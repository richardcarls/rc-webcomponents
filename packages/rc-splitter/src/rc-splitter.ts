import { LitElement, html, nothing } from 'lit';
import { property, state, query, queryAssignedElements } from 'lit/decorators.js';

import {
  DragGestureController,
  findNearestSnapIndex,
  findNextSnapIndex,
  keyInteraction,
  keyNavigation,
  type DragGestureDetail,
  type KeyboardNavigationAction,
} from '@rcarls/rc-common';

import splitterStyles from './rc-splitter.styles';

type SplitterOrientation = 'horizontal' | 'vertical';

type SplitterMode = 'length' | 'percent' | 'fixed';

const MIN_SWIPE_DISTANCE = 24;
const DEFAULT_SNAP_DURATION_MS = 200;
const SNAP_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

declare global {
  interface HTMLElementTagNameMap {
    'rc-splitter': RCSplitter;
  }
}

/**
 * Resizable pane splitter with pointer, keyboard, anchored settling, and
 * collapse/restore controls, following the WAI-ARIA Window Splitter pattern.
 *
 * Set `orientation="vertical"` for a vertical splitter
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-splitter rc-splitter docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/ WAI-ARIA Window Splitter pattern}
 *
 * @slot - Primary pane contents
 * @slot secondary - Secondary pane contents (optional)
 *
 * @fires rc-splitter-change - Fired when the separator position changes; `detail: { value, valueText }`
 *
 * @attr label - Accessible label applied to the primary pane and referenced by the separator
 *   handle's `aria-labelledby`.
 * @attr orientation - Layout direction: `horizontal` (left/right panes) or `vertical` (top/bottom panes).
 * @attr mode - Value units and pane sizing behavior: `length`, `percent`, or `fixed`.
 * @attr step - Keyboard resize step size, in the current mode's units.
 * @attr min - Minimum primary pane size, in the current mode's units.
 * @attr max - Maximum primary pane size, in the current mode's units. Defaults to the full
 *   container size.
 * @attr value - Current primary pane size. Host writes update silently.
 * @attr default-value - Initial uncontrolled primary pane size.
 * @attr fixed - Disables pointer and keyboard resizing without changing pane size.
 * @attr collapsible - Renders a collapse/expand toggle button on the separator.
 * @attr snap-points - Ascending whitespace-separated anchors, in the current mode's units.
 * @attr swipe-velocity - Minimum release velocity, in px/s, that qualifies as a swipe.
 *
 * @cssprop [--rc-splitter-separator-size=6px] - Thickness of the separator bar
 * @cssprop [--rc-splitter-separator-handle-size=100%] - Length of the drag handle area within the separator (also the length of the visible indicator)
 * @cssprop [--rc-splitter-separator-color=color-mix(in srgb, ButtonBorder 35%, Canvas 65%)] - Separator background color
 * @cssprop [--rc-splitter-keyline=1px solid ButtonBorder] - Shared separator keyline border
 * @cssprop [--rc-splitter-handle-color=ButtonBorder] - Color of the dot grip indicators (default visual)
 * @cssprop [--rc-splitter-handle-thickness=4px] - Cross-axis size of the visual indicator (dot column width or pill/line thickness)
 * @cssprop [--rc-splitter-handle-border-radius=0] - Border-radius of the visual indicator; set to a large value (e.g. 999px) for a pill shape
 * @cssprop [--rc-splitter-handle-pattern=<3-dot radial-gradient>] - background-image for the visual indicator; set to `none` to use a solid fill via --rc-splitter-handle-fill instead
 * @cssprop [--rc-splitter-handle-fill=transparent] - background-color of the visual indicator; effective when --rc-splitter-handle-pattern is none (e.g. for a solid pill)
 * @cssprop [--rc-splitter-handle-hover-fill=transparent] - background-color of the visual indicator on hover; scoped to the indicator element only, not the full separator strip
 * @cssprop [--rc-splitter-handle-transition=0ms] - CSS transition duration/easing for the visual indicator's background-color changes
 * @cssprop [--rc-splitter-snap-duration=200ms] - Duration of anchored settling after pointer release or `snapTo()`
 * @cssprop [--rc-splitter-collapse-button-size=20px] - Diameter of the collapse/expand toggle button
 * @cssprop [--rc-splitter-collapse-button-offset=8px] - Distance from the start edge of the separator to the collapse button center
 * @cssprop [--rc-splitter-collapse-button-bg=Canvas] - Collapse button background color
 * @cssprop [--rc-splitter-collapse-button-hover-bg=ButtonFace] - Collapse button background color on hover
 * @cssprop [--rc-splitter-collapse-button-border=ButtonBorder] - Collapse button border color
 * @cssprop [--rc-splitter-collapse-button-color=ButtonText] - Collapse button icon color
 * @cssprop [--rc-splitter-separator-border-inline-start=1px solid ButtonBorder] - Inline-start border
 * @cssprop [--rc-splitter-separator-border-inline-end=1px solid ButtonBorder] - Inline-end border
 * @cssprop [--rc-splitter-separator-border-block-start=1px solid ButtonBorder] - Block-start border (vertical orientation)
 * @cssprop [--rc-splitter-separator-border-block-end=1px solid ButtonBorder] - Block-end border (vertical orientation)
 * @csspart primary - Primary pane container
 * @csspart secondary - Secondary pane container
 * @csspart separator - The separator bar
 * @csspart separator-handle - The focusable drag handle
 * @csspart collapse-button - The collapse/expand toggle button (only rendered when `collapsible` is set)
 */
