import { LitElement, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import {
  HORIZONTAL_LTR_FLOW,
  RafScheduler,
  findNearestScrollAncestor,
  isReversed,
  logicalRect,
  observeDirection,
  physicalAxis,
  resolveFlow,
  type Flow,
  type LogicalAxis,
} from '@rcarls/rc-common';

import virtualScrollerStyles from './rc-virtual-scroller.styles.js';

export type RCVirtualScrollerAxis = LogicalAxis;
export type RCVirtualScrollerAlign = 'start' | 'center' | 'end' | 'nearest';

export interface RCVirtualScrollerRangeDetail {
  /** First item index the consumer should render, inclusive. */
  start: number;
  /** Item index one past the last the consumer should render. */
  end: number;
  /**
   * Items in one line across the scrolling axis: grid columns when scrolling
   * the block axis, grid rows when scrolling the inline axis, `1` when the
   * container is not a grid.
   */
  itemsPerLine: number;
  /** Line pitch in pixels along the scrolling axis, including the gap. */
  lineSize: number;
  /** `false` while `lineSize` is still the `item-size` estimate, `true` once a real line was measured. */
  measured: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-virtual-scroller': RCVirtualScroller;
  }

  interface HTMLElementEventMap {
    'rc-virtual-scroller-range': CustomEvent<RCVirtualScrollerRangeDetail>;
  }
}

/** Line pitch differences below this are measurement noise, not a real change. */
const LINE_SIZE_EPSILON = 0.5;

/**
 * Rect-derived offsets carry sub-pixel snapping (Firefox reports a view start
 * of 3999.98 where 4000 was scrolled), which is enough to floor into the
 * previous line. Half a pixel of tolerance on each edge absorbs it; it only
 * ever affects a line that is at most half a pixel on screen, well inside the
 * overscan.
 */
const SUBPIXEL_EPSILON = 0.5;

/** Returns the focused element, following open shadow roots down. */
function deepActiveElement(): Element | null {
  let active = document.activeElement;

  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }

  return active;
}

function trackCount(tracks: string): number {
  return tracks && tracks !== 'none' ? tracks.split(/\s+/).filter(Boolean).length : 1;
}

/**
 * Reports which slice of a long collection is currently on screen and reserves
 * the scroll space for the rest, so the consumer can render a few dozen items
 * instead of a few thousand.
 *
 * The element is deliberately headless: it never creates, recycles, or
 * positions item DOM. It measures geometry, dispatches
 * `rc-virtual-scroller-range`, and sizes two spacers around the default slot.
 * The consumer slots its own single container element (a `<ul>`, an
 * `<rc-list>`, a `<table>` body) and renders `detail.start`..`detail.end` into
 * it with whatever framework it already uses. That keeps the markup, the CSS
 * layout, and the accessibility semantics with the code that owns them, and it
 * means a native `grid-template-columns: repeat(auto-fill, ...)` keeps working
 * untouched.
 *
 * `axis` is logical. `block` (the default) windows lines stacked the way
 * paragraphs stack, which is vertical in horizontal writing modes and
 * horizontal in vertical ones. `inline` windows a row of items running the way
 * text runs, such as a horizontal shelf; the slotted container then lays its
 * items along the inline axis (`display: flex`, or a grid with
 * `grid-auto-flow: column`). Direction and writing mode are read from the
 * element's own computed style, so RTL and vertical text need no configuration.
 *
 * Items per line and line pitch are measured from the slotted container rather
 * than configured, so container queries and `auto-fill` stay authoritative.
 * `item-size` is only the estimate used for the first frame, before a real
 * line exists to measure.
 *
 * Accessibility is the consumer's, because the consumer owns the roles. A
 * virtualized set must still tell assistive technology its real size: put
 * `aria-setsize` (the true total) and `aria-posinset` (the item's real index,
 * not its DOM position) on each item, or `aria-rowcount` / `aria-rowindex` for
 * a grid. See the package README. The one part this element does handle is
 * focus: the reported range is always widened to include the focused item, so
 * scrolling never silently drops focus to `<body>`.
 *
 * @slot - The consumer's single container element, holding only the items in the current range.
 *
 * @csspart spacer-start - Space along the scrolling axis standing in for the lines before the range.
 * @csspart spacer-end - Space along the scrolling axis standing in for the lines after the range.
 *
 * @attr axis - Logical axis to window along: `block` (the default) or `inline`.
 * @attr count - Total number of items in the collection, including the ones not rendered.
 * @attr item-size - Estimated line pitch in pixels, used until a real line can be measured.
 * @attr overscan - Extra lines rendered beyond each edge of the viewport. Defaults to `2`.
 * @attr disabled - Reports the whole collection as the range and stops measuring.
 * @attr [first] - Reflected, computed. First item index in the current range.
 * @attr [last] - Reflected, computed. Last item index in the current range, inclusive. `-1` when the range is empty.
 *
 * @fires rc-virtual-scroller-range - The visible range changed, or its geometry was re-measured.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-virtual-scroller}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/feed/ | WAI-ARIA APG: Feed pattern}
 */
