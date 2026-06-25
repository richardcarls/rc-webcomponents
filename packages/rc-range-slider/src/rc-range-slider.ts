import { LitElement, css, html, nothing } from "lit";
import type { ComplexAttributeConverter } from "lit";
import { property, state } from "lit/decorators.js";
import {
  getDirectChildren,
  snapToStep,
  valueToPercent,
  warnMissingDirectChild,
} from "@rcarls/rc-common";

export interface RCRangeSliderValueEvent {
  /** Current [low, high] value tuple. */
  value: [number, number];
}

declare global {
  interface HTMLElementTagNameMap {
    "rc-range-slider": RCRangeSlider;
  }

  interface HTMLElementEventMap {
    "rc-range-slider-input": CustomEvent<RCRangeSliderValueEvent>;
    "rc-range-slider-change": CustomEvent<RCRangeSliderValueEvent>;
  }
}

type DisplayValue = "float" | "inline-start" | "inline-end" | null;
type RangeThumb = "low" | "high";

/**
 * Normalises the `display` attribute.
 * A bare boolean attribute (`display` with no value) maps to `'float'` so
 * the reflected attribute is always an explicit string, never an empty string.
 */
const displayConverter: ComplexAttributeConverter<DisplayValue> = {
  fromAttribute(v: string | null): DisplayValue {
    if (v === null) return null;
    if (v === "" || v === "float") return "float";
    if (v === "inline-start") return "inline-start";
    if (v === "inline-end") return "inline-end";
    return null;
  },
  toAttribute(v: DisplayValue): string | null {
    return v;
  },
};

/**
 * Returns the numeric value of a range input's `min`, `max`, or `step`
 * attribute string, falling back to `defaultVal` when the attribute is absent
 * (empty string) or not a valid number.
 */
function parseAttr(s: string, defaultVal: number): number {
  if (s === "") return defaultVal;

  const n = parseFloat(s);

  return isNaN(n) ? defaultVal : n;
}

/**
 * Dual-thumb range slider implementing the WAI-ARIA APG Slider (Multi-Thumb)
 * pattern with custom shadow-DOM slider thumbs.
 *
 * Consumers provide two direct child `<input type="range">` elements. Before
 * upgrade, those inputs are the usable progressive-enhancement fallback. After
 * upgrade, the inputs remain in light DOM as hidden form reflectors while the
 * shadow thumbs become the focusable, accessible interaction surface.
 *
 * Form participation is handled natively by each input's `name` attribute.
 *
 * @slot - Consumer-provided native range inputs.
 * @slot track-background - Optional decorative content rendered inside the track before the selected range fill.
 * @slot low-value-display - Optional replacement for the low value text.
 * @slot high-value-display - Optional replacement for the high value text.
 *
 * @fires rc-range-slider-input  - Fires while either thumb moves. Detail: `{ value }`.
 * @fires rc-range-slider-change - Fires when a thumb commits a new value. Detail: `{ value }`.
 *
 * @cssprop [--rc-range-slider-accent=Highlight] - Accent color for selected range, thumb border, focus, hover, and active states.
 * @cssprop [--rc-range-slider-gap=var(--rc-control-gap)] - Gap between track and inline value display.
 * @cssprop [--rc-range-slider-control-size=var(--rc-control-block-size)] - Track hit-area block size.
 * @cssprop [--rc-range-slider-track-background=color-mix(in srgb, CanvasText 25%, Canvas)] - Unselected track color.
 * @cssprop [--rc-range-slider-track-radius=var(--rc-control-radius)] - Track border radius.
 * @cssprop [--rc-range-slider-thumb-background=ButtonFace] - Thumb background color.
 * @cssprop [--rc-range-slider-thumb-border=var(--rc-range-slider-accent)] - Thumb border color.
 * @cssprop [--rc-range-slider-thumb-size=1.125rem] - Visual thumb inline/block size.
 * @cssprop [--rc-range-slider-value-color=var(--rc-text-disabled)] - Value display text color.
 * @cssprop [--rc-thumb-radius=9px] - Half the thumb width; used to align float value displays and range fill.
 * @cssprop [--rc-range-slider-float-value-block-offset=-1.4em] - Block-axis offset for horizontal float value displays.
 * @cssprop [--rc-range-slider-float-value-inline-offset=calc(100% + 0.5rem)] - Inline-axis offset for vertical float value displays.
 *
 * @csspart root - Root layout wrapper.
 * @csspart group - Slider group wrapper.
 * @csspart track - Visual slider track.
 * @csspart range - Filled selected range segment.
 * @csspart thumb - Shared custom slider thumb.
 * @csspart low-thumb - Low-value custom slider thumb.
 * @csspart high-thumb - High-value custom slider thumb.
 * @csspart value-display - Shared rendered value text.
 * @csspart low-value-display - Rendered low value text.
 * @csspart high-value-display - Rendered high value text.
 */
