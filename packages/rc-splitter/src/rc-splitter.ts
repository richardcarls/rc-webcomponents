import { LitElement, html } from 'lit';
import {
  property,
  state,
  query,
  queryAssignedElements,
} from 'lit/decorators.js';

import {
  keyNavigation,
  type KeyboardNavigationAction,
  mouseMove,
} from '@rcarls/rc-common';

import splitterStyles from './rc-splitter.styles';

type SplitterOrientation = 'horizontal' | 'vertical';

type SplitterMode = 'length' | 'percent';

declare global {
  interface HTMLElementTagNameMap {
    'rc-splitter': RCSplitter;
  }
}

// TODO: CSS Parts

/**
 * An accessible splitter layout component.
 *
 * Set `orientation="vertical"` for a vertical splitter
 *
 * @slot - Primary pane contents
 * @slot secondary - Secondary pane contents (optional)
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
 * @cssprop [--rc-splitter-separator-size=6px] - Thickness of the separator bar
 * @cssprop [--rc-splitter-separator-handle-size=100%] - Length of the drag handle within the separator
 * @cssprop [--rc-splitter-separator-color=ButtonFace] - Background color; falls back through --rc-surface
 * @cssprop [--rc-splitter-separator-border-inline-start=1px solid ButtonBorder] - Inline-start border
 * @cssprop [--rc-splitter-separator-border-inline-end=1px solid ButtonBorder] - Inline-end border
 * @cssprop [--rc-splitter-separator-border-block-start=1px solid ButtonBorder] - Block-start border (vertical orientation)
 * @cssprop [--rc-splitter-separator-border-block-end=1px solid ButtonBorder] - Block-end border (vertical orientation)
 * @csspart separator - The separator bar
 * @csspart separator-handle - The focusable drag handle
 */
export class RCSplitter extends LitElement {
  static styles = [splitterStyles];

  /** Accessible label for this splitter. Default label is 'Splitter'. */
  @property({ type: String })
  label = 'Splitter';

  /** Splitter orientation, for keyboard navigation and initial sizing. */
  @property({ type: String, reflect: true })
  orientation: SplitterOrientation = 'horizontal';

  /** Determines length units for min, max and step attributes, one of either `length` (default) or `percent` */
  @property({ type: String })
  mode: SplitterMode = 'length';

  /** The step size for resizing, in either pixels or percentage points depending on `mode`. */
  @property({ type: Number })
  step: number = 1;

  /** Initial value from attribute, used to set starting position. */
  @property({ type: Number, attribute: 'value' })
  initialValue: number | null = null;

  /** The current splitter value, corresponding to the separator position, in either pixels or percentage points depending on `mode`. */
  set value(val: number) {
    const oldValue = this._value;
    this._lastValue = oldValue;

    this._value = Math.min(
      Math.max(Math.round(val / this.step) * this.step, this._minValue),
      this._maxValue,
    );

    // Dispatch change event if value actually changed
    if (this._value !== oldValue) {
      this.dispatchEvent(
        new CustomEvent('rc-splitter-change', {
          bubbles: true,
          composed: true,
          detail: { value: this._value, valueText: this.valueText },
        }),
      );
    }
  }
  get value() {
    return this._value;
  }
  private _value: number = 0;

  /** Toggles resizing ability */
  @property({ type: Boolean })
  fixed: boolean = false;

  /** A human-readable string representation of the value. */
  get valueText() {
    return `${this.value}${this.mode === 'length' ? 'px' : '%'}`;
  }

  @state()
  protected _minValue: number = 0;

  @state()
  protected _maxValue: number = 0;

  /** Last valid value, for collapse functionality. */
  @state()
  protected _lastValue: number = 0;

  @query('#primary', true)
  protected _$primary!: HTMLDivElement;

  @queryAssignedElements()
  protected _$primaryElements!: Array<HTMLElement>;

  @queryAssignedElements({ slot: 'secondary' })
  protected _$secondaryElements!: Array<HTMLElement>;

  protected _initialMax: number = 0;

  protected _resizeObserver = new ResizeObserver(() => this._onResize());

