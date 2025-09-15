import { LitElement, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';

export interface RCRangeSliderValueEvent {
  /** Current [low, high] slider value. */
  value: [number, number];
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-range-slider': RCRangeSlider;
  }
}

/**
 * Dual-thumb range slider implementing the WAI-ARIA APG Slider (Multi-Thumb)
 * pattern.
 *
 * Each thumb is a `<div role="slider">` with its own label, value, and
 * dynamically linked `aria-valuemin`/`aria-valuemax` that keep the two thumbs
 * aware of each other's position. This ensures screen readers can announce
 * the interdependency without the pointer-event and z-index complications of
 * two overlaid `<input type="range">` elements.
 *
 * @fires rc-range-slider-input - Fires while either thumb is being dragged. Detail: `{ value }`.
 * @fires rc-range-slider-change - Fires when a thumb commits a new value. Detail: `{ value }`.
 */
export class RCRangeSlider extends LitElement {
  override createRenderRoot() { return this; }

  /** Minimum slider value. */
  @property({ type: Number }) min = 0;

  /** Maximum slider value. */
  @property({ type: Number }) max = 100;

  /** Slider step. */
  @property({ type: Number }) step = 1;

  /** Current [low, high] value. Assign a new tuple reference to trigger a re-render. */
  @property({
    attribute: false,
    hasChanged(newVal: [number, number], oldVal: [number, number]) {
      return newVal !== oldVal;
    },
  })
  value: [number, number] = [0, 100];

  /** Disable both thumbs. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Accessible label for the group, provided by a wrapping `<label>` or set directly. */
  @property() label = '';

  /** Accessible label for the low thumb. */
  @property({ attribute: 'low-label' }) lowLabel = 'Minimum';

  /** Accessible label for the high thumb. */
  @property({ attribute: 'high-label' }) highLabel = 'Maximum';

  /** Optional formatted text for the low thumb value. Defaults to the numeric value. */
  @property({ attribute: 'low-value-text' }) lowValueText = '';

  /** Optional formatted text for the high thumb value. Defaults to the numeric value. */
  @property({ attribute: 'high-value-text' }) highValueText = '';

  /** Controls where the value display renders relative to each thumb. */
  @property() display: 'none' | 'inline' | 'overlay' | 'end' = 'none';

  /** Slider orientation. Controls layout and `aria-orientation` on each thumb. */
  @property({ reflect: true }) orientation: 'horizontal' | 'vertical' = 'horizontal';

  override render() {
    const [low, high] = this.value;
    const showValue = this.display !== 'none';

    const lowText = this.lowValueText || String(low);
    const highText = this.highValueText || String(high);

    return html`
      <div
        part="root"
        class="rc-range-slider-root"
        data-display=${this.display}
        data-orientation=${this.orientation}
      >
        ${this.label ? html`<span part="label" class="rc-range-slider-label">${this.label}</span>` : nothing}

        <div
          part="group"
          class="rc-range-slider-group"
          role="group"
          aria-label=${this.label || nothing}
        >
          <span part="track" class="rc-range-slider-track" aria-hidden="true">
            <span
              part="range"
              class="rc-range-slider-range"
              style=${this._rangeStyle(low, high)}
            ></span>
          </span>

          <div
            part="thumb low-thumb"
            class="rc-range-slider-thumb"
            role="slider"
            tabindex=${this.disabled ? '-1' : '0'}
            aria-label=${this.lowLabel}
            aria-valuemin=${this.min}
            aria-valuemax=${high}
            aria-valuenow=${low}
            aria-valuetext=${this.lowValueText || nothing}
            aria-orientation=${this.orientation === 'vertical' ? 'vertical' : nothing}
            ?aria-disabled=${this.disabled}
            @keydown=${this._onLowKeydown}
            @pointerdown=${this._onLowPointerdown}
          >
            ${showValue ? html`
              <span part="value-display low-value-display" class="rc-range-slider-value" aria-hidden="true">
                <slot name="low-value-display">${lowText}</slot>
              </span>
            ` : nothing}
          </div>

          <div
            part="thumb high-thumb"
            class="rc-range-slider-thumb"
            role="slider"
            tabindex=${this.disabled ? '-1' : '0'}
            aria-label=${this.highLabel}
            aria-valuemin=${low}
            aria-valuemax=${this.max}
            aria-valuenow=${high}
            aria-valuetext=${this.highValueText || nothing}
            aria-orientation=${this.orientation === 'vertical' ? 'vertical' : nothing}
            ?aria-disabled=${this.disabled}
            @keydown=${this._onHighKeydown}
            @pointerdown=${this._onHighPointerdown}
          >
            ${showValue ? html`
              <span part="value-display high-value-display" class="rc-range-slider-value" aria-hidden="true">
                <slot name="high-value-display">${highText}</slot>
              </span>
            ` : nothing}
          </div>
        </div>
      </div>
    `;
  }

  private _onLowKeydown = (e: KeyboardEvent): void => {
    if (this.disabled) return;

    const [low, high] = this.value;
    const newLow = this._applyKey(e, low, this.min, high);

    if (newLow === null) return;
    e.preventDefault();

    this._setLow(newLow, e.type === 'keydown' ? 'input' : 'change');
  };