export class RCRangeSlider extends LitElement {
  static override styles = css`
    :host {
      --rc-range-slider-accent: var(--rc-accent, Highlight);
      --rc-range-slider-track-background: color-mix(in srgb, CanvasText 25%, Canvas);
      --rc-range-slider-range-background: var(--rc-range-slider-accent);
      --rc-range-slider-thumb-background: ButtonFace;
      --rc-range-slider-thumb-border: var(--rc-range-slider-accent);
      --rc-range-slider-thumb-hover-background: var(--rc-range-slider-accent);
      --rc-range-slider-thumb-hover-border: var(--rc-range-slider-accent);
      --rc-range-slider-thumb-active-background: var(--rc-range-slider-accent);
      --rc-range-slider-thumb-active-border: var(--rc-range-slider-accent);
      --rc-range-slider-focus-outline: var(--rc-range-slider-accent);
      display: block;
      font-family: var(--rc-font-family, inherit);
      font-size: var(--rc-font-size, inherit);
      line-height: var(--rc-line-height, normal);
    }

    :host([disabled]) {
      --rc-range-slider-accent: GrayText;
      --rc-range-slider-track-background: color-mix(in srgb, GrayText 35%, Canvas);
      --rc-range-slider-range-background: GrayText;
      --rc-range-slider-thumb-border: GrayText;
      --rc-range-slider-thumb-hover-background: ButtonFace;
      --rc-range-slider-thumb-hover-border: GrayText;
      --rc-range-slider-thumb-active-background: ButtonFace;
      --rc-range-slider-thumb-active-border: GrayText;
      --rc-range-slider-focus-outline: GrayText;
    }

    .rc-range-slider-root {
      display: grid;
      gap: var(--rc-range-slider-gap, var(--rc-control-gap, 0.5rem));
      align-items: center;
    }

    .rc-range-slider-root[data-display="inline-start"] {
      grid-template-columns: auto minmax(0, 1fr);
    }

    .rc-range-slider-root[data-display="inline-end"] {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .rc-range-slider-group {
      position: relative;
      display: block;
      min-width: 0;
      min-height: var(--rc-range-slider-control-size, var(--rc-control-block-size, 1.5rem));
      touch-action: none;
    }

    .rc-range-slider-track,
    .rc-range-slider-range {
      position: absolute;
      pointer-events: none;
    }

    .rc-range-slider-track {
      inset-inline: 0;
      inset-block: calc(50% - var(--rc-range-slider-track-size, 0.1875rem) / 2);
      block-size: var(--rc-range-slider-track-size, 0.1875rem);
      background: var(--rc-range-slider-track-background);
      border-radius: var(--rc-range-slider-track-radius, var(--rc-control-radius, 0));
      overflow: hidden;
      z-index: 0;
    }

    ::slotted([slot="track-background"]) {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .rc-range-slider-range {
      inset-block: 0;
      background: var(--rc-range-slider-range-background);
      border-radius: inherit;
      z-index: 1;
    }

    .rc-range-slider-thumb {
      position: absolute;
      z-index: 2;
      inline-size: var(--rc-range-slider-thumb-size, 1.125rem);
      block-size: var(--rc-range-slider-thumb-size, 1.125rem);
      background: var(--rc-range-slider-thumb-background);
      border: 2px solid var(--rc-range-slider-thumb-border);
      border-radius: 50%;
      box-sizing: border-box;
      cursor: grab;
      transform: translate(-50%, -50%);
      transition:
        background-color 120ms ease,
        border-color 120ms ease,
        box-shadow 120ms ease,
        transform var(--rc-motion-duration, 120ms) ease;
    }

    .rc-range-slider-thumb:focus-visible {
      outline: var(--rc-focus-ring, 2px solid var(--rc-range-slider-focus-outline));
      outline-offset: var(--rc-focus-ring-offset, 2px);
    }

    :host(:not([disabled]):not([readonly])) .rc-range-slider-thumb:hover {
      background: var(--rc-range-slider-thumb-hover-background);
      border-color: var(--rc-range-slider-thumb-hover-border);
      box-shadow: 0 0 0 0.25rem color-mix(in srgb, var(--rc-range-slider-accent) 20%, transparent);
    }

    :host(:not([disabled]):not([readonly])) .rc-range-slider-thumb:active {
      background: var(--rc-range-slider-thumb-active-background);
      border-color: var(--rc-range-slider-thumb-active-border);
      box-shadow: 0 0 0 0.35rem color-mix(in srgb, var(--rc-range-slider-accent) 28%, transparent);
      cursor: grabbing;
    }

    :host(:not([disabled]):not([readonly])) .rc-range-slider-group:hover .rc-range-slider-track {
      background: color-mix(in srgb, var(--rc-range-slider-track-background) 70%, CanvasText);
    }

    .rc-range-slider-thumb[aria-disabled="true"],
    .rc-range-slider-thumb[aria-readonly="true"] {
      cursor: default;
    }

    :host([disabled]) .rc-range-slider-root {
      opacity: 0.65;
    }

    ::slotted(input[type="range"]) {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      margin: 0;
      padding: 0;
      border: 0;
      clip-path: inset(50%);
      opacity: 0;
      overflow: hidden;
      pointer-events: none;
    }

    .rc-range-slider-values {
      pointer-events: none;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      color: var(--rc-range-slider-value-color, var(--rc-text-disabled, GrayText));
    }

    .rc-range-slider-root[data-display="float"] .rc-range-slider-values {
      position: absolute;
      inset: 0;
      z-index: 5;
    }

    .rc-range-slider-root[data-display="float"] .rc-range-slider-value {
      position: absolute;
      inset-block-start: var(--rc-range-slider-float-value-block-offset, -1.4em);
      transform: translateX(-50%);
    }

    .rc-range-slider-root[data-display="inline-start"] .rc-range-slider-values,
    .rc-range-slider-root[data-display="inline-end"] .rc-range-slider-values {
      display: flex;
      gap: 0.25em;
      align-items: center;
    }

    .rc-range-slider-root[data-display="inline-start"] .rc-range-slider-value:first-child::after,
    .rc-range-slider-root[data-display="inline-end"] .rc-range-slider-value:first-child::after {
      content: " -";
    }

    :host([orientation="vertical"]) {
      display: inline-block;
    }

    :host([orientation="vertical"]) .rc-range-slider-group {
      inline-size: var(--rc-range-slider-control-size, var(--rc-control-block-size, 1.5rem));
      block-size: var(--rc-range-slider-vertical-size, 12.5rem);
    }

    :host([orientation="vertical"]) .rc-range-slider-track {
      inset-block: 0;
      inset-inline: calc(50% - var(--rc-range-slider-track-size, 0.1875rem) / 2);
      inline-size: var(--rc-range-slider-track-size, 0.1875rem);
      block-size: auto;
    }

    :host([orientation="vertical"]) .rc-range-slider-range {
      inset-inline: 0;
      inset-block-start: auto;
    }

    :host([orientation="vertical"]) .rc-range-slider-thumb {
      inset-inline-start: 50%;
      transform: translate(-50%, 50%);
    }

    :host([orientation="vertical"]) .rc-range-slider-root[data-display="float"] .rc-range-slider-value {
      inset-block-start: auto;
      inset-inline-start: var(--rc-range-slider-float-value-inline-offset, calc(100% + 0.5rem));
      transform: translateY(50%);
    }
  `;

