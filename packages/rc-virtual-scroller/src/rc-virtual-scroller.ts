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
import { calculateWindow, positive, whole, type Geometry } from './range.js';
import { sampleLayout } from './sample.js';

import virtualScrollerStyles from './rc-virtual-scroller.styles.js';

export type RCVirtualScrollerAxis = LogicalAxis;
export type RCVirtualScrollerAlign = 'start' | 'center' | 'end' | 'nearest';

export interface RCVirtualScrollerRangeDetail {
  /** First item index the consumer should render, inclusive. */
  readonly start: number;
  /** Item index one past the last the consumer should render. */
  readonly end: number;
  /**
   * Effective items in one line: the explicit override, inferred uniform grid
   * capacity accounting for spans, or one for a non-grid collection.
   */
  readonly itemsPerLine: number;
  /** Line pitch in pixels along the scrolling axis, including the gap. */
  readonly lineSize: number;
  /** `false` while `lineSize` is still the `item-size` estimate, `true` once a real line was measured. */
  readonly measured: boolean;
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
 * Virtualization requires sequential DOM-order items with uniform line pitch
 * and capacity (the final line may be partial). Regular grids, uniform numeric
 * spans, lists, and nonwrapping shelves are measured from CSS. Use
 * `items-per-line` for ambiguous grid capacity; it does not enable variable
 * pitch, masonry, dense placement, or reordered items. Detectably unsupported
 * layouts render the full collection and warn in development. `item-size` is
 * only a bootstrap estimate. Hidden layouts retain their last valid window.
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
 * @attr items-per-line - Explicit grid capacity; zero (the default) restores automatic inference.
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

  private _count = 0;
  private _itemSize = 0;
  private _overscan = 2;
  private _capacity = 0;

  /** Total collection size, normalized to a nonnegative integer. Invalid values become zero. Host writes are silent. */
  @property({ type: Number })
  get count(): number {
    return this._count;
  }

  set count(value: number) {
    const old = this._count;

    this._count = whole(value);
    this.requestUpdate('count', old);
  }

  /**
   * Estimated line pitch in pixels, used for the first frame and whenever no
   * line is available to measure. Get this roughly right: it is what the very
   * first `rc-virtual-scroller-range` is computed from, and what a restored
   * scroll position lands against. Invalid or nonpositive values become zero.
   * Host writes are silent.
   */
  @property({ type: Number, attribute: 'item-size' })
  get itemSize(): number {
    return this._itemSize;
  }

  set itemSize(value: number) {
    const old = this._itemSize;

    this._itemSize = positive(value);
    this.requestUpdate('itemSize', old);
  }

  /** Grid capacity override, normalized to a nonnegative integer; zero means automatic. Host writes are silent. */
  @property({ type: Number, attribute: 'items-per-line' })
  get itemsPerLine(): number {
    return this._capacity;
  }

  set itemsPerLine(value: number) {
    const old = this._capacity;

    this._capacity = whole(value);
    this.requestUpdate('itemsPerLine', old);
  }

  /** Extra lines beyond each viewport edge, floored to an integer. Invalid/negative values become two. Host writes are silent. */
  @property({ type: Number })
  get overscan(): number {
    return this._overscan;
  }

  set overscan(value: number) {
    const old = this._overscan;

    this._overscan = whole(value, 2);
    this.requestUpdate('overscan', old);
  }

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

  /** Read-only first reported item index, also exposed as the computed `first` attribute. */
  get first(): number {
    return this._lastDetail?.start ?? 0;
  }

  /** Read-only last reported item index, or -1 for an empty range; also exposed as `last`. */
  get last(): number {
    return (this._lastDetail?.end ?? 0) - 1;
  }

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

