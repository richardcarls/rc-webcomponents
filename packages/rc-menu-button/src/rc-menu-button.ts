import { LitElement, html } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import {
  AnchorController,
  keyInteraction,
  keyNavigation,
  layoutOrientation,
  resolveFlow,
  type AnchorPlacement,
  type KeyboardNavigationAction,
} from '@rcarls/rc-common';
import type { RCMenu } from '@rcarls/rc-menu';

import menuButtonStyles from './rc-menu-button.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-menu-button': RCMenuButton;
  }
}

const LIGHT_DOM_CSS = `
@layer rc-base {
  /*
   * Expands an icon-only trigger's clickable region beyond its visible box
   * up to the accessible touch-target minimum, the same way rc-button and
   * rc-chip do: an absolutely-positioned, invisible pseudo-element on the
   * actual slotted trigger element (not the host) extends the hit area
   * symmetrically. The trigger already has position: relative from the
   * shadow-scoped ::slotted(button) rule. max(100%, size) keeps this a
   * no-op once the visible trigger already meets or exceeds the touch
   * target, rather than shrinking it.
   */
  rc-menu-button[icon-only] > [slot='trigger']::before {
    content: '';
    position: absolute;
    inset-block: calc(
      (
          var(--rc-menu-button-touch-target-block-size, 3rem) -
            max(100%, var(--rc-menu-button-trigger-block-size, 0px))
        ) / -2
    );
    inset-inline: calc(
      (
          var(
              --rc-menu-button-touch-target-inline-size,
              var(--rc-menu-button-touch-target-block-size, 3rem)
            ) -
            max(100%, var(--rc-menu-button-icon-size, var(--rc-menu-button-trigger-block-size, 0px)))
        ) / -2
    );
  }
}
`;

/** Detail payload for the `rc-menu-button-toggle` event. */
export interface RCMenuButtonToggleEvent {
  /** Whether the menu transitioned to open (`true`) or closed (`false`). */
  open: boolean;
}

