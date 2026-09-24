import { LitElement, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { RafScheduler, findNearestScrollAncestor } from '@rcarls/rc-common';

import virtualScrollerStyles from './rc-virtual-scroller.styles.js';

export type RCVirtualScrollerBlock = 'start' | 'center' | 'end' | 'nearest';

export interface RCVirtualScrollerRangeDetail {
  /** First item index the consumer should render, inclusive. */
  start: number;
  /** Item index one past the last the consumer should render. */
  end: number;
  /** Items per row, measured from the slotted container's grid. `1` when it is not a grid. */
  columns: number;
  /** Row pitch in pixels, including the row gap. */
  rowSize: number;
  /** `false` while `rowSize` is still the `item-size` estimate, `true` once a real row was measured. */
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

/** Row pitch differences below this are measurement noise, not a real change. */
const ROW_SIZE_EPSILON = 0.5;

/** Returns the focused element, following open shadow roots down. */
function deepActiveElement(): Element | null {
  let active = document.activeElement;

  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }

  return active;
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
 * Column count and row pitch are measured from the slotted container rather
 * than configured, so container queries and `auto-fill` stay authoritative.
 * `item-size` is only the estimate used for the first frame, before a real row
 * exists to measure.
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
 * @csspart spacer-start - Block space standing in for the rows before the range.
 * @csspart spacer-end - Block space standing in for the rows after the range.
 *
 * @attr count - Total number of items in the collection, including the ones not rendered.
 * @attr item-size - Estimated row pitch in pixels, used until a real row can be measured.
 * @attr overscan - Extra rows rendered beyond each edge of the viewport. Defaults to `2`.
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

  /** Total number of items in the collection, including the ones not rendered. */
  @property({ type: Number })
  count = 0;

  /**
   * Estimated row pitch in pixels, used for the first frame and whenever no
   * row is available to measure. Get this roughly right: it is what the very
   * first `rc-virtual-scroller-range` is computed from, and what a restored
   * scroll position lands against.
   */
  @property({ type: Number, attribute: 'item-size' })
  itemSize = 0;

  /** Extra rows rendered beyond each edge of the viewport. */
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

  @state()
  private _spacerStart = 0;

  @state()
  private _spacerEnd = 0;

  private readonly _frame = new RafScheduler(this);

  private _columns = 1;

  private _rowSize = 0;

  private _measured = false;

  /** The host's block offset inside the scroll target's scrollable content. */
  private _hostOffset = 0;

  private _resolvedTarget: Element | null = null;

  private _resizeObserver: ResizeObserver | null = null;

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
  }

  override disconnectedCallback(): void {
    this.removeEventListener('focusin', this._requestResolve);
    this.removeEventListener('focusout', this._requestEvaluate);
    this._detachScrollTarget();
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;

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
    if (
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
    return html`
      <div part="spacer-start" style=${styleMap({ blockSize: `${this._spacerStart}px` })}></div>
      <slot @slotchange=${this._requestResolve}></slot>
      <div part="spacer-end" style=${styleMap({ blockSize: `${this._spacerEnd}px` })}></div>
    `;
  }

  /**
   * Scrolls the item at `index` into view. Accurate to the current row pitch,
   * which means accurate to `item-size` until at least one row has rendered.
   */
  scrollToIndex(
    index: number,
    options: { block?: RCVirtualScrollerBlock; behavior?: ScrollBehavior } = {},
  ): void {
    const target = this._resolvedTarget ?? this._attachScrollTarget();
    const rowSize = this._effectiveRowSize();

    if (!target || !rowSize) {
      return;
    }

    const clamped = Math.min(Math.max(index, 0), Math.max(this.count - 1, 0));
    const rowTop = this._hostOffset + Math.floor(clamped / this._columns) * rowSize;
    const port = this._portSize(target);
    const block = options.block ?? 'start';

    let top = rowTop;

    if (block === 'center') {
      top = rowTop - (port - rowSize) / 2;
    } else if (block === 'end') {
      top = rowTop - (port - rowSize);
    } else if (block === 'nearest') {
      const scrollTop = this._scrollTop(target);

      if (rowTop >= scrollTop && rowTop + rowSize <= scrollTop + port) {
        return;
      }

      top = rowTop < scrollTop ? rowTop : rowTop - (port - rowSize);
    }

    target.scrollTo({ top: Math.max(0, top), behavior: options.behavior ?? 'auto' });
  }

  /**
   * Re-measures the slotted container and re-evaluates the range. Call this
   * when something outside the element's own observers changed the item size,
   * such as a font load or a theme swap.
   */
  measure(): void {
    this._measured = false;
    this._requestEvaluate();
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

  /** Requests an evaluation that re-finds the scrollport first. */
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

  private _isRootScroller(target: Element): boolean {
    return target === (document.scrollingElement ?? document.documentElement);
  }

  private _scrollTop(target: Element): number {
    return target.scrollTop;
  }

  private _portSize(target: Element): number {
    return target.clientHeight;
  }

  /** The consumer's slotted container, i.e. the element holding the items. */
  private _container(): Element | null {
    return this.firstElementChild;
  }

  private _effectiveRowSize(): number {
    return this._rowSize > 0 ? this._rowSize : this.itemSize;
  }

  /**
   * Reads the item grid from the slotted container. Column count comes from
   * the resolved `grid-template-columns` rather than a configured property, so
   * `auto-fill` and container queries stay the single source of truth for how
   * many items fit on a row.
   */
  private _measureGrid(container: Element): void {
    const styles = getComputedStyle(container);
    const tracks = styles.gridTemplateColumns;

    this._columns = tracks && tracks !== 'none' ? tracks.split(/\s+/).filter(Boolean).length : 1;

    const items = container.children;
    const firstItem = items.item(0);

    if (!firstItem) {
      return;
    }

    const firstRect = firstItem.getBoundingClientRect();
    // The offset between two items a full row apart is the row pitch with the
    // gap already included, which beats adding a separately parsed `row-gap`
    // to a measured height.
    const nextRowItem = items.item(this._columns);

    let rowSize = nextRowItem ? nextRowItem.getBoundingClientRect().top - firstRect.top : 0;

    if (rowSize <= 0) {
      const rowGap = Number.parseFloat(styles.rowGap);

      rowSize = firstRect.height + (Number.isFinite(rowGap) ? rowGap : 0);
    }

    // A container of `display: contents` items measures as zero; keep the
    // estimate rather than dividing the scroll space by nothing.
    if (rowSize > 0) {
      this._rowSize = rowSize;
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
      // Deliberately not on the scroll path: walking ancestors means a
      // getComputedStyle per level, which has no business running per frame.
      this._attachScrollTarget();
    }

    const container = this._container();

    if (this.disabled || !container || this.count <= 0) {
      this._applyRange(0, this.count, 0, 0);

      return;
    }

    this._measureGrid(container);

    const rowSize = this._effectiveRowSize();
    const target = this._resolvedTarget;

    if (!rowSize || !target) {
      // Nothing measurable to window against yet; rendering everything is the
      // only answer that cannot be wrong.
      this._applyRange(0, this.count, 0, 0);

      return;
    }

    const rows = Math.ceil(this.count / this._columns);
    const hostRect = this.getBoundingClientRect();
    const scrollTop = this._scrollTop(target);
    const portTop = this._isRootScroller(target) ? 0 : target.getBoundingClientRect().top;

    // Cached rather than derived per frame so that the ordinary scroll path is
    // arithmetic on a number, not another pair of layout reads.
    this._hostOffset = hostRect.top - portTop + scrollTop;

    const viewTop = scrollTop - this._hostOffset;
    const port = this._portSize(target);

    let firstRow = Math.floor(Math.max(0, viewTop) / rowSize) - this.overscan;
    let lastRow = Math.ceil((viewTop + port) / rowSize) + this.overscan;

    firstRow = Math.min(Math.max(firstRow, 0), rows);
    lastRow = Math.min(Math.max(lastRow, firstRow), rows);

    let start = firstRow * this._columns;
    let end = Math.min(lastRow * this._columns, this.count);

    // Unmounting the focused element resets focus to <body> with no error and
    // no visible cause, which is how a keyboard user loses their place mid
    // scroll. Widening keeps the range contiguous, so the consumer's render
    // stays a plain slice; it collapses again as soon as focus moves.
    const focused = this._focusedIndex(container);

    if (focused >= 0) {
      const focusedRow = Math.floor(focused / this._columns);

      start = Math.min(start, focusedRow * this._columns);
      end = Math.max(end, Math.min((focusedRow + 1) * this._columns, this.count));
    }

    const startRows = Math.floor(start / this._columns);
    const endRows = rows - Math.ceil(end / this._columns);

    this._applyRange(start, end, startRows * rowSize, Math.max(0, endRows) * rowSize);
  }

  private _applyRange(start: number, end: number, spacerStart: number, spacerEnd: number): void {
    this._spacerStart = spacerStart;
    this._spacerEnd = spacerEnd;
    this.first = start;
    this.last = end - 1;

    const detail: RCVirtualScrollerRangeDetail = {
      start,
      end,
      columns: this._columns,
      rowSize: this._effectiveRowSize(),
      measured: this._measured,
    };
    const previous = this._lastDetail;

    if (
      previous &&
      previous.start === detail.start &&
      previous.end === detail.end &&
      previous.columns === detail.columns &&
      previous.measured === detail.measured &&
      Math.abs(previous.rowSize - detail.rowSize) < ROW_SIZE_EPSILON
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
