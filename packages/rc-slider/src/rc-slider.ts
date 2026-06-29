import { LitElement, css, html, nothing } from "lit";
import type { ComplexAttributeConverter } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { NativeChildController, valueToPercent, warnMissingDirectChild } from "@rcarls/rc-common";

export interface RCSliderValueEvent {
  /** Current numeric slider value. */
  value: number;
}

declare global {
  interface HTMLElementTagNameMap {
    "rc-slider": RCSlider;
  }

  interface HTMLElementEventMap {
    "rc-slider-input": CustomEvent<RCSliderValueEvent>;
    "rc-slider-change": CustomEvent<RCSliderValueEvent>;
  }
}

type DisplayValue = "float" | "inline-start" | "inline-end" | null;

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
 * Progressive enhancement wrapper for a consumer-provided `<input type="range">`.
 * The native input must be supplied as a direct child element — the component
 * adds a styled track, optional live value display, and the APG keyboard
 * enhancement (Page Up/Down, ±10 steps).
 *
 * Label association:
 * - Explicit `for`/`id`: `<label for="vol">Volume</label><rc-slider><input id="vol" …></rc-slider>`
 * - Direct `aria-label` on the input: `<input aria-label="Volume" …>`
 *
 * These patterns all work without JavaScript. The component does not render a
 * label element itself — the consumer is responsible for accessible naming.
 *
 * Form participation is handled natively by the consumer-provided input's `name`
 * attribute; no `ElementInternals` setup is required.
 *
 * @slot track-background - Optional decorative content rendered inside the track before the progress fill.
 * @slot value-display - Optional replacement for the rendered value text.
 *
 * @fires rc-slider-input  - Fires continuously while the value changes. Detail: `{ value }`.
 * @fires rc-slider-change - Fires when the committed value changes (on release). Detail: `{ value }`.
 *
 * @cssprop [--rc-thumb-radius=9px] - Half the thumb width; used to position the float value display.
 * @cssprop [--rc-slider-gap=var(--rc-control-gap)] - Gap between track and inline value display.
 * @cssprop [--rc-slider-control-size=var(--rc-control-block-size)] - Track hit-area block size.
 * @cssprop [--rc-slider-track-size=0.1875rem] - Visual track thickness.
 * @cssprop [--rc-slider-track-background=CanvasText] - Unfilled track color.
 * @cssprop [--rc-slider-track-opacity=0.25] - Unfilled track opacity.
 * @cssprop [--rc-slider-track-radius=var(--rc-control-radius)] - Track border radius.
 * @cssprop [--rc-slider-progress-background=var(--rc-accent)] - Filled track color.
 * @cssprop [--rc-slider-value-color=var(--rc-text-disabled)] - Value display text color.
 * @cssprop [--rc-slider-float-value-block-offset=-1.4em] - Block-axis offset for horizontal float value display.
 * @cssprop [--rc-slider-float-value-inline-offset=calc(100% + 0.5rem)] - Inline-axis offset for vertical float value display.
 *
 * @csspart root - Root layout wrapper.
 * @csspart control - Track/input positioning wrapper.
 * @csspart track - Visual slider track.
 * @csspart progress - Filled progress segment.
 * @csspart value-display - Rendered value text.
 */
