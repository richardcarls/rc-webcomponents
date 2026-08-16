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
 * @attr selected - Declarative selected state for theme styling.
 * @attr disabled - Declarative disabled state. Disables action-target click forwarding.
 * @attr interactive - Visual affordance for cards with an author-provided action target.
 * @attr action-target - ID of a same-root anchor or button that receives forwarded surface clicks.
 * @attr [has-media] - Present when the `media` slot has assigned content.
 * @attr [has-header] - Present when the `header` slot has assigned content.
 * @attr [has-title] - Present when the `title` slot has assigned content.
 * @attr [has-subtitle] - Present when the `subtitle` slot has assigned content.
 * @attr [has-actions] - Present when the `actions` slot has assigned content.
 * @attr [has-footer] - Present when the `footer` slot has assigned content.
 *
 * @cssprop [--rc-card-grid-template-rows=auto auto auto 1fr auto auto] - Grid template rows for
 *   the host's structural regions.
 * @cssprop [--rc-card-border=0] - Card border.
 * @cssprop [--rc-card-radius=0] - Card border radius.
 * @cssprop [--rc-card-bg=Canvas] - Card background.
 * @cssprop [--rc-card-color=CanvasText] - Card text color.
 * @cssprop [--rc-card-shadow=none] - Card box shadow.
 * @cssprop [--rc-card-container-bg=transparent] - Background of the non-interactive container overlay.
 * @cssprop [--rc-card-state-layer-bg=currentColor] - State-layer overlay color.
 * @cssprop [--rc-card-state-layer-duration=150ms] - State-layer opacity transition duration.
 * @cssprop [--rc-card-state-layer-easing=ease] - State-layer opacity transition easing.
 * @cssprop [--rc-card-hover-state-layer-opacity=0] - State-layer opacity on hover (interactive
 *   cards only).
 * @cssprop [--rc-card-pressed-state-layer-opacity=0] - State-layer opacity on active press
 *   (interactive cards only).
 * @cssprop [--rc-card-padding-block] - Shared block-axis padding fallback for regions that don't
 *   set their own `*-padding-block` property. Defers to each region's own default (0 for
 *   header/title/subtitle/actions/footer, 1rem for body) when unset.
 * @cssprop [--rc-card-padding-inline] - Shared inline-axis padding fallback for regions that
 *   don't set their own `*-padding-inline` property. Defers to each region's own default (0 for
 *   header/title/subtitle/actions/footer, 1rem for body) when unset.
 * @cssprop [--rc-card-media-grid-row=auto] - Grid row for the media region.
 * @cssprop [--rc-card-header-grid-row=auto] - Grid row for the header region.
 * @cssprop [--rc-card-header-padding-block=var(--rc-card-padding-block, 0) 0] - Header block-axis padding.
 * @cssprop [--rc-card-header-padding-inline=var(--rc-card-padding-inline, 0)] - Header inline-axis padding.
 * @cssprop [--rc-card-title-grid-row=auto] - Grid row for the title region.
 * @cssprop [--rc-card-title-padding-block=var(--rc-card-padding-block, 0) 0] - Title block-axis padding.
 * @cssprop [--rc-card-title-padding-inline=var(--rc-card-padding-inline, 0)] - Title inline-axis padding.
 * @cssprop [--rc-card-title-color=inherit] - Title text color.
 * @cssprop [--rc-card-title-font=inherit] - Title font shorthand.
 * @cssprop [--rc-card-subtitle-grid-row=auto] - Grid row for the subtitle region.
 * @cssprop [--rc-card-subtitle-padding-block=0] - Subtitle block-axis padding.
 * @cssprop [--rc-card-subtitle-padding-inline=var(--rc-card-padding-inline, 0)] - Subtitle inline-axis padding.
 * @cssprop [--rc-card-subtitle-color=inherit] - Subtitle text color.
 * @cssprop [--rc-card-subtitle-font=inherit] - Subtitle font shorthand.
 * @cssprop [--rc-card-body-grid-row=auto] - Grid row for the body region.
 * @cssprop [--rc-card-body-padding-block=var(--rc-card-padding-block, 1rem)] - Body block-axis padding.
 * @cssprop [--rc-card-body-padding-inline=var(--rc-card-padding-inline, 1rem)] - Body inline-axis padding.
 * @cssprop [--rc-card-actions-grid-row=auto] - Grid row for the actions region.
 * @cssprop [--rc-card-actions-justify=flex-end] - Justify-content for the actions row.
 * @cssprop [--rc-card-actions-gap=0] - Gap between action items.
 * @cssprop [--rc-card-actions-padding-block=0 var(--rc-card-padding-block, 0)] - Actions block-axis padding.
 * @cssprop [--rc-card-actions-padding-inline=var(--rc-card-padding-inline, 0)] - Actions inline-axis padding.
 * @cssprop [--rc-card-footer-grid-row=auto] - Grid row for the footer region.
 * @cssprop [--rc-card-footer-padding-block=0 var(--rc-card-padding-block, 0)] - Footer block-axis padding.
 * @cssprop [--rc-card-footer-padding-inline=var(--rc-card-padding-inline, 0)] - Footer inline-axis padding.
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

  @queryAssignedElements({ slot: 'media', flatten: true }) private _$media!: Element[];
  @queryAssignedElements({ slot: 'header', flatten: true }) private _$header!: Element[];
  @queryAssignedElements({ slot: 'title', flatten: true }) private _$title!: Element[];
  @queryAssignedElements({ slot: 'subtitle', flatten: true }) private _$subtitle!: Element[];
  @queryAssignedElements({ slot: 'actions', flatten: true }) private _$actions!: Element[];
  @queryAssignedElements({ slot: 'footer', flatten: true }) private _$footer!: Element[];

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
      media: this._$media ?? [],
      header: this._$header ?? [],
      title: this._$title ?? [],
      subtitle: this._$subtitle ?? [],
      actions: this._$actions ?? [],
      footer: this._$footer ?? [],
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
    const $target =
      root instanceof Document || root instanceof ShadowRoot ? root.getElementById(id) : null;

    if ($target instanceof HTMLAnchorElement || $target instanceof HTMLButtonElement) {
      return $target;
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

    const $target = this._resolveActionTarget();

    if (!$target) {
      return;
    }

    event.preventDefault();
    $target.click();
  }

  constructor() {
    super();
    this.addEventListener('click', (event) => this._handleClick(event as MouseEvent));
  }
}

export default RCCard;
