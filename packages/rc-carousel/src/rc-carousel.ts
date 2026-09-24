import { LitElement, html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import {
  DragGestureController,
  findExtremeSnapIndex,
  findNearestSnapIndex,
  findNextSnapIndex,
  HORIZONTAL_LTR_FLOW,
  clientSize,
  getScrollOffset,
  keyNavigation,
  logicalDelta,
  physicalAxis,
  resolveFlow,
  setScrollOffset,
  warnMissingDirectChild,
  type DragGestureDetail,
  type Flow,
  type KeyboardNavigationAction,
} from '@rcarls/rc-common';
import type { RCCarouselItem } from './rc-carousel-item.js';

import carouselStyles from './rc-carousel.styles.js';

/** Release velocity (px/s) past which a mouse-drag release is treated as a
 * decisive swipe (advance one further slide) rather than settling to the
 * nearest snap point. */
const DECISIVE_DRAG_VELOCITY = 300;

export type RCCarouselChangeTrigger = 'api' | 'button' | 'keyboard' | 'swipe';

export interface RCCarouselChangeDetail {
  index: number;
  trigger: RCCarouselChangeTrigger;
}

declare global {
  interface HTMLElementEventMap {
    'rc-carousel-change': CustomEvent<RCCarouselChangeDetail>;
  }
  interface HTMLElementTagNameMap {
    'rc-carousel': RCCarousel;
  }
}

const SETTLE_DEBOUNCE_MS = 120;

/**
 * WAI-ARIA APG carousel pattern built on native CSS scroll-snap. One
 * `rc-carousel-item` per slide, swiped or paged between; the track's own
 * native scroll-snap settling (not a hand-rolled drag simulation) is the
 * primary interaction, per this monorepo's "build on native browser
 * behavior" principle.
 *
 * `activeIndex` is a controlled/uncontrolled property, mirroring
 * `rc-adaptive-menu`'s `open`/`defaultOpen` pair: leave it unset for
 * uncontrolled usage (`default-active-index` seeds the initial slide),
 * or set it directly to drive the carousel externally — a settle from
 * swipe, a keyboard action, or the imperative API all report back through
 * `rc-carousel-change` rather than silently self-correcting a controlled
 * value out from under the consumer.
 *
 * Previous/next navigation and a slide picker are both opt-in
 * (`navigation`/`pagination`), following the WAI-ARIA APG carousel
 * pattern's "grouped" (non-tab) picker style deliberately: the tabbed
 * `role="tabpanel"` variant requires cross-references between light-DOM
 * slides and shadow-DOM tab buttons that, in comparable shadow-DOM
 * carousels, has hit real accessibility-tooling failures across the
 * shadow boundary (including non-recognition by some screen readers
 * entirely). `loop` wraps seamlessly via cloned lead/trail slides rather
 * than a discontinuous jump back to the other end.
 *
 * @slot - One or more `rc-carousel-item` elements.
 * @slot previous-icon - Optional icon for the previous button, replacing
 *   the default chevron. Only rendered when `navigation` is set.
 * @slot next-icon - Optional icon for the next button, replacing the
 *   default chevron. Only rendered when `navigation` is set.
 *
 * @fires rc-carousel-change - Fires when the active slide changes, from a
 *   swipe settling, a keyboard action, or the imperative API.
 *   `detail: { index, trigger: 'swipe'|'button'|'keyboard'|'api' }`
 *
 * @attr active-index - Controls the active slide. Host writes are silent —
 *   listen for `rc-carousel-change` to stay in sync.
 * @attr default-active-index - Initial active slide for uncontrolled usage.
 * @attr loop - Wraps past the first/last slide back to the other end,
 *   seamlessly (via cloned lead/trail slides), for swipe, buttons, and
 *   keyboard alike. Off by default: the ends are real boundaries, not a
 *   loop, unless a consumer opts in.
 * @attr navigation - Shows previous/next buttons.
 * @attr pagination - Shows a slide-picker button group.
 * @attr mouse-dragging - Enables click-and-drag scrolling with a mouse.
 *   Touch/pen already get native scroll-snap physics; off by default.
 *
 * @cssprop [--rc-carousel-color=CanvasText] - Carousel foreground color.
 * @cssprop [--rc-carousel-gap=8px] - Space between slides.
 * @cssprop [--rc-carousel-slide-size=calc(100% - 4rem)] - Rendered size of
 *   each slide along the scroll axis. Set this directly or from a consumer
 *   container query to coordinate hero and multi-browse layouts.
 * @cssprop [--rc-carousel-navigation-button-size=40px] - Previous/next
 *   button diameter.
 * @cssprop [--rc-carousel-navigation-button-background=color-mix(in srgb, CanvasText 12%, transparent)] -
 *   Previous/next button background.
 * @cssprop [--rc-carousel-navigation-button-color=CanvasText] -
 *   Previous/next button icon color.
 * @cssprop [--rc-carousel-navigation-inset=8px] - Previous/next button
 *   inset from the track edge.
 * @cssprop [--rc-carousel-pagination-item-size=8px] - Slide-picker dot
 *   diameter.
 * @cssprop [--rc-carousel-pagination-item-color=color-mix(in srgb, CanvasText 40%, transparent)] -
 *   Inactive slide-picker dot color.
 * @cssprop [--rc-carousel-pagination-item-active-color=Highlight] - Active
 *   slide-picker dot color.
 *
 * @csspart track - The scrollable slide track.
 * @csspart navigation - Previous/next button wrapper.
 * @csspart navigation-button - A previous or next button.
 * @csspart navigation-button-previous - The previous button specifically.
 * @csspart navigation-button-next - The next button specifically.
 * @csspart pagination - Slide-picker button group wrapper.
 * @csspart pagination-item - A slide-picker button.
 * @csspart pagination-item-active - The active slide's picker button.
 *
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/carousel/ WAI-ARIA APG Carousel pattern}
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-carousel rc-carousel documentation}
 */
export class RCCarousel extends LitElement {
  static override styles = carouselStyles;

  private readonly _internals: ElementInternals;

  @query('#track') private _trackEl?: HTMLDivElement;
  @query('slot:not([name])') private _slotEl?: HTMLSlotElement;

  // Seeded from direct children during connection so the first render can
  // build pagination without changing reactive state from firstUpdated().
  private _items: RCCarouselItem[] = [];
  private _cloneItems: RCCarouselItem[] = [];
  private _mounted = false;
  private _suppressSync = false;
  private _pendingInstant = false;
  private _settleTimer: ReturnType<typeof setTimeout> | undefined;

  /** Wraps past the first/last slide back to the other end, seamlessly. */
  @property({ type: Boolean, reflect: true })
  loop = false;

  /** Shows previous/next buttons. */
  @property({ type: Boolean, reflect: true })
  navigation = false;

  /** Shows a slide-picker button group. */
  @property({ type: Boolean, reflect: true })
  pagination = false;

  /**
   * Enables click-and-drag scrolling with a mouse — native scroll-snap
   * touch physics already cover touch/pen, but a mouse has no built-in
   * equivalent. Off by default.
   */
  @property({ type: Boolean, reflect: true, attribute: 'mouse-dragging' })
  mouseDragging = false;

  @state() private _dragging = false;

  /** Logical inline scroll offset of the track when the current drag began. */
  private _dragStartOffset = 0;

  /** Track flow, re-resolved at the start of each drag or scroll operation. */
  private _flow: Flow = HORIZONTAL_LTR_FLOW;

  private _dragAxis: 'x' | 'y' = 'x';
  private _suppressNextClick = false;

  /**
   * Drives the track's scroll offset directly from pointer deltas while `mouseDragging`
   * is on. `activation: 'axis'` (not `'immediate'`) means a plain click
   * never activates a drag at all — it requires clearing
   * `activationDistance` (8px) of movement first — but a *real* drag still
   * ends in a native `click` on release, on whatever's under the pointer,
   * which `_suppressNextClick` swallows so dragging across an unrelated
   * link or button inside a slide doesn't activate it (the same edge case
   * Shoelace's own `sl-carousel` handles for exactly this reason).
   */
  protected readonly _dragController = new DragGestureController(this, {
    target: () => this._trackEl ?? null,
    axis: 'x',
    activation: 'axis',
    canStart: (event) => {
      if (!this.mouseDragging || event.pointerType !== 'mouse') {
        return false;
      }

      // Resolve on pointerdown, before the controller picks the drag axis
      // from the first moves; the flow then holds for the whole gesture.
      this._resolveFlow();

      return true;
    },
    onStart: () => {
      this._dragging = true;
      this._dragStartOffset = this._trackOffset();
      this._suppressNextClick = true;

      // Imperative, not reactive-class-driven: this must land before
      // onMove's very first scroll offset write below, and a Lit re-render
      // (triggered by _dragging above) is a whole render pass too late for
      // that — with scroll-snap-type still active, the browser eagerly
      // resnaps a plain scroll offset assignment straight back to the
      // nearest snap point, same as it would any other programmatic
      // scroll with no notion this is "mid-gesture".
      if (this._trackEl) {
        this._trackEl.style.scrollSnapType = 'none';
      }
    },
    onMove: (detail) => {
      // Dragging toward the inline end drags content with it, which scrolls
      // back toward the start, hence the subtraction. Projecting through the
      // flow makes that hold in RTL and in vertical writing modes.
      this._setTrackOffset(
        this._dragStartOffset -
          logicalDelta({ dx: detail.deltaX, dy: detail.deltaY }, 'inline', this._flow),
      );
    },
    onEnd: (detail) => this._endDrag(detail),
    onCancel: (detail) => this._endDrag(detail),
  });

  @state() private _busy = false;

  private _activeIndex: number | undefined;
  private _defaultActiveIndex = 0;
  private _uncontrolledActiveIndex: number | undefined;
  private _activeIndexInitialized = false;

  /** Controls the active slide. Host writes are silent. */
  @property({ type: Number, attribute: 'active-index' })
  get activeIndex(): number {
    return this._clampIndex(
      this._activeIndex ?? this._uncontrolledActiveIndex ?? this._defaultActiveIndex,
    );
  }

  set activeIndex(value: number | undefined) {
    const oldValue = this.activeIndex;

    this._activeIndex = value;
    this._activeIndexInitialized = true;
    this.requestUpdate('activeIndex', oldValue);
  }

  /** Initial active slide for uncontrolled usage. */
  @property({ type: Number, attribute: 'default-active-index' })
  get defaultActiveIndex(): number {
    return this._defaultActiveIndex;
  }

  set defaultActiveIndex(value: number) {
    const oldValue = this._defaultActiveIndex;

    this._defaultActiveIndex = value;

    if (
      !this._activeIndexInitialized &&
      this._activeIndex === undefined &&
      this._uncontrolledActiveIndex === undefined
    ) {
      this.requestUpdate('activeIndex', oldValue);
    }

    this.requestUpdate('defaultActiveIndex', oldValue);
  }

  /**
   * The scroll-snap track element. Internal integration point consumed by
   * `rc-carousel-item`'s IntersectionObserver (its `root` must be this
   * track, not the viewport, so peeking/clipped-but-viewport-visible
   * slides are still correctly detected as off-screen) — not a public API.
   */
  get trackElement(): HTMLElement | null {
    return this._trackEl ?? null;
  }

  constructor() {
    super();
    this._internals = this.attachInternals();
    this._internals.role = 'group';
  }

  override connectedCallback(): void {
    super.connectedCallback();

    this._items = this._directItems();
    this._setItemPositions();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'group');
    }

    if (!this.hasAttribute('aria-roledescription')) {
      this.setAttribute('aria-roledescription', 'carousel');
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();

    if (this._settleTimer !== undefined) {
      clearTimeout(this._settleTimer);
    }
  }

  protected override firstUpdated(): void {
    if (import.meta.env.DEV) {
      warnMissingDirectChild(this, {
        selector: ':scope > rc-carousel-item',
        childDescription: '<rc-carousel-item> elements',
      });

      if (!this.hasAttribute('aria-label') && !this.hasAttribute('aria-labelledby')) {
        console.warn(
          "[rc-carousel] No aria-label/aria-labelledby set. Provide one describing this carousel's content.",
        );
      }
    }

    this._syncActiveItemAccessibility(this.activeIndex);
    this._scrollToIndex(this.activeIndex, true);
    this._mounted = true;
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed);

    this._initPaginationTabIndex();

    if (changed.has('loop') && this._mounted) {
      // Live toggle: _syncItems is idempotent (see its own comment) when
      // clone presence already matches, so this is cheap to call even when
      // nothing actually needs to change.
      this._syncItems();
    }

    if (!changed.has('activeIndex')) {
      return;
    }

    this._syncActiveItemAccessibility(this.activeIndex);

    if (this._suppressSync) {
      this._suppressSync = false;

      return;
    }

    const instant = !this._mounted || this._pendingInstant;

    this._pendingInstant = false;
    this._scrollToIndex(this.activeIndex, instant);
  }

  /** Moves to the next slide. */
  next(): void {
    this._step(1, 'api');
  }

  /** Moves to the previous slide. */
  previous(): void {
    this._step(-1, 'api');
  }

  /** Moves directly to a slide index. */
  goToIndex(index: number, instant = false): void {
    this._pendingInstant = instant;
    this._setActiveIndex(index, 'api');
  }

  private _step(delta: 1 | -1, trigger: RCCarouselChangeTrigger): void {
    this._setActiveIndex(this.activeIndex + delta, trigger);
  }

  /** Whether a previous/next button (or an equivalent keyboard action)
   * currently has anywhere to go — always true when `loop` is set and
   * there's more than one slide. */
  private _canStep(delta: 1 | -1): boolean {
    const count = this._items.length;

    if (count <= 1) {
      return false;
    }

    if (this.loop) {
      return true;
    }

    return delta > 0 ? this.activeIndex < count - 1 : this.activeIndex > 0;
  }

  /**
   * Wraps when `loop` is set, otherwise clamps to the real slide range.
   * Wrapping here covers button/keyboard navigation; a swipe wraps
   * seamlessly through `_trackSlots`'s cloned lead/trail slides instead,
   * since that needs the clones' own track positions, not just an index.
   */
  private _clampIndex(index: number): number {
    const count = this._items.length;

    if (count === 0) {
      return 0;
    }

    if (this.loop) {
      return ((index % count) + count) % count;
    }

    return Math.min(count - 1, Math.max(0, index));
  }

  private _snapPoints(): number[] {
    const step = this._itemStep();

    return this._items.map((_item, index) => index * step);
  }

  /**
   * Every scrollable track position in rendered order, including cloned
   * lead/trail slides when `loop` is on — `[lastClone, item0, ..., itemN-1,
   * firstClone]`. Each slot reports which real slide index it represents
   * (a clone mirrors the real slide it duplicates), so both scrolling to
   * an index and reading back a settled scroll position can stay in terms
   * of real indices while the clones do the seamless-wrap work.
   */
  private _trackSlots(): { point: number; index: number; isClone: boolean }[] {
    const step = this._itemStep();
    const count = this._items.length;

    if (!this.loop || count < 2) {
      return this._items.map((_item, index) => ({ point: index * step, index, isClone: false }));
    }

    return [
      { point: 0, index: count - 1, isClone: true },
      ...this._items.map((_item, index) => ({ point: (index + 1) * step, index, isClone: false })),
      { point: (count + 1) * step, index: 0, isClone: true },
    ];
  }

  private _itemStep(): number {
    if (!this._trackEl) {
      return 1;
    }

    const first = this._items[0];
    const flow = this._resolveFlow();

    if (!(first instanceof HTMLElement)) {
      return clientSize(this._trackEl, 'inline', flow);
    }

    const gap = Number.parseFloat(getComputedStyle(this._trackEl).columnGap || '0') || 0;

    return (flow.inline === 'x' ? first.offsetWidth : first.offsetHeight) + gap;
  }

  /**
   * Re-reads the track's writing mode and direction. Called at the start of
   * each scroll operation and on each drag's pointerdown rather than cached
   * for the element's life, since neither a `dir` nor a writing-mode change
   * on an ancestor fires an event. The drag gesture's physical axis follows,
   * so a carousel in vertical text drags vertically.
   */
  private _resolveFlow(): Flow {
    if (!this._trackEl) {
      return this._flow;
    }

    this._flow = resolveFlow(this._trackEl);

    const axis = physicalAxis('inline', this._flow);

    // Never rebind mid-gesture; the next drag picks the new axis up.
    if (!this._dragging && axis !== this._dragAxis) {
      this._dragAxis = axis;
      this._dragController.setOptions({ axis });
    }

    return this._flow;
  }

  /** Scroll distance from the track's logical start, never negative. */
  private _trackOffset(): number {
    return this._trackEl ? getScrollOffset(this._trackEl, 'inline', this._flow) : 0;
  }

  private _setTrackOffset(offset: number, behavior: ScrollBehavior = 'auto'): void {
    if (this._trackEl) {
      setScrollOffset(this._trackEl, 'inline', offset, this._flow, behavior);
    }
  }

  private _setActiveIndex(index: number, trigger: RCCarouselChangeTrigger): void {
    const clamped = this._clampIndex(index);
    const oldValue = this.activeIndex;

    if (oldValue === clamped) {
      return;
    }

    // Controlled usage (activeIndex currently has a host-owned value)
    // never self-writes here — only the consumer's own activeIndex setter
    // may change it, in response to the event dispatched below. Only
    // genuinely uncontrolled usage updates its own backing state directly.
    if (this._activeIndex === undefined) {
      this._uncontrolledActiveIndex = clamped;
      this.requestUpdate('activeIndex', oldValue);
    }

    this.dispatchEvent(
      new CustomEvent<RCCarouselChangeDetail>('rc-carousel-change', {
        bubbles: true,
        composed: true,
        detail: { index: clamped, trigger },
      }),
    );
  }

  private _scrollToIndex(index: number, instant: boolean): void {
    if (!this._trackEl) {
      return;
    }

    const slot = this._trackSlots().find((s) => !s.isClone && s.index === index);
    const offset = slot ? slot.point : index * this._itemStep();
    const reducedMotion =
      this.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches ??
      false;

    // Explicit per call, not an ambient CSS default — see the comment on
    // #track in rc-carousel.styles.ts.
    this._setTrackOffset(offset, instant || reducedMotion ? 'auto' : 'smooth');
  }

  /**
   * Keep the authored active slide available to assistive technology even
   * before a programmatic scroll produces its next intersection callback.
   * IntersectionObserver still takes over during direct manipulation, where
   * the visually dominant slide can change before scroll settling updates the
   * public active index.
   */
  private _syncActiveItemAccessibility(index: number): void {
    this._directItems().forEach((item, itemIndex) => {
      const hidden = itemIndex !== index;

      item.toggleAttribute('aria-hidden', hidden);
      item.toggleAttribute('inert', hidden);
    });
  }

  private _onSlotChange = (): void => {
    this._syncItems();
  };

  private _directItems(): RCCarouselItem[] {
    return Array.from(this.children).filter(
      (el): el is RCCarouselItem =>
        el.tagName === 'RC-CAROUSEL-ITEM' && !el.hasAttribute('data-clone'),
    );
  }

  private _setItemPositions(): void {
    this._items.forEach((item, index) => {
      item.position = `${index + 1} of ${this._items.length}`;
    });
  }

  /**
   * Prepending/appending the loop clones below is itself a light-DOM
   * mutation on this host, which re-fires `slotchange` (asynchronously) —
   * `_onSlotChange` calls back into this method, so a naive unconditional
   * remove-then-recreate would recreate a fresh pair of clones on every
   * pass forever. Clones are always excluded from `nextItems`, so the
   * real item list is byte-for-byte identical on that re-entrant pass;
   * only rebuild clone DOM when either the real items or the desired
   * clone presence has actually changed, so the re-entrant pass is a
   * true no-op and the recursion terminates.
   */
  private _syncItems(): void {
    const assigned = this._slotEl?.assignedElements() ?? [];
    const nextItems = assigned.filter(
      (el): el is RCCarouselItem =>
        el.tagName === 'RC-CAROUSEL-ITEM' && !el.hasAttribute('data-clone'),
    );
    const itemsChanged =
      nextItems.length !== this._items.length ||
      nextItems.some((item, index) => item !== this._items[index]);
    const wantsClones = this.loop && nextItems.length > 1;
    const hasClones = this._cloneItems.length > 0;

    this._items = nextItems;
    this._setItemPositions();

    if (itemsChanged && this._mounted) {
      this.requestUpdate();
    }

    if (!itemsChanged && wantsClones === hasClones) {
      return;
    }

    this._removeClones();

    if (wantsClones) {
      this._addClones();
    }
  }

  /**
   * Clones the first and last slide and prepends/appends them
   * (`data-clone="<real index>"` marks them, excluded from `_items` and
   * from position numbering) so the track has real scrollable content
   * past both visual ends. `_trackSlots`/`_commitSettledIndex` detect
   * when a clone settles and instantly re-anchor to the real slide it
   * mirrors — Shoelace's proven technique for a seamless infinite swipe,
   * rather than a discontinuous index-modulo jump back to the other end.
   */
  private _addClones(): void {
    const first = this._items[0];
    const last = this._items[this._items.length - 1];

    if (!first || !last) {
      return;
    }

    const leadingClone = last.cloneNode(true) as RCCarouselItem;

    leadingClone.setAttribute('data-clone', String(this._items.length - 1));
    this._sanitizeClone(leadingClone);
    this.prepend(leadingClone);

    const trailingClone = first.cloneNode(true) as RCCarouselItem;

    trailingClone.setAttribute('data-clone', '0');
    this._sanitizeClone(trailingClone);
    this.append(trailingClone);

    this._cloneItems = [leadingClone, trailingClone];
  }

  /** Keeps visual loop clones out of forms, focus order, and the accessibility tree. */
  private _sanitizeClone($clone: RCCarouselItem): void {
    $clone.setAttribute('aria-hidden', 'true');
    $clone.setAttribute('inert', '');

    for (const $element of [$clone, ...$clone.querySelectorAll<HTMLElement>('*')]) {
      $element.removeAttribute('id');
      $element.removeAttribute('name');
      $element.removeAttribute('form');
    }
  }

  private _removeClones(): void {
    this._cloneItems.forEach((clone) => clone.remove());
    this._cloneItems = [];
  }

  /**
   * On release, a fast enough flick pre-nudges the scroll offset to the next
   * snap point in the drag direction (a "decisive swipe" — mirroring
   * `rc-bottom-sheet`'s own velocity-vs-nearest-point settle heuristic,
   * adapted from "jump to the extreme end" for a 2-point sheet to "advance
   * one further point" for a carousel that can have many). Either way,
   * this hands off to the same debounced settle path a native swipe
   * already goes through — our own scroll offset writes during the drag
   * already fired real `scroll` events, so `_onScroll` just needs to run
   * its usual timer to pick up wherever things ended.
   */
  private _endDrag(detail: DragGestureDetail): void {
    this._dragging = false;

    if (this._trackEl) {
      this._trackEl.style.scrollSnapType = '';
    }

    const velocity = logicalDelta(
      { dx: detail.velocityX, dy: detail.velocityY },
      'inline',
      this._flow,
    );

    if (this._trackEl && Math.abs(velocity) > DECISIVE_DRAG_VELOCITY) {
      const slots = this._trackSlots();
      // Flicking toward the inline start moves content toward the start,
      // i.e. advances forward — toward higher track points.
      const direction = velocity < 0 ? 1 : -1;
      const targetSlotIndex = findNextSnapIndex(
        slots.map((slot) => slot.point),
        this._trackOffset(),
        direction,
      );
      const targetSlot = slots[targetSlotIndex];

      if (targetSlot) {
        this._setTrackOffset(targetSlot.point);
      }
    }

    this._onScroll();
  }

  /**
   * Debounced, not per-frame: `_scrollToIndex`'s own smooth scroll fires
   * many `scroll` events while still mid-flight, and reading the settled
   * index from an in-progress position would report the wrong slide and
   * immediately fight the very scroll driving it. Waiting for scrolling to
   * actually stop (swipe release or animation end) avoids that oscillation.
   */
  private _onScroll = (): void => {
    if (this._settleTimer !== undefined) {
      clearTimeout(this._settleTimer);
    }

    this._busy = true;
    this._settleTimer = setTimeout(this._commitSettledIndex, SETTLE_DEBOUNCE_MS);
  };

  private _commitSettledIndex = (): void => {
    this._busy = false;

    if (!this._trackEl) {
      return;
    }

    const slots = this._trackSlots();
    const settledSlotIndex = findNearestSnapIndex(
      slots.map((slot) => slot.point),
      this._trackOffset(),
    );
    const settledSlot = settledSlotIndex >= 0 ? slots[settledSlotIndex] : undefined;

    if (!settledSlot) {
      return;
    }

    if (settledSlot.isClone) {
      // Seamless re-anchor: a clone settling means the user scrolled past
      // the real end. Instantly (no animation — this must be invisible)
      // correct to the real slide's own track position, which renders
      // identically to the clone at this scroll offset.
      const realSlot = slots.find((slot) => !slot.isClone && slot.index === settledSlot.index);

      if (realSlot) {
        this._setTrackOffset(realSlot.point);
      }
    }

    if (settledSlot.index === this.activeIndex) {
      // Already in sync (or the clone correction above just made it so) —
      // no prop change means `updated()` won't run at all, so there's no
      // echo to suppress here.
      return;
    }

    // Settling a user swipe reports the new index back up through the same
    // `activeIndex` prop the sync effect (`updated()`) watches. Replaying
    // that through `_scrollToIndex` would still fire a real, non-instant
    // `scrollTo`, not a no-op — if a genuine next swipe starts during that
    // echoed animation, it fights the swipe and can swallow it.
    // `_suppressSync` skips `updated()`'s scroll for exactly that one echo.
    const controlled = this._activeIndex !== undefined;

    if (!controlled) {
      this._suppressSync = true;
    }

    this._setActiveIndex(settledSlot.index, 'swipe');

    // A controlled consumer may reject the requested swipe by leaving the
    // property unchanged. Restore the visual position to the host-owned slide
    // instead of leaving scroll state and public state disagreeing.
    if (controlled && this.activeIndex !== settledSlot.index) {
      this._scrollToIndex(this.activeIndex, true);
    }
  };

  private _onNavigate = (action: KeyboardNavigationAction): void => {
    switch (action) {
      case 'next':
        this._step(1, 'keyboard');
        break;
      case 'prev':
        this._step(-1, 'keyboard');
        break;

      case 'start': {
        const index = findExtremeSnapIndex(this._snapPoints(), -1);

        if (index >= 0) {
          this._setActiveIndex(index, 'keyboard');
        }

        break;
      }

      case 'end': {
        const index = findExtremeSnapIndex(this._snapPoints(), 1);

        if (index >= 0) {
          this._setActiveIndex(index, 'keyboard');
        }

        break;
      }
    }
  };

  /**
   * A real drag still ends in a native `click` on release (browsers fire
   * one on pointerup as long as pointerdown/pointerup share a target),
   * landing on whatever's currently under the pointer — which, mid-drag,
   * is often unrelated slide content the user was scrolling past, not
   * clicking. Capturing and swallowing exactly one click right after a
   * drag activated (`_suppressNextClick`, set in the drag controller's
   * `onStart`) stops that from reaching a link/button inside a slide.
   */
  private _onTrackClickCapture = (event: MouseEvent): void => {
    if (!this._suppressNextClick) {
      return;
    }

    this._suppressNextClick = false;
    event.stopPropagation();
    event.preventDefault();
  };

  private _paginationButtons(): HTMLButtonElement[] {
    return Array.from(
      this.shadowRoot?.querySelectorAll<HTMLButtonElement>('[data-pagination-item]') ?? [],
    );
  }

  /**
   * Hand-rolled roving tabindex for the pagination row, not
   * `RovingTabIndexMixin`: that mixin collects items from a real
   * `slotchange`-firing `<slot>`, matching its intended use (consumer-
   * authored, slotted content, like `rc-toolbar`'s buttons) — these
   * buttons are shadow-DOM content this component renders itself, so
   * there's no slot to collect from. The pattern is otherwise the same
   * one the mixin itself implements: exactly one button is a tab stop,
   * arrow keys move focus among them (not activeIndex — matching
   * rc-toolbar's own "arrows move focus, Enter/Space activates" model,
   * not a tablist's auto-activate-on-arrow), and focus keeps tabindex in
   * sync wherever it lands (click, Tab, or a `.focus()` call below).
   */
  private _onPaginationFocus = (event: FocusEvent): void => {
    const buttons = this._paginationButtons();
    const target = event.composedPath().find((el) => buttons.includes(el as HTMLButtonElement)) as
      | HTMLButtonElement
      | undefined;

    if (!target) {
      return;
    }

    buttons.forEach((button) => button.setAttribute('tabindex', button === target ? '0' : '-1'));
  };

  private _onPaginationNavigate = (action: KeyboardNavigationAction): void => {
    const buttons = this._paginationButtons();

    if (!buttons.length) {
      return;
    }

    const current = buttons.indexOf(this.shadowRoot?.activeElement as HTMLButtonElement);
    const from = current < 0 ? 0 : current;

    switch (action) {
      case 'next':
        buttons[(from + 1) % buttons.length]?.focus();
        break;
      case 'prev':
        buttons[(from - 1 + buttons.length) % buttons.length]?.focus();
        break;
      case 'start':
        buttons[0]?.focus();
        break;
      case 'end':
        buttons[buttons.length - 1]?.focus();
        break;
    }
  };

  /**
   * One-time tabindex seed for pagination buttons that have never
   * received focus yet (matching `activeIndex`, the sane default) —
   * `_onPaginationFocus` takes over from there. Safe to call on every
   * render: a no-op once every button already has some tabindex value.
   */
  private _initPaginationTabIndex(): void {
    this._paginationButtons().forEach((button, index) => {
      if (!button.hasAttribute('tabindex')) {
        button.setAttribute('tabindex', index === this.activeIndex ? '0' : '-1');
      }
    });
  }

  protected override render() {
    const canPrev = this._canStep(-1);
    const canNext = this._canStep(1);

    return html`
      <div
        id="track"
        part="track"
        tabindex="0"
        class=${this._dragging ? 'dragging' : nothing}
        aria-busy=${this._busy ? 'true' : 'false'}
        aria-atomic="true"
        @scroll=${this._onScroll}
        @click=${{ handleEvent: this._onTrackClickCapture, capture: true }}
        ${keyNavigation(this._onNavigate, { navigationAxis: 'horizontal' })}
      >
        <slot @slotchange=${this._onSlotChange}></slot>
      </div>

      ${this.navigation
        ? html`
            <div id="navigation" part="navigation">
              <button
                type="button"
                part="navigation-button navigation-button-previous"
                aria-label="Previous slide"
                aria-disabled=${canPrev ? 'false' : 'true'}
                @click=${() => {
                  if (canPrev) {
                    this._step(-1, 'button');
                  }
                }}
              >
                <span aria-hidden="true">
                  <slot name="previous-icon">
                    <svg
                      viewBox="0 0 6 10"
                      width="10"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="5,1 1,5 5,9" />
                    </svg>
                  </slot>
                </span>
              </button>
              <button
                type="button"
                part="navigation-button navigation-button-next"
                aria-label="Next slide"
                aria-disabled=${canNext ? 'false' : 'true'}
                @click=${() => {
                  if (canNext) {
                    this._step(1, 'button');
                  }
                }}
              >
                <span aria-hidden="true">
                  <slot name="next-icon">
                    <svg
                      viewBox="0 0 6 10"
                      width="10"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="1,1 5,5 1,9" />
                    </svg>
                  </slot>
                </span>
              </button>
            </div>
          `
        : nothing}
      ${this.pagination
        ? html`
            <div
              id="pagination"
              part="pagination"
              role="group"
              aria-label="Choose slide to display"
              @focusin=${this._onPaginationFocus}
              ${keyNavigation(this._onPaginationNavigate, { navigationAxis: 'horizontal' })}
            >
              ${this._items.map(
                (_item, index) => html`
                  <button
                    type="button"
                    data-pagination-item
                    part="pagination-item${index === this.activeIndex
                      ? ' pagination-item-active'
                      : ''}"
                    aria-label="Go to slide ${index + 1}"
                    aria-current=${index === this.activeIndex ? 'true' : 'false'}
                    aria-disabled=${index === this.activeIndex ? 'true' : 'false'}
                    @click=${() => this._setActiveIndex(index, 'button')}
                  ></button>
                `,
              )}
            </div>
          `
        : nothing}
    `;
  }
}