/**
 * Trigger button that opens an rc-menu popup, following the WAI-ARIA Menu Button pattern.
 *
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-menu-button rc-menu-button docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/ WAI-ARIA Menu Button pattern}
 *
 * @slot trigger - The button element that triggers the menu
 * @slot indicator - Optional decorative indicator rendered at the trigger's inline end
 * @slot default - The rc-menu element to display as popup
 *
 * @fires rc-menu-button-toggle - Fired when the menu opens or closes
 *
 * @cssprop [--rc-menu-button-trigger-block-size=var(--rc-control-block-size)] - Minimum block size of the trigger
 * @cssprop [--rc-menu-button-trigger-padding-block=var(--rc-control-padding-block)] - Trigger block-axis padding
 * @cssprop [--rc-menu-button-trigger-padding-inline=var(--rc-control-padding-inline)] - Trigger inline-axis padding
 * @cssprop [--rc-menu-button-trigger-gap=var(--rc-item-gap)] - Gap between flex children in the trigger
 * @cssprop [--rc-menu-button-trigger-border=var(--rc-border)] - Trigger border
 * @cssprop [--rc-menu-button-trigger-radius=var(--rc-control-radius)] - Trigger border radius
 * @cssprop [--rc-menu-button-trigger-background=var(--rc-button-bg)] - Trigger background
 * @cssprop [--rc-menu-button-trigger-color=var(--rc-button-text)] - Trigger text color
 * @cssprop [--rc-menu-button-trigger-transition] - CSS transition applied to the trigger
 * @cssprop [--rc-menu-button-trigger-hover-background=color-mix(in srgb, Highlight 8%, transparent)] - Trigger hover background
 * @cssprop [--rc-menu-button-trigger-hover-color=inherit] - Trigger hover text color
 * @cssprop [--rc-menu-button-trigger-hover-border-color=currentColor] - Trigger hover border color
 * @cssprop [--rc-menu-button-trigger-open-background=color-mix(in srgb, Highlight 12%, transparent)] - Trigger background when the menu is open
 * @cssprop [--rc-menu-button-trigger-open-color=inherit] - Trigger text color when the menu is open
 * @cssprop [--rc-menu-button-trigger-open-border-color=currentColor] - Trigger border color when the menu is open
 * @cssprop [--rc-menu-button-indicator-size=1em] - Inline and block size of the slotted indicator
 * @cssprop [--rc-menu-button-indicator-color=currentColor] - Color of the slotted indicator
 * @cssprop [--rc-menu-button-indicator-inset=var(--rc-menu-button-trigger-padding-inline)] - Indicator distance from the trigger's inline end
 * @cssprop [--rc-menu-button-icon-size] - Inline size of an `icon-only` trigger's visible box.
 *   Square by default (equal to `--rc-menu-button-trigger-block-size`); set narrower or wider
 *   to change only the trigger's width, independent of its height.
 * @cssprop [--rc-menu-button-touch-target-block-size=3rem] - Minimum accessible touch target
 *   block size for an `icon-only` trigger. A floor, not a fixed size: has no effect once
 *   `--rc-menu-button-trigger-block-size` already meets or exceeds it. Grows the shadow-DOM
 *   trigger wrapper (reserving layout space) and the light-DOM hit-slop (the actual larger
 *   clickable region) together; the visible trigger itself stays at its own size, centered.
 * @cssprop [--rc-menu-button-touch-target-inline-size] - Minimum accessible touch target inline
 *   size for an `icon-only` trigger. Defers to `--rc-menu-button-touch-target-block-size` when
 *   unset.
 * @cssprop [--rc-menu-button-touch-target-overlap-inline-start=0px] - Zero by default. A theme
 *   or consumer sets this on an `icon-only` trigger that sits at a real leading edge (no
 *   neighbor on that side) to let its touch-target inflation overlap into whatever sits just
 *   outside the host, such as a container's own edge padding, instead of also reserving layout
 *   space there.
 * @cssprop [--rc-menu-button-touch-target-overlap-inline-end=0px] - The trailing-edge
 *   counterpart to `--rc-menu-button-touch-target-overlap-inline-start`.
 * @cssprop [--rc-menu-button-popup-duration=150ms] - Popup open/close fade transition duration.
 *
 * @csspart root - The root container element
 * @csspart popup - The popup container element
 *
 * @attr open - Whether the menu popup is visible. Controlled mode: host writes silently.
 * @attr default-open - Initial open state for uncontrolled mode. Ignored after the first
 *   controlled write to `open`.
 * @attr orientation - The layout the trigger sits in: `horizontal` along the inline axis,
 *   like a menubar row, or `vertical` along the block axis. It picks the arrow key that opens
 *   the menu, following how that layout renders, so the keys turn with RTL and vertical text.
 *   Inherits from a parent `rc-menubar` or `[role="menubar"]` when unset.
 * @attr placement - Preferred placement of the popup relative to the trigger: `top` or `bottom`,
 *   or `inline-start`/`inline-end` to open beside it toward the reading direction, each with an
 *   optional `-start`/`-end` edge alignment that follows the reading direction too. Physical
 *   `left*`/`right*` values still work but are deprecated.
 * @attr icon-only - Hints that the slotted trigger has no visible label, so themes can size
 *   it and its touch target as an icon button (see `--rc-menu-button-icon-size` and
 *   `--rc-menu-button-touch-target-*` above). Purely a styling hook; RCMenuButton does not read
 *   or derive it — set it whenever the trigger is rendered icon-only.
 */
export class RCMenuButton extends LitElement {
  static styles = [menuButtonStyles];

  /**
   * Enables delegatesFocus so the browser routes focus() on the host element
   * to the slotted trigger button.
   */
  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,