  /** Minimum slider value. */
  @property({ type: Number }) min = 0;

  /** Maximum slider value. */
  @property({ type: Number }) max = 100;

  /** Slider step. */
  @property({ type: Number }) step = 1;

  private _value: [number, number] | undefined;
  private _defaultValue: [number, number] | undefined;
  private _valueInitialized = false;

  /** Current [low, high] value. Assign a new tuple reference to trigger a re-render. */
  @property({ attribute: false })
  get value(): [number, number] {
    return this._value ?? this._defaultValue ?? this._nativeInputValue;
  }
  set value(v: [number, number]) {
    const old = this._value;
    this._value = this._normalizeValue(v);
    this._valueInitialized = true;
    this._applyValueToInputs(this._value);
    if (this._value !== old) {
      this.requestUpdate("value", old);
    }
  }

  /** Initial uncontrolled [low, high] value. Has no effect after the first user interaction or `value` write. */
  @property({ attribute: false })
  get defaultValue(): [number, number] | undefined {
    return this._defaultValue;
  }
  set defaultValue(v: [number, number] | undefined) {
    const old = this._defaultValue;
    this._defaultValue = v === undefined ? undefined : this._normalizeValue(v);
    if (
      !this._valueInitialized &&
      this._value === undefined &&
      this._defaultValue !== undefined
    ) {
      this._applyValueToInputs(this._defaultValue);
      this.requestUpdate("value", undefined);
    }
    this.requestUpdate("defaultValue", old);
  }

