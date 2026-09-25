import { LitElement, html } from 'lit';
import { property, query } from 'lit/decorators.js';

import {
  AnchorController,
  FlowController,
  isFocusable,
  keyNavigation,
  type KeyboardNavigationAction,
  renderedOrientation,
} from '@rcarls/rc-common';

import adaptiveMenuStyles from './rc-adaptive-menu.styles.js';

/** Detail payload for the `rc-adaptive-menu-toggle` event. */
export interface RCAdaptiveMenuToggleEvent {
  /** The open state requested by the user. */
  open: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-adaptive-menu': RCAdaptiveMenu;
  }

  interface HTMLElementEventMap {
    'rc-adaptive-menu-toggle': CustomEvent<RCAdaptiveMenuToggleEvent>;
  }
}

type AuthoredState = {
  slot: string;
  focusTarget: HTMLElement;
  orientation: string | null;
  role: string | null;
  tabindex: string | null;
  forcedOverflow: boolean;
};

const ACTION_WRAPPERS = 'rc-button, rc-chip, rc-menu-button';

const LIGHT_DOM_CSS = `
@layer rc-base {
  rc-adaptive-menu > [data-rc-action-promoted],
  rc-adaptive-menu > [data-rc-action-overflowed] {
    box-sizing: border-box;
    min-inline-size: 0;
  }

  rc-adaptive-menu > [data-rc-action-overflowed] {
    display: flex;
    inline-size: 100%;
  }

  rc-adaptive-menu > [data-rc-action-overflowed] > :is(button, a[href]),
  rc-adaptive-menu > :is(button, a[href])[data-rc-action-overflowed] {
    display: flex;
    align-items: center;
    gap: var(--rc-adaptive-menu-item-gap, var(--rc-item-gap, 0.5em));
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: var(--rc-adaptive-menu-item-min-block-size, 2.5em);
    padding: var(--rc-adaptive-menu-item-padding-block, var(--rc-item-padding-block, 0.3em))
      var(--rc-adaptive-menu-item-padding-inline, var(--rc-item-padding-inline, 0.75em));
    border: none;
    border-radius: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    text-decoration: none;
  }

  rc-adaptive-menu [data-rc-menu-leading],
  rc-adaptive-menu [data-rc-menu-trailing] {
    flex: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  rc-adaptive-menu [data-rc-menu-label] {
    flex: 1 1 auto;
    min-inline-size: 0;
  }

  rc-adaptive-menu [data-rc-menu-trailing],
  rc-adaptive-menu [data-rc-menu-shortcut],
  rc-adaptive-menu [data-menu-shortcut] {
    margin-inline-start: auto;
  }
}
`;

