import { LitElement, html } from 'lit';
import { property, query } from 'lit/decorators.js';

import { AnchorController, PopoverController, type AnchorPlacement } from '@rcarls/rc-common';

import tooltipStyles from './rc-tooltip.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-tooltip': RCTooltip;
  }
}

export type RCTooltipPlacement = AnchorPlacement;

type ContentState = {
  id: string | null;
  role: string | null;
  ariaHidden: string | null;
  popover: string | null;
  hidden: boolean;
};

let tooltipId = 0;

const LIGHT_DOM_CSS = `
@layer rc-base {
  rc-tooltip > [slot='content'],
  rc-tooltip > :not([slot]) {
    position: fixed;
    display: block;
    box-sizing: border-box;
    max-inline-size: var(--rc-tooltip-max-inline-size, 20rem);
    padding-block: var(--rc-tooltip-padding-block, 0.25em);
    padding-inline: var(--rc-tooltip-padding-inline, 0.5em);
    border: var(--rc-tooltip-border, 1px solid CanvasText);
    border-radius: var(--rc-tooltip-radius, var(--rc-radius-sm, 0.125em));
    background: var(--rc-tooltip-background, CanvasText);
    color: var(--rc-tooltip-color, Canvas);
    box-shadow: var(--rc-tooltip-shadow, none);
    font: var(--rc-tooltip-font, inherit);
    line-height: var(--rc-tooltip-line-height, normal);
    overflow-wrap: anywhere;
    pointer-events: auto;
    z-index: var(--rc-tooltip-z-index, 1);
  }

  rc-tooltip > [slot='content'][hidden],
  rc-tooltip > :not([slot])[hidden] {
    display: none !important;
  }
}
`;

/**
 * Tooltip wrapper for a consumer-owned trigger and descriptive content,
 * following the [WAI-ARIA Tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/).
 * The trigger remains in light DOM and receives `aria-describedby`; the
 * content remains in light DOM so the ID relationship works across browsers.
 *
 * The native Popover API is used when the supplied content supports it. Older
 * browsers use the same focus, pointer, Escape, and anchor positioning logic
 * with an explicit visibility fallback. Tooltip content is descriptive and
 * must not contain interactive controls or receive focus.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-tooltip rc-tooltip docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/ WAI-ARIA Tooltip pattern}
 *
 * @slot trigger - The consumer-owned element that receives focus and hover behavior.
 * @slot content - The single consumer-owned element containing the tooltip text.
 * @slot default - A fallback content slot when `content` is omitted.
 *
 * @csspart root - The shadow-DOM wrapper containing the two slots.
 *
 * @cssprop [--rc-tooltip-max-inline-size=20rem] - Maximum inline size of the tooltip content.
 * @cssprop [--rc-tooltip-padding-block=0.25em] - Tooltip block-axis padding.
 * @cssprop [--rc-tooltip-padding-inline=0.5em] - Tooltip inline-axis padding.
 * @cssprop [--rc-tooltip-border=1px solid CanvasText] - Tooltip border.
 * @cssprop [--rc-tooltip-radius=var(--rc-radius-sm)] - Tooltip corner radius.
 * @cssprop [--rc-tooltip-background=CanvasText] - Tooltip background.
 * @cssprop [--rc-tooltip-color=Canvas] - Tooltip text color.
 * @cssprop [--rc-tooltip-shadow=none] - Tooltip shadow.
 * @cssprop [--rc-tooltip-font=inherit] - Tooltip font.
 * @cssprop [--rc-tooltip-line-height=normal] - Tooltip line height.
 * @cssprop [--rc-tooltip-z-index=1] - Tooltip stacking order in the fallback mode.
 *
 * @attr placement - Preferred logical placement relative to the trigger.
 * @attr [open] - Reflects the tooltip's visible state; set by the component.
 */
export class RCTooltip extends LitElement {
  static override styles = tooltipStyles;

  private static readonly _styledRoots = new WeakSet<Document | ShadowRoot>();

  /** Preferred logical placement relative to the trigger. */
  @property({ type: String })
  placement: RCTooltipPlacement = 'block-end';

  @query("slot[name='trigger']")
  private _$triggerSlot!: HTMLSlotElement;

  @query("slot[name='content']")
  private _$contentSlot!: HTMLSlotElement;

  @query('slot:not([name])')
  private _$defaultSlot!: HTMLSlotElement;

