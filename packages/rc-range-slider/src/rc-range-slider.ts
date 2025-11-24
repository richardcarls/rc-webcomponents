import { LitElement, html, nothing } from 'lit';
import type { PropertyValues } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { snapToStep, valueToPercent } from '@rcarls/rc-common';

export interface RCRangeSliderValueEvent {
  /** Current [low, high] value tuple. */
  value: [number, number];
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-range-slider': RCRangeSlider;
  }
}

/**
 * Dual-thumb range slider built on two stacked `<input type="range">` elements,
 * implementing the WAI-ARIA APG Slider (Multi-Thumb) pattern.
 *
 * Each native input provides keyboard navigation, form participation, and ARIA
 * semantics. Dynamic `aria-valuemin`/`aria-valuemax` cross-constraints keep both
 * inputs aware of each other's position.
 *
 * Progressive enhancement: if two child `<input type="range">` elements are
 * present before upgrade, their `min`, `max`, `step`, `value`, and `name`
 * attributes seed the component. The first child becomes the low input, the
 * second becomes the high input.
 *
 * @fires rc-range-slider-input  - Fires while either thumb moves. Detail: `{ value }`.
 * @fires rc-range-slider-change - Fires when a thumb commits a new value. Detail: `{ value }`.
 *
 * @cssprop [--rc-thumb-radius=9px] - Half the thumb width; used to align overlay value displays.
 */
export class RCRangeSlider extends LitElement {
  override createRenderRoot() { return this; }

  /** Minimum value. */
  @property({ type: Number }) min = 0;

  /** Maximum value. */
  @property({ type: Number }) max = 100;

  /** Step size. */
  @property({ type: Number }) step = 1;

  /**
   * Current [low, high] value. Assign a new tuple reference to trigger a
   * re-render; mutating the existing tuple in place will not schedule an update.
   */
  @property({
    attribute: false,
    hasChanged(n: [number, number], o: [number, number]) { return n !== o; },
  })
  value: [number, number] = [0, 100];

  /** Disables both inputs. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Accessible label for the group element. */
  @property() label = '';

  /** Accessible label for the low (min) thumb. */
  @property({ attribute: 'low-label' }) lowLabel = 'Minimum';

  /** Accessible label for the high (max) thumb. */
  @property({ attribute: 'high-label' }) highLabel = 'Maximum';

  /** Formatted screen-reader text for the low value. Falls back to the raw number. */
  @property({ attribute: 'low-value-text' }) lowValueText = '';

  /** Formatted screen-reader text for the high value. Falls back to the raw number. */
  @property({ attribute: 'high-value-text' }) highValueText = '';

  /**
   * Where to render the live value labels.
   * `none` hides them; `overlay` places them above each thumb;
   * `end` and `inline` are consumer-positioned via CSS / `data-display`.
   */
  @property() display: 'none' | 'inline' | 'overlay' | 'end' = 'none';

  /** Orientation; reflected as an attribute and forwarded to each input's `aria-orientation`. */
  @property({ reflect: true }) orientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Convenience: sets a shared name base. Creates inputs named `${name}-low`
   * and `${name}-high`. Individual `low-name` / `high-name` attributes override
   * the derived names when set.
   */
  @property() name = '';

  /** Explicit `name` for the low input. Overrides the value derived from `name`. */
  @property({ attribute: 'low-name' }) lowName = '';

  /** Explicit `name` for the high input. Overrides the value derived from `name`. */
  @property({ attribute: 'high-name' }) highName = '';

  /** Which input is currently on top (receives pointer events). Updated on `pointermove`. */
  @state() private _topThumb: 'low' | 'high' = 'high';

  @query('.rc-range-slider-group') private _groupEl!: HTMLElement;

