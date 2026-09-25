import { LitElement, html, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';

import { ClickDelegateController } from '@rcarls/rc-common';

import listItemStyles from './rc-list-item.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-list-item': RCListItem;
  }
}

/**
 * A list row whose leading, content, and trailing cells participate in the
 * column grid owned by the nearest `rc-list`.
 *
 * `selected` is presentational state. In a selecting `rc-list`, the group
 * mirrors it from a direct native radio or checkbox, which remains the source
 * of truth. Outside a selecting list, authors may control it directly.
 *
 * An `interactive` row forwards a plain click anywhere on its surface (that
 * hasn't already landed on one of its own interactive descendants — see
 * `@rcarls/rc-common`'s `ClickDelegateController`) to whichever of these
 * resolves first:
 *   1. `action-target`, the same same-root id-ref contract `rc-card` uses —
 *      for a row whose primary action is a button/link that isn't itself a
 *      selection control (opens a dialog, navigates, etc).
 *   2. A direct-child native `input[type=checkbox]`/`input[type=radio]` —
 *      the existing selection-row behavior, unchanged.
 * Both exist because a CSS `::after`-overlay ("stretched link") on the
 * slotted control doesn't work here: it would need `[part=content]` as its
 * containing block, but that part's own `overflow: hidden` (required for
 * label truncation) clips the overlay right back down to its own bounds.
 *
 * @slot leading - Optional leading visual or native selection control. Add
 *   `data-rc-list-leading` when a theme should apply its standard leading-icon geometry.
 * @slot - Primary row content. It truncates to one line by default.
 * @slot trailing - Optional trailing metadata or action.
 *
 * @csspart row - Row surface and subgrid.
 * @csspart state-layer - Hover, focus, and pressed state layer.
 * @csspart leading - Leading slot wrapper.
 * @csspart content - Default content slot wrapper.
 * @csspart trailing - Trailing slot wrapper.
 * @csspart divider - Row divider.
 *
 * @attr selected - Presentational selected state. Host writes are silent.
 * @attr disabled - Presentational disabled state. Host writes are silent.
 * @attr interactive - Enables row interaction styling and click delegation.
 * @attr action-target - ID of a same-root anchor or button that receives
 *   forwarded surface clicks.
 * @attr [has-leading] - Reflected when the leading slot has content.
 * @attr [has-trailing] - Reflected when the trailing slot has content.
 * @attr [data-rc-list-position] - Row position assigned by the parent list: from `aria-posinset`
 *   and `aria-setsize` when the row has them (a virtualized slice), otherwise from rendered order.
 *
 * @cssprop [--rc-list-item-min-block-size=3rem] - Minimum rendered row height.
 * @cssprop [--rc-list-item-padding-block=0.5rem] - Row block padding.
 * @cssprop [--rc-list-item-color=CanvasText] - Row foreground color.
 * @cssprop [--rc-list-item-background=transparent] - Row surface color.
 * @cssprop [--rc-list-item-selected-color] - Selected foreground color.
 * @cssprop [--rc-list-item-selected-background=transparent] - Selected surface color.
 * @cssprop [--rc-list-item-border=0] - Row border shorthand.
 * @cssprop [--rc-list-item-border-radius=0] - Row corner radius.
 * @cssprop [--rc-list-item-box-shadow=none] - Row shadow.
 * @cssprop [--rc-list-item-divider=0] - Divider border shorthand.
 * @cssprop [--rc-list-item-divider-inset-inline=0] - Divider inline inset.
 * @cssprop [--rc-list-item-grid-template-rows=auto] - Internal row track definition.
 * @cssprop [--rc-list-item-row-gap=0] - Gap between internal row tracks.
 * @cssprop [--rc-list-item-leading-grid-column=leading-start / leading-end] - Leading region column placement.
 * @cssprop [--rc-list-item-leading-grid-row=auto] - Leading region row placement.
 * @cssprop [--rc-list-item-content-grid-column=content-start / content-end] - Content region column placement.
 * @cssprop [--rc-list-item-content-grid-row=auto] - Content region row placement.
 * @cssprop [--rc-list-item-content-white-space=nowrap] - Content wrapping behavior.
 * @cssprop [--rc-list-item-content-text-overflow=ellipsis] - Content overflow marker.
 * @cssprop [--rc-list-item-trailing-grid-column=trailing-start / trailing-end] - Trailing region column placement.
 * @cssprop [--rc-list-item-trailing-grid-row=auto] - Trailing region row placement.
 * @cssprop [--rc-list-item-trailing-justify-self=end] - Trailing region alignment within its grid area.
 * @cssprop [--rc-list-item-state-layer-color=currentColor] - Interaction state layer color.
 * @cssprop [--rc-list-item-state-layer-opacity=0] - Resting interaction state layer opacity.
 * @cssprop [--rc-list-item-hover-state-layer-opacity=0.08] - Hover state opacity.
 * @cssprop [--rc-list-item-focus-state-layer-opacity=0.1] - Focus state opacity.
 * @cssprop [--rc-list-item-pressed-state-layer-opacity=0.1] - Pressed state opacity.
 * @cssprop [--rc-list-item-disabled-opacity=0.38] - Disabled row opacity.
 * @cssprop [--rc-list-item-transition-duration=0ms] - Row state transition duration.
 * @cssprop [--rc-list-item-transition-easing=ease] - Row state transition easing.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-list rc-list documentation}
 */
