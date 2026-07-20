import { LitElement, html } from 'lit';
import type { PropertyValues } from 'lit';
import { property, query } from 'lit/decorators.js';

import { NavigationIndicatorController } from '@rcarls/rc-common';

import navigationBarStyles from './rc-navigation-bar.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-navigation-bar': RCNavigationBar;
  }
}

/**
 * Bottom navigation landmark that styles consumer-authored links.
 *
 * `rc-navigation-bar` preserves native `<a>` elements in light DOM for router
 * interop and progressive enhancement. Mark the current link with
 * `aria-current="page"` or provide `active-selector` for router active classes.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-navigation-bar rc-navigation-bar docs}
 * @see {@link https://m3.material.io/components/navigation-bar/overview Material 3 navigation bar}
 *
 * @slot default - Navigation links. Direct `<a>` children are recommended.
 *
 * @csspart nav - The component-owned navigation landmark.
 * @csspart indicator - The active item indicator.
 *
 * @cssprop [--rc-navigation-bar-bg=Canvas] - Navigation surface background.
 * @cssprop [--rc-navigation-bar-color=CanvasText] - Navigation text color.
 * @cssprop [--rc-navigation-bar-block-size=4rem] - Minimum block size for the bar.
 * @cssprop [--rc-navigation-bar-padding-block=0] - Bar block-axis padding.
 * @cssprop [--rc-navigation-bar-padding-inline=0] - Bar inline-axis padding.
 * @cssprop [--rc-navigation-bar-gap=0] - Gap between slotted items.
 * @cssprop [--rc-navigation-bar-item-gap=0.25rem] - Gap between item icon and label.
 * @cssprop [--rc-navigation-bar-item-min-block-size=3rem] - Minimum item block size.
 * @cssprop [--rc-navigation-bar-item-padding-block=0.5rem] - Item block-axis padding.
 * @cssprop [--rc-navigation-bar-item-padding-inline=0.75rem] - Item inline-axis padding.
 * @cssprop [--rc-navigation-bar-item-color=inherit] - Resting item text color.
 * @cssprop [--rc-navigation-bar-active-color=inherit] - Active item text color.
 * @cssprop [--rc-navigation-bar-indicator-bg] - Active indicator background.
 * @cssprop [--rc-navigation-bar-indicator-radius=9999px] - Active indicator corner radius.
 * @cssprop [--rc-navigation-bar-indicator-duration=180ms] - Active indicator transition duration.
 * @cssprop [--rc-navigation-bar-indicator-easing=ease] - Active indicator transition easing.
 * @cssprop [--rc-navigation-bar-focus-ring=2px solid Highlight] - Slotted link focus outline.
 * @cssprop [--rc-navigation-bar-focus-ring-offset=2px] - Slotted link outline offset.
 *
 * @attr label - Accessible label for the navigation landmark.
 * @attr active-selector - Selector used to find the active link.
 * @attr indicator-target - Selector inside the active link used for indicator geometry.
 */
export class RCNavigationBar extends LitElement {
  static override styles = [navigationBarStyles];

  /** Accessible label for the navigation landmark. */
  @property({ type: String })
  label = 'Primary navigation';

  /** Selector used to find the active link. Defaults to `aria-current`. */
  @property({ type: String, attribute: 'active-selector' })
  activeSelector = 'a[aria-current]:not([aria-current="false"])';

  /** Selector inside the active link used for indicator geometry. */
  @property({ type: String, attribute: 'indicator-target' })
  indicatorTarget = '[data-rc-navigation-indicator], [data-rc-navigation-icon]';

  @query('slot') private _$slot!: HTMLSlotElement;

  @query('nav') private _$nav!: HTMLElement;

  @query('#indicator') private _$indicator!: HTMLElement;

  private readonly _indicatorCtrl = new NavigationIndicatorController(this, {
    slot: () => this._$slot ?? null,
    container: () => this._$nav ?? null,
    indicator: () => this._$indicator ?? null,
    activeSelector: () => this.activeSelector,
    indicatorTargetSelector: () => this.indicatorTarget,
  });

  protected override firstUpdated(): void {
    this._indicatorCtrl.sync();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('activeSelector') || changed.has('indicatorTarget')) {
      this._indicatorCtrl.sync();
    }
  }

  protected override render() {
    return html`
      <nav part="nav" aria-label=${this.label}>
        <div id="indicator" part="indicator" hidden></div>
        <slot @slotchange=${this._handleSlotChange}></slot>
      </nav>
    `;
  }

  private _handleSlotChange(): void {
    this._indicatorCtrl.sync();
  }
}

export default RCNavigationBar;