  /** Disable both thumbs and their hidden native input reflectors. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Prevents edits while preserving normal focus and display. */
  @property({ type: Boolean, reflect: true }) readonly = false;

  /** Accessible label for the low (min) thumb when the input does not provide one. */
  @property({ attribute: "low-label" }) lowLabel = "Minimum";

  /** Accessible label for the high (max) thumb when the input does not provide one. */
  @property({ attribute: "high-label" }) highLabel = "Maximum";

  /** Formatted screen-reader text for the low value. Falls back to the raw number. */
  @property({ attribute: "low-value-text" }) lowValueText = "";

  /** Formatted screen-reader text for the high value. Falls back to the raw number. */
  @property({ attribute: "high-value-text" }) highValueText = "";

  /**
   * Controls the live value display.
   *
   * - Absent (default) — no value shown.
   * - `display` or `display="float"` — floats each value above its thumb.
   * - `display="inline-start"` — renders the value container before the track.
   * - `display="inline-end"` — renders the value container after the track.
   */
  @property({ reflect: true, converter: displayConverter })
  display: DisplayValue = null;

  /** Orientation; reflected as an attribute and forwarded to custom thumbs. */
  @property({ reflect: true }) orientation: "horizontal" | "vertical" =
    "horizontal";

  @state() private _lowValue = 0;
  @state() private _highValue = 100;