export class RCSplitter extends LitElement {
  static styles = [splitterStyles];

  /** Accessible label for this splitter. Default label is 'Splitter'. */
  @property({ type: String })
  label = 'Splitter';

  /** Splitter orientation, for keyboard navigation and initial sizing. */
  @property({ type: String, reflect: true })
  orientation: SplitterOrientation = 'horizontal';

  /**
   * Determines value units and pane sizing behavior.
   *
   * - `length` uses px for the primary pane size.
   * - `percent` uses percentage points.
   * - `fixed` uses px for a clampable fixed primary pane while the secondary pane flexes.
   */
  @property({ type: String, reflect: true })
  mode: SplitterMode = 'length';

  /** The step size for resizing, in either pixels or percentage points depending on `mode`. */
  @property({ type: Number })
  step: number = 1;

  /** Minimum size of the primary pane in current mode units. Defaults to 0. */
  @property({ type: Number })
  min: number = 0;

  /** Maximum size of the primary pane in current mode units. Defaults to the full container size. */
  @property({ type: Number })
  max: number | undefined = undefined;

  private _defaultValue: number | undefined;
  private _hostValue: number | undefined;
  private _valueInitialized = false;

  /** The current splitter value. Host writes update silently. */
  @property({ type: Number })
  set value(val: number) {
    const oldValue = this._hostValue;

    this._hostValue = val;

    if (this._initialMax) {
      this._setValue(val, false);
    }

    this.requestUpdate('value', oldValue);
  }

  /** The current splitter value, corresponding to the separator position, in either pixels or percentage points depending on `mode`. */
  get value() {
    return this._value;
  }

  /** Initial uncontrolled splitter value. */
  @property({ type: Number, attribute: 'default-value' })
  set defaultValue(val: number | undefined) {
    const oldValue = this._defaultValue;

    this._defaultValue = val;

    if (!this._initialMax && this._hostValue === undefined && val !== undefined) {
      this._setValue(val, false);
    }

    this.requestUpdate('defaultValue', oldValue);
  }

  /** Initial uncontrolled splitter value. */
  get defaultValue() {
    return this._defaultValue;
  }

  protected get _effectiveMin(): number {
    return Math.max(this._minValue, this.min);
  }

  protected get _effectiveMax(): number {
    return Math.min(this._maxValue, this.max ?? this._maxValue);
  }

