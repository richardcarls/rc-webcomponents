import { LitElement, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

export interface RCSliderRange {
  /** Lower value included in the styled range. */
  from: number;

  /** Upper value included in the styled range. */
  to: number;

  /** Optional CSS part token added to the rendered range segment. */
  part?: string;

  /** Optional accessible label for the rendered range segment. */
  label?: string;
}

export interface RCSliderValueEvent {
  /** Current numeric slider value. */
  value: number;
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-slider': RCSlider;
  }
}

/**
 * Range input enhancement with styled track ranges and flexible value display.
 *
 * @fires rc-slider-input - Fires while the value changes. Detail: `{ value }`.
 * @fires rc-slider-change - Fires when the committed value changes. Detail: `{ value }`.
 */
export class RCSlider extends LitElement {
  override createRenderRoot() { return this; }

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
    this.requestUpdate('value', old);
  }

  /** Initial uncontrolled slider value. Has no effect after the first user interaction or `value` write. */
  @property({ type: Number, attribute: 'default-value' })
  get defaultValue(): number | undefined {
    return this._defaultValue;
  }
  set defaultValue(v: number | undefined) {
    const old = this._defaultValue;
    this._defaultValue = v;
    if (!this._valueInitialized && this._value === undefined && v !== undefined) {
      this.requestUpdate('value', undefined);
    }
    this.requestUpdate('defaultValue', old);
  }

  /** Disable the underlying input. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Prevent user edits while preserving normal display. */
  @property({ type: Boolean, reflect: true }) readonly = false;

  /** Accessible label provided by the wrapping `<label>` element. */
  @property() label = '';

  /** `name` forwarded to the underlying range input for form participation. */
  @property() name = '';

  /** Controls where the value display renders. */
  @property() display: 'none' | 'inline' | 'overlay' | 'end' = 'none';

  /** Optional formatted value text. Defaults to `value`. Exposed to screen readers via `aria-valuetext`. */
  @property({ attribute: 'value-text' }) valueText = '';

  /** Slider orientation. Controls layout and `aria-orientation` on the underlying input. */
  @property({ reflect: true }) orientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Styled ranges painted on top of the track.
   *
   * Assign a new array reference to trigger a re-render; mutating the existing
   * array in place will not schedule an update.
   */
  @property({
    attribute: false,
    hasChanged(newVal: RCSliderRange[], oldVal: RCSliderRange[]) {
      return newVal !== oldVal;
    },
  })
  ranges: RCSliderRange[] = [];

  override render() {
    const showValue = this.display !== 'none';

    return html`
      <label part="root" class="rc-slider-root" data-display=${this.display}>
        ${this.label ? html`<span part="label" class="rc-slider-label">${this.label}</span>` : nothing}

        <span part="control" class="rc-slider-control">
          <span part="track" class="rc-slider-track" aria-hidden="true">
            ${repeat(
              this.ranges,
              (range) => `${range.from}-${range.to}-${range.part ?? ''}`,
              (range) => html`
                <span
                  part=${`range ${range.part ?? ''}`.trim()}
                  class="rc-slider-range"
                  aria-label=${range.label || nothing}
                  style=${this._rangeStyle(range)}
                ></span>
              `,
            )}
          </span>

          <input
            part="input"
            type="range"
            min=${this.min}
            max=${this.max}
            step=${this.step}
            name=${this.name || nothing}
            .value=${String(this.value)}
            ?disabled=${this.disabled}
            aria-readonly=${this.readonly ? 'true' : nothing}
            aria-valuetext=${this.valueText || nothing}
            aria-orientation=${this.orientation === 'vertical' ? 'vertical' : nothing}
            @input=${this._onInput}
            @change=${this._onChange}
            @keydown=${this._onKeydown}
          >

          ${showValue ? html`
            <span part="value-display" class="rc-slider-value" aria-hidden="true">
              <slot name="value-display">${this._displayText}</slot>
            </span>
          ` : nothing}
        </span>
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

  private _rangeStyle(range: RCSliderRange): string {
    const span = this.max - this.min;
    if (span <= 0) return 'left:0%;width:0%';

    const from = Math.min(Math.max(range.from, this.min), this.max);
    const to = Math.min(Math.max(range.to, this.min), this.max);
    const left = ((Math.min(from, to) - this.min) / span) * 100;
    const width = (Math.abs(to - from) / span) * 100;

    return `left:${left}%;width:${width}%`;
  }
}

export default RCSlider;