  protected _onKeyboardResize(action: KeyboardNavigationAction) {
    if (this.fixed) {
      return;
    }

    switch (action) {
      case 'next':
        this.value += this.step;
        break;
      case 'prev':
        this.value -= this.step;
        break;
      case 'collapse':
      case 'start':
        this.value = 0;
        break;
      case 'end':
        this.value = this._maxValue;
        break;
      case 'restore':
        this.value = this._lastValue;
        break;
    }
  }

  protected _onMouseResize(e: MouseEvent) {
    if (this.fixed) {
      return;
    }

    const clientRect = this.getBoundingClientRect();

    if (this.orientation === 'vertical') {
      this.value =
        ((e.clientY - clientRect.top) / clientRect.height) * this._maxValue;
    } else {
      this.value =
        ((e.clientX - clientRect.left) / clientRect.width) * this._maxValue;
    }
  }

  protected _onPrimaryChange(_e: Event) {
    if (this._$primaryElements.length >= 2) {
      // Move all additonal elements to secondary slot
      this._$primaryElements
        .slice(1)
        .forEach((el) => el.setAttribute('slot', 'secondary'));
    }
  }

  protected _onSecondaryChange(_e: Event) {
    if (this._$secondaryElements.length && !this._$primaryElements.length) {
      // Make sure default slot is populated first
      this._$secondaryElements.at(0)?.removeAttribute('slot');
    }
  }

  protected _onResize() {
    const el = this._$primaryElements.at(0);
    const prevStyle = this._$primary.style.getPropertyValue('display');

    // Request animation frame to prevent layout piant jank
    globalThis.requestAnimationFrame(() => {
      // Temporarily display the first / primary lightDOM element as a direct child, for measurment
      this._$primary.style.setProperty('display', 'contents');

      const clientRect =
        el?.getBoundingClientRect() ?? this.getBoundingClientRect();

      if (this.mode === 'length') {
        this._maxValue =
          this.orientation === 'horizontal'
            ? // For horizontal splitters, just take the host width...
              Math.ceil(this.getBoundingClientRect().width)
            : // ...otherwise try to use the first lightDOM element's auto height, and cache it
              this._initialMax || Math.ceil(clientRect.height);
      } else {
        // Percentage max is always just 100%
        this._maxValue = 100.0;
      }

      if (!this._initialMax) {
        // console.log(this, this.value);

        this._initialMax = this._maxValue;
        this.value = this.initialValue ?? this._maxValue / 2;
      }

      // Restore previous display mode
      prevStyle
        ? this._$primary.style.setProperty('display', prevStyle)
        : this._$primary.style.removeProperty('display');
    });
  }

  connectedCallback() {
    super.connectedCallback();
    this._resizeObserver.observe(this);
  }

  disconnectedCallback(): void {
    this._resizeObserver.disconnect();
    super.disconnectedCallback();
  }

  firstUpdated() {
    this._onResize();
  }

  render() {
    return html`
      <div
        id="primary"
        aria-label=${this.label}
        style=${this.orientation === 'horizontal'
          ? `width: ${this.valueText}`
          : `height: ${this.valueText}`}
        ?hidden=${this.value === this._minValue}
      >
        <slot @slotchange=${this._onPrimaryChange}></slot>
      </div>

      <div id="separator" part="separator">
        <div
          id="separator-handle"
          role="separator"
          tabindex="0"
          part="separator-handle"
          aria-labelledby="primary"
          aria-controls="primary"
          aria-orientation=${this.orientation}
          aria-valuenow=${this.value}
          aria-valuetext=${this.valueText}
          aria-valuemin=${this._minValue}
          aria-valuemax=${this._maxValue}
          ${keyNavigation(this._onKeyboardResize)}
          ${mouseMove(this._onMouseResize)}
          ?hidden=${!this._$secondaryElements.length}
        ></div>
      </div>

      <aside
        id="secondary"
        ?hidden=${!this._$secondaryElements.length ||
        this.value === this._maxValue}
      >
        <slot name="secondary" @slotchange=${this._onSecondaryChange}></slot>
      </aside>
    `;
  }
}

export default RCSplitter;