export class RCSlider extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .rc-slider-root {
      display: grid;
      gap: var(--rc-slider-gap, var(--rc-control-gap, 0.5rem));
      align-items: center;
      font-family: var(--rc-font-family, inherit);
      font-size: var(--rc-font-size, inherit);
      line-height: var(--rc-line-height, normal);
    }

    .rc-slider-root[data-display="inline-start"] {
      grid-template-columns: auto minmax(0, 1fr);
    }

    .rc-slider-root[data-display="inline-end"] {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .rc-slider-control {
      position: relative;
      display: block;
      min-width: 0;
      min-height: var(--rc-slider-control-size, var(--rc-control-block-size, 1.5rem));
    }

    .rc-slider-track,
    .rc-slider-progress {
      position: absolute;
      pointer-events: none;
    }

    .rc-slider-track {
      inset-inline: 0;
      inset-block: calc(50% - var(--rc-slider-track-size, 0.1875rem) / 2);
      block-size: var(--rc-slider-track-size, 0.1875rem);
      background: var(--rc-slider-track-background, CanvasText);
      opacity: var(--rc-slider-track-opacity, 0.25);
      border-radius: var(--rc-slider-track-radius, var(--rc-control-radius, 0));
      overflow: hidden;
      z-index: 0;
    }

    ::slotted([slot="track-background"]) {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .rc-slider-progress {
      inset-block: 0;
      background: var(--rc-slider-progress-background, var(--rc-accent, Highlight));
      border-radius: inherit;
      z-index: 1;
    }

    ::slotted(input[type="range"]) {
      position: absolute;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      margin: 0;
      background: transparent;
      z-index: 2;
    }

    .rc-slider-value {
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
      color: var(--rc-slider-value-color, var(--rc-text-disabled, GrayText));
    }

    .rc-slider-root[data-display="float"] .rc-slider-value {
      position: absolute;
      inset-block-start: var(--rc-slider-float-value-block-offset, -1.4em);
      transform: translateX(-50%);
      pointer-events: none;
      z-index: 3;
    }

    :host([orientation="vertical"]) {
      display: inline-block;
    }

    :host([orientation="vertical"]) .rc-slider-control {
      inline-size: var(--rc-slider-control-size, var(--rc-control-block-size, 1.5rem));
      block-size: var(--rc-slider-vertical-size, 12.5rem);
    }

    :host([orientation="vertical"]) .rc-slider-track {
      inset-block: 0;
      inset-inline: calc(50% - var(--rc-slider-track-size, 0.1875rem) / 2);
      inline-size: var(--rc-slider-track-size, 0.1875rem);
      block-size: auto;
    }

    :host([orientation="vertical"]) .rc-slider-progress {
      inset-inline: 0;
    }

    :host([orientation="vertical"]) ::slotted(input[type="range"]) {
      writing-mode: vertical-lr;
      direction: rtl;
    }

    :host([orientation="vertical"]) .rc-slider-root[data-display="float"] .rc-slider-value {
      inset-block-start: auto;
      inset-inline-start: var(--rc-slider-float-value-inline-offset, calc(100% + 0.5rem));
      transform: translateY(50%);
    }
  `;

  /** Minimum slider value. */
  @property({ type: Number }) min = 0;

  /** Maximum slider value. */
  @property({ type: Number }) max = 100;

  /** Slider step. */
  @property({ type: Number }) step = 1;

  private _value: number | undefined;
  private _defaultValue: number | undefined;
  private _valueInitialized = false;

  /** Current slider value. */
  @property({ type: Number })
  get value(): number {
    return this._value ?? this._defaultValue ?? this._nativeInputValue;
  }
  set value(v: number) {
    const old = this._value;
    this._value = v;
    this._valueInitialized = true;
    this._applyValueToInput(v);
    this.requestUpdate("value", old);
  }

  /** Initial uncontrolled slider value. Has no effect after the first user interaction or `value` write. */
  @property({ type: Number, attribute: "default-value" })
  get defaultValue(): number | undefined {
    return this._defaultValue;
  }
  set defaultValue(v: number | undefined) {
    const old = this._defaultValue;
    this._defaultValue = v;
    if (
      !this._valueInitialized &&
      this._value === undefined &&
      v !== undefined
    ) {
      this._applyValueToInput(v);
      this.requestUpdate("value", undefined);
    }
    this.requestUpdate("defaultValue", old);
  }

  /** Disable the underlying input. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Prevents edits while preserving normal display. Not a native range attribute. */
  @property({ type: Boolean, reflect: true }) readonly = false;

  /**
   * Controls the live value display.
   *
   * - Absent (default) — no value shown.
   * - `display` or `display="float"` — floats above the thumb.
   * - `display="inline-start"` — rendered before the track, inline in the grid.
   * - `display="inline-end"` — rendered after the track, inline in the grid.
   */
  @property({ reflect: true, converter: displayConverter })
  display: DisplayValue = null;

  /** Screen-reader value text. When set, forwarded as `aria-valuetext` on the native input. */
  @property({ attribute: "value-text" }) valueText = "";

  /** Orientation; reflected as an attribute and forwarded to `aria-orientation`. */
  @property({ reflect: true }) orientation: "horizontal" | "vertical" =
    "horizontal";

  private _nativeInput: HTMLInputElement | null = null;

  private readonly _nativeInputController = new NativeChildController<HTMLInputElement>(this, {
    selector: ':scope > input[type="range"]',
    observe: true,
    onChange: (input, previous) => this._setupInput(input, previous),
    onMissing: () => {
      if (import.meta.env.DEV) {
        warnMissingDirectChild(this, {
          selector: ':scope > input[type="range"]',
          message: '[rc-slider] Requires a child <input type="range"> element.',
        });
      }
    },
  });

  override disconnectedCallback(): void {
    this._unwireInput();
    super.disconnectedCallback();
  }

  override updated(): void {
    const input = this._nativeInput;
    if (!input) return;

    input.disabled = this.disabled;
    this._syncAriaAttributes(input);
  }

  override render() {
    const input = this._nativeInput;
    if (!input) return nothing;

    const valueDisplay = html`
      <span
        part="value-display"
        class="rc-slider-value"
        style=${ifDefined(
          this.display === "float" ? this._floatStyle() : undefined,
        )}
        aria-hidden="true"
      >
        <slot name="value-display">${this._displayText}</slot>
      </span>
    `;

    return html`
      <div
        part="root"
        class="rc-slider-root"
        data-display=${this.display ?? nothing}
        data-orientation=${this.orientation}
        data-readonly=${this.readonly ? "" : nothing}
        data-disabled=${this.disabled ? "" : nothing}
        data-has-value-text=${this.valueText ? "" : nothing}
      >
        ${this.display === "inline-start" ? valueDisplay : nothing}

        <span part="control" class="rc-slider-control">
          <span part="track" class="rc-slider-track" aria-hidden="true">
            <slot name="track-background"></slot>
            <span
              part="progress"
              class="rc-slider-progress"
              style=${this._progressStyle()}
            ></span>
          </span>

          <slot @slotchange=${this._onDefaultSlotChange}></slot>
          ${this.display === "float" ? valueDisplay : nothing}
        </span>

        ${this.display === "inline-end" ? valueDisplay : nothing}
      </div>
    `;
  }

  private get _displayText(): string {
    return this.valueText || String(this.value);
  }

  private get _nativeInputValue(): number {
    const value = this._nativeInput?.valueAsNumber;
    return value === undefined || isNaN(value) ? 0 : value;
  }

  private _setupInput(input: HTMLInputElement | null, previous?: HTMLInputElement | null): void {
    if (previous && previous !== input) {
      this._unwireInput(previous);
    }

    if (!input) {
      this._nativeInput = null;
      return;
    }

    // Mirror disabled state from the native input if not explicitly set on the host.
    // Pre-upgrade markup may carry <input disabled> before the component upgrades.
    if (!this.hasAttribute("disabled") && input.disabled) {
      this.disabled = true;
    }

    this._nativeInput = input;
    this._applyInitialValueToInput(input);
    this._wireInput(input);
    this.requestUpdate();
  }

  private _onDefaultSlotChange = (): void => {
    this._nativeInputController.sync();
    this.requestUpdate();
  };

  private _applyInitialValueToInput(input: HTMLInputElement): void {
    if (this._value !== undefined) {
      this._applyValueToInput(this._value);
      return;
    }

    if (this._defaultValue !== undefined) {
      this._applyValueToInput(this._defaultValue);
      return;
    }

    const value = input.valueAsNumber;
    if (!isNaN(value)) {
      this._defaultValue = value;
    }
  }

  private _applyValueToInput(value: number): void {
    if (!this._nativeInput) return;

    this._nativeInput.value = String(value);
  }

  private _wireInput(input: HTMLInputElement): void {
    input.addEventListener("input", this._onInput);
    input.addEventListener("change", this._onChange);
    input.addEventListener("keydown", this._onKeydown);
  }

  private _unwireInput(input = this._nativeInput): void {
    input?.removeEventListener("input", this._onInput);
    input?.removeEventListener("change", this._onChange);
    input?.removeEventListener("keydown", this._onKeydown);
  }

  private _syncAriaAttributes(input: HTMLInputElement): void {
    if (this.valueText) {
      input.setAttribute("aria-valuetext", this.valueText);
    } else {
      input.removeAttribute("aria-valuetext");
    }

    if (this.orientation === "vertical") {
      input.setAttribute("aria-orientation", "vertical");
    } else {
      input.removeAttribute("aria-orientation");
    }

    if (this.readonly) {
      input.setAttribute("aria-readonly", "true");
    } else {
      input.removeAttribute("aria-readonly");
    }
  }

  private readonly _onInput = (e: Event): void => {
    this._handleRangeEvent(e, "rc-slider-input");
  };

  private readonly _onChange = (e: Event): void => {
    this._handleRangeEvent(e, "rc-slider-change");
  };

  private _handleRangeEvent(
    e: Event,
    type: "rc-slider-input" | "rc-slider-change",
  ): void {
    const input = e.currentTarget as HTMLInputElement;

    if (this.readonly) {
      input.value = String(this.value);
      return;
    }

    this._commitInputValue(input);

    this.dispatchEvent(
      new CustomEvent<RCSliderValueEvent>(type, {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  private readonly _onKeydown = (e: KeyboardEvent): void => {
    if (this.disabled || this.readonly) return;
    if (e.key !== "PageUp" && e.key !== "PageDown") return;

    e.preventDefault();
    const input = e.currentTarget as HTMLInputElement;

    if (e.key === "PageUp") input.stepUp(10);
    else input.stepDown(10);

    this._commitInputValue(input);

    this.dispatchEvent(
      new CustomEvent<RCSliderValueEvent>("rc-slider-input", {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  };

  private _commitInputValue(input: HTMLInputElement): void {
    const old = this.value;

    this._value = input.valueAsNumber;
    this._valueInitialized = true;

    this.requestUpdate("value", old);
  }

  private _progressStyle(): string {
    const input = this._nativeInput;
    if (!input) return "";

    const min = parseAttr(input.min, 0);
    const max = parseAttr(input.max, 100);
    const pct = valueToPercent(input.valueAsNumber, min, max) * 100;

    if (this.orientation === "vertical") {
      return `bottom:0%;height:${pct.toFixed(3)}%`;
    }

    return `left:0%;width:${pct.toFixed(3)}%`;
  }

  private _floatStyle(): string {
    const input = this._nativeInput;
    if (!input) return "";

    const min = parseAttr(input.min, 0);
    const max = parseAttr(input.max, 100);
    const pct = valueToPercent(input.valueAsNumber, min, max);
    const k = (1 - pct * 2).toFixed(4);

    if (this.orientation === "vertical") {
      return `bottom:calc(${(pct * 100).toFixed(3)}% + ${k} * var(--rc-thumb-radius, 9px))`;
    }

    return `left:calc(${(pct * 100).toFixed(3)}% + ${k} * var(--rc-thumb-radius, 9px))`;
  }
}

export default RCSlider;