  private _geometry: Geometry = { itemsPerLine: 1, lineSize: 0, measured: false };
  private _needsSample = true;
  private _resetGeometry = false;
  private _unsupported = false;
  private readonly _warnedLayouts = new Set<string>();
  private _$container: Element | null = null;
  private _$scrollSource: EventTarget | null = null;
  private _contentObserver: MutationObserver | null = null;

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
    }

    if (typeof MutationObserver === 'function') {
      this._contentObserver = new MutationObserver(this._requestSample);
    }

    // A direction flip reverses the inline axis without resizing anything.
    this._unobserveDirection = observeDirection(this._requestResolve);
    this.ownerDocument.defaultView?.addEventListener('resize', this._requestResolve);
    this._requestResolve();
  }

  override disconnectedCallback(): void {
    this.removeEventListener('focusin', this._requestResolve);
    this.removeEventListener('focusout', this._requestEvaluate);
    this._detachScrollTarget();
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    this._observingLayout = false;
    this._contentObserver?.disconnect();
    this._contentObserver = null;
    this._$container = null;
    this.ownerDocument.defaultView?.removeEventListener('resize', this._requestResolve);
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
    if (changed.has('axis') || changed.has('itemsPerLine')) {
      this._resetGeometry = true;
    }

    if (
      changed.has('axis') ||
      changed.has('itemsPerLine') ||
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
    if (!this.isConnected || !Number.isFinite(index) || this.count === 0 || this._unsupported) {
      return;
    }

    const target = this._resolvedTarget ?? this._attachScrollTarget();
    const lineSize = this._effectiveLineSize();

    if (!target || !lineSize) {
      return;
    }

    // Read at call time, like any other interaction: the direction may have
    // flipped in this same task, before the observer's notice arrives.
    this._flow = resolveFlow(this);

    const clamped = Math.min(Math.max(Math.floor(index), 0), Math.max(this.count - 1, 0));
    const lineStart = Math.floor(clamped / this._geometry.itemsPerLine) * lineSize;
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
    this._resetGeometry = true;
    this._requestResolve();
  }

  /**
   * Schedules an evaluation. `RafScheduler` keeps only the most recently
   * scheduled callback, so every path has to funnel through this single one:
   * a scroll arriving between a resize and its frame must not be able to drop
   * the resize's work.
   */
  private readonly _requestEvaluate = (): void => {
    if (this.isConnected) {
      this._frame.schedule(() => this._evaluate());
    }
  };

  private readonly _requestSample = (): void => {
    this._needsSample = true;
    this._requestEvaluate();
  };

  /** Requests an evaluation that re-finds the scrollport and flow first. */
  private readonly _requestResolve = (): void => {
    this._needsResolve = true;
    this._requestSample();
  };

  private _attachScrollTarget(): Element | null {
    const next = this.scrollTarget ?? findNearestScrollAncestor(this);

    if (next === this._resolvedTarget) {
      return next;
    }

    this._detachScrollTarget();
    this._resolvedTarget = next;
    this._$scrollSource = next === this._documentScroller() ? this.ownerDocument : next;
    this._$scrollSource?.addEventListener('scroll', this._requestEvaluate, { passive: true });

    return next;
  }

  private _detachScrollTarget(): void {
    this._$scrollSource?.removeEventListener('scroll', this._requestEvaluate);
    this._$scrollSource = null;
    this._resolvedTarget = null;
  }

  /** The scroll target's visible client box in viewport coordinates. */
  private _portRect(target: Element): DOMRect {
    if (target === this._documentScroller()) {
      const root = this.ownerDocument.documentElement;

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

  private _documentScroller(): Element {
    return this.ownerDocument.scrollingElement ?? this.ownerDocument.documentElement;
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

  private _effectiveLineSize(): number {
    return this._geometry.measured ? this._geometry.lineSize : this.itemSize;
  }

  /** Rebind observers only when their actual targets changed. */
  private _observeLayout(): void {
    const $container = this.firstElementChild;
    const $oldTarget = this._resolvedTarget;

    this._attachScrollTarget();

    if ($container !== this._$container) {
      this._$container = $container;
      this._resetGeometry = true;
      this._contentObserver?.disconnect();

      if ($container) {
        this._contentObserver?.observe($container, { childList: true });
      }
    } else if ($oldTarget === this._resolvedTarget && this._observingLayout) {
      return;
    }

    this._observingLayout = true;
    this._resizeObserver?.disconnect();
    this._resizeObserver?.observe(this);

    if ($container) {
      this._resizeObserver?.observe($container);
    }

    if (this._resolvedTarget && this._resolvedTarget !== this._documentScroller()) {
      this._resizeObserver?.observe(this._resolvedTarget);
    }
  }

  private _observingLayout = false;

  /**
   * Focus retargets to a closed shadow host. Stop at the item that owns it,
   * rather than asking ordinary contains() to cross a shadow boundary.
   */
  private _focusedIndex($container: Element): number {
    const root = this.getRootNode();
    let $active =
      root instanceof ShadowRoot ? root.activeElement : this.ownerDocument.activeElement;

    while ($active) {
      let $ancestor: Element | null = $active;

      while ($ancestor && $ancestor.parentElement !== $container) {
        const ancestorRoot: Node = $ancestor.getRootNode();

        $ancestor =
          $ancestor.assignedSlot ??
          $ancestor.parentElement ??
          (ancestorRoot instanceof ShadowRoot ? ancestorRoot.host : null);
      }

      if ($ancestor) {
        return this.first + Array.prototype.indexOf.call($container.children, $ancestor);
      }

      $active = $active.shadowRoot?.activeElement ?? null;
    }

    return -1;
  }

  private _evaluate(): void {
    if (!this.isConnected) {
      return;
    }

    if (this._needsResolve || !this._resolvedTarget) {
      this._needsResolve = false;
      this._observeLayout();
      this._flow = resolveFlow(this);
    }

    const $container = this._$container;
    const $target = this._resolvedTarget;

    if (this.disabled || !$container || this.count === 0) {
      this._applyRange(0, this.count, 0, 0);

      return;
    }

    if (!$target || !this.getClientRects().length || !$target.getClientRects().length) {
      // An unavailable layout is not a new measurement. Only clamp a changed
      // collection; preserve the mounted slice and spacer geometry while hidden.
      if (this._lastDetail && this._lastDetail.end > this.count) {
        this._applyRange(
          Math.min(this.first, this.count),
          this.count,
          this._spacerStart,
          this._spacerEnd,
        );
      }

      return;
    }

    if (this._resetGeometry) {
      this._resetGeometry = false;

      this._geometry = {
        itemsPerLine: this.itemsPerLine || 1,
        lineSize: this.itemSize,
        measured: false,
      };

      this._needsSample = true;
    }

    if (this._needsSample) {
      this._needsSample = false;

      const sample = sampleLayout(
        $container,
        this.axis,
        this._flow,
        this.itemsPerLine,
        this._geometry,
      );

      this._unsupported = sample.kind === 'unsupported';

      if (sample.kind === 'unsupported') {
        if (import.meta.env.DEV && !this._warnedLayouts.has(sample.reason)) {
          this._warnedLayouts.add(sample.reason);

          console.warn(
            `[rc-virtual-scroller] ${sample.reason} Rendering the full collection.`,
            this,
          );
        }
      } else {
        this._geometry = sample.geometry;
      }
    }

    const lineSize = this._effectiveLineSize();

    if (this._unsupported || !lineSize) {
      this._applyRange(0, this.count, 0, 0);

      return;
    }

    const range = calculateWindow({
      ...this._geometry,
      lineSize,
      count: this.count,
      overscan: this.overscan,
      ...this._view($target),
      focused: this._focusedIndex($container),
    });

    this._applyRange(range.start, range.end, range.spacerStart, range.spacerEnd);
  }

  private _applyRange(start: number, end: number, spacerStart: number, spacerEnd: number): void {
    this._spacerStart = spacerStart;
    this._spacerEnd = spacerEnd;
    this.setAttribute('first', String(start));
    this.setAttribute('last', String(end - 1));

    const detail: RCVirtualScrollerRangeDetail = {
      start,
      end,
      itemsPerLine: this._geometry.itemsPerLine,
      lineSize: this._effectiveLineSize(),
      measured: this._geometry.measured,
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

    this._lastDetail = Object.freeze(detail);

    this.dispatchEvent(
      new CustomEvent<RCVirtualScrollerRangeDetail>('rc-virtual-scroller-range', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }
}