/**
 * Priority-aware action toolbar that preserves authored light-DOM controls while moving
 * lower-priority actions into an overflow menu.
 *
 * Actions remain the same connected nodes in the same parent. The component
 * changes only their slot assignment and component-owned ARIA/focus state, so
 * framework listeners, native form behavior, dialog invokers, and references
 * continue to work after an action moves.
 *
 * Direct native buttons and links are supported. `rc-button`, `rc-chip`, and
 * `rc-menu-button` wrappers participate through their direct native trigger.
 * DOM order is the default priority; a numeric `data-priority` promotes larger
 * values first. Authoring `slot="overflow"` keeps an action overflow-only. A
 * negative `data-priority` has the same effect: the action always overflows,
 * regardless of `max-shown`. The overflow menu itself renders in authored DOM
 * order (native slot distribution, not JS-ordered), so author negative-priority
 * actions after normal-priority ones to have them appear last.
 *
 * This is a purely declarative computation from authored state (`max-shown`,
 * `data-priority`, and authored `slot`) re-evaluated whenever that authored
 * state changes. The component performs no runtime size measurement: it does
 * not observe its own or its children's rendered size, and `max-shown`
 * actions are promoted regardless of whether they visually fit the available
 * space. A consumer that needs the promoted count to react to available
 * space — a responsive breakpoint, a container query, a window size class —
 * owns that decision itself and writes the resulting `max-shown` value down.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-adaptive-menu rc-adaptive-menu docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/ WAI-ARIA Toolbar pattern}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/ WAI-ARIA Menu Button pattern}
 *
 * @slot default - Direct native actions or supported rc action wrappers.
 * @slot overflow - Overflow-only actions and actions re-slotted by the component.
 * @slot overflow-icon - Optional decorative icon for the overflow trigger.
 *
 * @fires rc-adaptive-menu-toggle - Fired when user interaction requests a change to `open`.
 *
 * @attr label - Accessible label for the toolbar. Defaults to `Actions`.
 * @attr max-shown - Maximum number of authored actions promoted ahead of the overflow trigger.
 *   A static declarative cap, not a measurement of available space — actions beyond it move to
 *   the overflow menu regardless of whether they'd visually fit. Defaults to 3.
 * @attr open - Whether the overflow menu is visible. Host writes are silent.
 * @attr default-open - Initial open state for uncontrolled usage.
 * @attr orientation - Toolbar layout along the inline (`horizontal`) or block (`vertical`) axis.
 *   `aria-orientation` and the arrow keys follow the orientation actually rendered, which turns
 *   over in vertical writing modes.
 * @attr overflow-label - Accessible label for the overflow trigger and popup. Defaults to `More actions`.
 *
 * @csspart root - Toolbar container.
 * @csspart overflow-trigger - Button that opens the overflow menu.
 * @csspart popup - Overflow menu popover.
 *
 * @cssprop [--rc-adaptive-menu-gap=var(--rc-control-gap)] - Gap between promoted actions and the overflow trigger.
 * @cssprop [--rc-adaptive-menu-trigger-inline-size=2.5em] - Overflow trigger minimum inline size.
 * @cssprop [--rc-adaptive-menu-trigger-block-size=2.5em] - Overflow trigger minimum block size.
 * @cssprop [--rc-adaptive-menu-touch-target-inline-size] - Minimum overflow trigger activation-area inline size. Defers to `--rc-adaptive-menu-touch-target-block-size` when unset.
 * @cssprop [--rc-adaptive-menu-touch-target-block-size=3rem] - Minimum overflow trigger activation-area block size.
 * @cssprop [--rc-adaptive-menu-touch-target-overlap-inline-start=0px] - Zero by default. A theme
 *   or consumer sets this when the overflow trigger sits at a real leading edge (no neighbor on
 *   that side) to let its touch-target inflation overlap into whatever sits just outside the
 *   host, such as a container's own edge padding, instead of also reserving layout space there.
 * @cssprop [--rc-adaptive-menu-touch-target-overlap-inline-end=0px] - The trailing-edge
 *   counterpart to `--rc-adaptive-menu-touch-target-overlap-inline-start` — the overflow trigger
 *   is conventionally the trailing-most control in a toolbar, so this is the one commonly set.
 * @cssprop [--rc-adaptive-menu-trigger-padding=0.5em] - Overflow trigger padding.
 * @cssprop [--rc-adaptive-menu-trigger-border=1px solid ButtonBorder] - Overflow trigger border.
 * @cssprop [--rc-adaptive-menu-trigger-radius=var(--rc-control-radius)] - Overflow trigger radius.
 * @cssprop [--rc-adaptive-menu-trigger-background=ButtonFace] - Overflow trigger background.
 * @cssprop [--rc-adaptive-menu-trigger-color=ButtonText] - Overflow trigger color.
 * @cssprop [--rc-adaptive-menu-icon-size=1.5em] - Default overflow icon size.
 * @cssprop [--rc-adaptive-menu-popup-min-inline-size=10em] - Overflow popup minimum inline size.
 * @cssprop [--rc-adaptive-menu-popup-max-inline-size=calc(100dvi - 0.5rem)] - Overflow popup viewport-aware inline limit.
 * @cssprop [--rc-adaptive-menu-popup-max-block-size=calc(100dvb - 0.5rem)] - Overflow popup viewport-aware block limit.
 * @cssprop [--rc-adaptive-menu-popup-padding-block=0.25em] - Overflow popup block padding.
 * @cssprop [--rc-adaptive-menu-popup-border=var(--rc-border)] - Overflow popup border.
 * @cssprop [--rc-adaptive-menu-popup-radius=var(--rc-control-radius)] - Overflow popup radius.
 * @cssprop [--rc-adaptive-menu-popup-background=var(--rc-surface)] - Overflow popup background.
 * @cssprop [--rc-adaptive-menu-popup-shadow=var(--rc-shadow)] - Overflow popup shadow.
 * @cssprop [--rc-adaptive-menu-popup-color=var(--rc-field-text)] - Overflow popup foreground.
 * @cssprop [--rc-adaptive-menu-item-min-block-size=2.5em] - Overflow action minimum block size.
 * @cssprop [--rc-adaptive-menu-item-padding-block=var(--rc-item-padding-block)] - Overflow action block padding.
 * @cssprop [--rc-adaptive-menu-item-padding-inline=var(--rc-item-padding-inline)] - Overflow action inline padding.
 * @cssprop [--rc-adaptive-menu-item-gap=var(--rc-item-gap)] - Overflow action content gap.
 */