  private _lowInput: HTMLInputElement | null = null;
  private _highInput: HTMLInputElement | null = null;
  private _dragThumb: RangeThumb | null = null;
  private _dragPointerId: number | null = null;
  private _addedHostRole = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this._syncHostRole();
    this._findInputs();
  }

  override disconnectedCallback(): void {
    this._unwireInputs();
    this._restoreInputs();
    if (this._addedHostRole) {
      this.removeAttribute("role");
      this._addedHostRole = false;
    }
    super.disconnectedCallback();
  }

  override updated(): void {
    this._syncInputReflectors();
  }

  override render() {
    const lo = this._lowInput;
    const hi = this._highInput;
    if (!lo || !hi) return nothing;

    const lowText = this.lowValueText || String(this._lowValue);
    const highText = this.highValueText || String(this._highValue);

    const valuesContainer = html`
      <span class="rc-range-slider-values" aria-hidden="true">
        <span
          part="value-display low-value-display"
          class="rc-range-slider-value"
          style=${this.display === "float"
            ? this._floatStyle(this._lowValue)
            : nothing}
          ><slot name="low-value-display">${lowText}</slot></span
        >
        <span
          part="value-display high-value-display"
          class="rc-range-slider-value"
          style=${this.display === "float"
            ? this._floatStyle(this._highValue)
            : nothing}
          ><slot name="high-value-display">${highText}</slot></span
        >
      </span>
    `;

    return html`
      <div
        part="root"
        class="rc-range-slider-root"
        data-display=${this.display ?? nothing}
        data-orientation=${this.orientation}
      >
        ${this.display === "inline-start" ? valuesContainer : nothing}

        <div
          part="group"
          class="rc-range-slider-group"
          @pointerdown=${this._onGroupPointerDown}
          @pointermove=${this._onGroupPointerMove}
          @pointerup=${this._onGroupPointerUp}
          @pointercancel=${this._onGroupPointerCancel}
        >
          <span part="track" class="rc-range-slider-track" aria-hidden="true">
            <slot name="track-background"></slot>
            <span
              part="range"
              class="rc-range-slider-range"
              style=${this._rangeStyle()}
            ></span>
          </span>

          ${this._renderThumb("low")} ${this._renderThumb("high")}
          <slot @slotchange=${this._onDefaultSlotChange}></slot>
          ${this.display === "float" ? valuesContainer : nothing}
        </div>

        ${this.display === "inline-end" ? valuesContainer : nothing}
      </div>
    `;
  }

  private _renderThumb(thumb: RangeThumb) {
    const isLow = thumb === "low";
    const input = isLow ? this._lowInput : this._highInput;
    const value = isLow ? this._lowValue : this._highValue;
    const valueText = isLow ? this.lowValueText : this.highValueText;
    const label = this._thumbLabel(thumb);
    const labelledBy = input?.getAttribute("aria-labelledby");

    return html`
      <span
        part=${isLow ? "thumb low-thumb" : "thumb high-thumb"}
        class="rc-range-slider-thumb"
        data-thumb=${thumb}
        role="slider"
        tabindex=${this.disabled ? "-1" : "0"}
        aria-label=${label ?? nothing}
        aria-labelledby=${labelledBy ?? nothing}
        aria-valuemin=${String(isLow ? this._min() : this._lowValue)}
        aria-valuemax=${String(isLow ? this._highValue : this._max())}
        aria-valuenow=${String(value)}
        aria-valuetext=${valueText || nothing}
        aria-orientation=${this.orientation}
        aria-disabled=${this.disabled ? "true" : nothing}
        aria-readonly=${this.readonly ? "true" : nothing}
        style=${this._thumbStyle(value)}
        @keydown=${isLow ? this._onLowKeydown : this._onHighKeydown}
      ></span>
    `;
  }

  /**
   * Finds the first two child `<input type="range">` elements and wires them.
   * Inputs remain in the DOM permanently as form/progressive-enhancement
   * reflectors.
   */
  private _findInputs(): void {
    const inputs = getDirectChildren<HTMLInputElement>(
      this,
      ':scope > input[type="range"]',
    ).slice(0, 2);

    if (inputs.length < 2) {
      warnMissingDirectChild(this, {
        selector: ':scope > input[type="range"]',
        minimum: 2,
        message: '[rc-range-slider] Requires two child <input type="range"> elements.',
      });
      return;
    }

    const [lo, hi] = inputs as [HTMLInputElement, HTMLInputElement];

    if (!this.hasAttribute("disabled") && (lo.disabled || hi.disabled)) {
      this.disabled = true;
    }

    this._lowInput = lo;
    this._highInput = hi;
    this._applyInitialValueToInputs(lo, hi);

    this._wireInput(lo, this._onLowInput, this._onLowChange);
    this._wireInput(hi, this._onHighInput, this._onHighChange);
    this._syncInputReflectors();
  }

  private _onDefaultSlotChange = (): void => {
    this._unwireInputs();
    this._restoreInputs();
    this._findInputs();
    this.requestUpdate();
  };

  private get _nativeInputValue(): [number, number] {
    const low = this._lowInput?.valueAsNumber;
    const high = this._highInput?.valueAsNumber;

    return [
      low === undefined || isNaN(low) ? this.min : low,
      high === undefined || isNaN(high) ? this.max : high,
    ];
  }

  private _applyInitialValueToInputs(
    lowInput: HTMLInputElement,
    highInput: HTMLInputElement,
  ): void {
    if (this._value !== undefined) {
      this._applyValueToInputs(this._value);
      return;
    }

    if (this._defaultValue !== undefined) {
      this._applyValueToInputs(this._defaultValue);
      return;
    }

    const lowValue = lowInput.valueAsNumber;
    const highValue = highInput.valueAsNumber;

    this._lowValue = isNaN(lowValue) ? this._min() : lowValue;
    this._highValue = isNaN(highValue) ? this._max() : highValue;
    this._defaultValue = this._normalizeValue([this._lowValue, this._highValue]);
    this._applyValueToInputs(this._defaultValue);
  }

  private _applyValueToInputs(value: [number, number]): void {
    const [low, high] = this._normalizeValue(value);
    this._lowValue = low;
    this._highValue = high;

    if (this._lowInput) this._lowInput.value = String(low);
    if (this._highInput) this._highInput.value = String(high);
  }

  private _setCurrentValue(value: [number, number]): void {
    const [low, high] = this._normalizeValue(value);
    this._value = [low, high];
    this._valueInitialized = true;
    this._applyValueToInputs(this._value);
    this.requestUpdate("value");
  }

  private _wireInput(
    input: HTMLInputElement,
    onInput: (e: Event) => void,
    onChange: (e: Event) => void,
  ): void {
    input.addEventListener("input", onInput);
    input.addEventListener("change", onChange);
  }

  private _unwireInputs(): void {
    this._lowInput?.removeEventListener("input", this._onLowInput);
    this._lowInput?.removeEventListener("change", this._onLowChange);

    this._highInput?.removeEventListener("input", this._onHighInput);
    this._highInput?.removeEventListener("change", this._onHighChange);
  }

  private _restoreInputs(): void {
    for (const input of [this._lowInput, this._highInput]) {
      input?.removeAttribute("aria-hidden");
      input?.removeAttribute("tabindex");
      input?.removeAttribute("data-rc-range-slider-reflector");
      input?.style.removeProperty("display");
    }
  }

  private _syncInputReflectors(): void {
    const lo = this._lowInput;
    const hi = this._highInput;
    if (!lo || !hi) return;

    for (const input of [lo, hi]) {
      input.disabled = this.disabled;
      input.tabIndex = -1;
      input.setAttribute("aria-hidden", "true");
      input.setAttribute("data-rc-range-slider-reflector", "");
    }
  }

  private _syncHostRole(): void {
    if (this.hasAttribute("role")) return;

    this.setAttribute("role", "group");
    this._addedHostRole = true;
  }

  private readonly _onLowInput = (e: Event): void => {
    if (this.readonly) {
      this._applyValueToInputs([this._lowValue, this._highValue]);
      return;
    }

    const input = e.currentTarget as HTMLInputElement;
    this._setCurrentValue([input.valueAsNumber, this._highValue]);
    this._dispatch("rc-range-slider-input", this.value);
  };

  private readonly _onLowChange = (e: Event): void => {
    if (this.readonly) {
      this._applyValueToInputs([this._lowValue, this._highValue]);
      return;
    }

    const input = e.currentTarget as HTMLInputElement;
    this._setCurrentValue([input.valueAsNumber, this._highValue]);
    this._dispatch("rc-range-slider-change", this.value);
  };

  private readonly _onHighInput = (e: Event): void => {
    if (this.readonly) {
      this._applyValueToInputs([this._lowValue, this._highValue]);
      return;
    }

    const input = e.currentTarget as HTMLInputElement;
    this._setCurrentValue([this._lowValue, input.valueAsNumber]);
    this._dispatch("rc-range-slider-input", this.value);
  };

  private readonly _onHighChange = (e: Event): void => {
    if (this.readonly) {
      this._applyValueToInputs([this._lowValue, this._highValue]);
      return;
    }

    const input = e.currentTarget as HTMLInputElement;
    this._setCurrentValue([this._lowValue, input.valueAsNumber]);
    this._dispatch("rc-range-slider-change", this.value);
  };

  /** APG keyboard contract for the low thumb. */
  private readonly _onLowKeydown = (e: KeyboardEvent): void => {
    this._handleThumbKeydown(e, "low");
  };

  /** APG keyboard contract for the high thumb. */
  private readonly _onHighKeydown = (e: KeyboardEvent): void => {
    this._handleThumbKeydown(e, "high");
  };

  private _handleThumbKeydown(e: KeyboardEvent, thumb: RangeThumb): void {
    if (this.disabled || this.readonly) return;

    const min = this._min();
    const max = this._max();
    const step = this._step();
    const bigStep = step * 10;
    const low = this._lowValue;
    const high = this._highValue;
    const current = thumb === "low" ? low : high;
    const effectiveMin = thumb === "low" ? min : low;
    const effectiveMax = thumb === "low" ? high : max;

    let next: number | null = null;

    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = current + step;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = current - step;
        break;
      case "PageUp":
        next = current + bigStep;
        break;
      case "PageDown":
        next = current - bigStep;
        break;
      case "Home":
        next = effectiveMin;
        break;
      case "End":
        next = effectiveMax;
        break;
      default:
        return;
    }

    e.preventDefault();

    const nextValue = snapToStep(next, effectiveMin, effectiveMax, step);
    if (nextValue === current) return;

    this._setThumbValue(thumb, nextValue);
    this._dispatch("rc-range-slider-input", this.value);
  }

  private _onGroupPointerDown(e: PointerEvent): void {
    if (this.disabled || this.readonly || e.button !== 0) return;

    const thumb = this._nearestThumb(e);
    const thumbEl = this._thumbElement(thumb);
    this._dragThumb = thumb;
    this._dragPointerId = e.pointerId;

    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Synthetic browser-test PointerEvents are not active pointer streams.
    }
    thumbEl?.focus();
    this._setThumbValue(thumb, this._valueFromPointer(e, thumb));
    this._dispatch("rc-range-slider-input", this.value);
  }

  private _onGroupPointerMove(e: PointerEvent): void {
    if (this._dragPointerId !== e.pointerId || this._dragThumb === null) return;

    e.preventDefault();
    this._setThumbValue(this._dragThumb, this._valueFromPointer(e, this._dragThumb));
    this._dispatch("rc-range-slider-input", this.value);
  }

  private _onGroupPointerUp(e: PointerEvent): void {
    if (this._dragPointerId !== e.pointerId || this._dragThumb === null) return;

    const thumb = this._dragThumb;
    this._dragThumb = null;
    this._dragPointerId = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Synthetic browser-test PointerEvents are not active pointer streams.
    }
    this._dispatch("rc-range-slider-change", this.value);
    this._thumbElement(thumb)?.focus();
  }

  private _onGroupPointerCancel(e: PointerEvent): void {
    if (this._dragPointerId !== e.pointerId) return;

    this._dragThumb = null;
    this._dragPointerId = null;
  }

  private _setThumbValue(thumb: RangeThumb, value: number): void {
    if (thumb === "low") {
      this._setCurrentValue([value, this._highValue]);
      return;
    }

    this._setCurrentValue([this._lowValue, value]);
  }

  private _valueFromPointer(e: PointerEvent, thumb: RangeThumb): number {
    const rect = this._groupRect();
    if (!rect) return thumb === "low" ? this._lowValue : this._highValue;

    const min = thumb === "low" ? this._min() : this._lowValue;
    const max = thumb === "low" ? this._highValue : this._max();
    const span = this._max() - this._min();
    if (span <= 0) return min;

    const pct =
      this.orientation === "vertical"
        ? 1 - (e.clientY - rect.top) / rect.height
        : (e.clientX - rect.left) / rect.width;
    const raw = pct * span + this._min();

    return snapToStep(raw, min, max, this._step());
  }

  private _nearestThumb(e: PointerEvent): RangeThumb {
    const value = this._valueFromPointer(e, "low");
    const lowDistance = Math.abs(value - this._lowValue);
    const highDistance = Math.abs(value - this._highValue);

    if (lowDistance === highDistance) {
      return value < this._lowValue ? "low" : "high";
    }

    return lowDistance < highDistance ? "low" : "high";
  }

  private _rangeStyle(): string {
    const loPct = valueToPercent(this._lowValue, this._min(), this._max());
    const hiPct = valueToPercent(this._highValue, this._min(), this._max());
    const loCenter = this._thumbCenterStyle(loPct);
    const hiCenter = this._thumbCenterStyle(hiPct);

    if (this.orientation === "vertical") {
      return [
        `bottom:${loCenter}`,
        `height:max(0px, calc(${hiCenter} - ${loCenter}))`,
      ].join(";");
    }

    return [
      `left:${loCenter}`,
      `width:max(0px, calc(${hiCenter} - ${loCenter}))`,
    ].join(";");
  }

  private _thumbStyle(value: number): string {
    const pct = valueToPercent(value, this._min(), this._max());
    const center = this._thumbCenterStyle(pct);

    if (this.orientation === "vertical") {
      return `bottom:${center}`;
    }

    return `left:${center};top:50%`;
  }

  private _thumbCenterStyle(pct: number): string {
    const k = (1 - pct * 2).toFixed(4);

    return `calc(${(pct * 100).toFixed(3)}% + ${k} * var(--rc-thumb-radius, 9px))`;
  }

  private _floatStyle(value: number): string {
    const pct = valueToPercent(value, this._min(), this._max());
    const center = this._thumbCenterStyle(pct);

    if (this.orientation === "vertical") {
      return `bottom:${center}`;
    }

    return `left:${center}`;
  }

  private _normalizeValue([low, high]: [number, number]): [number, number] {
    const min = this._min();
    const max = this._max();
    const steppedLow = snapToStep(low, min, max, this._step());
    const steppedHigh = snapToStep(high, min, max, this._step());

    return [Math.min(steppedLow, steppedHigh), Math.max(steppedLow, steppedHigh)];
  }

  private _min(): number {
    return parseAttr(this._lowInput?.min ?? "", this.min);
  }

  private _max(): number {
    return parseAttr(this._highInput?.max ?? "", this.max);
  }

  private _step(): number {
    return parseAttr(this._lowInput?.step ?? "", this.step);
  }

  private _groupRect(): DOMRect | null {
    return this.shadowRoot
      ?.querySelector<HTMLElement>(".rc-range-slider-group")
      ?.getBoundingClientRect() ?? null;
  }

  private _thumbElement(thumb: RangeThumb): HTMLElement | null {
    return (
      this.shadowRoot?.querySelector<HTMLElement>(`[data-thumb="${thumb}"]`) ??
      null
    );
  }

  private _thumbLabel(thumb: RangeThumb): string | null {
    const input = thumb === "low" ? this._lowInput : this._highInput;
    const fallback = thumb === "low" ? this.lowLabel : this.highLabel;
    const explicitLabel = input?.getAttribute("aria-label");
    if (explicitLabel) return explicitLabel;

    const nativeLabel = input?.labels?.[0]?.textContent?.trim();
    if (nativeLabel) return nativeLabel;

    return fallback || null;
  }

  private _dispatch(
    type: "rc-range-slider-input" | "rc-range-slider-change",
    value: [number, number],
  ): void {
    this.dispatchEvent(
      new CustomEvent<RCRangeSliderValueEvent>(type, {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
  }
}

export default RCRangeSlider;