  /** True once initialized and the primary pane is at its effective minimum. */
  protected get _isCollapsed(): boolean {
    return this._initialMax > 0 && this.value <= this._effectiveMin;
  }

  protected _toggleCollapse(): void {
    this._setUserValue(this._isCollapsed ? this._lastValue : this._effectiveMin);
  }

  protected _onCollapseButtonClick(): void {
    this._toggleCollapse();
  }

  protected _onCollapseKeydown(e: KeyboardEvent): void {
    if (!this.collapsible || this.fixed) {
      return;
    }

    if (!e.ctrlKey && !e.metaKey) {
      return;
    }

    const isRelevantKey =
      this.orientation === 'horizontal'
        ? e.key === 'ArrowLeft' || e.key === 'ArrowRight'
        : e.key === 'ArrowUp' || e.key === 'ArrowDown';

    if (isRelevantKey) {
      e.preventDefault();
      e.stopImmediatePropagation();
      this._toggleCollapse();
    }
  }

  private get _collapseButtonIcon() {
    const isHorizontal = this.orientation === 'horizontal';
    // Chevron points LEFT/UP to collapse (separator moves toward primary),
    // RIGHT/DOWN to expand (separator moves away from primary).
    const d = isHorizontal
      ? this._isCollapsed
        ? 'M 3 1 L 7 5 L 3 9'
        : 'M 7 1 L 3 5 L 7 9'
      : this._isCollapsed
        ? 'M 1 3 L 5 7 L 9 3'
        : 'M 1 7 L 5 3 L 9 7';

    return html`<svg
      aria-hidden="true"
      viewBox="0 0 10 10"
      width="10"
      height="10"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d=${d} />
    </svg>`;
  }

  private _setValue(val: number, dispatch: boolean): void {
    const oldValue = this._value;

    this._value = Math.min(
      Math.max(Math.round(val / this.step) * this.step, this._effectiveMin),
      this._effectiveMax,
    );

    if (dispatch && this._value !== oldValue) {
      this.dispatchEvent(
        new CustomEvent('rc-splitter-change', {
          bubbles: true,
          composed: true,
          detail: { value: this._value, valueText: this.valueText },
        }),
      );
    }
  }

  private _setUserValue(val: number): void {
    this._valueInitialized = true;
    this._hostValue = undefined;

    // Capture the last position above the effective minimum before a user-driven
    // change so toggle-collapse can restore it. Internal resize callbacks use
    // _setValue directly and must not overwrite this.
    if (this._value > this._effectiveMin) {
      this._lastValue = this._value;
    }

    this._setValue(val, true);
  }

  @state()
  private _value: number = 0;

  /** Disables pointer and keyboard resizing without changing pane size. */
  @property({ type: Boolean })
  fixed: boolean = false;

  /** Renders a collapse/expand toggle button on the separator. */
  @property({ type: Boolean })
  collapsible: boolean = false;

  /**
   * Ascending whitespace-separated snap points in the current mode's units.
   * An empty value keeps pointer resizing continuous.
   */
  @property({ type: String, attribute: 'snap-points' })
  snapPoints = '';

  /** Minimum release velocity, in px/s, that qualifies as a swipe. */
  @property({ type: Number, attribute: 'swipe-velocity' })
  swipeVelocity = 500;

  /** A human-readable string representation of the value. */
  get valueText() {
    return `${this.value}${this.mode === 'percent' ? '%' : 'px'}`;
  }

  @state()
  protected _minValue: number = 0;

  @state()
  protected _maxValue: number = 0;

  /** Last valid value, for collapse functionality. */
  @state()
  protected _lastValue: number = 0;

  @query('#primary', true)
  protected _$primary!: HTMLDivElement;

  @query('#separator-handle')
  protected _$separatorHandle!: HTMLDivElement;

  @queryAssignedElements()
  protected _$primaryElements!: Array<HTMLElement>;