  override connectedCallback(): void {
    this._absorbChildInputs();
    super.connectedCallback();
  }

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('min') || changed.has('max') || changed.has('step')) {
      const [low, high] = this.value;
      const clampedLow  = snapToStep(low,  this.min, this.max,  this.step);
      const clampedHigh = snapToStep(high, clampedLow, this.max, this.step);

      if (clampedLow !== low || clampedHigh !== high) {
        this.value = [clampedLow, clampedHigh];
      }
    }
  }

  override render() {
    const [low, high] = this.value;
    const showValue   = this.display !== 'none';
    const isVertical  = this.orientation === 'vertical';

    const lowText  = this.lowValueText  || String(low);
    const highText = this.highValueText || String(high);

    // The low input's max is capped at high so it cannot keyboard-navigate past
    // the high thumb. The high input's min is floored at low for the same reason.
    // This also provides the aria-valuemax / aria-valuemin ARIA constraints for
    // free via the native input mapping.
    return html`
      <div
        part="root"
        class="rc-range-slider-root"
        data-display=${this.display}
        data-orientation=${this.orientation}
      >
        ${this.label
          ? html`<span part="label" class="rc-range-slider-label">${this.label}</span>`
          : nothing}

        <div
          part="group"
          class="rc-range-slider-group"
          role="group"
          aria-label=${this.label || nothing}
          @pointermove=${this._onGroupPointerMove}
        >
          <span part="track" class="rc-range-slider-track" aria-hidden="true">
            <span
              part="range"
              class="rc-range-slider-range"
              style=${this._rangeStyle(low, high)}
            ></span>
          </span>

          <input
            type="range"
            part="low-input"
            class="rc-range-slider-input"
            min=${this.min}
            max=${high}
            step=${this.step}
            name=${this._lowInputName || nothing}
            .value=${String(low)}
            ?disabled=${this.disabled}
            aria-label=${this.lowLabel}
            aria-valuetext=${this.lowValueText || nothing}
            aria-orientation=${isVertical ? 'vertical' : nothing}
            style=${this._inputStyle('low')}
            @input=${this._onLowInput}
            @change=${this._onLowChange}
            @keydown=${this._onLowKeydown}
          >

          <input
            type="range"
            part="high-input"
            class="rc-range-slider-input"
            min=${low}
            max=${this.max}
            step=${this.step}
            name=${this._highInputName || nothing}
            .value=${String(high)}
            ?disabled=${this.disabled}
            aria-label=${this.highLabel}
            aria-valuetext=${this.highValueText || nothing}
            aria-orientation=${isVertical ? 'vertical' : nothing}
            style=${this._inputStyle('high')}
            @input=${this._onHighInput}
            @change=${this._onHighChange}
            @keydown=${this._onHighKeydown}
          >

          ${showValue ? html`
            <span class="rc-range-slider-values" aria-hidden="true">
              <span
                part="value-display low-value-display"
                class="rc-range-slider-value"
                style=${this.display === 'overlay' ? this._overlayStyle(low) : nothing}
              >${lowText}</span>
              <span
                part="value-display high-value-display"
                class="rc-range-slider-value"
                style=${this.display === 'overlay' ? this._overlayStyle(high) : nothing}
              >${highText}</span>
            </span>
          ` : nothing}
        </div>
      </div>
    `;
  }

  private get _lowInputName(): string {
    return this.lowName || (this.name ? `${this.name}-low` : '');
  }

  private get _highInputName(): string {
    return this.highName || (this.name ? `${this.name}-high` : '');
  }

  private _onLowInput(e: Event): void {
    const input = e.currentTarget as HTMLInputElement;
    const [, high] = this.value;

    this.value = [input.valueAsNumber, high];
    this._dispatch('rc-range-slider-input', this.value);
  }

  private _onLowChange(e: Event): void {
    const input = e.currentTarget as HTMLInputElement;
    const [, high] = this.value;

    this.value = [input.valueAsNumber, high];
    this._dispatch('rc-range-slider-change', this.value);
  }

  private _onHighInput(e: Event): void {
    const input = e.currentTarget as HTMLInputElement;
    const [low] = this.value;

    this.value = [low, input.valueAsNumber];
    this._dispatch('rc-range-slider-input', this.value);
  }

  private _onHighChange(e: Event): void {
    const input = e.currentTarget as HTMLInputElement;
    const [low] = this.value;

    this.value = [low, input.valueAsNumber];
    this._dispatch('rc-range-slider-change', this.value);
  }

  /**
   * APG keyboard contract for the low thumb.
   *
   * Prevents default on all handled keys so the native input doesn't also
   * process the event, then sets `input.value` immediately for visual feedback
   * before Lit's async re-render catches up.
   */
  private _onLowKeydown(e: KeyboardEvent): void {
    if (this.disabled) return;

    const input = e.currentTarget as HTMLInputElement;
    const [low, high] = this.value;
    const bigStep = this.step * 10;

    let newLow: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':   newLow = Math.min(low + this.step, high); break;
      case 'ArrowLeft':
      case 'ArrowDown': newLow = Math.max(low - this.step, this.min); break;
      case 'PageUp':    newLow = Math.min(low + bigStep,   high); break;
      case 'PageDown':  newLow = Math.max(low - bigStep,   this.min); break;
      case 'Home':      newLow = this.min; break;
      case 'End':       newLow = high; break; // low's effective max is high
      default:          return;
    }

    e.preventDefault();

    if (newLow === low) return;

    input.value = String(newLow);

    this.value = [newLow, high];
    this._dispatch('rc-range-slider-input', this.value);
  }

  /** APG keyboard contract for the high thumb. */
  private _onHighKeydown(e: KeyboardEvent): void {
    if (this.disabled) return;

    const input = e.currentTarget as HTMLInputElement;
    const [low, high] = this.value;
    const bigStep = this.step * 10;

    let newHigh: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':   newHigh = Math.min(high + this.step, this.max); break;
      case 'ArrowLeft':
      case 'ArrowDown': newHigh = Math.max(high - this.step, low); break;
      case 'PageUp':    newHigh = Math.min(high + bigStep,   this.max); break;
      case 'PageDown':  newHigh = Math.max(high - bigStep,   low); break;
      case 'Home':      newHigh = low; break; // high's effective min is low
      case 'End':       newHigh = this.max; break;
      default:          return;
    }

    e.preventDefault();

    if (newHigh === high) return;

    input.value = String(newHigh);

    this.value = [low, newHigh];
    this._dispatch('rc-range-slider-input', this.value);
  }


  /**
   * Updates which input is on top based on pointer proximity to each thumb.
   * Runs only when no button is held (i.e. not during a drag).
   */
  private _onGroupPointerMove(e: PointerEvent): void {
    if (e.buttons !== 0 || this.disabled) return;

    const rect = this._groupEl?.getBoundingClientRect();
    if (!rect) return;

    const [low, high] = this.value;
    const span = this.max - this.min;
    if (span <= 0) return;

    const pct = this.orientation === 'vertical'
      ? 1 - (e.clientY - rect.top)  / rect.height
      : (e.clientX  - rect.left) / rect.width;

    const val      = pct * span + this.min;
    const distLow  = Math.abs(val - low);
    const distHigh = Math.abs(val - high);

    // High wins on ties: keeps high on top when both thumbs coincide so the
    // user can drag it rightward to open the range.
    this._topThumb = distLow < distHigh ? 'low' : 'high';
  }

  private _inputStyle(thumb: 'low' | 'high'): string {
    const onTop = this._topThumb === thumb;
    // Both inputs cover the full group via position:absolute in consumer CSS.
    // z-index determines which receives pointer events.
    return `z-index:${onTop ? 2 : 1}`;
  }

  private _rangeStyle(low: number, high: number): string {
    const lo  = valueToPercent(low,  this.min, this.max) * 100;
    const hi  = valueToPercent(high, this.min, this.max) * 100;

    if (this.orientation === 'vertical') {
      return `bottom:${lo.toFixed(3)}%;height:${(hi - lo).toFixed(3)}%`;
    }

    return `left:${lo.toFixed(3)}%;width:${(hi - lo).toFixed(3)}%`;
  }

  private _overlayStyle(value: number): string {
    const pct = valueToPercent(value, this.min, this.max);
    const k   = (1 - pct * 2).toFixed(4);

    if (this.orientation === 'vertical') {
      return `bottom:calc(${(pct * 100).toFixed(3)}% + ${k} * var(--rc-thumb-radius, 9px))`;
    }

    return `left:calc(${(pct * 100).toFixed(3)}% + ${k} * var(--rc-thumb-radius, 9px))`;
  }

  private _dispatch(
    type: 'rc-range-slider-input' | 'rc-range-slider-change',
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

  /**
   * Reads config from the first two child `<input type="range">` elements
   * present before upgrade. Component attributes take precedence.
   */
  private _absorbChildInputs(): void {
    const inputs = Array.from(
      this.querySelectorAll<HTMLInputElement>('input[type="range"]'),
    ).slice(0, 2);

    if (inputs.length === 0) return;

    const [lo, hi] = inputs;

    if (!this.hasAttribute('min')   && lo?.hasAttribute('min'))   this.min   = +lo.min;
    if (!this.hasAttribute('max')   && (hi ?? lo)?.hasAttribute('max')) this.max = +(hi ?? lo).max;
    if (!this.hasAttribute('step')  && lo?.hasAttribute('step'))  this.step  = +lo.step;

    const initLow  = lo  && lo.hasAttribute('value')  ? +lo.value  : this.min;
    const initHigh = hi  && hi.hasAttribute('value')  ? +hi.value  : this.max;

    if (!this.lowName  && lo?.name)  this.lowName  = lo.name;
    if (!this.highName && hi?.name)  this.highName = hi.name;

    this.value = [initLow, initHigh];

    // Remove original child inputs — Lit's render supplies the managed inputs.
    for (const input of inputs) input.remove();
  }
}

export default RCRangeSlider;
