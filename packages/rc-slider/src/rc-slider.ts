import { LitElement, html, nothing } from 'lit';
import type { ComplexAttributeConverter } from 'lit';
import { property } from 'lit/decorators.js';
import { valueToPercent } from '@rcarls/rc-common';

export interface RCSliderValueEvent {
  /** Current numeric slider value. */
  value: number;
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-slider': RCSlider;
  }
}

type DisplayValue = 'float' | 'inline-start' | 'inline-end' | null;

/**
 * Normalises the `display` attribute.
 * A bare boolean attribute (`display` with no value) maps to `'float'` so
 * the reflected attribute is always an explicit string, never an empty string.
 */
const displayConverter: ComplexAttributeConverter<DisplayValue> = {
  fromAttribute(v: string | null): DisplayValue {
    if (v === null) return null;
    if (v === '' || v === 'float') return 'float';
    if (v === 'inline-start') return 'inline-start';
    if (v === 'inline-end') return 'inline-end';
    return null;
  },
  toAttribute(v: DisplayValue): string | null {
    return v;
  },
};

/**
 * Enhancement wrapper around `<input type="range">` with a styled progress
 * fill, live value display, and vertical orientation support.
 *
 * Progressive enhancement: if a child `<input type="range">` is present in the
 * HTML before upgrade, the component reads `min`, `max`, `step`, `value`, and
 * `name` from it. Component attributes take precedence over child input attributes.
 *
 * @fires rc-slider-input  - Fires continuously while the value changes. Detail: `{ value }`.
 * @fires rc-slider-change - Fires when the committed value changes (on release). Detail: `{ value }`.
 *
 * @cssprop [--rc-thumb-radius=9px] - Half the thumb width; used to align the float value display.
 */
export class RCSlider extends LitElement {
  override createRenderRoot() { return this; }

  /** Minimum value. */
  @property({ type: Number }) min = 0;

  /** Maximum value. */
  @property({ type: Number }) max = 100;

  /** Step size. */
  @property({ type: Number }) step = 1;

  /** Current value. */
  @property({ type: Number }) value = 0;

  /** Disables the underlying input. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Prevents edits while preserving normal display. Not a native range attribute. */
  @property({ type: Boolean, reflect: true }) readonly = false;

  /** Accessible label text rendered above the control. */
  @property() label = '';

  /** `name` forwarded to the underlying range input for form participation. */
  @property() name = '';

  /**
   * Associates the underlying input with a `<form>` element by its `id`.
   * Forwarded directly to the native input's `form` attribute.
   */
  @property() form = '';

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

  /** Optional screen-reader value text. When set, forwarded as `aria-valuetext`. */
  @property({ attribute: 'value-text' }) valueText = '';

  /** Orientation; reflected as an attribute and forwarded to `aria-orientation`. */
  @property({ reflect: true }) orientation: 'horizontal' | 'vertical' = 'horizontal';

  override connectedCallback(): void {
    this._absorbChildInput();
    super.connectedCallback();
  }

  override render() {
    const isVertical = this.orientation === 'vertical';

    const valueDisplay = html`
      <span
        part="value-display"
        class="rc-slider-value"
        style=${this.display === 'float' ? this._floatStyle() : nothing}
        aria-hidden="true"
      >
        <slot name="value-display">${this._displayText}</slot>
      </span>
    `;

    return html`
      <label
        part="root"
        class="rc-slider-root"
        data-display=${this.display ?? nothing}
        data-orientation=${this.orientation}
      >
        ${this.label
          ? html`<span part="label" class="rc-slider-label">${this.label}</span>`
          : nothing}

        ${this.display === 'inline-start' ? valueDisplay : nothing}

        <span part="control" class="rc-slider-control">
          <span part="track" class="rc-slider-track" aria-hidden="true">
            <span
              part="progress"
              class="rc-slider-progress"
              style=${this._progressStyle()}
            ></span>
          </span>

          <input
            part="input"
            type="range"
            min=${this.min}
            max=${this.max}
            step=${this.step}
            name=${this.name || nothing}
            form=${this.form || nothing}
            .value=${String(this.value)}
            ?disabled=${this.disabled}
            aria-readonly=${this.readonly ? 'true' : nothing}
            aria-valuetext=${this.valueText || nothing}
            aria-orientation=${isVertical ? 'vertical' : nothing}
            @input=${this._onInput}
            @change=${this._onChange}
            @keydown=${this._onKeydown}
          >

          ${this.display === 'float' ? valueDisplay : nothing}
        </span>

        ${this.display === 'inline-end' ? valueDisplay : nothing}
      </label>
    `;
  }

  private get _displayText(): string {
    return this.valueText || String(this.value);
  }

  private _onInput(e: Event): void {
    this._handleRangeEvent(e, 'rc-slider-input');
  }

  private _onChange(e: Event): void {
    this._handleRangeEvent(e, 'rc-slider-change');
  }

  private _handleRangeEvent(e: Event, type: 'rc-slider-input' | 'rc-slider-change'): void {
    const input = e.currentTarget as HTMLInputElement;

    if (this.readonly) {
      input.value = String(this.value);
      return;
    }

    this.value = input.valueAsNumber;

    this.dispatchEvent(
      new CustomEvent<RCSliderValueEvent>(type, {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  private _onKeydown(e: KeyboardEvent): void {
    if (this.disabled || this.readonly) return;
    if (e.key !== 'PageUp' && e.key !== 'PageDown') return;

    e.preventDefault();
    const input = e.currentTarget as HTMLInputElement;

    if (e.key === 'PageUp') input.stepUp(10);
    else input.stepDown(10);

    this.value = input.valueAsNumber;

    this.dispatchEvent(
      new CustomEvent<RCSliderValueEvent>('rc-slider-input', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  }

  private _progressStyle(): string {
    const pct = valueToPercent(this.value, this.min, this.max) * 100;

    if (this.orientation === 'vertical') {
      return `bottom:0%;height:${pct.toFixed(3)}%`;
    }

    return `left:0%;width:${pct.toFixed(3)}%`;
  }

  private _floatStyle(): string {
    const pct = valueToPercent(this.value, this.min, this.max);
    const k   = (1 - pct * 2).toFixed(4);

    if (this.orientation === 'vertical') {
      return `bottom:calc(${(pct * 100).toFixed(3)}% + ${k} * var(--rc-thumb-radius, 9px))`;
    }

    return `left:calc(${(pct * 100).toFixed(3)}% + ${k} * var(--rc-thumb-radius, 9px))`;
  }

  /**
   * Reads `min`, `max`, `step`, `value`, and `name` from the first child
   * `<input type="range">` and uses them as defaults for any component
   * attribute not explicitly set. The child input is removed after absorption
   * since Lit's render supplies the managed input.
   */
  private _absorbChildInput(): void {
    const input = this.querySelector<HTMLInputElement>('input[type="range"]');
    if (!input) return;

    if (!this.hasAttribute('min')   && input.hasAttribute('min'))   this.min   = +input.min;
    if (!this.hasAttribute('max')   && input.hasAttribute('max'))   this.max   = +input.max;
    if (!this.hasAttribute('step')  && input.hasAttribute('step'))  this.step  = +input.step;
    if (!this.hasAttribute('value') && input.hasAttribute('value')) this.value = +input.value;
    if (!this.name && input.name) this.name = input.name;

    // TODO: support `list` attribute (datalist) for tick marks on the native input
    input.remove();
  }
}

export default RCSlider;