  @queryAssignedElements({ slot: 'secondary' })
  protected _$secondaryElements!: Array<HTMLElement>;

  protected _initialMax: number = 0;

  private _gestureStartValue = 0;
  private _gestureRestoreValue = 0;
  private _activeSnapAnimation: Animation | null = null;
  private readonly _reducedMotion =
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  private readonly _gesture = new DragGestureController(this, {
    target: () => this._$separatorHandle,
    axis: this.orientation === 'horizontal' ? 'x' : 'y',
    focusOnStart: true,
    onStart: (detail) => this._onGestureStart(detail),
    onMove: (detail) => this._onGestureMove(detail),
    onEnd: (detail) => this._onGestureEnd(detail),
    onCancel: () => this._onGestureCancel(),
  });

  protected _resizeObserver = new ResizeObserver(() => this._onResize());

  protected _onKeyboardResize(action: KeyboardNavigationAction) {
    if (this.fixed) {
      return;
    }

    switch (action) {
      case 'next':
        this._setUserValue(this.value + this.step);
        break;
      case 'prev':
        this._setUserValue(this.value - this.step);
        break;
      case 'next-large':
        this._setUserValue(this.value + this.step * 10);
        break;
      case 'prev-large':
        this._setUserValue(this.value - this.step * 10);
        break;
      case 'start':
        this._setUserValue(this._effectiveMin);
        break;
      case 'end':
        this._setUserValue(this._effectiveMax);
        break;
      case 'toggle':
        this._setUserValue(
          this.value === this._effectiveMin ? this._lastValue : this._effectiveMin,
        );
        break;
    }
  }

  protected _onPointerResize(e: Pick<PointerEvent, 'clientX' | 'clientY'>) {
    if (this.fixed) {
      return;
    }

    const clientRect = this.getBoundingClientRect();

    if (this.orientation === 'vertical') {
      this._setUserValue(((e.clientY - clientRect.top) / clientRect.height) * this._maxValue);
    } else {
      this._setUserValue(((e.clientX - clientRect.left) / clientRect.width) * this._maxValue);
    }
  }

  /**
   * Settles at a declared snap point by zero-based index.
   *
   * Finite fractional indices are truncated and clamped. Calls without valid
   * snap points or with a non-finite index have no effect.
   *
   * @param index - zero-based index into `snapPoints`
   * @param behavior - whether to animate the movement
   */
  snapTo(index: number, behavior: 'animated' | 'instant' = 'animated'): void {
    const points = this._resolvedSnapPoints();

    if (!Number.isFinite(index) || points.length === 0) {
      return;
    }

    const clampedIndex = Math.max(0, Math.min(Math.trunc(index), points.length - 1));

    void this._settleToValue(points[clampedIndex], behavior);
  }

  private _onGestureStart(_detail: DragGestureDetail): void {
    this._activeSnapAnimation?.cancel();
    this._activeSnapAnimation = null;
    this._gestureStartValue = this.value;
    this._gestureRestoreValue = this._lastValue;
  }

  private _onGestureMove(detail: DragGestureDetail): void {
    this._onPointerResize({ clientX: detail.x, clientY: detail.y });
  }

  private _onGestureEnd(detail: DragGestureDetail): void {
    const delta = this.orientation === 'horizontal' ? detail.deltaX : detail.deltaY;
    const velocity = this.orientation === 'horizontal' ? detail.velocityX : detail.velocityY;
    const decisive =
      Math.abs(delta) >= MIN_SWIPE_DISTANCE && Math.abs(velocity) >= this.swipeVelocity;

    if (decisive && this.collapsible) {
      if (velocity < 0) {
        const restoreValue =
          this._gestureRestoreValue > this._effectiveMin
            ? this._gestureRestoreValue
            : this._gestureStartValue;

        void this._settleToValue(this._effectiveMin, 'animated');
        this._lastValue = restoreValue;

        return;
      }

      if (this._gestureStartValue <= this._effectiveMin) {
        void this._settleToValue(
          Math.max(this._gestureRestoreValue, this._effectiveMin),
          'animated',
        );

        return;
      }
    }

    const points = this._resolvedSnapPoints();

    if (points.length === 0) {
      return;
    }

    const index = decisive
      ? findNextSnapIndex(points, this._gestureStartValue, velocity > 0 ? 1 : -1)
      : findNearestSnapIndex(points, this.value);

    if (index >= 0) {
      void this._settleToValue(points[index], 'animated');
    }
  }

