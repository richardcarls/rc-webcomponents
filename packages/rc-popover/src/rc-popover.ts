import { LitElement, html } from 'lit';
import { property, query } from 'lit/decorators.js';

import {
  AnchorController,
  type AnchorPlacement,
  cssText,
  PopoverController,
} from '@rcarls/rc-common';

import popoverStyles from './rc-popover.styles.js';

export type RCPopoverPlacement = AnchorPlacement;
export type RCPopoverTriggerAction = 'toggle' | 'none';

/** Detail of a user-requested open-state change. */
export interface RCPopoverToggleDetail {
  open: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-popover': RCPopover;
  }

  interface HTMLElementEventMap {
    'rc-popover-toggle': CustomEvent<RCPopoverToggleDetail>;
  }
}

type TriggerState = {
  ariaControls: string | null;
  ariaExpanded: string | null;
  popoverTarget: string | null;
};

type ContentState = {
  id: string | null;
  popover: string | null;
  hidden: boolean;
};

let popoverId = 0;

const LIGHT_DOM_CSS = cssText`
@layer rc-base {
  rc-popover > [slot='content'] {
    position: fixed;
    display: none;
    box-sizing: border-box;
    max-inline-size: var(--rc-popover-max-inline-size, min(20rem, 100dvi - 1rem));
    max-block-size: var(--rc-popover-max-block-size, calc(100dvb - 1rem));
    margin: 0;
    padding-block: var(--rc-popover-padding-block, 0.75rem);
    padding-inline: var(--rc-popover-padding-inline, 0.75rem);
    border: var(
      --rc-popover-border,
      var(--rc-popup-border, var(--rc-border, 1px solid ButtonBorder))
    );
    border-radius: var(
      --rc-popover-radius,
      var(--rc-popup-radius, var(--rc-radius-sm, 0.25rem))
    );
    background: var(
      --rc-popover-background,
      var(--rc-popup-background, var(--rc-surface, Canvas))
    );
    color: var(
      --rc-popover-color,
      var(--rc-popup-color, var(--rc-field-text, CanvasText))
    );
    box-shadow: var(
      --rc-popover-shadow,
      var(
        --rc-popup-shadow,
        var(--rc-shadow, 0 2px 8px color-mix(in srgb, CanvasText 15%, transparent))
      )
    );
    font: inherit;
    overflow: auto;
    z-index: var(--rc-popover-z-index, 1);
  }

  rc-popover > [slot='content']:is(:popover-open, [data-rc-popover-fallback-open]) {
    display: block;
  }

  rc-popover > [slot='content'][hidden] {
    display: none !important;
  }
}
`;

/**
 * Anchored non-modal surface around a native trigger and consumer-owned content.
 * The component manages visibility and positioning; the author supplies the
 * content's role, accessible name, and any widget-specific keyboard behavior.
 * A native `popovertarget` on the trigger and `popover` on the content provide
 * a usable pre-upgrade path; the component restores those attributes on disconnect.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-popover rc-popover docs}
 * @see {@link https://html.spec.whatwg.org/multipage/popover.html HTML popover}
 *
 * @slot trigger - Direct child native trigger, usually a `<button>`.
 * @slot content - Direct child popover surface with author-owned semantics.
 * @csspart root - Shadow wrapper for the two slots.
 * @fires rc-popover-toggle - User requested open-state change; detail: `{open: boolean}`.
 * @attr open - Controlled open state; host writes are silent.
 * @attr default-open - Initial uncontrolled open state.
 * @attr placement - Preferred logical placement relative to the trigger.
 * @attr trigger-action - `toggle` (default) or `none` for hover/focus/programmatic use.
 * @attr open-on-hover - Opens while pointer is over trigger or content.
 * @attr open-on-focus - Opens while focus is within trigger or content.
 * @cssprop [--rc-popover-max-inline-size=min(20rem, 100dvi - 1rem)] - Maximum inline size.
 * @cssprop [--rc-popover-max-block-size=calc(100dvb - 1rem)] - Maximum block size.
 * @cssprop [--rc-popover-padding-block=0.75rem] - Block padding.
 * @cssprop [--rc-popover-padding-inline=0.75rem] - Inline padding.
 * @cssprop [--rc-popover-border=var(--rc-popup-border)] - Surface border.
 * @cssprop [--rc-popover-radius=var(--rc-popup-radius)] - Corner radius.
 * @cssprop [--rc-popover-background=var(--rc-popup-background)] - Surface background.
 * @cssprop [--rc-popover-color=var(--rc-popup-color)] - Surface text color.
 * @cssprop [--rc-popover-shadow=var(--rc-popup-shadow)] - Surface shadow.
 * @cssprop [--rc-popover-z-index=1] - Fallback stacking order.
 */