export class RCListItem extends LitElement {
  static override styles = listItemStyles;

  private readonly _internals: ElementInternals;

  /** Presentational selected state. Host writes are silent. */
  @property({ type: Boolean, reflect: true })
  selected = false;

  /** Presentational disabled state. Host writes are silent. */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Enables row interaction styling. */
  @property({ type: Boolean, reflect: true })
  interactive = false;

  /**
   * ID of a same-root anchor or button that receives forwarded surface
   * clicks — the same contract as `rc-card`'s `action-target`. Checked
   * before the native radio/checkbox fallback, so a row can combine a
   * selection input with its own `action-target` if it ever needs to
   * (uncommon, but not fought against).
   */
  @property({ type: String, attribute: 'action-target' })
  actionTarget = '';

  constructor() {
    super();
    this._internals = this.attachInternals();
    this._internals.role = 'listitem';

    new ClickDelegateController(this, {
      target: () => this._resolveActionTarget() ?? this._nativeInput(),
      disabled: () => !this.interactive || this.disabled,
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'listitem');
    }
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (!import.meta.env.DEV) {
      return;
    }

    if (!changed.has('interactive') && !changed.has('actionTarget')) {
      return;
    }

    if (this.interactive && !this.actionTarget.trim() && !this._nativeInput()) {
      console.warn(
        `[rc-list-item] interactive is set with no action-target and no direct-child ` +
          `checkbox/radio, so surface clicks have nothing to forward to. Set action-target ` +
          `to a same-root <a> or <button>, or add one of those as a direct child.`,
        this,
      );
    }
  }

  private _hasAssignedElements(event: Event): boolean {
    return (event.currentTarget as HTMLSlotElement)
      .assignedNodes({ flatten: true })
      .some(($node) => {
        return $node.nodeType !== Node.TEXT_NODE || Boolean($node.textContent?.trim());
      });
  }

  private _handleNamedSlotChange(event: Event): void {
    const $slot = event.currentTarget as HTMLSlotElement;

    this.toggleAttribute(`has-${$slot.name}`, this._hasAssignedElements(event));
  }

  private _nativeInput(): HTMLInputElement | null {
    return this.querySelector(':scope > input:is([type="checkbox"], [type="radio"])');
  }

  private _resolveActionTarget(): HTMLAnchorElement | HTMLButtonElement | null {
    const id = this.actionTarget.trim();

    if (!id) {
      return null;
    }

    const $root = this.getRootNode();
    const $target =
      $root instanceof Document || $root instanceof ShadowRoot ? $root.getElementById(id) : null;

    if ($target instanceof HTMLAnchorElement || $target instanceof HTMLButtonElement) {
      return $target;
    }

    if (import.meta.env.DEV) {
      console.warn(
        `[rc-list-item] action-target="${id}" must reference a same-root <a> or <button>.`,
      );
    }

    return null;
  }

  protected override firstUpdated(): void {
    for (const $slot of this.shadowRoot?.querySelectorAll<HTMLSlotElement>('slot[name]') ?? []) {
      this.toggleAttribute(`has-${$slot.name}`, $slot.assignedNodes({ flatten: true }).length > 0);
    }
  }

  protected override render() {
    return html`
      <div part="row">
        <span part="state-layer" aria-hidden="true"></span>
        <span part="leading">
          <slot name="leading" @slotchange=${this._handleNamedSlotChange}></slot>
        </span>
        <span part="content"><slot></slot></span>
        <span part="trailing">
          <slot name="trailing" @slotchange=${this._handleNamedSlotChange}></slot>
        </span>
        <span part="divider" aria-hidden="true"></span>
      </div>
    `;
  }
}
