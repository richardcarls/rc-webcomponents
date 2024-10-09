import { LitElement, html } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';

import {
  keyNavigation,
  type KeyboardNavigationAction,
  mouseMove,
} from '@rcarls/rc-common';

import splitterStyles from './rc-splitter.styles';

type SplitterOrientation = 'horizontal' | 'vertical';

// TODO: flex-basis any different than percent?
type SplitterMode = 'length' | 'percent' | 'flex';

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
 * @see https://github.com/orgs/w3c/projects/142/views/1?pane=issue&itemId=80564335&issue=w3c%7Caria-practices%7C130
 */
@customElement('rc-splitter')
export class RCSplitter extends LitElement {
  static styles = [splitterStyles];

  /** Accessible label for this splitter. Default label is 'Splitter'. */
  @property({ type: String })
  label = 'Splitter';

  /** Toolbar orientation, for keyboard navigation. */
  @property({ type: String })
  orientation: SplitterOrientation = 'horizontal';

  /** Determines length units for min, max and step attributes. */
  @property({ type: String })
  mode: SplitterMode = 'length';

  @property({ type: Number })
  set step(val: number) {
    this._step = Math.min(Math.max(val, 0), this.maxValue);
  }

  get step() {
    return this._step;
  }

  private _step: number = 1.0;

  // TODO: min, max to replace minValue and maxValue

  protected _rootClientRect: DOMRect = this.getBoundingClientRect();

  protected get maxValue(): number {
    if (this.mode === 'length') {
      return this.orientation === 'horizontal'
        ? this._rootClientRect.width
        : this._rootClientRect.height;
    } else {
      return 100.0;
    }
  }

  protected _resizeObserver = new ResizeObserver(this._onRootResize);

  @state()
  protected _lastValue: number = 50.0;

  @property({ type: Number })
  set value(val: number) {
    this._lastValue = this._value;

    this._value = Math.min(
      Math.max(Math.round(val / this.step) * this.step, 0),
      this.maxValue
    );
  }

  get value() {
    return this._value;
  }

  private _value: number = this.maxValue / 2;

  get valueText() {
    return `${this.value}${this.mode === 'length' ? 'px' : '%'}`;
  }

  protected _onRootResize(entries: ResizeObserverEntry[]) {
    for (const entry of entries) {
      this._rootClientRect = entry.target.getBoundingClientRect();
    }
  }

  protected _onNavigate(action: KeyboardNavigationAction) {
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
        this.value = this.maxValue;
        break;
      case 'restore':
        this.value = this._lastValue;
        break;
    }
  }

  protected _onMouseMove(e: MouseEvent) {
    const clientRect = this.getBoundingClientRect();

    if (this.orientation === 'vertical') {
      this.value =
        ((e.clientY - clientRect.top) / clientRect.height) * this.maxValue;
    } else {
      this.value =
        ((e.clientX - clientRect.left) / clientRect.width) * this.maxValue;
    }
  }

  async connectedCallback() {
    super.connectedCallback();

    await this.updateComplete;

    this._resizeObserver.observe(this);

    this.value = this.maxValue / 2;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();

    this._resizeObserver.disconnect();
  }

  render() {
    return html`
      <section
        id="primary"
        aria-label=${this.label}
        style=${this.mode === 'flex'
          ? `flex-basis: ${this.valueText}`
          : this.orientation === 'horizontal'
          ? `width: ${this.valueText}`
          : `height: ${this.valueText}`}
        ?hidden=${this.value === 0}
      >
        <slot></slot>
      </section>

      <div
        id="separator"
        role="separator"
        tabindex="0"
        aria-labelledby="primary"
        aria-controls="primary"
        aria-orientation=${this.orientation}
        aria-valuenow=${this.value}
        aria-valuetext=${this.valueText}
        aria-valuemin="0"
        aria-valuemax="100"
        ${keyNavigation(this._onNavigate)}
        ${mouseMove(this._onMouseMove)}
      ></div>

      <aside id="secondary" ?hidden=${this.value === this.maxValue}>
        <slot name="secondary"></slot>
      </aside>
    `;
  }
}

export default RCSplitter;