export class RCVirtualScroller extends LitElement {
  static override styles = virtualScrollerStyles;

  // Geometry can only be measured after render, and the reflected range
  // attributes are written from that measurement, so an update legitimately
  // schedules one follow-up update.
  static override enabledWarnings = (LitElement.enabledWarnings ?? []).filter(
    (warning) => warning !== 'change-in-update',
  );

  /** Logical axis to window along. */
  @property({ reflect: true })
  axis: RCVirtualScrollerAxis = 'block';

  /** Total number of items in the collection, including the ones not rendered. */
  @property({ type: Number })
  count = 0;

  /**
   * Estimated line pitch in pixels, used for the first frame and whenever no
   * line is available to measure. Get this roughly right: it is what the very
   * first `rc-virtual-scroller-range` is computed from, and what a restored
   * scroll position lands against.
   */
  @property({ type: Number, attribute: 'item-size' })
  itemSize = 0;

  /** Extra lines rendered beyond each edge of the viewport. */
  @property({ type: Number })
  overscan = 2;

  /**
   * Reports the whole collection as the range and stops measuring. An escape
   * hatch for short collections, printing, and A/B measurement; the consumer's
   * render path stays the same either way.
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * The scroll container to measure against. Defaults to the nearest scrolling
   * ancestor. Set this when the ancestor only becomes scrollable after its own
   * upgrade, or when the intended scrollport is further up than the first
   * `overflow: auto` element.
   */
  @property({ attribute: false })
  scrollTarget: Element | null = null;

  /** Reflected, computed. See the class doc comment. */
  @property({ type: Number, reflect: true })
  first = 0;

  /** Reflected, computed. See the class doc comment. */
  @property({ type: Number, reflect: true })
  last = -1;

  /**
   * The most recently reported range, or `null` before the first measurement.
   * The element measures on its own schedule, which can be before a consumer
   * has attached its listener; render from this once when subscribing, then
   * follow `rc-virtual-scroller-range`. Identical ranges are never re-sent, so
   * a subscriber that skips this can wait for an event that will not come.
   */
  get range(): RCVirtualScrollerRangeDetail | null {
    return this._lastDetail;
  }

  @state()
  private _spacerStart = 0;

  @state()
  private _spacerEnd = 0;

  private readonly _frame = new RafScheduler(this);

  private _itemsPerLine = 1;

  private _lineSize = 0;

  private _measured = false;

  /** The host's own flow, resolved with the scroll target rather than per frame. */
  private _flow: Flow = HORIZONTAL_LTR_FLOW;

  private _resolvedTarget: Element | null = null;

  private _resizeObserver: ResizeObserver | null = null;

  private _unobserveDirection: (() => void) | null = null;

  private _lastDetail: RCVirtualScrollerRangeDetail | null = null;

  /** Set when the surrounding layout changed enough to re-find the scrollport. */
  private _needsResolve = true;

  override connectedCallback(): void {
    super.connectedCallback();

    // Focus moving in or out changes which items must stay rendered, and
    // nothing else would tell us: a blur fires no scroll and no resize.
    this.addEventListener('focusin', this._requestResolve);
    this.addEventListener('focusout', this._requestEvaluate);

    if (typeof ResizeObserver === 'function') {
      this._resizeObserver = new ResizeObserver(this._requestResolve);
      this._resizeObserver.observe(this);
    }

    // A direction flip reverses the inline axis without resizing anything.
    this._unobserveDirection = observeDirection(this._requestResolve);
  }

