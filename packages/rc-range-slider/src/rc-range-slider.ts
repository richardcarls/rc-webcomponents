import { LitElement, html, nothing } from 'lit';
import type { ComplexAttributeConverter } from 'lit';
import { property, state, query } from 'lit/decorators.js';
import { valueToPercent } from '@rcarls/rc-common';

export interface RCRangeSliderValueEvent {
  /** Current [low, high] value tuple. */
  value: [number, number];
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-range-slider': RCRangeSlider;
  }

  interface HTMLElementEventMap {
    'rc-range-slider-input':  CustomEvent<RCRangeSliderValueEvent>;
    'rc-range-slider-change': CustomEvent<RCRangeSliderValueEvent>;
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
 * Returns the numeric value of a range input's `min`, `max`, or `step`
 * attribute string, falling back to `defaultVal` when the attribute is absent
 * (empty string) or not a valid number.
 */
function parseAttr(s: string, defaultVal: number): number {
  if (s === '') return defaultVal;
  const n = parseFloat(s);
  return isNaN(n) ? defaultVal : n;
}

/**
 * Dual-thumb range slider built on two consumer-provided `<input type="range">`
 * elements, implementing the WAI-ARIA APG Slider (Multi-Thumb) pattern.
 *
 * Both native inputs must be supplied as direct children. The component keeps
 * them in the DOM permanently — it enhances rather than replaces them. Each
 * input handles its own keyboard navigation and form participation natively.
 *
 * Dynamic `aria-valuemax`/`aria-valuemin` cross-constraints are applied
 * imperatively in `updated()` to keep each thumb aware of the other.
 *
 * Label association for the group (all patterns work without JavaScript):
 * - `<fieldset><legend>Price range</legend><rc-range-slider>…</rc-range-slider></fieldset>`
 * - `aria-labelledby` on the element itself pointing to an external heading or label.
 *
 * Per-thumb labels:
 * - `low-label` / `high-label` attributes (defaults: "Minimum" / "Maximum") set
 *   `aria-label` on each input only when the consumer has not already provided one.
 * - Consumer may set `aria-label` or `aria-labelledby` directly on their inputs.
 *
 * Form participation is handled natively by each input's `name` attribute.
 *
 * @fires rc-range-slider-input  - Fires while either thumb moves. Detail: `{ value }`.
 * @fires rc-range-slider-change - Fires when a thumb commits a new value. Detail: `{ value }`.
 *
 * @cssprop [--rc-thumb-radius=9px] - Half the thumb width; used to align float value displays.
 */
export class RCRangeSlider extends LitElement {
  override createRenderRoot() { return this; }

  /** Disables both inputs. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Prevents edits while preserving normal display. Not a native range attribute. */
  @property({ type: Boolean, reflect: true }) readonly = false;

  /**
   * Accessible label for the low (min) thumb. Applied to the native input via
   * `aria-label` only when the consumer has not already set `aria-label` on it.
   */
  @property({ attribute: 'low-label' }) lowLabel = 'Minimum';

  /**
   * Accessible label for the high (max) thumb. Applied to the native input via
   * `aria-label` only when the consumer has not already set `aria-label` on it.
   */
  @property({ attribute: 'high-label' }) highLabel = 'Maximum';

  /** Formatted screen-reader text for the low value. Falls back to the raw number. */
  @property({ attribute: 'low-value-text' }) lowValueText = '';

  /** Formatted screen-reader text for the high value. Falls back to the raw number. */
  @property({ attribute: 'high-value-text' }) highValueText = '';

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

  /** Orientation; reflected as an attribute and forwarded to each input's `aria-orientation`. */
  @property({ reflect: true }) orientation: 'horizontal' | 'vertical' = 'horizontal';

  /**
   * Current [low, high] value tuple; reflects the native inputs' last committed
   * values. Read-only from the outside.
   */
  get value(): [number, number] {
    return [this._lowValue, this._highValue];
  }

  @state() private _lowValue  = 0;
  @state() private _highValue = 100;

  /** Which input is currently on top (receives pointer events). Updated on `pointermove`. */
  @state() private _topThumb: 'low' | 'high' = 'high';

  @query('.rc-range-slider-group') private _groupEl!: HTMLElement;

  private _lowInput:  HTMLInputElement | null = null;
  private _highInput: HTMLInputElement | null = null;

  override connectedCallback(): void {
    this._findInputs();
    super.connectedCallback();
  }

  override disconnectedCallback(): void {
    this._unwireInputs();
    super.disconnectedCallback();
  }

  override firstUpdated(): void {
    if (this._lowInput && this._highInput) {
      this._lowValue  = this._lowInput.valueAsNumber  || 0;
      this._highValue = this._highInput.valueAsNumber || 100;
    }
  }

  override updated(): void {
    this._syncAriaAttributes();
  }

  override render() {
    const lo = this._lowInput;
    const hi = this._highInput;
    if (!lo || !hi) return nothing;

    // Read current values directly from the native inputs for accurate first render.
    // _lowValue / _highValue are @state() properties that trigger re-renders; they
    // lag behind by one cycle on the initial mount because firstUpdated() seeds them.
    const lowVal  = isNaN(lo.valueAsNumber) ? this._lowValue  : lo.valueAsNumber;
    const highVal = isNaN(hi.valueAsNumber) ? this._highValue : hi.valueAsNumber;

    const lowText  = this.lowValueText  || String(lowVal);
    const highText = this.highValueText || String(highVal);

    const valuesContainer = html`
      <span class="rc-range-slider-values" aria-hidden="true">
        <span
          part="value-display low-value-display"
          class="rc-range-slider-value"
          style=${this.display === 'float' ? this._floatStyle(lowVal) : nothing}
        >${lowText}</span>
        <span
          part="value-display high-value-display"
          class="rc-range-slider-value"
          style=${this.display === 'float' ? this._floatStyle(highVal) : nothing}
        >${highText}</span>
      </span>
    `;

    // Both inputs span the full [min, max] so the browser positions each thumb
    // as a fraction of the full range. Cross-constraints (low ≤ high) are
    // enforced via aria-valuemax / aria-valuemin and clamping in the event
    // handlers. Using a constrained native max/min produces a positional offset
    // that grows worst when both thumbs are near the centre.
    return html`
      <div
        part="root"
        class="rc-range-slider-root"
        data-display=${this.display ?? nothing}
        data-orientation=${this.orientation}
      >
        ${this.display === 'inline-start' ? valuesContainer : nothing}

        <div
          part="group"
          class="rc-range-slider-group"
          role="group"
          @pointermove=${this._onGroupPointerMove}
        >
          <span part="track" class="rc-range-slider-track" aria-hidden="true">
            <span
              part="range"
              class="rc-range-slider-range"
              style=${this._rangeStyle()}
            ></span>
          </span>

          ${lo}

          ${hi}

          ${this.display === 'float' ? valuesContainer : nothing}
        </div>

        ${this.display === 'inline-end' ? valuesContainer : nothing}
      </div>
    `;
  }

  /**
   * Finds the first two child `<input type="range">` elements and wires them.
   * Inputs remain in the DOM permanently; the component enhances rather than
   * replaces them.
   */
  private _findInputs(): void {
    const inputs = Array.from(
      this.querySelectorAll<HTMLInputElement>('input[type="range"]'),
    ).slice(0, 2);

    if (inputs.length < 2) {
      console.warn('[rc-range-slider] Requires two child <input type="range"> elements.');
      return;
    }

    const [lo, hi] = inputs as [HTMLInputElement, HTMLInputElement];

    // Mirror disabled state from the native inputs if not explicitly set on the host.
    if (!this.hasAttribute('disabled') && (lo.disabled || hi.disabled)) {
      this.disabled = true;
    }

    // Add CSS class required by the component's styling rules.
    lo.classList.add('rc-range-slider-input');
    hi.classList.add('rc-range-slider-input');

    this._lowInput  = lo;
    this._highInput = hi;

    this._wireInput(lo, this._onLowInput, this._onLowChange, this._onLowKeydown);
    this._wireInput(hi, this._onHighInput, this._onHighChange, this._onHighKeydown);
  }

  private _wireInput(
    input: HTMLInputElement,
    onInput:   (e: Event) => void,
    onChange:  (e: Event) => void,
    onKeydown: (e: KeyboardEvent) => void,
  ): void {
    input.addEventListener('input',   onInput);
    input.addEventListener('change',  onChange);
    input.addEventListener('keydown', onKeydown);
  }

  private _unwireInputs(): void {
    this._lowInput?.removeEventListener('input',   this._onLowInput);
    this._lowInput?.removeEventListener('change',  this._onLowChange);
    this._lowInput?.removeEventListener('keydown', this._onLowKeydown);

    this._highInput?.removeEventListener('input',   this._onHighInput);
    this._highInput?.removeEventListener('change',  this._onHighChange);
    this._highInput?.removeEventListener('keydown', this._onHighKeydown);
  }

  private _syncAriaAttributes(): void {
    const lo = this._lowInput;
    const hi = this._highInput;
    if (!lo || !hi) return;

    // Cross-constraints: each thumb's aria-valuemax/min reflects the other's position.
    lo.setAttribute('aria-valuemax', String(this._highValue));
    hi.setAttribute('aria-valuemin', String(this._lowValue));

    // Per-thumb labels — only set when the consumer hasn't provided their own.
    if (!lo.hasAttribute('aria-label') && this.lowLabel) {
      lo.setAttribute('aria-label', this.lowLabel);
    }
    if (!hi.hasAttribute('aria-label') && this.highLabel) {
      hi.setAttribute('aria-label', this.highLabel);
    }

    if (this.lowValueText) {
      lo.setAttribute('aria-valuetext', this.lowValueText);
    } else {
      lo.removeAttribute('aria-valuetext');
    }

    if (this.highValueText) {
      hi.setAttribute('aria-valuetext', this.highValueText);
    } else {
      hi.removeAttribute('aria-valuetext');
    }

    if (this.readonly) {
      lo.setAttribute('aria-readonly', 'true');
      hi.setAttribute('aria-readonly', 'true');
    } else {
      lo.removeAttribute('aria-readonly');
      hi.removeAttribute('aria-readonly');
    }

    if (this.orientation === 'vertical') {
      lo.setAttribute('aria-orientation', 'vertical');
      hi.setAttribute('aria-orientation', 'vertical');
    } else {
      lo.removeAttribute('aria-orientation');
      hi.removeAttribute('aria-orientation');
    }

    lo.disabled = this.disabled;
    hi.disabled = this.disabled;

    // z-index controls which input receives pointer events when the thumbs overlap.
    lo.style.zIndex = this._topThumb === 'low'  ? '2' : '1';
    hi.style.zIndex = this._topThumb === 'high' ? '2' : '1';
  }

  private readonly _onLowInput = (e: Event): void => {
    const input = e.currentTarget as HTMLInputElement;

    if (this.readonly) {
      input.value = String(this._lowValue);
      return;
    }

    const clamped = Math.min(input.valueAsNumber, this._highValue);

    // Imperatively reset so the browser snaps the thumb back before Lit's async
    // re-render catches up; without this the thumb drifts past the high thumb
    // during a fast drag even though the emitted value is correctly clamped.
    if (clamped !== input.valueAsNumber) input.value = String(clamped);

    this._lowValue = clamped;
    this._dispatch('rc-range-slider-input', this.value);
  };

  private readonly _onLowChange = (e: Event): void => {
    const input = e.currentTarget as HTMLInputElement;

    if (this.readonly) {
      input.value = String(this._lowValue);
      return;
    }

    const clamped = Math.min(input.valueAsNumber, this._highValue);
    if (clamped !== input.valueAsNumber) input.value = String(clamped);

    this._lowValue = clamped;
    this._dispatch('rc-range-slider-change', this.value);
  };

  private readonly _onHighInput = (e: Event): void => {
    const input = e.currentTarget as HTMLInputElement;

    if (this.readonly) {
      input.value = String(this._highValue);
      return;
    }

    const clamped = Math.max(input.valueAsNumber, this._lowValue);
    if (clamped !== input.valueAsNumber) input.value = String(clamped);

    this._highValue = clamped;
    this._dispatch('rc-range-slider-input', this.value);
  };

  private readonly _onHighChange = (e: Event): void => {
    const input = e.currentTarget as HTMLInputElement;

    if (this.readonly) {
      input.value = String(this._highValue);
      return;
    }

    const clamped = Math.max(input.valueAsNumber, this._lowValue);
    if (clamped !== input.valueAsNumber) input.value = String(clamped);

    this._highValue = clamped;
    this._dispatch('rc-range-slider-change', this.value);
  };

  /**
   * APG keyboard contract for the low thumb.
   *
   * Prevents default on all handled keys so the native input doesn't also
   * process the event, then sets `input.value` immediately for visual feedback
   * before Lit's async re-render catches up.
   */
  private readonly _onLowKeydown = (e: KeyboardEvent): void => {
    if (this.disabled || this.readonly) return;

    const input  = e.currentTarget as HTMLInputElement;
    const step   = parseAttr(input.step, 1);
    const min    = parseAttr(input.min, 0);
    const bigStep = step * 10;
    const low    = this._lowValue;
    const high   = this._highValue;

    let newLow: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':   newLow = Math.min(low + step,    high); break;
      case 'ArrowLeft':
      case 'ArrowDown': newLow = Math.max(low - step,    min);  break;
      case 'PageUp':    newLow = Math.min(low + bigStep,  high); break;
      case 'PageDown':  newLow = Math.max(low - bigStep,  min);  break;
      case 'Home':      newLow = min;  break;
      case 'End':       newLow = high; break; // low's effective max is high
      default:          return;
    }

    e.preventDefault();
    if (newLow === low) return;

    input.value = String(newLow);
    this._lowValue = newLow;
    this._dispatch('rc-range-slider-input', this.value);
  };

  /** APG keyboard contract for the high thumb. */
  private readonly _onHighKeydown = (e: KeyboardEvent): void => {
    if (this.disabled || this.readonly) return;

    const input   = e.currentTarget as HTMLInputElement;
    const step    = parseAttr(input.step, 1);
    const max     = parseAttr(input.max, 100);
    const bigStep = step * 10;
    const low     = this._lowValue;
    const high    = this._highValue;

    let newHigh: number | null = null;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':   newHigh = Math.min(high + step,    max);  break;
      case 'ArrowLeft':
      case 'ArrowDown': newHigh = Math.max(high - step,    low);  break;
      case 'PageUp':    newHigh = Math.min(high + bigStep,  max);  break;
      case 'PageDown':  newHigh = Math.max(high - bigStep,  low);  break;
      case 'Home':      newHigh = low; break; // high's effective min is low
      case 'End':       newHigh = max; break;
      default:          return;
    }

    e.preventDefault();
    if (newHigh === high) return;

    input.value = String(newHigh);
    this._highValue = newHigh;
    this._dispatch('rc-range-slider-input', this.value);
  };

  /**
   * Updates which input is on top based on pointer position relative to the
   * midpoint between the two thumbs. Runs only when no button is held.
   */
  private _onGroupPointerMove(e: PointerEvent): void {
    if (e.buttons !== 0 || this.disabled) return;

    const rect = this._groupEl?.getBoundingClientRect();
    if (!rect) return;

    const lo  = this._lowInput;
    if (!lo) return;

    const min  = parseAttr(lo.min, 0);
    const max  = parseAttr(lo.max, 100);
    const span = max - min;
    if (span <= 0) return;

    const pct = this.orientation === 'vertical'
      ? 1 - (e.clientY - rect.top)  / rect.height
      : (e.clientX  - rect.left) / rect.width;

    const val    = pct * span + min;
    const midVal = (this._lowValue + this._highValue) / 2;

    // Split on the midpoint between the two thumbs. When separated, this is
    // equivalent to proximity. When overlapping, the midpoint is the centre of
    // the shared thumb, so hovering left/below puts low on top and right/above
    // puts high on top — no special-casing needed for any overlap position.
    this._topThumb = val <= midVal ? 'low' : 'high';
  }

  private _rangeStyle(): string {
    const lo = this._lowInput;
    const hi = this._highInput;
    if (!lo || !hi) return '';

    const min = parseAttr(lo.min, 0);
    const max = parseAttr(lo.max, 100);
    const loP = valueToPercent(lo.valueAsNumber, min, max) * 100;
    const hiP = valueToPercent(hi.valueAsNumber, min, max) * 100;

    if (this.orientation === 'vertical') {
      return `bottom:${loP.toFixed(3)}%;height:${(hiP - loP).toFixed(3)}%`;
    }

    return `left:${loP.toFixed(3)}%;width:${(hiP - loP).toFixed(3)}%`;
  }

  private _floatStyle(value: number): string {
    const lo = this._lowInput;
    if (!lo) return '';

    const min = parseAttr(lo.min, 0);
    const max = parseAttr(lo.max, 100);
    const pct = valueToPercent(value, min, max);
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
}

export default RCRangeSlider;