  private _$trigger: HTMLElement | null = null;
  private _$content: HTMLElement | null = null;
  private _contentState: ContentState | null = null;
  private _triggerDescribedBy: string | null = null;
  private _visible = false;
  private _focusWithin = false;
  private _pointerWithin = false;
  private _dismissedByEscape = false;
  private _slotSyncQueued = false;

  private readonly _anchor = new AnchorController(this, {
    anchor: () => this._$trigger,
    floating: () => this._$content,
    placement: this.placement,
    offset: 4,
    disabled: () => !this._visible,
  });

  private readonly _popover = new PopoverController(this, { element: () => this._$content });

  override connectedCallback(): void {
    super.connectedCallback();
    RCTooltip._ensureBaseStyles(this.getRootNode() as Document | ShadowRoot);
    this.addEventListener('focusin', this._onFocusIn);
    this.addEventListener('focusout', this._onFocusOut);
    this.addEventListener('pointerover', this._onPointerOver);
    this.addEventListener('pointerout', this._onPointerOut);
    this.addEventListener('keydown', this._onKeyDown);

    if (this.hasUpdated) {
      this._queueSlotSync();
    }
  }

  override disconnectedCallback(): void {
    this.removeEventListener('focusin', this._onFocusIn);
    this.removeEventListener('focusout', this._onFocusOut);
    this.removeEventListener('pointerover', this._onPointerOver);
    this.removeEventListener('pointerout', this._onPointerOut);
    this.removeEventListener('keydown', this._onKeyDown);
    this._focusWithin = false;
    this._pointerWithin = false;
    this._dismissedByEscape = false;
    this._closeTooltip();
    this._restoreTrigger();
    this._restoreContent();
    this._$trigger = null;
    this._$content = null;
    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    this._queueSlotSync();

    if (import.meta.env.DEV && !this.querySelector(':scope > [slot="trigger"]')) {
      console.warn(
        '[rc-tooltip] No direct child [slot="trigger"] found. Place the trigger element in the trigger slot.',
        this,
      );
    }

    if (
      import.meta.env.DEV &&
      !this.querySelector(':scope > [slot="content"]') &&
      !this.querySelector(':scope > :not([slot])')
    ) {
      console.warn(
        '[rc-tooltip] No direct tooltip content found. Place one element in the content slot.',
        this,
      );
    }
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('placement')) {
      this._anchor.setOptions({ placement: this.placement });
    }
  }

  protected override render() {
    return html`
      <div id="root" part="root">
        <slot name="trigger" @slotchange=${this._onSlotChange}></slot>
        <slot name="content" @slotchange=${this._onSlotChange}></slot>
        <slot @slotchange=${this._onSlotChange}></slot>
      </div>
    `;
  }

  private static _ensureBaseStyles(root: Document | ShadowRoot): void {
    if (RCTooltip._styledRoots.has(root)) {
      return;
    }

    RCTooltip._styledRoots.add(root);

    const style = (root instanceof Document ? root : root.ownerDocument).createElement('style');

    style.setAttribute('data-rc-light-dom-base', 'rc-tooltip');
    style.textContent = LIGHT_DOM_CSS;

    if (root instanceof Document) {
      root.head.append(style);
    } else {
      root.append(style);
    }
  }

  private _onSlotChange = (): void => {
    this._queueSlotSync();
  };

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
        ?.assignedElements({ flatten: true })
        .find((element): element is HTMLElement => element instanceof HTMLElement) ?? null;
    const content =
      this._$contentSlot
        ?.assignedElements({ flatten: true })
        .find((element): element is HTMLElement => element instanceof HTMLElement) ??
      this._$defaultSlot
        ?.assignedElements({ flatten: true })
        .find((element): element is HTMLElement => element instanceof HTMLElement) ??
      null;

    if (content !== this._$content) {
      this._closeTooltip();
      this._restoreTrigger();
      this._restoreContent();
      this._$content = content;
      this._contentState = null;
      this._applyContentSemantics();
    }

    if (trigger !== this._$trigger) {
      this._restoreTrigger();
      this._$trigger = trigger;
      this._triggerDescribedBy = null;
    }

    this._applyContentSemantics();
    this._syncTriggerDescription();
    this._syncVisibility();

    if (this._visible) {
      this._anchor.update();
    }
  }

  private _applyContentSemantics(): void {
    const content = this._$content;

    if (!content) {
      return;
    }

    if (!this._contentState) {
      this._contentState = {
        id: content.getAttribute('id'),
        role: content.getAttribute('role'),
        ariaHidden: content.getAttribute('aria-hidden'),
        popover: content.getAttribute('popover'),
        hidden: content.hidden,
      };
    }

    if (!content.id) {
      content.id = `rc-tooltip-${++tooltipId}`;
    }

    content.setAttribute('role', 'tooltip');
    content.setAttribute('popover', 'manual');
    content.toggleAttribute('hidden', !this._visible);
    content.setAttribute('aria-hidden', String(!this._visible));
  }

  private _syncTriggerDescription(): void {
    const trigger = this._$trigger;
    const content = this._$content;

    if (!trigger || !content?.id) {
      return;
    }

    const current = trigger.getAttribute('aria-describedby');

    if (this._triggerDescribedBy === null) {
      this._triggerDescribedBy = current;
    }

    const tokens = new Set((current ?? '').split(/\s+/).filter(Boolean));

    if (!tokens.has(content.id)) {
      tokens.add(content.id);
    }

    trigger.setAttribute('aria-describedby', Array.from(tokens).join(' '));
  }

  private _restoreTrigger(): void {
    if (!this._$trigger || this._triggerDescribedBy === null) {
      return;
    }

    if (this._triggerDescribedBy === '') {
      this._$trigger.removeAttribute('aria-describedby');
    } else {
      this._$trigger.setAttribute('aria-describedby', this._triggerDescribedBy);
    }

    this._triggerDescribedBy = null;
  }

  private _restoreContent(): void {
    const content = this._$content;
    const state = this._contentState;

    if (!content || !state) {
      return;
    }

    this._popover.sync(false);

    if (state.id === null) {
      content.removeAttribute('id');
    } else {
      content.setAttribute('id', state.id);
    }

    if (state.role === null) {
      content.removeAttribute('role');
    } else {
      content.setAttribute('role', state.role);
    }

    if (state.ariaHidden === null) {
      content.removeAttribute('aria-hidden');
    } else {
      content.setAttribute('aria-hidden', state.ariaHidden);
    }

    if (state.popover === null) {
      content.removeAttribute('popover');
    } else {
      content.setAttribute('popover', state.popover);
    }

    content.hidden = state.hidden;
    this._contentState = null;
  }

  private _onFocusIn = (event: FocusEvent): void => {
    if (this._$trigger && event.composedPath().includes(this._$trigger)) {
      this._focusWithin = true;
      this._syncVisibility();
    }
  };

  private _onFocusOut = (event: FocusEvent): void => {
    const relatedTarget = event.relatedTarget;

    if (relatedTarget instanceof Node && this.contains(relatedTarget)) {
      return;
    }

    if (this._$trigger && event.composedPath().includes(this._$trigger)) {
      this._focusWithin = false;
      this._dismissedByEscape = false;
      this._syncVisibility();
    }
  };

  private _onPointerOver = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') {
      return;
    }

    const path = event.composedPath();

    if (
      (this._$trigger && path.includes(this._$trigger)) ||
      (this._$content && path.includes(this._$content))
    ) {
      this._pointerWithin = true;
      this._dismissedByEscape = false;
      this._syncVisibility();
    }
  };

  private _onPointerOut = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') {
      return;
    }

    const relatedTarget = event.relatedTarget;

    if (relatedTarget instanceof Node && this.contains(relatedTarget)) {
      return;
    }

    const path = event.composedPath();

    if (
      (this._$trigger && path.includes(this._$trigger)) ||
      (this._$content && path.includes(this._$content))
    ) {
      this._pointerWithin = false;
      this._syncVisibility();
    }
  };

  private _onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape' || !this._visible) {
      return;
    }

    event.stopPropagation();
    this._dismissedByEscape = true;
    this._focusWithin = false;
    this._pointerWithin = false;
    this._closeTooltip();
  };

  private _syncVisibility(): void {
    const shouldOpen =
      !this._dismissedByEscape && (this._focusWithin || this._pointerWithin) && !!this._$content;

    if (shouldOpen === this._visible) {
      return;
    }

    if (shouldOpen) {
      this._openTooltip();
    } else {
      this._closeTooltip();
    }
  }

  private _openTooltip(): void {
    const content = this._$content;

    if (!content) {
      return;
    }

    this._visible = true;
    this.toggleAttribute('open', true);
    this._applyContentSemantics();
    content.hidden = false;

    this._popover.sync(true);

    this._anchor.update();
  }

  private _closeTooltip(): void {
    const content = this._$content;

    this._visible = false;
    this.toggleAttribute('open', false);

    if (content) {
      this._popover.sync(false);
      content.hidden = true;
      content.setAttribute('aria-hidden', 'true');
    }

    this._anchor.update();
  }
}

export default RCTooltip;