  override disconnectedCallback(): void {
    this.removeEventListener('focusin', this._requestResolve);
    this.removeEventListener('focusout', this._requestEvaluate);
    this._detachScrollTarget();
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    this._unobserveDirection?.();
    this._unobserveDirection = null;

    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    if (import.meta.env.DEV && !this.firstElementChild) {
      console.warn(
        '[rc-virtual-scroller] No child element found. Slot a single container element (a <ul>, an <rc-list>) holding the items in the current range.',
        this,
      );
    }

    this._requestResolve();
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('axis')) {
      // A line pitch measured along the other axis means nothing on this one.
      this._lineSize = 0;
      this._measured = false;
    }

    if (
      changed.has('axis') ||
      changed.has('count') ||
      changed.has('itemSize') ||
      changed.has('overscan') ||
      changed.has('disabled') ||
      changed.has('scrollTarget')
    ) {
      this._requestResolve();
    }
  }

  protected override render() {
    const size = this.axis === 'inline' ? 'inlineSize' : 'blockSize';

    return html`
      <div part="spacer-start" style=${styleMap({ [size]: `${this._spacerStart}px` })}></div>
      <slot @slotchange=${this._requestResolve}></slot>
      <div part="spacer-end" style=${styleMap({ [size]: `${this._spacerEnd}px` })}></div>
    `;
  }

  /**
   * Scrolls the item at `index` into view along `axis`. Accurate to the current
   * line pitch, which means accurate to `item-size` until at least one line has
   * rendered.
   */
  scrollToIndex(
    index: number,
    options: { align?: RCVirtualScrollerAlign; behavior?: ScrollBehavior } = {},
  ): void {
    const target = this._resolvedTarget ?? this._attachScrollTarget();
    const lineSize = this._effectiveLineSize();

    if (!target || !lineSize) {
      return;
    }

    // Read at call time, like any other interaction: the direction may have
    // flipped in this same task, before the observer's notice arrives.
    this._flow = resolveFlow(this);

    const clamped = Math.min(Math.max(index, 0), Math.max(this.count - 1, 0));
    const lineStart = Math.floor(clamped / this._itemsPerLine) * lineSize;
    const { viewStart, viewSize } = this._view(target);
    const align = options.align ?? 'start';

    let desired = lineStart;

    if (align === 'center') {
      desired = lineStart - (viewSize - lineSize) / 2;
    } else if (align === 'end') {
      desired = lineStart - (viewSize - lineSize);
    } else if (align === 'nearest') {
      if (lineStart >= viewStart && lineStart + lineSize <= viewStart + viewSize) {
        return;
      }

      desired = lineStart < viewStart ? lineStart : lineStart - (viewSize - lineSize);
    }

    // A relative scroll, expressed in the host's own flow, means the scroll
    // container's origin (negative scrollLeft in RTL and vertical-rl) never
    // has to be interpreted here.
    const delta = (desired - viewStart) * (isReversed(this.axis, this._flow) ? -1 : 1);
    const behavior = options.behavior ?? 'auto';

    if (physicalAxis(this.axis, this._flow) === 'x') {
      target.scrollBy({ left: delta, behavior });
    } else {
      target.scrollBy({ top: delta, behavior });
    }
  }

  /**
   * Re-measures the slotted container and re-evaluates the range. Call this
   * when something outside the element's own observers changed the item size,
   * such as a font load or a theme swap.
   */
  measure(): void {
    this._measured = false;
    this._requestResolve();
  }

  /**
   * Schedules an evaluation. `RafScheduler` keeps only the most recently
   * scheduled callback, so every path has to funnel through this single one:
   * a scroll arriving between a resize and its frame must not be able to drop
   * the resize's work.
   */
  private readonly _requestEvaluate = (): void => {
    this._frame.schedule(() => this._evaluate());
  };

  /** Requests an evaluation that re-finds the scrollport and flow first. */
  private readonly _requestResolve = (): void => {
    this._needsResolve = true;
    this._requestEvaluate();
  };

  private _attachScrollTarget(): Element | null {
    const next = this.scrollTarget ?? findNearestScrollAncestor(this);

    if (next === this._resolvedTarget) {
      return next;
    }

    this._detachScrollTarget();
    this._resolvedTarget = next;
    next?.addEventListener('scroll', this._requestEvaluate, { passive: true });

    return next;
  }

  private _detachScrollTarget(): void {
    this._resolvedTarget?.removeEventListener('scroll', this._requestEvaluate);
    this._resolvedTarget = null;
  }

  /** The scroll target's visible client box in viewport coordinates. */
  private _portRect(target: Element): DOMRect {
    if (target === (document.scrollingElement ?? document.documentElement)) {
      const root = document.documentElement;

      return new DOMRect(0, 0, root.clientWidth, root.clientHeight);
    }

    const rect = target.getBoundingClientRect();

    return new DOMRect(
      rect.left + target.clientLeft,
      rect.top + target.clientTop,
      target.clientWidth,
      target.clientHeight,
    );
  }

  /**
   * Where the visible part of the scroll target sits relative to the host,
   * measured from the host's start edge along `axis` in the host's own flow.
   * Working from the two rects rather than from `scrollTop`/`scrollLeft`
   * keeps the arithmetic identical in every writing mode and direction.
   */
  private _view(target: Element): { viewStart: number; viewSize: number } {
    const view = logicalRect(this._portRect(target), this.getBoundingClientRect(), this._flow);

    return this.axis === 'inline'
      ? { viewStart: view.inlineStart, viewSize: view.inlineSize }
      : { viewStart: view.blockStart, viewSize: view.blockSize };
  }

  /** The consumer's slotted container, i.e. the element holding the items. */
  private _container(): Element | null {
    return this.firstElementChild;
  }

  private _effectiveLineSize(): number {
    return this._lineSize > 0 ? this._lineSize : this.itemSize;
  }

  /**
   * Reads the item grid from the slotted container. Grid columns are inline
   * tracks and grid rows are block tracks in every writing mode, so lines
   * stacked along the block axis hold one item per column, and lines along
   * the inline axis hold one item per row. Reading the resolved tracks rather
   * than a configured count keeps `auto-fill` and container queries the
   * single source of truth.
   */
  /**
   * How many items share the first line, counted from where they render: the
   * leading run of items that start where the first one does along the
   * windowed axis. Unlike the track count, this holds when an item spans
   * several tracks, such as cards aligned through subgrid across every row of
   * a column-flow shelf. Returns `undefined` when every rendered item sits on
   * the first line, since the line's real length is then unknown.
   */
  private _itemsInFirstLine(items: HTMLCollection, firstRect: DOMRect): number | undefined {
    const lineStart = (rect: DOMRect) => {
      const box = logicalRect(rect, firstRect, this._flow);

      return this.axis === 'inline' ? box.inlineStart : box.blockStart;
    };

    for (let index = 1; index < items.length; index++) {
      const item = items.item(index);

      if (item && Math.abs(lineStart(item.getBoundingClientRect())) > SUBPIXEL_EPSILON) {
        return index;
      }
    }

    return undefined;
  }

  private _measureGrid(container: Element): void {
    const styles = getComputedStyle(container);
    const tracks = trackCount(
      this.axis === 'inline' ? styles.gridTemplateRows : styles.gridTemplateColumns,
    );

    this._itemsPerLine = tracks;

    const items = container.children;
    const firstItem = items.item(0);

    if (!firstItem) {
      return;
    }

    const firstRect = firstItem.getBoundingClientRect();

    this._itemsPerLine = this._itemsInFirstLine(items, firstRect) ?? tracks;

    // The offset between two items a full line apart is the pitch with the
    // gap already included, which beats adding a separately parsed gap to a
    // measured size.
    const nextLineItem = items.item(this._itemsPerLine);

    let lineSize = 0;

    if (nextLineItem) {
      const offset = logicalRect(nextLineItem.getBoundingClientRect(), firstRect, this._flow);

      lineSize = this.axis === 'inline' ? offset.inlineStart : offset.blockStart;
    }

    if (lineSize <= 0) {
      const own = logicalRect(firstRect, firstRect, this._flow);
      const gap = Number.parseFloat(this.axis === 'inline' ? styles.columnGap : styles.rowGap);

      lineSize =
        (this.axis === 'inline' ? own.inlineSize : own.blockSize) +
        (Number.isFinite(gap) ? gap : 0);
    }

    // A container of `display: contents` items measures as zero; keep the
    // estimate rather than dividing the scroll space by nothing.
    if (lineSize > 0) {
      this._lineSize = lineSize;
      this._measured = true;
    }
  }

  /**
   * The focused item's index, or `-1`. Items are the container's children, so
   * the focused item's index is its DOM position offset by the current range
   * start, which is the only place the rendered slice's own numbering exists.
   */
  private _focusedIndex(container: Element): number {
    const active = deepActiveElement();

    if (!active || !this.contains(active)) {
      return -1;
    }

    const items = Array.from(container.children);
    const position = items.findIndex((item) => item === active || item.contains(active));

    return position < 0 ? -1 : this.first + position;
  }

  private _evaluate(): void {
    if (this._needsResolve || !this._resolvedTarget) {
      this._needsResolve = false;
      // Deliberately not on the scroll path: walking ancestors and reading the
      // flow cost a getComputedStyle each, which has no business running per
      // frame. A resize, slotchange, focus change, or `dir` change requests
      // this pass.
      this._attachScrollTarget();
      this._flow = resolveFlow(this);
    }

    const container = this._container();

    if (this.disabled || !container || this.count <= 0) {
      this._applyRange(0, this.count, 0, 0);

      return;
    }

    this._measureGrid(container);

    const lineSize = this._effectiveLineSize();
    const target = this._resolvedTarget;

    if (!lineSize || !target) {
      // Nothing measurable to window against yet; rendering everything is the
      // only answer that cannot be wrong.
      this._applyRange(0, this.count, 0, 0);

      return;
    }

    const perLine = this._itemsPerLine;
    const lines = Math.ceil(this.count / perLine);
    const { viewStart, viewSize } = this._view(target);

    let firstLine =
      Math.floor((Math.max(0, viewStart) + SUBPIXEL_EPSILON) / lineSize) - this.overscan;
    let lastLine = Math.ceil((viewStart + viewSize - SUBPIXEL_EPSILON) / lineSize) + this.overscan;

    firstLine = Math.min(Math.max(firstLine, 0), lines);
    lastLine = Math.min(Math.max(lastLine, firstLine), lines);

    let start = firstLine * perLine;
    let end = Math.min(lastLine * perLine, this.count);

    // Unmounting the focused element resets focus to <body> with no error and
    // no visible cause, which is how a keyboard user loses their place mid
    // scroll. Widening keeps the range contiguous, so the consumer's render
    // stays a plain slice; it collapses again as soon as focus moves.
    const focused = this._focusedIndex(container);

    if (focused >= 0) {
      const focusedLine = Math.floor(focused / perLine);

      start = Math.min(start, focusedLine * perLine);
      end = Math.max(end, Math.min((focusedLine + 1) * perLine, this.count));
    }

    const linesBefore = Math.floor(start / perLine);
    const linesAfter = lines - Math.ceil(end / perLine);

    this._applyRange(start, end, linesBefore * lineSize, Math.max(0, linesAfter) * lineSize);
  }

  private _applyRange(start: number, end: number, spacerStart: number, spacerEnd: number): void {
    this._spacerStart = spacerStart;
    this._spacerEnd = spacerEnd;
    this.first = start;
    this.last = end - 1;

    const detail: RCVirtualScrollerRangeDetail = {
      start,
      end,
      itemsPerLine: this._itemsPerLine,
      lineSize: this._effectiveLineSize(),
      measured: this._measured,
    };
    const previous = this._lastDetail;

    if (
      previous &&
      previous.start === detail.start &&
      previous.end === detail.end &&
      previous.itemsPerLine === detail.itemsPerLine &&
      previous.measured === detail.measured &&
      Math.abs(previous.lineSize - detail.lineSize) < LINE_SIZE_EPSILON
    ) {
      // Re-dispatching an identical range would make the consumer re-render,
      // which lands back here through slotchange, forever.

      return;
    }

    this._lastDetail = detail;

    this.dispatchEvent(
      new CustomEvent<RCVirtualScrollerRangeDetail>('rc-virtual-scroller-range', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }
}