export class RCPopover extends LitElement {
  static override styles = popoverStyles;

  private static readonly _styledRoots = new WeakSet<Document | ShadowRoot>();

  /** Preferred logical placement. */
  @property({ type: String })
  placement: RCPopoverPlacement = 'block-end-start';

  /** Whether trigger activation toggles the surface. */
  @property({ type: String, attribute: 'trigger-action' })
  triggerAction: RCPopoverTriggerAction = 'toggle';

  /** Open while the pointer is over trigger or content. */
  @property({ type: Boolean, attribute: 'open-on-hover' })
  openOnHover = false;

  /** Open while focus is within trigger or content. */
  @property({ type: Boolean, attribute: 'open-on-focus' })
  openOnFocus = false;

  private _controlledOpen: boolean | undefined;
  private _uncontrolledOpen = false;
  private _defaultOpen = false;
  private _initialized = false;

  /** Controlled open state. A host write never emits `rc-popover-toggle`. */
  @property({ type: Boolean, reflect: true })
  get open(): boolean {
    return this._controlledOpen ?? this._uncontrolledOpen;
  }

  set open(value: boolean | undefined) {
    const old = this.open;

    this._controlledOpen = value;
    this._initialized = value !== undefined || this._initialized;
    this.requestUpdate('open', old);
    this._syncOpen();
  }

  /** Initial open state used until the host or user changes the state. */
  @property({ type: Boolean, attribute: 'default-open' })
  get defaultOpen(): boolean {
    return this._defaultOpen;
  }

  set defaultOpen(value: boolean) {
    const old = this._defaultOpen;

    this._defaultOpen = value;

    if (!this._initialized && this._controlledOpen === undefined) {
      this._uncontrolledOpen = value;
    }

    this.requestUpdate('defaultOpen', old);
    this._syncOpen();
  }

  @query("slot[name='trigger']")
  private _$triggerSlot!: HTMLSlotElement;

  @query("slot[name='content']")
  private _$contentSlot!: HTMLSlotElement;

  private _$trigger: HTMLElement | null = null;
  private _$content: HTMLElement | null = null;
  private _triggerState: TriggerState | null = null;
  private _contentState: ContentState | null = null;
  private _slotSyncQueued = false;
  private _pointerWithin = false;
  private _focusWithin = false;
  private _pinnedByClick = false;
  private _dismissedUntilLeave = false;

  private readonly _anchor = new AnchorController(this, {
    anchor: () => this._$trigger,
    floating: () => this._$content,
    placement: this.placement,
    offset: 4,
    disabled: () => !this.open,
  });

  private readonly _popover = new PopoverController(this, { element: () => this._$content });

  override connectedCallback(): void {
    super.connectedCallback();
    RCPopover._ensureBaseStyles(this.getRootNode() as Document | ShadowRoot);
    this.addEventListener('click', this._onClick);
    this.addEventListener('pointerover', this._onPointerOver);
    this.addEventListener('pointerout', this._onPointerOut);
    this.addEventListener('focusin', this._onFocusIn);
    this.addEventListener('focusout', this._onFocusOut);
    this.ownerDocument.addEventListener('pointerdown', this._onDocumentPointerDown);
    this.ownerDocument.addEventListener('keydown', this._onDocumentKeyDown);

    if (this.hasUpdated) {
      this._queueSlotSync();
    }
  }

