import { LitElement, html, nothing } from "lit";
import type { ComplexAttributeConverter } from "lit";
import { property, state } from "lit/decorators.js";
import { valueToPercent } from "@rcarls/rc-common";

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
 * Label association — all native patterns work because there is no shadow DOM boundary:
 * - Wrapping `<label>`: `<label>Volume<rc-slider><input …></rc-slider></label>`
 * - Explicit `for`/`id`: `<label for="vol">Volume</label><rc-slider><input id="vol" …></rc-slider>`
 * - Direct `aria-label` on the input: `<input aria-label="Volume" …>`
 *
 * These patterns all work without JavaScript. The component does not render a
 * label element itself — the consumer is responsible for accessible naming.
 *
 * Form participation is handled natively by the consumer-provided input's `name`
 * attribute; no `ElementInternals` setup is required.
 *
 * @fires rc-slider-input  - Fires continuously while the value changes. Detail: `{ value }`.
 * @fires rc-slider-change - Fires when the committed value changes (on release). Detail: `{ value }`.
 *
 * @cssprop [--rc-thumb-radius=9px] - Half the thumb width; used to position the float value display.
 */
export class RCSlider extends LitElement {
  override createRenderRoot() {
    return this;
  }

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
    return this._value ?? this._defaultValue ?? 0;
  }
  set value(v: number) {
    const old = this._value;
    this._value = v;
    this._valueInitialized = true;
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

  /** Current value; reflects the native input's last committed value. Read-only from the outside. */
  get value(): number {
    return this._value;
  }

  @state() private _value = 0;

  private _nativeInput: HTMLInputElement | null = null;

  override connectedCallback(): void {
    this._findInput();
    super.connectedCallback();
  }

  override disconnectedCallback(): void {
    this._unwireInput();
    super.disconnectedCallback();
  }

  override firstUpdated(): void {
    if (this._nativeInput) {
      this._value = this._nativeInput.valueAsNumber || 0;
    }
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
        style=${this.display === "float" ? this._floatStyle() : nothing}
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
      >
        ${this.display === "inline-start" ? valueDisplay : nothing}

        <span part="control" class="rc-slider-control">
          <span part="track" class="rc-slider-track" aria-hidden="true">
            <span
              part="progress"
              class="rc-slider-progress"
              style=${this._progressStyle()}
            ></span>
          </span>

          ${input} ${this.display === "float" ? valueDisplay : nothing}
        </span>

        ${this.display === "inline-end" ? valueDisplay : nothing}
      </div>
    `;
  }

  private get _displayText(): string {
    return this.valueText || String(this._value);
  }

  /**
   * Finds the consumer-provided native input and wires event listeners.
   * The input remains in the DOM permanently; the component enhances it
   * rather than replacing it.
   */
  private _findInput(): void {
    const input = this.querySelector<HTMLInputElement>('input[type="range"]');
    if (!input) {
      console.warn(
        '[rc-slider] Requires a child <input type="range"> element.',
      );
      return;
    }

    // Mirror disabled state from the native input if not explicitly set on the host.
    // Pre-upgrade markup may carry <input disabled> before the component upgrades.
    if (!this.hasAttribute("disabled") && input.disabled) {
      this.disabled = true;
    }

    this._nativeInput = input;
    this._wireInput(input);
  }

  private _wireInput(input: HTMLInputElement): void {
    input.addEventListener("input", this._onInput);
    input.addEventListener("change", this._onChange);
    input.addEventListener("keydown", this._onKeydown);
  }

  private _unwireInput(): void {
    this._nativeInput?.removeEventListener("input", this._onInput);
    this._nativeInput?.removeEventListener("change", this._onChange);
    this._nativeInput?.removeEventListener("keydown", this._onKeydown);
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
      input.value = String(this._value);
      return;
    }

    this._value = input.valueAsNumber;

    this.dispatchEvent(
      new CustomEvent<RCSliderValueEvent>(type, {
        bubbles: true,
        composed: true,
        detail: { value: this._value },
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

    this._value = input.valueAsNumber;

    this.dispatchEvent(
      new CustomEvent<RCSliderValueEvent>("rc-slider-input", {
        bubbles: true,
        composed: true,
        detail: { value: this._value },
      }),
    );
  };

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
