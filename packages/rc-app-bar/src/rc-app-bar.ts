import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import {
  ScrollObserverController,
  type ScrollObserverTarget,
} from '@rcarls/rc-common';

import appBarStyles from './rc-app-bar.styles';

declare global {
  interface HTMLElementTagNameMap {
    'rc-app-bar': RCAppBar;
  }
}

export type RCAppBarVariant = 'small' | 'medium';

export interface RCAppBarScrollDetail {
  /** Whether the observed scroll target is past the threshold. */
  scrolled: boolean;
}

/**
 * A Material-style top app bar: a structural layout row for a leading
 * nav control, a title region, and trailing actions, with an optional
 * expanded title row (`variant="medium"`) that collapses on scroll.
 *
 * The element carries no landmark role; wrap the page-level instance in
 * `<header>` (and secondary pane instances in their own containers) so
 * landmark semantics stay under consumer control.
 *
 * Scrolled state is dual-mode. Uncontrolled: set `scrollTarget` (or the
 * `scroll-target` selector attribute) and the bar observes the container,
 * reflects `data-scrolled`/`:state(scrolled)`, and fires `rc-app-bar-scroll`.
 * Controlled: assign the `scrolled` property and the bar applies it silently;
 * assign `undefined` to release back to observation. The `data-scrolled`
 * attribute is state output for CSS, never an input.
 *
 * @slot leading - Navigation control, typically a back or menu icon button
 * @slot - Inline title content, or an `rc-search-bar` for a search layout
 * @slot trailing - Trailing actions, typically an `rc-toolbar`
 * @slot expanded-title - Larger title for `variant="medium"`; provide the
 *   title in both this slot and the default slot — the bar keeps exactly one
 *   exposed to assistive technology at a time
 * @fires rc-app-bar-scroll - When the observed scroll state crosses the
 *   threshold (uncontrolled mode only); `detail: { scrolled }`
 * @cssprop [--rc-app-bar-bg=Canvas] - Bar background
 * @cssprop [--rc-app-bar-color=CanvasText] - Bar text color
 * @cssprop [--rc-app-bar-height=64px] - Title row block size
 * @cssprop [--rc-app-bar-expanded-height=48px] - Expanded title row block size
 * @cssprop [--rc-app-bar-title-font-size=1.375rem] - Inline title font size
 * @cssprop [--rc-app-bar-expanded-title-font-size=1.5rem] - Expanded title font size
 * @cssprop [--rc-app-bar-divider-scrolled=1px solid GrayText] - Bottom divider shown while scrolled
 * @cssprop [--rc-app-bar-shadow-scrolled=none] - Box shadow applied while scrolled
 * @cssprop [--rc-app-bar-transition-duration=200ms] - Collapse and fade duration
 * @cssprop [--rc-app-bar-padding-inline=0.75em] - Horizontal padding
 * @cssprop [--rc-app-bar-gap=0.5em] - Gap between title row regions
 * @csspart root - The bar container
 * @csspart title-row - The main row
 * @csspart leading - Wrapper around the leading slot
 * @csspart title - Wrapper around the inline title slot
 * @csspart trailing - Wrapper around the trailing slot
 * @csspart expanded - Wrapper around the expanded title row
 */
export class RCAppBar extends LitElement {
  static styles = [appBarStyles];

  /** Structural variant. `medium` adds the collapsible expanded title row. */
  @property({ type: String, reflect: true })
  variant: RCAppBarVariant = 'small';

  /**
   * Scroll container to observe for the scrolled state. Accepts an element
   * reference (property) or, via the `scroll-target` attribute, a CSS
   * selector resolved against the document — or the keyword `window`.
   */
  @property({ attribute: 'scroll-target' })
  scrollTarget: ScrollObserverTarget | string | null = null;

  /** Scroll offset in px past which the bar becomes scrolled (strict `>`). */
  @property({ type: Number, attribute: 'scroll-threshold' })
  scrollThreshold = 4;

