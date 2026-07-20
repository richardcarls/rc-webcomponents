import { LitElement, html } from 'lit';
import type { PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import { NavigationIndicatorController } from '@rcarls/rc-common';

import navigationRailStyles from './rc-navigation-rail.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-navigation-rail': RCNavigationRail;
  }

  interface HTMLElementEventMap {
    'rc-navigation-rail-toggle': CustomEvent<RCNavigationRailToggleDetail>;
  }
}

/** Detail payload for the `rc-navigation-rail-toggle` event. */
export interface RCNavigationRailToggleDetail {
  /** Whether the rail is expanded after the toggle. */
  expanded: boolean;
}

/**
 * Navigation rail landmark that styles consumer-authored links.
 *
 * `rc-navigation-rail` preserves native `<a>` elements in light DOM for router
 * interop and progressive enhancement. Mark the current link with
 * `aria-current="page"` or provide `active-selector` for router active classes.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-navigation-rail rc-navigation-rail docs}
 * @see {@link https://m3.material.io/components/navigation-rail/overview Material 3 navigation rail}
 *
 * @slot default - Navigation links. Direct `<a>` children are recommended.
 * @slot header - Content above the navigation links.
 * @slot footer - Content pinned after the navigation links.
 * @slot toggle - Custom rail expand/collapse control.
 *
 * @fires rc-navigation-rail-toggle - Fired when user interaction or a method toggles expanded state.
 *
 * @csspart root - The rail layout container.
 * @csspart nav - The component-owned navigation landmark.
 * @csspart indicator - The active item indicator.
 * @csspart toggle - The default toggle button.
 * @csspart header - Header slot container.
 * @csspart footer - Footer slot container.
 *
 * @cssprop [--rc-navigation-rail-bg=Canvas] - Rail surface background.
 * @cssprop [--rc-navigation-rail-color=CanvasText] - Rail text color.
 * @cssprop [--rc-navigation-rail-inline-size=5rem] - Collapsed rail inline size.
 * @cssprop [--rc-navigation-rail-expanded-inline-size=16rem] - Expanded rail inline size.
 * @cssprop [--rc-navigation-rail-padding-block=0.75rem] - Rail block-axis padding.
 * @cssprop [--rc-navigation-rail-padding-inline=0.5rem] - Rail inline-axis padding.
 * @cssprop [--rc-navigation-rail-gap=0.75rem] - Gap between rail regions.
 * @cssprop [--rc-navigation-rail-item-gap=0.75rem] - Gap between navigation items.
 * @cssprop [--rc-navigation-rail-link-gap=0.25rem] - Gap between item icon and label.
 * @cssprop [--rc-navigation-rail-item-min-block-size=3.5rem] - Collapsed item minimum block size.
 * @cssprop [--rc-navigation-rail-expanded-item-min-block-size=3.5rem] - Expanded item minimum block size.
 * @cssprop [--rc-navigation-rail-item-padding-block=0.25rem] - Item block-axis padding.
 * @cssprop [--rc-navigation-rail-item-padding-inline=0.5rem] - Collapsed item inline-axis padding.
 * @cssprop [--rc-navigation-rail-expanded-item-padding-inline=1rem] - Expanded item inline-axis padding.
 * @cssprop [--rc-navigation-rail-item-color=inherit] - Resting item text color.
 * @cssprop [--rc-navigation-rail-active-color=inherit] - Active item text color.
 * @cssprop [--rc-navigation-rail-indicator-bg] - Active indicator background.
 * @cssprop [--rc-navigation-rail-indicator-radius=9999px] - Active indicator corner radius.
 * @cssprop [--rc-navigation-rail-toggle-size=3rem] - Default toggle square size.
 * @cssprop [--rc-navigation-rail-toggle-radius=9999px] - Default toggle corner radius.
 * @cssprop [--rc-navigation-rail-toggle-bg=transparent] - Default toggle background.
 * @cssprop [--rc-navigation-rail-toggle-color=inherit] - Default toggle text color.
 * @cssprop [--rc-navigation-rail-toggle-hover-bg] - Default toggle hover background.
 * @cssprop [--rc-navigation-rail-duration=200ms] - Rail expand/collapse transition duration.
 * @cssprop [--rc-navigation-rail-easing=ease] - Rail expand/collapse transition easing.
 * @cssprop [--rc-navigation-rail-indicator-duration=180ms] - Active indicator transition duration.
 * @cssprop [--rc-navigation-rail-indicator-easing=ease] - Active indicator transition easing.
 * @cssprop [--rc-navigation-rail-focus-ring=2px solid Highlight] - Slotted link and default toggle focus outline.
 * @cssprop [--rc-navigation-rail-focus-ring-offset=2px] - Slotted link outline offset.
 */
export class RCNavigationRail extends LitElement {
  static override styles = [navigationRailStyles];

  private _defaultExpanded = false;
  private _expanded: boolean | undefined;
  private _expandedInitialized = false;

  /** Accessible label for the navigation landmark. */
  @property({ type: String })
  label = 'Primary navigation';

  /** Whether the rail is expanded. Host writes are silent. */
  @property({ type: Boolean, reflect: true })
  get expanded(): boolean {
    return this._expanded ?? this._defaultExpanded;
  }

  set expanded(value: boolean | undefined) {
    if (value === undefined) {
      return;
    }

    const oldValue = this.expanded;

    this._expanded = value;
    this._expandedInitialized = true;
    this.requestUpdate('expanded', oldValue);
  }