export class RCAdaptiveMenu extends LitElement {
  static override styles = adaptiveMenuStyles;

  private static readonly _styledRoots = new WeakSet<Document | ShadowRoot>();

  /** Accessible label for the toolbar. */
  @property({ type: String })
  label = 'Actions';

  /**
   * Maximum authored actions promoted ahead of the overflow trigger. A
   * static declarative cap, re-evaluated whenever it changes — not a
   * measurement of available space.
   */
  @property({ type: Number, attribute: 'max-shown' })
  maxShown = 3;

  private _open: boolean | undefined;
  private _defaultOpen = false;
  private _uncontrolledOpen: boolean | undefined;
  private _openInitialized = false;

  /** Whether the overflow menu is visible. Host writes are silent. */
  @property({ type: Boolean, reflect: true })
  get open(): boolean {
    return this._open ?? this._uncontrolledOpen ?? this._defaultOpen;
  }

  set open(value: boolean | undefined) {
    const oldValue = this.open;

    this._open = value;
    this._openInitialized = true;
    this.requestUpdate('open', oldValue);
  }

  /** Initial open state for uncontrolled usage. */
  @property({ type: Boolean, attribute: 'default-open' })
  get defaultOpen(): boolean {
    return this._defaultOpen;
  }

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

  /** Toolbar layout and arrow-key navigation axis. */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  /** Keeps the exposed aria-orientation on the orientation actually rendered. */
  protected readonly _flow = new FlowController(this);

  /** Accessible name for the overflow trigger and popup. */
  @property({ type: String, attribute: 'overflow-label' })
  overflowLabel = 'More actions';

  @query('#overflow-trigger')
  private _$trigger!: HTMLButtonElement;

  @query('#popup')
  private _$popup!: HTMLDivElement;

  private readonly _authored = new Map<HTMLElement, AuthoredState>();
  private _mutationObserver?: MutationObserver;
  private _applyingSlots = false;
  private _restoreFocusWhenClosed = false;
  private _focusWhenOpened: 'first' | 'last' | 'none' | null = null;

  private readonly _anchor = new AnchorController(this, {
    anchor: () => this._$trigger,
    floating: () => this._$popup,
    placement: 'block-end-end',
    offset: 4,
    shadowHost: () => this,
  });

  override connectedCallback(): void {
    super.connectedCallback();
    RCAdaptiveMenu._ensureBaseStyles(this.getRootNode() as Document | ShadowRoot);
    this.addEventListener('focusin', this._onFocusIn);
    this.ownerDocument.addEventListener('pointerdown', this._onDocumentPointerDown);
    this.ownerDocument.addEventListener('keydown', this._onDocumentKeydown);

    if (typeof MutationObserver === 'function') {
      this._mutationObserver = new MutationObserver(this._onMutation);

      this._mutationObserver.observe(this, {
        attributeFilter: ['aria-disabled', 'data-priority', 'disabled', 'slot'],
        childList: true,
        subtree: true,
      });
    }

    if (this.hasUpdated) {
      queueMicrotask(() => {
        if (!this.isConnected) {
          return;
        }

        this._syncActions();
        this._syncOpenState();
      });
    }
  }

  override disconnectedCallback(): void {
    this.removeEventListener('focusin', this._onFocusIn);
    this.ownerDocument.removeEventListener('pointerdown', this._onDocumentPointerDown);
    this.ownerDocument.removeEventListener('keydown', this._onDocumentKeydown);
    this._mutationObserver?.disconnect();
    this._mutationObserver = undefined;

    for (const [action, state] of this._authored) {
      this._restoreAction(action, state);
    }

    this._authored.clear();
    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    this._syncActions();
    this._syncOpenState();

    if (import.meta.env.DEV && this.children.length === 0) {
      console.warn(
        '[rc-adaptive-menu] No direct actions found. Place native buttons, links, or supported rc action wrappers directly inside the component.',
        this,
      );
    }
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('orientation')) {
      this._anchor.setOptions({
        placement: this.orientation === 'vertical' ? 'inline-end-start' : 'block-end-end',
      });
    }