  private _scrolled: boolean | undefined = undefined;

  @state()
  private _observedScrolled = false;

  @state()
  private _hasLeading = false;

  @state()
  private _hasTrailing = false;

  @state()
  private _hasExpandedTitle = false;

  private _internals = this.attachInternals();

  private readonly _scroll = new ScrollObserverController(this, {
    target: () => this._resolveScrollTarget(),
    threshold: this.scrollThreshold,
    disabled: true,
    onChange: (scrolled) => {
      this._observedScrolled = scrolled;
      this.dispatchEvent(
        new CustomEvent<RCAppBarScrollDetail>('rc-app-bar-scroll', {
          bubbles: true,
          composed: true,
          detail: { scrolled },
        }),
      );
    },
  });

  /**
   * Whether the bar is in the scrolled (elevated/collapsed) state. Host
   * writes are silent and switch the bar to controlled mode; assigning
   * `undefined` releases control back to the scroll observer.
   */
  @property({ attribute: false })
  get scrolled(): boolean {
    return this._scrolled ?? this._observedScrolled;
  }
  set scrolled(value: boolean | undefined) {
    const oldValue = this.scrolled;

    this._scrolled = value;
    this._syncScrollObserver();
    this.requestUpdate('scrolled', oldValue);
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (changed.has('scrollTarget') || changed.has('scrollThreshold')) {
      this._syncScrollObserver();
    }
  }

  protected override updated(): void {
    this.toggleAttribute('data-scrolled', this.scrolled);

    // CustomStateSet is Baseline but feature-detected for older engines.
    if (this._internals.states) {
      if (this.scrolled) {
        this._internals.states.add('scrolled');
      } else {
        this._internals.states.delete('scrolled');
      }
    }
  }

  private _syncScrollObserver(): void {
    this._scroll.setOptions({
      threshold: this.scrollThreshold,
      disabled: this._scrolled !== undefined || this._resolveScrollTarget() === null,
    });
  }

  private _resolveScrollTarget(): ScrollObserverTarget | null {
    const target = this.scrollTarget;
    if (target === null || target === undefined) return null;

    if (typeof target !== 'string') return target;

    if (target === 'window') return window;

    // An invalid consumer selector must degrade silently, not throw.
    try {
      return this.ownerDocument?.querySelector(target) ?? null;
    } catch {
      return null;
    }
  }

  /** The expanded title row is shown and exposed to AT only in this state. */
  private get _expandedActive(): boolean {
    return this.variant === 'medium' && this._hasExpandedTitle && !this.scrolled;
  }

  private _onSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const hasContent = slot.assignedElements().length > 0;

    switch (slot.name) {
      case 'leading':
        this._hasLeading = hasContent;
        break;
      case 'trailing':
        this._hasTrailing = hasContent;
        break;
      case 'expanded-title':
        this._hasExpandedTitle = hasContent;
        break;
    }
  }

  protected override render() {
    const expandedActive = this._expandedActive;

    return html`
      <div
        id="root"
        part="root"
        data-expanded-active=${expandedActive ? '' : nothing}
      >
        <div id="title-row" part="title-row">
          <div
            id="leading"
            part="leading"
            class=${classMap({ empty: !this._hasLeading })}
          >
            <slot name="leading" @slotchange=${this._onSlotChange}></slot>
          </div>
          <div
            id="title"
            part="title"
            aria-hidden=${expandedActive ? 'true' : nothing}
          >
            <slot></slot>
          </div>
          <div
            id="trailing"
            part="trailing"
            class=${classMap({ empty: !this._hasTrailing })}
          >
            <slot name="trailing" @slotchange=${this._onSlotChange}></slot>
          </div>
        </div>
        <div
          id="expanded"
          part="expanded"
          aria-hidden=${expandedActive ? nothing : 'true'}
        >
          <slot name="expanded-title" @slotchange=${this._onSlotChange}></slot>
        </div>
      </div>
    `;
  }
}

export default RCAppBar;
