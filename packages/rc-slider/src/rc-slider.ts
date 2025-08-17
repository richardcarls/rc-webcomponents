import { LitElement, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';

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

  /** Current slider value. */
  @property({ type: Number }) value = 0;

  /** Disable the underlying input. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Prevent user edits while preserving normal display. */
  @property({ type: Boolean, reflect: true }) readonly = false;

  /** Accessible label copied to the underlying range input. */
  @property() label = '';

  /** Controls where the value display renders. */
  @property() display: 'none' | 'inline' | 'overlay' | 'end' = 'none';

  /** Optional formatted value text. Defaults to `value`. */
  @property({ attribute: 'value-text' }) valueText = '';

  @state() private _ranges: RCSliderRange[] = [];

  /** Styled ranges painted on top of the track. */
  get ranges(): RCSliderRange[] {
    return [...this._ranges];
  }

  set ranges(value: RCSliderRange[]) {
    this._ranges = [...value];
  }

  override render() {
    const showValue = this.display !== 'none';

    return html`
      <label part="root" class="rc-slider-root" data-display=${this.display}>
        ${this.label ? html`<span part="label" class="rc-slider-label">${this.label}</span>` : nothing}

        <span part="control" class="rc-slider-control">
          <span part="track" class="rc-slider-track" aria-hidden="true">
            ${this._ranges.map((range) => html`
              <span
                part=${`range ${range.part ?? ''}`.trim()}
                class="rc-slider-range"
                title=${range.label ?? nothing}
                style=${this._rangeStyle(range)}
              ></span>
            `)}
          </span>

          <input
            part="input"
            type="range"
            min=${this.min}
            max=${this.max}
            step=${this.step}
            .value=${String(this.value)}
            aria-label=${this.label || nothing}
            aria-readonly=${this.readonly ? 'true' : nothing}
            ?disabled=${this.disabled}
            @input=${this._onInput}
            @change=${this._onChange}
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
    const input = e.currentTarget as HTMLInputElement;

    if (this.readonly) {
      input.value = String(this.value);
      return;
    }

    this.value = input.valueAsNumber;
    this._dispatchValue('rc-slider-input');
  }

  private _onChange(e: Event): void {
    const input = e.currentTarget as HTMLInputElement;

    if (this.readonly) {
      input.value = String(this.value);
      return;
    }

    this.value = input.valueAsNumber;
    this._dispatchValue('rc-slider-change');
  }

  private _dispatchValue(type: 'rc-slider-input' | 'rc-slider-change'): void {
    this.dispatchEvent(
      new CustomEvent<RCSliderValueEvent>(type, {
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
