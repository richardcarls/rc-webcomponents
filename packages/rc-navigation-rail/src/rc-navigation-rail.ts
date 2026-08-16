import { LitElement, html } from 'lit';
import type { PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import { NavigationIndicatorController } from '@rcarls/rc-common';

import navigationRailStyles from './rc-navigation-rail.styles.js';

const LIGHT_DOM_CSS = `
@layer rc-base {
  rc-navigation-rail > a > [data-rc-navigation-icon] {
    align-self: center;
    vertical-align: middle;
  }

  rc-navigation-rail:not([expanded])
    > a
    > [data-rc-navigation-label] {
    max-inline-size: var(--rc-navigation-rail-collapsed-label-inline-size, 4rem);
    font-size: smaller;
    line-height: 1.2;
    text-align: center;
    overflow-wrap: anywhere;
  }

  rc-navigation-rail > a > [data-rc-navigation-indicator] {
    position: relative;
    display: inline-grid;
    place-items: center;
    max-inline-size: 100%;
    vertical-align: middle;
  }

  rc-navigation-rail > a > [data-rc-navigation-indicator] > [data-rc-navigation-icon] {
    flex: none;
    vertical-align: middle;
  }

  rc-navigation-rail > a > [data-rc-navigation-indicator] > :not([data-rc-navigation-icon]) {
    position: absolute;
    inset-block-start: calc(100% + var(--rc-navigation-rail-link-gap, 0.25rem));
    inset-inline-start: 50%;
    inline-size: max-content;
    max-inline-size: var(--rc-navigation-rail-collapsed-label-inline-size, 4rem);
    font-size: smaller;
    line-height: 1.2;
    text-align: center;
    overflow-wrap: anywhere;
    translate: -50% 0;
  }

  rc-navigation-rail[expanded] > a > [data-rc-navigation-indicator] {
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--rc-navigation-rail-link-gap, 0.25rem);
  }

  rc-navigation-rail[expanded]
    > a
    > [data-rc-navigation-indicator]
    > :not([data-rc-navigation-icon]) {
    position: static;
    inline-size: auto;
    max-inline-size: none;
    font-size: inherit;
    line-height: inherit;
    text-align: start;
    overflow-wrap: normal;
    translate: none;
  }

  rc-navigation-rail
    :is([data-rc-navigation-expand-icon], [data-rc-navigation-collapse-icon])[hidden] {
    display: none !important;
  }
}
`;

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
 * @slot toggle - Native `<button>` or `rc-button` expand/collapse control.
 *
 * @fires rc-navigation-rail-toggle - Fired when user interaction or a method toggles expanded state.
 *
 * @csspart root - The rail layout container.
 * @csspart nav - The component-owned navigation landmark.
 * @csspart indicator - The active item indicator.
 * @csspart toggle - Toggle slot container.
 * @csspart header - Header slot container.
 * @csspart footer - Footer slot container.
 *
 * @attr label - Accessible label for the navigation landmark.
 * @attr expanded - Whether the rail is expanded. Host writes are silent.
 * @attr default-expanded - Initial expanded state for uncontrolled usage.
 * @attr active-selector - Selector used to find the active link.
 * @attr indicator-target - Selector inside the active link used for indicator geometry.
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
 * @cssprop [--rc-navigation-rail-collapsed-label-inline-size=4rem] - Collapsed label maximum inline size.
 * @cssprop [--rc-navigation-rail-item-color=inherit] - Resting item text color.
 * @cssprop [--rc-navigation-rail-item-text-decoration] - Slotted link text decoration (defers to
 *   native anchor text-decoration when unset).
 * @cssprop [--rc-navigation-rail-active-color] - Active item text color. Falls back to
 *   `--rc-navigation-rail-item-color`, then `inherit`.
 * @cssprop [--rc-navigation-rail-indicator-bg=transparent] - Active indicator background.
 * @cssprop [--rc-navigation-rail-indicator-border=1px solid Highlight] - Active indicator border.
 * @cssprop [--rc-navigation-rail-indicator-radius=0] - Active indicator corner radius.
 * @cssprop [--rc-navigation-rail-toggle-size=3rem] - Toggle region minimum block size.
 * @cssprop [--rc-navigation-rail-toggle-inline-offset=0.5rem] - Toggle control inline-start offset.
 * @cssprop [--rc-navigation-rail-duration=200ms] - Rail expand/collapse transition duration.
 * @cssprop [--rc-navigation-rail-easing=ease] - Rail expand/collapse transition easing.
 * @cssprop [--rc-navigation-rail-indicator-duration=0ms] - Active indicator transition duration.
 * @cssprop [--rc-navigation-rail-indicator-easing=ease] - Active indicator transition easing.
 * @cssprop [--rc-navigation-rail-focus-ring] - Slotted link focus outline (defers to native
 *   outline when unset).
 * @cssprop [--rc-navigation-rail-focus-ring-offset=2px] - Slotted link outline offset.
 */
export class RCNavigationRail extends LitElement {
  static override styles = [navigationRailStyles];

  private static readonly _styledRoots = new Set<Document | ShadowRoot>();

  private static _ensureBaseStyles(root: Document | ShadowRoot): void {
    if (RCNavigationRail._styledRoots.has(root)) {
      return;
    }

    RCNavigationRail._styledRoots.add(root);

    const $style = document.createElement('style');

    $style.setAttribute('data-rc-light-dom-base', 'rc-navigation-rail');
    $style.textContent = LIGHT_DOM_CSS;

    if (root instanceof Document) {
      root.head.append($style);
    } else {
      root.append($style);
    }
  }

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

  /** Selector used to find the active link. Defaults to `aria-current`. */
  @property({ type: String, attribute: 'active-selector' })
  activeSelector = 'a[aria-current]:not([aria-current="false"])';

  /** Selector inside the active link used for indicator geometry. */
  @property({ type: String, attribute: 'indicator-target' })
  indicatorTarget = '[data-rc-navigation-indicator], [data-rc-navigation-icon]';

  @state() private _hasToggle = false;

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

  override connectedCallback(): void {
    super.connectedCallback();
    RCNavigationRail._ensureBaseStyles(this.getRootNode() as Document | ShadowRoot);
  }

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

    if (changed.has('expanded')) {
      this._syncToggleButton();
    }
  }

  protected override render() {
    return html`
      <div id="root" part="root">
        <div
          id="toggle-wrap"
          part="toggle"
          ?hidden=${!this._hasToggle}
          @click=${this._handleToggleClick}
        >
          <slot name="toggle" @slotchange=${this._handleToggleSlotChange}></slot>
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
    const $slot = event.currentTarget as HTMLSlotElement;

    this._hasToggle = $slot.assignedElements({ flatten: true }).length > 0;
    this._syncToggleButton();
  }

  private _handleHeaderSlotChange(event: Event): void {
    const $slot = event.currentTarget as HTMLSlotElement;

    this._hasHeader = $slot.assignedElements({ flatten: true }).length > 0;
  }

  private _handleFooterSlotChange(event: Event): void {
    const $slot = event.currentTarget as HTMLSlotElement;

    this._hasFooter = $slot.assignedElements({ flatten: true }).length > 0;
  }

  private _handleToggleClick(event: MouseEvent): void {
    const $target = event.target as Element | null;

    if (!$target?.closest('button')) {
      return;
    }

    this.toggleExpanded();
  }

  private _getToggleButton(): HTMLButtonElement | null {
    const $toggle = this.querySelector<HTMLElement>(':scope > [slot="toggle"]');

    if ($toggle instanceof HTMLButtonElement) {
      return $toggle;
    }

    return $toggle?.querySelector(':scope > button') ?? null;
  }

  private _syncToggleButton(): void {
    const $toggle = this.querySelector<HTMLElement>(':scope > [slot="toggle"]');
    const $button = this._getToggleButton();

    if ($toggle?.localName === 'rc-button') {
      $toggle.toggleAttribute('selected', this.expanded);
    }

    $button?.setAttribute('aria-expanded', String(this.expanded));

    $button
      ?.querySelectorAll<HTMLElement>('[data-rc-navigation-expand-icon]')
      .forEach(($icon) => ($icon.hidden = this.expanded));

    $button
      ?.querySelectorAll<HTMLElement>('[data-rc-navigation-collapse-icon]')
      .forEach(($icon) => ($icon.hidden = !this.expanded));
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