  private _onGestureCancel(): void {
    this._activeSnapAnimation?.cancel();
    this._activeSnapAnimation = null;
  }

  private _resolvedSnapPoints(): number[] {
    if (!this.snapPoints.trim()) {
      return [];
    }

    return this.snapPoints
      .trim()
      .split(/\s+/)
      .map(Number)
      .filter(Number.isFinite)
      .map((point) => Math.min(Math.max(point, this._effectiveMin), this._effectiveMax))
      .filter((point, index, points) => index === 0 || point !== points[index - 1]);
  }

  private async _settleToValue(value: number, behavior: 'animated' | 'instant'): Promise<void> {
    const $primary = this._$primary;
    const fromSize =
      this.orientation === 'horizontal'
        ? $primary.getBoundingClientRect().width
        : $primary.getBoundingClientRect().height;

    this._activeSnapAnimation?.cancel();
    this._activeSnapAnimation = null;
    this._setUserValue(value);
    await this.updateComplete;

    if (behavior === 'instant' || this._reducedMotion?.matches) {
      return;
    }

    const toSize =
      this.orientation === 'horizontal'
        ? $primary.getBoundingClientRect().width
        : $primary.getBoundingClientRect().height;

    if (fromSize === toSize) {
      return;
    }

    const property = this.orientation === 'horizontal' ? 'width' : 'height';
    const animation = $primary.animate(
      [{ [property]: `${fromSize}px` }, { [property]: `${toSize}px` }],
      {
        duration: this._snapDuration(),
        easing: SNAP_EASING,
      },
    );

    this._activeSnapAnimation = animation;

    try {
      await animation.finished;
    } catch {
      // A newer gesture or snap call owns the final visual state.
    } finally {
      if (this._activeSnapAnimation === animation) {
        this._activeSnapAnimation = null;
      }
    }
  }

  private _snapDuration(): number {
    const raw = getComputedStyle(this).getPropertyValue('--rc-splitter-snap-duration').trim();
    const parsed = Number.parseFloat(raw);

    return Number.isFinite(parsed) ? parsed : DEFAULT_SNAP_DURATION_MS;
  }

  protected _onPrimaryChange(_e: Event) {
    queueMicrotask(() => {
      if (this._$primaryElements.length < 2) {
        return;
      }

      this._$primaryElements.slice(1).forEach((el) => el.setAttribute('slot', 'secondary'));
    });
  }

  protected _onSecondaryChange(_e: Event) {
    queueMicrotask(() => {
      if (!this._$secondaryElements.length || this._$primaryElements.length) {
        return;
      }

      this._$secondaryElements.at(0)?.removeAttribute('slot');
    });
  }

  private _measureHostSize(axis: 'inline' | 'block'): number {
    const clientRect = this.getBoundingClientRect();
    const measuredSize = axis === 'inline' ? clientRect.width : clientRect.height;

    if (measuredSize > 0) {
      return Math.ceil(measuredSize);
    }

    const computedStyle = getComputedStyle(this);
    const fallbackSize = axis === 'inline' ? computedStyle.width : computedStyle.height;
    const parsedFallbackSize = Number.parseFloat(fallbackSize);

    return Number.isFinite(parsedFallbackSize) ? Math.ceil(parsedFallbackSize) : 0;
  }