  private _onHighKeydown = (e: KeyboardEvent): void => {
    if (this.disabled) return;

    const [low, high] = this.value;
    const newHigh = this._applyKey(e, high, low, this.max);

    if (newHigh === null) return;
    e.preventDefault();

    this._setHigh(newHigh, e.type === 'keydown' ? 'input' : 'change');
  };

  private _onLowPointerdown = (e: PointerEvent): void => {
    if (this.disabled || e.button !== 0) return;

    const thumb = e.currentTarget as HTMLElement;
    thumb.setPointerCapture(e.pointerId);
    thumb.addEventListener('pointermove', this._onLowPointermove);
    thumb.addEventListener('pointerup', this._onLowPointerup, { once: true });
  };

  private _onLowPointermove = (e: PointerEvent): void => {
    if (this.disabled) return;

    const [, high] = this.value;
    const newLow = this._pointerToValue(e, this.min, high);

    this._setLow(newLow, 'input');
  };

  private _onLowPointerup = (e: PointerEvent): void => {
    const thumb = e.currentTarget as HTMLElement;
    thumb.removeEventListener('pointermove', this._onLowPointermove);

    const [low] = this.value;
    this._dispatch('rc-range-slider-change', [low, this.value[1]]);
  };

  private _onHighPointerdown = (e: PointerEvent): void => {
    if (this.disabled || e.button !== 0) return;

    const thumb = e.currentTarget as HTMLElement;
    thumb.setPointerCapture(e.pointerId);
    thumb.addEventListener('pointermove', this._onHighPointermove);
    thumb.addEventListener('pointerup', this._onHighPointerup, { once: true });
  };

  private _onHighPointermove = (e: PointerEvent): void => {
    if (this.disabled) return;

    const [low] = this.value;
    const newHigh = this._pointerToValue(e, low, this.max);

    this._setHigh(newHigh, 'input');
  };

  private _onHighPointerup = (e: PointerEvent): void => {
    const thumb = e.currentTarget as HTMLElement;
    thumb.removeEventListener('pointermove', this._onHighPointermove);

    const [, high] = this.value;
    this._dispatch('rc-range-slider-change', [this.value[0], high]);
  };

  private _setLow(newLow: number, eventType: 'input' | 'change'): void {
    const [, high] = this.value;
    const clamped = this._clamp(this._snap(newLow), this.min, high);

    if (clamped === this.value[0]) return;

    this.value = [clamped, high];
    this._dispatch(`rc-range-slider-${eventType}`, this.value);
  }

  private _setHigh(newHigh: number, eventType: 'input' | 'change'): void {
    const [low] = this.value;
    const clamped = this._clamp(this._snap(newHigh), low, this.max);

    if (clamped === this.value[1]) return;

    this.value = [low, clamped];
    this._dispatch(`rc-range-slider-${eventType}`, this.value);
  }

  /**
   * Translates an APG keyboard event into a new value for a thumb, bounded by
   * [minBound, maxBound]. Returns `null` for unhandled keys.
   */
  private _applyKey(
    e: KeyboardEvent,
    current: number,
    minBound: number,
    maxBound: number,
  ): number | null {
    const bigStep = this.step * 10;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':    return Math.min(current + this.step, maxBound);
      case 'ArrowLeft':
      case 'ArrowDown':  return Math.max(current - this.step, minBound);
      case 'PageUp':     return Math.min(current + bigStep, maxBound);
      case 'PageDown':   return Math.max(current - bigStep, minBound);
      case 'Home':       return minBound;
      case 'End':        return maxBound;
      default:           return null;
    }
  }

  private _pointerToValue(e: PointerEvent, minBound: number, maxBound: number): number {
    const track = this.querySelector<HTMLElement>('[part~="track"]');
    if (!track) return minBound;

    const rect = track.getBoundingClientRect();
    const span = this.max - this.min;
    if (span <= 0) return minBound;

    let ratio: number;

    if (this.orientation === 'vertical') {
      ratio = 1 - (e.clientY - rect.top) / rect.height;
    } else {
      ratio = (e.clientX - rect.left) / rect.width;
    }

    const raw = this.min + ratio * span;
    return this._clamp(this._snap(raw), minBound, maxBound);
  }

  private _snap(value: number): number {
    return Math.round(value / this.step) * this.step;
  }

  private _clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private _rangeStyle(low: number, high: number): string {
    const span = this.max - this.min;
    if (span <= 0) return 'left:0%;width:0%';

    const left = ((this._clamp(low, this.min, this.max) - this.min) / span) * 100;
    const right = ((this._clamp(high, this.min, this.max) - this.min) / span) * 100;

    if (this.orientation === 'vertical') {
      return `bottom:${left}%;height:${right - left}%`;
    }

    return `left:${left}%;width:${right - left}%`;
  }

  private _dispatch(type: 'rc-range-slider-input' | 'rc-range-slider-change', value: [number, number]): void {
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
