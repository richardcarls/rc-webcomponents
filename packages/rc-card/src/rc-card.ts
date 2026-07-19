import { LitElement, html } from 'lit';
import { property, queryAssignedElements } from 'lit/decorators.js';

import cardStyles from './rc-card.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-card': RCCard;
  }
}

const INTERACTIVE_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[role="button"]',
  '[role="link"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const SLOT_NAMES = ['media', 'header', 'title', 'subtitle', 'actions', 'footer'] as const;

type SlotName = (typeof SLOT_NAMES)[number];

/**
 * Design-system-neutral card shell with first-class structural parts and
 * optional pointer delegation to an author-provided anchor or button.
 *
 * @slot media - Media region, typically an image or figure.
 * @slot header - Header content above title/body.
 * @slot title - Primary card title.
 * @slot subtitle - Secondary title or metadata.
 * @slot - Body content.
 * @slot actions - Action row.
 * @slot footer - Footer content.
 *
 * @csspart container - Non-interactive visual container overlay.
 * @csspart media - Media region wrapper.
 * @csspart header - Header region wrapper.
 * @csspart title - Title region wrapper.
 * @csspart subtitle - Subtitle region wrapper.
 * @csspart body - Body region wrapper.
 * @csspart actions - Actions region wrapper.
 * @csspart footer - Footer region wrapper.
 * @csspart state-layer - Non-interactive overlay for hover/pressed/ripple effects.
 *
 * @attr action-target - ID of a same-root anchor or button that receives forwarded surface clicks.
 */
export class RCCard extends LitElement {
  static override styles = cardStyles;

  /** Declarative selected state for theme styling. */
  @property({ type: Boolean, reflect: true })
  selected = false;

  /** Declarative disabled state. Disables action-target click forwarding. */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Visual affordance for cards with an author-provided action target. */
  @property({ type: Boolean, reflect: true })
  interactive = false;

  /** ID of a same-root anchor or button that receives forwarded surface clicks. */
  @property({ type: String, attribute: 'action-target' })
  actionTarget = '';

  @queryAssignedElements({ slot: 'media', flatten: true }) private _media!: Element[];
  @queryAssignedElements({ slot: 'header', flatten: true }) private _header!: Element[];
  @queryAssignedElements({ slot: 'title', flatten: true }) private _title!: Element[];
  @queryAssignedElements({ slot: 'subtitle', flatten: true }) private _subtitle!: Element[];
  @queryAssignedElements({ slot: 'actions', flatten: true }) private _actions!: Element[];
  @queryAssignedElements({ slot: 'footer', flatten: true }) private _footer!: Element[];

  private _slotMicrotaskQueued = false;

  protected override firstUpdated(): void {
    this._syncSlotPresence();
  }

  protected override render() {
    return html`
      <div part="container" aria-hidden="true"></div>
      <div part="media"><slot name="media" @slotchange=${this._handleSlotChange}></slot></div>
      <div part="header"><slot name="header" @slotchange=${this._handleSlotChange}></slot></div>
      <div part="title"><slot name="title" @slotchange=${this._handleSlotChange}></slot></div>
      <div part="subtitle"><slot name="subtitle" @slotchange=${this._handleSlotChange}></slot></div>
      <div part="body"><slot @slotchange=${this._handleSlotChange}></slot></div>
      <div part="actions"><slot name="actions" @slotchange=${this._handleSlotChange}></slot></div>
      <div part="footer"><slot name="footer" @slotchange=${this._handleSlotChange}></slot></div>
      <div part="state-layer" aria-hidden="true"></div>
    `;
  }

  private _handleSlotChange(): void {
    if (this._slotMicrotaskQueued) {
      return;
    }

    this._slotMicrotaskQueued = true;

    queueMicrotask(() => {
      this._slotMicrotaskQueued = false;

      if (!this.isConnected) {
        return;
      }

      this._syncSlotPresence();
    });
  }

  private _syncSlotPresence(): void {
    const bySlot: Record<SlotName, Element[]> = {
      media: this._media ?? [],
      header: this._header ?? [],
      title: this._title ?? [],
      subtitle: this._subtitle ?? [],
      actions: this._actions ?? [],
      footer: this._footer ?? [],
    };

    for (const slotName of SLOT_NAMES) {
      this.toggleAttribute(`has-${slotName}`, bySlot[slotName].length > 0);
    }
  }

  private _resolveActionTarget(): HTMLAnchorElement | HTMLButtonElement | null {
    const id = this.actionTarget.trim();

    if (!id) {
      return null;
    }

    const root = this.getRootNode();
    const target =
      root instanceof Document || root instanceof ShadowRoot ? root.getElementById(id) : null;

    if (target instanceof HTMLAnchorElement || target instanceof HTMLButtonElement) {
      return target;
    }

    if (import.meta.env.DEV) {
      console.warn(`[rc-card] action-target="${id}" must reference a same-root <a> or <button>.`);
    }

    return null;
  }

  private _eventStartedInInteractiveDescendant(event: Event): boolean {
    for (const entry of event.composedPath()) {
      if (entry === this) {
        return false;
      }

      if (entry instanceof Element && entry.matches(INTERACTIVE_SELECTOR)) {
        return true;
      }
    }

    return false;
  }

  private _handleClick(event: MouseEvent): void {
    if (this.disabled || event.defaultPrevented || event.button !== 0) {
      return;
    }

    if (this._eventStartedInInteractiveDescendant(event)) {
      return;
    }

    const target = this._resolveActionTarget();

    if (!target) {
      return;
    }

    event.preventDefault();
    target.click();
  }

  constructor() {
    super();
    this.addEventListener('click', (event) => this._handleClick(event as MouseEvent));
  }
}

export default RCCard;