  protected _onResize() {
    const el = this._$primaryElements.at(0);
    const prevStyle = this._$primary.style.getPropertyValue('display');

    // Request animation frame to prevent layout paint jank.
    globalThis.requestAnimationFrame(() => {
      // Temporarily display the first light DOM element as a direct child for measurement.
      this._$primary.style.setProperty('display', 'contents');

      const clientRect = el?.getBoundingClientRect() ?? this.getBoundingClientRect();

      if (this.mode !== 'percent') {
        const measured =
          this.orientation === 'horizontal'
            ? // For horizontal splitters, just take the host width...
              this._measureHostSize('inline')
            : // ...otherwise try to use the first lightDOM element's auto height, and cache it
              this._initialMax || Math.ceil(clientRect.height) || this._measureHostSize('block');

        // After initialization, ignore spurious zero measurements (e.g. during
        // Chromium's layout recalculation triggered by a secondary ResizeObserver
        // callback). A temporarily-zero result would clamp _value to 0 incorrectly.
        if (measured > 0 || !this._initialMax) {
          this._maxValue = measured;
        }
      } else {
        // Percentage max is always just 100%
        this._maxValue = 100.0;
      }

      if (!this._initialMax) {
        this._initialMax = this._maxValue;

        this._setValue(
          this._valueInitialized
            ? this._value
            : (this._hostValue ?? this.defaultValue ?? this._maxValue / 2),
          false,
        );
      } else if (this._hostValue !== undefined) {
        this._setValue(this._hostValue, false);
      } else {
        this._setValue(this.value, false);
      }

      // Restore previous display mode
      prevStyle
        ? this._$primary.style.setProperty('display', prevStyle)
        : this._$primary.style.removeProperty('display');
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this._resizeObserver.observe(this);
  }

  disconnectedCallback(): void {
    this._resizeObserver.disconnect();
    this._activeSnapAnimation?.cancel();
    this._activeSnapAnimation = null;
    super.disconnectedCallback();
  }

  firstUpdated() {
    this._onResize();
  }

  protected updated(): void {
    this._gesture.setOptions({
      axis: this.orientation === 'horizontal' ? 'x' : 'y',
      target: () => this._$separatorHandle,
    });
  }

  render() {
    return html`
      <div
        id="primary"
        part="primary"
        aria-label=${this.label}
        style=${this.orientation === 'horizontal'
          ? `width: ${this.valueText}`
          : `height: ${this.valueText}`}
        ?hidden=${this.value === this._minValue}
      >
        <slot @slotchange=${this._onPrimaryChange}></slot>
      </div>

      <div id="separator" part="separator">
        ${this.collapsible && this._$secondaryElements.length && !this.fixed
          ? html`<button
              id="collapse-button"
              part="collapse-button"
              aria-label=${this._isCollapsed ? `Expand ${this.label}` : `Collapse ${this.label}`}
              aria-expanded=${String(!this._isCollapsed)}
              aria-controls="primary"
              @click=${this._onCollapseButtonClick}
            >
              ${this._collapseButtonIcon}
            </button>`
          : nothing}
        <div
          id="separator-handle"
          role="separator"
          tabindex="0"
          part="separator-handle"
          aria-labelledby="primary"
          aria-controls="primary"
          aria-orientation=${this.orientation === 'horizontal' ? 'vertical' : 'horizontal'}
          aria-valuenow=${this.value}
          aria-valuetext=${this.valueText}
          aria-valuemin=${this._effectiveMin}
          aria-valuemax=${this._effectiveMax}
          @keydown=${this._onCollapseKeydown}
          ${keyNavigation(this._onKeyboardResize)}
          ${keyInteraction()}
          ?hidden=${!this._$secondaryElements.length}
        ></div>
      </div>

      <aside
        id="secondary"
        part="secondary"
        ?hidden=${!this._$secondaryElements.length || this.value === this._maxValue}
      >
        <slot name="secondary" @slotchange=${this._onSecondaryChange}></slot>
      </aside>
    `;
  }
}

export default RCSplitter;