  override disconnectedCallback(): void {
    this.removeEventListener('click', this._onClick);
    this.removeEventListener('pointerover', this._onPointerOver);
    this.removeEventListener('pointerout', this._onPointerOut);
    this.removeEventListener('focusin', this._onFocusIn);
    this.removeEventListener('focusout', this._onFocusOut);
    this.ownerDocument.removeEventListener('pointerdown', this._onDocumentPointerDown);
    this.ownerDocument.removeEventListener('keydown', this._onDocumentKeyDown);
    this._popover.sync(false);
    this._restoreTrigger();
    this._restoreContent();
    this._$trigger = null;
    this._$content = null;
    this._pointerWithin = false;
    this._focusWithin = false;
    this._pinnedByClick = false;
    this._dismissedUntilLeave = false;
    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    this._queueSlotSync();

    if (import.meta.env.DEV && !this.querySelector(':scope > [slot="trigger"]')) {
      console.warn('[rc-popover] No direct [slot="trigger"] child found.', this);
    }

    if (import.meta.env.DEV && !this.querySelector(':scope > [slot="content"]')) {
      console.warn('[rc-popover] No direct [slot="content"] child found.', this);
    }
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('placement')) {
      this._anchor.setOptions({ placement: this.placement });
    }

    this._syncOpen();
  }

  protected override render() {
    return html`<div part="root">
      <slot name="trigger" @slotchange=${this._onSlotChange}></slot>
      <slot name="content" @slotchange=${this._onSlotChange}></slot>
    </div>`;
  }

  private static _ensureBaseStyles(root: Document | ShadowRoot): void {
    if (RCPopover._styledRoots.has(root)) {
      return;
    }

    RCPopover._styledRoots.add(root);

    const style = (root instanceof Document ? root : root.ownerDocument).createElement('style');

    style.setAttribute('data-rc-light-dom-base', 'rc-popover');
    style.textContent = LIGHT_DOM_CSS;

    if (root instanceof Document) {
      root.head.append(style);
    } else {
      root.append(style);
    }
  }

  private _onSlotChange = (): void => this._queueSlotSync();

  private _queueSlotSync(): void {
    if (this._slotSyncQueued) {
      return;
    }

    this._slotSyncQueued = true;

    queueMicrotask(() => {
      this._slotSyncQueued = false;

      if (this.isConnected) {
        this._syncSlots();
      }
    });
  }

  private _syncSlots(): void {
    const trigger =
      this._$triggerSlot
        ?.assignedElements()
        .find((element): element is HTMLElement => element instanceof HTMLElement) ?? null;
    const content =
      this._$contentSlot
        ?.assignedElements()
        .find((element): element is HTMLElement => element instanceof HTMLElement) ?? null;

    if (content !== this._$content) {
      this._popover.sync(false);
      this._restoreContent();
      this._$content = content;
      this._contentState = null;
    }

    if (trigger !== this._$trigger) {
      this._restoreTrigger();
      this._$trigger = trigger;
      this._triggerState = null;
    }

    this._prepareContent();
    this._prepareTrigger();
    this._syncOpen();
  }

  private _prepareContent(): void {
    const content = this._$content;

    if (!content) {
      return;
    }

    if (!this._contentState) {
      this._contentState = {
        id: content.getAttribute('id'),
        popover: content.getAttribute('popover'),
        hidden: content.hidden,
      };
    }

    if (!content.id) {
      content.id = `rc-popover-${++popoverId}`;
    }

    content.setAttribute('popover', 'manual');
  }

  private _prepareTrigger(): void {
    const trigger = this._$trigger;
    const content = this._$content;

    if (!trigger) {
      return;
    }

    if (!this._triggerState) {
      this._triggerState = {
        ariaControls: trigger.getAttribute('aria-controls'),
        ariaExpanded: trigger.getAttribute('aria-expanded'),
        popoverTarget: trigger.getAttribute('popovertarget'),
      };
    }

    if (trigger.hasAttribute('popovertarget')) {
      trigger.removeAttribute('popovertarget');
    }

    if (trigger instanceof HTMLButtonElement && content?.id) {
      const controls = this._triggerState.ariaControls?.split(/\s+/).filter(Boolean) ?? [];

      if (!controls.includes(content.id)) {
        controls.push(content.id);
      }

      trigger.setAttribute('aria-controls', controls.join(' '));
      trigger.setAttribute('aria-expanded', String(this.open));
    }
  }

  private _restoreTrigger(): void {
    const trigger = this._$trigger;
    const state = this._triggerState;

    if (!trigger || !state) {
      return;
    }

    this._restoreAttribute(trigger, 'aria-controls', state.ariaControls);
    this._restoreAttribute(trigger, 'aria-expanded', state.ariaExpanded);
    this._restoreAttribute(trigger, 'popovertarget', state.popoverTarget);
    this._triggerState = null;
  }

  private _restoreContent(): void {
    const content = this._$content;
    const state = this._contentState;

    if (!content || !state) {
      return;
    }

    this._restoreAttribute(content, 'id', state.id);
    this._restoreAttribute(content, 'popover', state.popover);
    content.hidden = state.hidden;
    this._contentState = null;
  }

  private _restoreAttribute(element: HTMLElement, name: string, value: string | null): void {
    if (value === null) {
      element.removeAttribute(name);
    } else {
      element.setAttribute(name, value);
    }
  }

  private _syncOpen(): void {
    if (!this.isConnected || !this._$content) {
      return;
    }

    if (this.open) {
      this._$content.hidden = false;
      this._popover.sync(true);
    } else {
      this._popover.sync(false);
      this._$content.hidden = true;
    }

    this._prepareTrigger();

    if (this.open) {
      this._anchor.update();
    }
  }

  private _requestOpen(open: boolean): void {
    if (open === this.open) {
      return;
    }

    if (this._controlledOpen === undefined) {
      const old = this.open;

      this._uncontrolledOpen = open;
      this._initialized = true;
      this.requestUpdate('open', old);
      this._syncOpen();
    }

    this.dispatchEvent(
      new CustomEvent<RCPopoverToggleDetail>('rc-popover-toggle', {
        bubbles: true,
        composed: true,
        detail: { open },
      }),
    );
  }

  private _inside(event: Event): boolean {
    const path = event.composedPath();

    return (
      path.includes(this._$trigger as EventTarget) || path.includes(this._$content as EventTarget)
    );
  }

  private _onClick = (event: MouseEvent): void => {
    if (
      this.triggerAction !== 'toggle' ||
      !this._$trigger ||
      !event.composedPath().includes(this._$trigger)
    ) {
      return;
    }

    if (this.open) {
      this._pinnedByClick = false;
      this._dismissedUntilLeave = true;
      this._requestOpen(false);
    } else {
      this._dismissedUntilLeave = false;
      this._pinnedByClick = true;
      this._requestOpen(true);
    }
  };

  private _onPointerOver = (event: PointerEvent): void => {
    if (!this.openOnHover || event.pointerType === 'touch' || !this._inside(event)) {
      return;
    }

    this._pointerWithin = true;
    this._reconcileAutomaticOpen();
  };

  private _onPointerOut = (event: PointerEvent): void => {
    if (!this.openOnHover || event.pointerType === 'touch' || !this._inside(event)) {
      return;
    }

    if (event.relatedTarget instanceof Node && this.contains(event.relatedTarget)) {
      return;
    }

    this._pointerWithin = false;
    this._reconcileAutomaticOpen();
  };

  private _onFocusIn = (event: FocusEvent): void => {
    if (!this.openOnFocus || !this._inside(event)) {
      return;
    }

    this._focusWithin = true;
    this._reconcileAutomaticOpen();
  };

  private _onFocusOut = (event: FocusEvent): void => {
    if (!this.openOnFocus || !this._inside(event)) {
      return;
    }

    if (event.relatedTarget instanceof Node && this.contains(event.relatedTarget)) {
      return;
    }

    this._focusWithin = false;
    this._reconcileAutomaticOpen();
  };

  private _reconcileAutomaticOpen(): void {
    if (!this._pointerWithin && !this._focusWithin) {
      this._dismissedUntilLeave = false;

      if (!this._pinnedByClick) {
        this._requestOpen(false);
      }

      return;
    }

    if (!this._dismissedUntilLeave) {
      this._requestOpen(true);
    }
  }

  private _onDocumentPointerDown = (event: PointerEvent): void => {
    if (!this.open || event.composedPath().includes(this)) {
      return;
    }

    this._pinnedByClick = false;
    this._dismissedUntilLeave = true;
    this._requestOpen(false);
  };

  private _onDocumentKeyDown = (event: KeyboardEvent): void => {
    if (!this.open || event.key !== 'Escape') {
      return;
    }

    this._pinnedByClick = false;
    this._dismissedUntilLeave = true;
    this._requestOpen(false);

    if (this._$content?.contains(this.ownerDocument.activeElement)) {
      this._$trigger?.focus();
    }
  };
}

export default RCPopover;