    delegatesFocus: true,
  };

  protected static readonly _styledRoots = new Set<Document | ShadowRoot>();

  protected static _ensureBaseStyles(root: Document | ShadowRoot): void {
    if (RCMenuButton._styledRoots.has(root)) {
      return;
    }

    RCMenuButton._styledRoots.add(root);

    const style = document.createElement('style');

    style.setAttribute('data-rc-light-dom-base', 'rc-menu-button');
    style.textContent = LIGHT_DOM_CSS;

    if (root instanceof Document) {
      root.head.append(style);
    } else {
      root.append(style);
    }
  }

  private _defaultOpen = false;
  private _open: boolean | undefined;
  private _uncontrolledOpen: boolean | undefined;
  private _openInitialized = false;

  /**
   * Whether the menu is currently open.
   *
   * In controlled mode the host owns this value; writing the property applies
   * the state silently without dispatching `rc-menu-button-toggle`.
   */
  @property({ type: Boolean, reflect: true })
  get open(): boolean {
    return this._open ?? this._uncontrolledOpen ?? this._defaultOpen;
  }

  /** Applies open state in controlled mode without dispatching an event. */
  set open(value: boolean | undefined) {
    const oldValue = this.open;

    this._open = value;
    this._openInitialized = true;
    this.requestUpdate('open', oldValue);
    this._syncTriggerAria();
  }

  /**
   * Initial open state for uncontrolled mode.
   *
   * Ignored after the first controlled write; use `open` to update state
   * programmatically after mount.
   */
  @property({ type: Boolean, attribute: 'default-open' })
  get defaultOpen(): boolean {
    return this._defaultOpen;
  }

  /** Applies the uncontrolled default before any controlled write occurs. */
  set defaultOpen(value: boolean) {
    const oldValue = this._defaultOpen;

    this._defaultOpen = value;

    if (
      !this._openInitialized &&
      this._open === undefined &&
      this._uncontrolledOpen === undefined
    ) {
      this.requestUpdate('open', oldValue);
    }

    this.requestUpdate('defaultOpen', oldValue);
  }

  /**
   * The layout this menu button sits in, which picks the arrow keys that open
   * and close the menu. `horizontal` runs along the inline axis and `vertical`
   * along the block axis; the keys follow how that layout renders.
   *
   * If not set, inherits from a parent rc-menubar or element with role="menubar".
   */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' | undefined;

  /** Preferred placement of the popup relative to the trigger button. */
  @property({ reflect: true })
  placement: AnchorPlacement = 'bottom-start';

  /**
   * Popup placement adjusted for orientation.
   *
   * Switches from `bottom-start` to `inline-end-start` when the resolved
   * orientation is `vertical`, so vertical menubars open submenus to the side,
   * toward the inline end.
   */
  protected get _effectivePlacement(): AnchorPlacement {
    if (this.placement !== 'bottom-start') {
      return this.placement;
    }

    // Opens toward the inline end, which is the left in RTL.
    return this._resolvedOrientation === 'vertical' ? 'inline-end-start' : this.placement;
  }

  /**
   * Resolved orientation, considering inheritance from parent menubar.
   * Falls back to 'horizontal' if no orientation is set or inherited.
   */
  protected get _resolvedOrientation(): 'horizontal' | 'vertical' {
    if (this.orientation) {
      return this.orientation;
    }

    const $menubar = this.closest('rc-menubar, [role="menubar"]');

    if ($menubar) {
      const orientation = $menubar.getAttribute('orientation');

      if (orientation === 'vertical' || orientation === 'horizontal') {
        return orientation;
      }

      // Without a layout attribute, only aria-orientation is left, and it
      // reports how the menubar renders; in vertical text that is the other
      // orientation from its layout.
      const rendered = $menubar.getAttribute('aria-orientation');

      if (rendered === 'vertical' || rendered === 'horizontal') {
        return layoutOrientation(rendered, resolveFlow($menubar));
      }
    }

    return 'horizontal';
  }

  /** Shadow DOM root container. Serves as the anchor element for `_anchorCtrl`. */
  @query('#root') protected _$root!: HTMLElement;

  /** Shadow DOM popup container. Hidden when `open` is `false`. */
  @query('#popup') protected _$popup!: HTMLElement;

  /** Weak reference to the slotted trigger button. */
  @state()
  protected _$trigger: WeakRef<HTMLElement> | undefined;

  /** Weak reference to the slotted `rc-menu` element. */
  @state()
  protected _$menu: WeakRef<RCMenu> | undefined;

  /** Positions the popup relative to the trigger using CSS anchor positioning. */
  protected _anchorCtrl = new AnchorController(this, {
    anchor: () => this._$root ?? null,
    floating: () => this._$popup ?? null,
    shadowHost: () => this,
    placement: 'bottom-start',
    offset: 2,
  });

  /** Bound handler for document click (light dismiss). Stored for `removeEventListener` pairing. */
  protected _boundHandleDocumentClick = this._handleDocumentClick.bind(this);

  /**
   * Watches the host's own `tabindex` attribute so the trigger button's
   * tabindex can be kept in sync.
   *
   * When a parent (e.g. rc-toolbar) places the
   * host under roving-tabindex management it sets/removes tabindex on the
   * host; we mirror that to the trigger so it doesn't become an independent
   * tab stop. When the host has no tabindex the trigger keeps its natural
   * tabindex=0 for standalone usage.
   */
  protected _tabObserver?: MutationObserver;

  /** Installs the tabindex mutation observer and the document-level click listener. */
  override connectedCallback() {
    super.connectedCallback();
    RCMenuButton._ensureBaseStyles(this.getRootNode() as Document | ShadowRoot);

    this._tabObserver = new MutationObserver(() => this._syncTriggerTabindex());
    this._tabObserver.observe(this, { attributes: true, attributeFilter: ['tabindex'] });

    document.addEventListener('click', this._boundHandleDocumentClick, true);

    this.requestUpdate('open');
  }

  /** Disconnects the tabindex observer and removes the document-level click listener. */
  override disconnectedCallback() {
    this._tabObserver?.disconnect();
    this._tabObserver = undefined;

    super.disconnectedCallback();
    document.removeEventListener('click', this._boundHandleDocumentClick, true);
  }

  /**
   * Opens the menu and moves focus into it.
   *
   * @param focusTarget - which item receives initial focus when the menu opens
   */
  openMenu(focusTarget: 'first' | 'last' = 'first') {
    if (this.open) {
      return;
    }

    this._anchorCtrl.setOptions({ placement: this._effectivePlacement });
    this._setOpen(true, true);

    this.updateComplete.then(() => {
      if (!this.open) {
        return;
      }

      const $menu = this._$menu?.deref();

      focusTarget === 'last' ? $menu?.focusLast() : $menu?.focusFirst();
    });
  }

  /**
   * Closes the menu.
   *
   * @param returnFocus - when `true`, returns focus to the trigger button after closing
   */
  closeMenu(returnFocus = true) {
    if (!this.open) {
      return;
    }

    this._setOpen(false, true);

    if (returnFocus && !this.open) {
      const $trigger = this._$trigger?.deref();

      $trigger?.focus();
    }
  }

  /** Toggles the menu between open and closed. */
  toggleMenu() {
    if (this.open) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  /** Dispatches the `rc-menu-button-toggle` bubbling composed event with the requested open state. */
  protected _dispatchToggle(open = this.open) {
    this.dispatchEvent(
      new CustomEvent<RCMenuButtonToggleEvent>('rc-menu-button-toggle', {
        bubbles: true,
        composed: true,
        detail: { open },
      }),
    );
  }

  /** Caches a weak reference to the first assigned trigger element and syncs its ARIA and tabindex state. */
  protected _handleTriggerSlotChange(e: Event) {
    const $slot = e.currentTarget as HTMLSlotElement;
    const $trigger = $slot.assignedElements()[0] as HTMLElement | undefined;

    if ($trigger) {
      this._$trigger = new WeakRef($trigger);
      this._syncTriggerAria();
      this._syncTriggerTabindex();
    }
  }

  /** Tracks optional indicator content so the trigger reserves its inline-end space. */
  protected _handleIndicatorSlotChange(e: Event) {
    const $slot = e.currentTarget as HTMLSlotElement;

    this.toggleAttribute('has-indicator', $slot.assignedElements().length > 0);
  }

  /**
   * Mirrors the host's `tabindex` attribute to the trigger button.
   *
   * When a roving-tabindex parent (e.g. rc-toolbar) marks this host inactive
   * with `tabindex="-1"`, the trigger must also be suppressed so it does not
   * become an independent tab stop. When the host is the active item
   * (`tabindex="0"`) or standalone (no tabindex), the trigger retains its
   * natural focusability so that Chrome's delegatesFocus can route sequential
   * Tab navigation through the host to the trigger.
   */
  protected _syncTriggerTabindex() {
    const $trigger = this._$trigger?.deref();

    if (!$trigger) {
      return;
    }

    if (this.getAttribute('tabindex') === '-1') {
      $trigger.setAttribute('tabindex', '-1');
    } else {
      $trigger.removeAttribute('tabindex');
    }
  }

  /**
   * Overrides the default focus() so that programmatic focus calls (e.g. from
   * a roving-tabindex parent navigating back to this element via arrow keys)
   * always reach the trigger.
   *
   * Chrome's delegatesFocus will not delegate to a tabindex="-1" element, so
   * when the toolbar marks this host inactive it suppresses the trigger — and
   * the next focusItem() call silently fails. Lifting the suppression here and
   * directly calling trigger.focus() bypasses that restriction.
   */
  override focus(options?: FocusOptions) {
    const $trigger = this._$trigger?.deref();

    if (!$trigger) {
      super.focus(options);

      return;
    }

    $trigger.removeAttribute('tabindex');
    $trigger.focus(options);
  }

  /** Caches a weak reference to the first assigned `rc-menu` element. */
  protected _handleMenuSlotChange(e: Event) {
    const $slot = e.currentTarget as HTMLSlotElement;
    const $elements = $slot.assignedElements();
    const $menu = $elements.find(($el) => $el.tagName === 'RC-MENU') as RCMenu | undefined;

    if ($menu) {
      this._$menu = new WeakRef($menu);
    }
  }

  /**
   * Keyboard navigation handler.
   *
   * Opens or closes the menu in response to arrow/Enter/Escape keys.
   **/
  protected _onNavigate = (action: KeyboardNavigationAction) => {
    switch (action) {
      case 'open-to-first':
      case 'activate':
        this.openMenu();
        break;

      case 'open-to-last':
        this.openMenu('last');
        break;

      case 'escape':
        this.closeMenu();
        break;
    }
  };

  /** Prevents the default button action and delegates to `toggleMenu`. */
  protected _handleTriggerClick(e: MouseEvent) {
    e.preventDefault();

    this.toggleMenu();
  }

  /** Closes the menu when an `rc-menu-close` event bubbles up from the popup. */
  protected _handleMenuClose() {
    this.closeMenu();
  }

  /** Closes the menu when an `rc-menu-activate` event bubbles up from the popup. */
  protected _handleMenuActivate() {
    this.closeMenu();
  }

  /** Closes the menu on clicks outside this component (light dismiss). */
  protected _handleDocumentClick(e: MouseEvent) {
    if (!this.open) {
      return;
    }

    const path = e.composedPath();

    if (path.includes(this)) {
      return;
    }

    this.closeMenu(false);
  }

  /** Syncs trigger ARIA when `open` changes; updates anchor placement when `placement` or `orientation` change. */
  protected override updated(changedProperties: Map<PropertyKey, unknown>) {
    super.updated(changedProperties);

    if (changedProperties.has('open')) {
      this._syncTriggerAria();

      // A pending update can flush after the host (and its shadow tree) has
      // already been disconnected — e.g. a framework unmounting this element
      // in the same tick as an `open` change. togglePopover() throws
      // InvalidStateError on a disconnected popover, so guard on connectivity
      // rather than letting that reach the caller.
      if (this._$popup?.isConnected) {
        this._$popup.togglePopover(this.open);

        if (this.open) {
          this._anchorCtrl.update();
        }
      }
    }

    if (changedProperties.has('placement') || changedProperties.has('orientation')) {
      this._anchorCtrl.setOptions({ placement: this._effectivePlacement });
    }
  }

  protected _setOpen(open: boolean, dispatch: boolean): void {
    const oldValue = this.open;

    if (oldValue === open) {
      return;
    }

    if (this._open === undefined) {
      this._uncontrolledOpen = open;
    }

    this.requestUpdate('open', oldValue);
    this._syncTriggerAria();

    if (dispatch) {
      this._dispatchToggle(open);
    }
  }

  /** Writes `aria-haspopup` and `aria-expanded` to the trigger button to match the current open state. */
  protected _syncTriggerAria(): void {
    const $trigger = this._$trigger?.deref();

    if (!$trigger?.isConnected) {
      return;
    }

    $trigger.setAttribute('aria-haspopup', 'menu');
    $trigger.setAttribute('aria-expanded', String(this.open));
  }

  protected override render() {
    return html`
      <div id="root" part="root">
        <div
          id="trigger-wrap"
          ${keyNavigation(this._onNavigate, {
            navigationAxis: this._resolvedOrientation,
            handleNavAxis: false,
            handleOpenAxis: true,
            handleActivate: true,
            handleEscape: this.open,
          })}
          ${keyInteraction()}
          @click=${this._handleTriggerClick}
        >
          <slot name="trigger" @slotchange=${this._handleTriggerSlotChange}></slot>
          <slot
            name="indicator"
            aria-hidden="true"
            @slotchange=${this._handleIndicatorSlotChange}
          ></slot>
        </div>

        <div
          id="popup"
          part="popup"
          popover="manual"
          @rc-menu-close=${this._handleMenuClose}
          @rc-menu-activate=${this._handleMenuActivate}
        >
          <slot @slotchange=${this._handleMenuSlotChange}></slot>
        </div>
      </div>
    `;
  }
}

export default RCMenuButton;