    if (changed.has('maxShown') || changed.has('orientation')) {
      this._applySlots();
    }

    if (changed.has('open')) {
      this._syncOpenState();
    }
  }

  /** Original authored action elements in DOM order. */
  get $actions(): HTMLElement[] {
    return this._entriesInDomOrder().map(([action]) => action);
  }

  /** Actions currently shown in the toolbar, in authored DOM order. */
  get $promotedActions(): HTMLElement[] {
    return this.$actions.filter((action) => action.hasAttribute('data-rc-action-promoted'));
  }

  /** Actions currently assigned to the overflow menu, in authored DOM order. */
  get $overflowedActions(): HTMLElement[] {
    return this.$actions.filter((action) => action.hasAttribute('data-rc-action-overflowed'));
  }

  /** Opens the overflow popup silently and optionally focuses an edge action. */
  openMenu(focus: 'first' | 'last' | 'none' = 'first'): void {
    if (!this.hasAttribute('data-overflow')) {
      return;
    }

    this._setProgrammaticOpen(true, false, focus);
  }

  /** Closes the overflow popup silently. */
  closeMenu(returnFocus = false): void {
    this._setProgrammaticOpen(false, returnFocus);
  }

  /** Toggles the overflow popup silently. */
  toggleMenu(focus: 'first' | 'last' | 'none' = 'first'): void {
    if (!this.open && !this.hasAttribute('data-overflow')) {
      return;
    }

    this._setProgrammaticOpen(!this.open, this.open, focus);
  }

  protected override render() {
    return html`
      <div
        id="root"
        part="root"
        role="toolbar"
        aria-label=${this.label}
        aria-orientation=${renderedOrientation(this.orientation, this._flow.flow)}
        ${keyNavigation(this._onToolbarNavigate, {
          navigationAxis: this.orientation,
        })}
      >
        <slot id="actions" @slotchange=${this._onSlotChange}></slot>
        <span id="overflow-trigger-target">
          <button
            id="overflow-trigger"
            part="overflow-trigger"
            type="button"
            aria-haspopup="menu"
            aria-expanded="false"
            aria-controls="popup"
            aria-label=${this.overflowLabel}
            title=${this.overflowLabel}
            ${keyNavigation(this._onTriggerNavigate, {
              navigationAxis: this.orientation,
              handleNavAxis: false,
              handleOpenAxis: true,
              handleEscape: this.open,
            })}
            @click=${this._onTriggerClick}
          >
            <slot name="overflow-icon">
              <svg id="overflow-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="5" r="2"></circle>
                <circle cx="12" cy="12" r="2"></circle>
                <circle cx="12" cy="19" r="2"></circle>
              </svg>
            </slot>
          </button>
        </span>
      </div>
      <div
        id="popup"
        part="popup"
        popover="manual"
        role="menu"
        aria-label=${this.overflowLabel}
        ${keyNavigation(this._onOverflowNavigate, {
          navigationAxis: 'vertical',
          handleEscape: true,
        })}
        @click=${this._onPopupClick}
      >
        <slot id="overflow" name="overflow" @slotchange=${this._onSlotChange}></slot>
      </div>
    `;
  }

  private static _ensureBaseStyles(root: Document | ShadowRoot): void {
    if (RCAdaptiveMenu._styledRoots.has(root)) {
      return;
    }

    RCAdaptiveMenu._styledRoots.add(root);

    const $style = (root instanceof Document ? root : root.ownerDocument).createElement('style');

    $style.setAttribute('data-rc-light-dom-base', 'rc-adaptive-menu');
    $style.textContent = LIGHT_DOM_CSS;

    if (root instanceof Document) {
      root.head.append($style);
    } else {
      root.append($style);
    }
  }

  private _onSlotChange = (): void => {
    if (this._applyingSlots) {
      return;
    }

    queueMicrotask(() => {
      if (this.isConnected && !this._applyingSlots) {
        this._syncActions();
      }
    });
  };

  private _onMutation = (records: MutationRecord[]): void => {
    if (this._applyingSlots) {
      return;
    }

    if (records.some((record) => record.type === 'childList' || record.attributeName === 'slot')) {
      this._syncActions();

      return;
    }

    // A data-priority change reorders which actions are promoted; other
    // watched attributes (aria-disabled, disabled) don't affect slotting.
    if (records.some((record) => record.attributeName === 'data-priority')) {
      this._applySlots();

      return;
    }

    this._syncToolbarTabStops();
  };

  private _syncActions(): void {
    const current = new Set<HTMLElement>();

    for (const $child of Array.from(this.children)) {
      if (!($child instanceof HTMLElement) || $child.slot === 'overflow-icon') {
        continue;
      }

      const existing = this._authored.get($child);
      const authoredSlot = existing?.slot ?? $child.slot;

      if (authoredSlot && authoredSlot !== 'overflow') {
        if (import.meta.env.DEV && !existing) {
          console.warn(
            `[rc-adaptive-menu] Ignoring a child with the incompatible authored slot "${authoredSlot}". Actions may use only the default or overflow slot.`,
            $child,
          );
        }

        continue;
      }

      const $focusTarget = existing?.focusTarget ?? this._focusTarget($child);

      if (!$focusTarget) {
        if (import.meta.env.DEV && !existing) {
          console.warn(
            '[rc-adaptive-menu] Ignoring a direct child without a supported focusable action.',
            $child,
          );
        }

        continue;
      }

      current.add($child);

      if (!existing) {
        this._authored.set($child, {
          slot: authoredSlot,
          focusTarget: $focusTarget,
          orientation: $child.getAttribute('orientation'),
          role: $focusTarget.getAttribute('role'),
          tabindex: $focusTarget.getAttribute('tabindex'),
          forcedOverflow: authoredSlot === 'overflow',
        });
      }
    }

    for (const [$action, state] of this._authored) {
      if (!current.has($action)) {
        this._restoreAction($action, state);
        this._authored.delete($action);
      }
    }

    this._applySlots();
  }

  private _entriesInDomOrder(): [HTMLElement, AuthoredState][] {
    return Array.from(this.children).flatMap(($child) => {
      if (!($child instanceof HTMLElement)) {
        return [];
      }

      const state = this._authored.get($child);

      return state ? [[$child, state] as [HTMLElement, AuthoredState]] : [];
    });
  }

  /**
   * Assigns each authored action to the default (promoted) or overflow slot.
   * A purely declarative computation from `max-shown`, `data-priority`, and
   * authored `slot` — no size measurement of any kind.
   */
  private _applySlots(): void {
    const entries = this._entriesInDomOrder();

    const priorityOf = (action: HTMLElement): number => {
      const parsedPriority = Number(action.dataset.priority ?? 0);

      return Number.isFinite(parsedPriority) ? parsedPriority : 0;
    };

    // A negative data-priority forces overflow, the same as an authored
    // `slot="overflow"`, regardless of max-shown.
    const isForcedOverflow = ([action, state]: [HTMLElement, AuthoredState]): boolean =>
      state.forcedOverflow || priorityOf(action) < 0;
    const candidates = entries.filter((entry) => !isForcedOverflow(entry));

    const ranked = candidates
      .map(([action], index) => ({
        action,
        index,
        priority: priorityOf(action),
      }))
      .sort((a, b) => b.priority - a.priority || a.index - b.index);

    const requestedCap = Number.isFinite(this.maxShown)
      ? Math.max(0, Math.trunc(this.maxShown))
      : candidates.length;
    const cap = Math.min(candidates.length, requestedCap);
    const promotedSet = new Set(ranked.slice(0, cap).map(({ action }) => action));
    const overflowed = entries
      .map(([action]) => action)
      .filter((action) => !promotedSet.has(action));
    const focusedAction = entries.find(
      ([, state]) => state.focusTarget === this.ownerDocument.activeElement,
    )?.[0];

    this.toggleAttribute('data-overflow', overflowed.length > 0);

    if (focusedAction && overflowed.includes(focusedAction)) {
      this._$trigger.focus();
    }

    this._applyingSlots = true;

    for (const [action, state] of entries) {
      if (promotedSet.has(action)) {
        action.slot = '';
        action.setAttribute('data-rc-action-promoted', '');
        action.removeAttribute('data-rc-action-overflowed');
        this._restoreOrientation(action, state);
        this._restoreRole(state);
      } else {
        action.slot = 'overflow';
        action.removeAttribute('data-rc-action-promoted');
        action.setAttribute('data-rc-action-overflowed', '');

        if (action.matches('rc-menu-button')) {
          action.setAttribute('orientation', 'vertical');
        }

        state.focusTarget.setAttribute('role', 'menuitem');
        state.focusTarget.setAttribute('tabindex', '-1');
      }
    }

    this._syncToolbarTabStops();

    queueMicrotask(() => {
      this._applyingSlots = false;
    });

    this._syncOpenState();
  }

  private _focusTarget($action: HTMLElement): HTMLElement | null {
    if ($action.matches(ACTION_WRAPPERS)) {
      return $action.querySelector<HTMLElement>(
        ':scope > button, :scope > a[href], :scope > [slot="trigger"]',
      );
    }

    return $action.matches('button, a[href]') ? $action : null;
  }

  private _promotedFocusTargets(): HTMLElement[] {
    const targets = Array.from(this._authored.entries())
      .filter(([action]) => action.hasAttribute('data-rc-action-promoted'))
      .map(([, state]) => state.focusTarget)
      .filter(($target) => isFocusable($target));

    if (this.hasAttribute('data-overflow')) {
      targets.push(this._$trigger);
    }

    return targets;
  }

  private _overflowFocusTargets(): HTMLElement[] {
    return Array.from(this._authored.entries())
      .filter(([action]) => action.hasAttribute('data-rc-action-overflowed'))
      .map(([, state]) => state.focusTarget)
      .filter(($target) => isFocusable($target));
  }

  private _syncToolbarTabStops(active?: HTMLElement): void {
    const targets = this._promotedFocusTargets();
    const selected = active && targets.includes(active) ? active : targets[0];

    for (const target of targets) {
      target.setAttribute('tabindex', target === selected ? '0' : '-1');
    }
  }

  private _onFocusIn = (event: FocusEvent): void => {
    const $target = event.composedPath()[0];

    if ($target instanceof HTMLElement && this._promotedFocusTargets().includes($target)) {
      this._syncToolbarTabStops($target);
    }
  };

  private _onToolbarNavigate = (action: KeyboardNavigationAction): void => {
    this._focusByNavigationAction(action, this._promotedFocusTargets());
  };

  private _onTriggerNavigate = (action: KeyboardNavigationAction): void => {
    switch (action) {
      case 'open-to-first':
        this._requestUserOpen(true, false, 'first');
        break;
      case 'open-to-last':
        this._requestUserOpen(true, false, 'last');
        break;
      case 'escape':
        this._requestUserOpen(false, true);
        break;
    }
  };

  private _onOverflowNavigate = (action: KeyboardNavigationAction): void => {
    if (action === 'escape') {
      this._requestUserOpen(false, true);

      return;
    }

    this._focusByNavigationAction(action, this._overflowFocusTargets());
  };

  private _focusByNavigationAction(
    action: KeyboardNavigationAction,
    $targets: HTMLElement[],
  ): void {
    const $active = this.ownerDocument.activeElement;
    const index = $active instanceof HTMLElement ? $targets.indexOf($active) : -1;
    let $target: HTMLElement | undefined;

    switch (action) {
      case 'next':
        $target = $targets[(index + 1) % $targets.length];
        break;
      case 'prev':
        $target = $targets[(index - 1 + $targets.length) % $targets.length];
        break;
      case 'start':
        $target = $targets[0];
        break;
      case 'end':
        $target = $targets.at(-1);
        break;
    }

    $target?.focus();
  }

  private _onTriggerClick = (): void => {
    this._requestUserOpen(!this.open, false, 'none');
  };

  private _onDocumentPointerDown = (event: PointerEvent): void => {
    if (this.open && !event.composedPath().includes(this)) {
      this._requestUserOpen(false, false);
    }
  };

  private _onDocumentKeydown = (event: KeyboardEvent): void => {
    if (this.open && event.key === 'Escape' && !event.composedPath().includes(this)) {
      this._requestUserOpen(false, false);
    }
  };

  private _onPopupClick = (event: MouseEvent): void => {
    const path = event.composedPath();
    const entry = Array.from(this._authored.entries()).find(
      ([action, state]) =>
        action.hasAttribute('data-rc-action-overflowed') &&
        (path.includes(action) || path.includes(state.focusTarget)),
    );

    if (!entry || this._isDisabled(entry[1].focusTarget)) {
      return;
    }

    const $focusTarget = entry[1].focusTarget;

    // A menu-button trigger must keep the containing overflow menu open while
    // its submenu is shown. Leaf selections still dismiss the outer menu.
    if (path.includes($focusTarget) && $focusTarget.getAttribute('aria-haspopup') === 'menu') {
      return;
    }

    this._requestUserOpen(false, true);
  };

  private _setProgrammaticOpen(
    open: boolean,
    returnFocus: boolean,
    focus: 'first' | 'last' | 'none' = 'none',
  ): void {
    const oldValue = this.open;

    if (oldValue === open) {
      if (open) {
        this._focusOverflowEdge(focus);
      }

      return;
    }

    if (this._openInitialized) {
      this._open = open;
    } else {
      this._uncontrolledOpen = open;
    }

    this._restoreFocusWhenClosed = !open && returnFocus;
    this._focusWhenOpened = open ? focus : null;
    this.requestUpdate('open', oldValue);
    this._syncOpenState();
  }

  private _requestUserOpen(
    open: boolean,
    returnFocus: boolean,
    focus: 'first' | 'last' | 'none' = 'none',
  ): void {
    if (this.open === open) {
      return;
    }

    this._restoreFocusWhenClosed = !open && returnFocus;
    this._focusWhenOpened = open ? focus : null;

    if (this._open === undefined) {
      const oldValue = this.open;

      this._uncontrolledOpen = open;
      this.requestUpdate('open', oldValue);
      this._syncOpenState();
    }

    this.dispatchEvent(
      new CustomEvent<RCAdaptiveMenuToggleEvent>('rc-adaptive-menu-toggle', {
        bubbles: true,
        composed: true,
        detail: { open },
      }),
    );
  }

  private _syncOpenState(): void {
    const $popup = this._$popup as HTMLDivElement & {
      hidePopover?: () => void;
      showPopover?: () => void;
    };

    if (!$popup?.isConnected) {
      return;
    }

    if (this.open && this.hasAttribute('data-overflow')) {
      let shown = false;

      if (typeof $popup.showPopover === 'function') {
        try {
          $popup.showPopover();
          shown = true;
        } catch {
          // The fallback attribute provides the same visible state when the
          // Popover API exists only partially or rejects this element.
        }
      }

      $popup.toggleAttribute('data-fallback-open', !shown);
      this._$trigger.setAttribute('aria-expanded', 'true');
      this._anchor.update();

      if (this._focusWhenOpened !== null) {
        const focus = this._focusWhenOpened;

        this._focusWhenOpened = null;
        requestAnimationFrame(() => this._focusOverflowEdge(focus));
      }

      return;
    }

    if (typeof $popup.hidePopover === 'function') {
      try {
        $popup.hidePopover();
      } catch {
        // A closed or unsupported popover needs no additional native cleanup.
      }
    }

    $popup.removeAttribute('data-fallback-open');
    this._$trigger.setAttribute('aria-expanded', 'false');

    if (this._restoreFocusWhenClosed) {
      this._restoreFocusWhenClosed = false;
      this._$trigger.focus();
    }
  }

  private _focusOverflowEdge(focus: 'first' | 'last' | 'none'): void {
    if (!this.open || focus === 'none') {
      return;
    }

    const $items = this._overflowFocusTargets();
    const $target = focus === 'last' ? $items.at(-1) : $items[0];

    $target?.focus();
  }

  private _restoreAction(action: HTMLElement, state: AuthoredState): void {
    action.slot = state.slot;
    action.removeAttribute('data-rc-action-promoted');
    action.removeAttribute('data-rc-action-overflowed');
    this._restoreOrientation(action, state);
    this._restoreRole(state);

    if (state.tabindex === null) {
      state.focusTarget.removeAttribute('tabindex');
    } else {
      state.focusTarget.setAttribute('tabindex', state.tabindex);
    }
  }

  private _restoreOrientation(action: HTMLElement, state: AuthoredState): void {
    if (!action.matches('rc-menu-button')) {
      return;
    }

    if (state.orientation === null) {
      action.removeAttribute('orientation');
    } else {
      action.setAttribute('orientation', state.orientation);
    }
  }

  private _restoreRole(state: AuthoredState): void {
    if (state.role === null) {
      state.focusTarget.removeAttribute('role');
    } else {
      state.focusTarget.setAttribute('role', state.role);
    }
  }

  private _isDisabled(target: HTMLElement): boolean {
    return (
      (target instanceof HTMLButtonElement && target.disabled) ||
      target.getAttribute('aria-disabled') === 'true'
    );
  }
}

export default RCAdaptiveMenu;