  /** Initial expanded state for uncontrolled usage. */
  @property({ type: Boolean, attribute: 'default-expanded' })
  get defaultExpanded(): boolean {
    return this._defaultExpanded;
  }

  set defaultExpanded(value: boolean) {
    const oldValue = this._defaultExpanded;

    this._defaultExpanded = value;

    if (!this._expandedInitialized && this._expanded === undefined) {
      this.requestUpdate('expanded', oldValue);
    }

    this.requestUpdate('defaultExpanded', oldValue);
  }

  /** Render the default expand/collapse toggle when no custom toggle is slotted. */
  @property({ type: Boolean, reflect: true })
  toggleable = false;

  /** Accessible label used by the default toggle while collapsed. */
  @property({ type: String, attribute: 'expand-label' })
  expandLabel = 'Expand navigation';

  /** Accessible label used by the default toggle while expanded. */
  @property({ type: String, attribute: 'collapse-label' })
  collapseLabel = 'Collapse navigation';

  /** Selector used to find the active link. Defaults to `aria-current`. */
  @property({ type: String, attribute: 'active-selector' })
  activeSelector = 'a[aria-current]:not([aria-current="false"])';

  /** Selector inside the active link used for indicator geometry. */
  @property({ type: String, attribute: 'indicator-target' })
  indicatorTarget = '[data-rc-navigation-indicator], [data-rc-navigation-icon]';

  @state() private _hasCustomToggle = false;

  @state() private _hasHeader = false;

  @state() private _hasFooter = false;

  @query('slot:not([name])') private _$slot!: HTMLSlotElement;

  @query('nav') private _$nav!: HTMLElement;

  @query('#indicator') private _$indicator!: HTMLElement;

  private readonly _indicatorCtrl = new NavigationIndicatorController(this, {
    slot: () => this._$slot ?? null,
    container: () => this._$nav ?? null,
    indicator: () => this._$indicator ?? null,
    activeSelector: () => this.activeSelector,
    indicatorTargetSelector: () => this.indicatorTarget,
  });

  /** Expands the rail and dispatches `rc-navigation-rail-toggle` when it changes. */
  expand(): void {
    this._setExpanded(true, true);
  }

  /** Collapses the rail and dispatches `rc-navigation-rail-toggle` when it changes. */
  collapse(): void {
    this._setExpanded(false, true);
  }

  /** Toggles expanded state and dispatches `rc-navigation-rail-toggle` when it changes. */
  toggleExpanded(): void {
    this._setExpanded(!this.expanded, true);
  }

  protected override firstUpdated(): void {
    this._indicatorCtrl.sync();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (
      changed.has('activeSelector') ||
      changed.has('indicatorTarget') ||
      changed.has('expanded')
    ) {
      this._indicatorCtrl.sync();
    }
  }

  protected override render() {
    const toggleLabel = this.expanded ? this.collapseLabel : this.expandLabel;

    return html`
      <div id="root" part="root">
        <div
          id="toggle-wrap"
          ?hidden=${!this.toggleable && !this._hasCustomToggle}
          @click=${this._handleToggleClick}
        >
          <slot name="toggle" @slotchange=${this._handleToggleSlotChange}></slot>
          ${this.toggleable && !this._hasCustomToggle
            ? html`
                <button
                  id="default-toggle"
                  part="toggle"
                  type="button"
                  aria-label=${toggleLabel}
                  aria-expanded=${this.expanded ? 'true' : 'false'}
                >
                  <span aria-hidden="true">${this.expanded ? '←' : '☰'}</span>
                </button>
              `
            : null}
        </div>
        <div id="header" part="header" ?hidden=${!this._hasHeader}>
          <slot name="header" @slotchange=${this._handleHeaderSlotChange}></slot>
        </div>
        <nav part="nav" aria-label=${this.label}>
          <div id="indicator" part="indicator" hidden></div>
          <slot @slotchange=${this._handleSlotChange}></slot>
        </nav>
        <div id="footer" part="footer" ?hidden=${!this._hasFooter}>
          <slot name="footer" @slotchange=${this._handleFooterSlotChange}></slot>
        </div>
      </div>
    `;
  }

  private _handleSlotChange(): void {
    this._indicatorCtrl.sync();
  }

  private _handleToggleSlotChange(event: Event): void {
    const slot = event.currentTarget as HTMLSlotElement;

    this._hasCustomToggle = slot.assignedElements({ flatten: true }).length > 0;
  }

  private _handleHeaderSlotChange(event: Event): void {
    const slot = event.currentTarget as HTMLSlotElement;

    this._hasHeader = slot.assignedElements({ flatten: true }).length > 0;
  }

  private _handleFooterSlotChange(event: Event): void {
    const slot = event.currentTarget as HTMLSlotElement;

    this._hasFooter = slot.assignedElements({ flatten: true }).length > 0;
  }

  private _handleToggleClick(event: MouseEvent): void {
    const target = event.target as Element | null;

    if (!target?.closest('button, [role="button"], a[href]')) {
      return;
    }

    this.toggleExpanded();
  }

  private _setExpanded(expanded: boolean, notify: boolean): void {
    if (expanded === this.expanded) {
      return;
    }

    const oldValue = this.expanded;

    this._expanded = expanded;
    this._expandedInitialized = true;
    this.requestUpdate('expanded', oldValue);

    if (notify) {
      this.dispatchEvent(
        new CustomEvent<RCNavigationRailToggleDetail>('rc-navigation-rail-toggle', {
          bubbles: true,
          composed: true,
          detail: { expanded },
        }),
      );
    }
  }
}

export default RCNavigationRail;
