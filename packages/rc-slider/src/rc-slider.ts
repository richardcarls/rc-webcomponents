import { LitElement, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { valueToPercent } from '@rcarls/rc-common';

export interface RCSliderRange {
  /** Lower bound of the styled range segment (inclusive). */
  from: number;

  /** Upper bound of the styled range segment (inclusive). */
  to: number;

  /** Optional CSS part token added to the rendered range span. */
  part?: string;

  /** Optional accessible label for the rendered segment. */
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
 * Enhancement wrapper around `<input type="range">` with styled track segments,
 * live value display, and vertical orientation support.
 *
 * Progressive enhancement: if a child `<input type="range">` is present in the
 * HTML before upgrade, the component reads `min`, `max`, `step`, `value`, and
 * `name` from it. Component attributes take precedence over child input attributes.
 *
 * @fires rc-slider-input  - Fires continuously while the value changes. Detail: `{ value }`.
 * @fires rc-slider-change - Fires when the committed value changes (on release). Detail: `{ value }`.
 *
 * @cssprop [--rc-thumb-radius=9px] - Half the thumb width; used to align overlay value displays.
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

  /** Prevents edits while preserving normal display. */
  @property({ type: Boolean, reflect: true }) readonly = false;

  /** Accessible label text rendered above the control. */
  @property() label = '';

  /** `name` forwarded to the underlying range input for form participation. */
  @property() name = '';

  /**
   * Where to render the live value.
   * `none` hides it; `end` places it after the control; `overlay` places it
   * above the thumb; `inline` is a consumer-positioned slot.
   */
  @property() display: 'none' | 'inline' | 'overlay' | 'end' = 'none';

  /** Optional screen-reader value text. When set, forwarded as `aria-valuetext`. */
  @property({ attribute: 'value-text' }) valueText = '';

  /** Orientation; reflected as an attribute and forwarded to `aria-orientation`. */
  @property({ reflect: true }) orientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Styled track segments. Assign a new array reference to trigger a re-render;
   * mutating in place will not schedule an update.
   */
  @property({
    attribute: false,
    hasChanged(n: RCSliderRange[], o: RCSliderRange[]) { return n !== o; },
  })
  ranges: RCSliderRange[] = [];

  override connectedCallback(): void {
    this._absorbChildInput();
    super.connectedCallback();
  }

  override render() {
    const showValue = this.display !== 'none';
    const isVertical = this.orientation === 'vertical';

    return html`
      <label
        part="root"
        class="rc-slider-root"
        data-display=${this.display}
        data-orientation=${this.orientation}
      >
        ${this.label
          ? html`<span part="label" class="rc-slider-label">${this.label}</span>`
          : nothing}

        <span part="control" class="rc-slider-control">
          <span part="track" class="rc-slider-track" aria-hidden="true">
            ${repeat(
              this.ranges,
              (r) => `${r.from}-${r.to}-${r.part ?? ''}`,
              (r) => html`
                <span
                  part=${`range ${r.part ?? ''}`.trim()}
                  class="rc-slider-range"
                  aria-label=${r.label || nothing}
                  style=${this._rangeStyle(r)}
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
            aria-orientation=${isVertical ? 'vertical' : nothing}
            @input=${this._onInput}
            @change=${this._onChange}
            @keydown=${this._onKeydown}
          >

          ${showValue ? html`
            <span
              part="value-display"
              class="rc-slider-value"
              style=${this.display === 'overlay' ? this._overlayStyle() : nothing}
              aria-hidden="true"
            >
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
    const from = Math.min(Math.max(range.from, this.min), this.max);
    const to   = Math.min(Math.max(range.to,   this.min), this.max);

    const lo  = valueToPercent(Math.min(from, to), this.min, this.max) * 100;
    const len = Math.abs(
      valueToPercent(to, this.min, this.max) - valueToPercent(from, this.min, this.max),
    ) * 100;

    if (this.orientation === 'vertical') {
      return `bottom:${lo.toFixed(3)}%;height:${len.toFixed(3)}%`;
    }

    return `left:${lo.toFixed(3)}%;width:${len.toFixed(3)}%`;
  }

  private _overlayStyle(): string {
    const pct = valueToPercent(this.value, this.min, this.max);
    const k   = (1 - pct * 2).toFixed(4);

    // Aligns the display to the native thumb's center regardless of thumb size.
    // Requires --rc-thumb-radius to match the consumer's thumb CSS.
    if (this.orientation === 'vertical') {
      return `bottom:calc(${(pct * 100).toFixed(3)}% + ${k} * var(--rc-thumb-radius, 9px))`;
    }

    return `left:calc(${(pct * 100).toFixed(3)}% + ${k} * var(--rc-thumb-radius, 9px))`;
  }

  /**
   * Reads `min`, `max`, `step`, `value`, and `name` from the first child
   * `<input type="range">` and uses them as defaults for any component
   * attribute not explicitly set. Called before Lit's first render.
   */
  private _absorbChildInput(): void {
    const input = this.querySelector<HTMLInputElement>('input[type="range"]');
    if (!input) return;

    if (!this.hasAttribute('min')   && input.hasAttribute('min'))   this.min   = +input.min;
    if (!this.hasAttribute('max')   && input.hasAttribute('max'))   this.max   = +input.max;
    if (!this.hasAttribute('step')  && input.hasAttribute('step'))  this.step  = +input.step;
    if (!this.hasAttribute('value') && input.hasAttribute('value')) this.value = +input.value;
    if (!this.name && input.name) this.name = input.name;
  }
}

export default RCSlider;
