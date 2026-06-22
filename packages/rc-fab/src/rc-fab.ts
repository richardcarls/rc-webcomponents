import { LitElement, html, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import fabStyles from './rc-fab.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-fab': RCFab;
  }
}

/**
 * A "floating action button (FAB)" implementation, adapted from Material Design 3.
 *
 * Use `variant="regular"` (default) for an icon-only FAB, or
 * `variant="extended"` to show an icon alongside the `label`.
 *
 * Place the button icon in the `icon` slot:
 *
 * ```html
 * <rc-fab label="New item">
 *   <iconify-icon slot="icon" icon="mdi-plus"></iconify-icon>
 * </rc-fab>
 * ```
 *
 * @slot icon - The icon element displayed inside the button.
 *
 * @csspart button - The inner `<button>` element.
 *
 * @cssprop [--rc-fab-bg=Canvas] - Button background colour.
 * @cssprop [--rc-fab-bg-hover=var(--rc-fab-bg)] - Hover background colour.
 * @cssprop [--rc-fab-color=CanvasText] - Foreground (icon + label) colour.
 * @cssprop [--rc-fab-size=3.5rem] - Height and minimum width of the button.
 * @cssprop [--rc-fab-radius=1rem] - Border-radius of the button.
 * @cssprop [--rc-fab-shadow=0 3px 8px rgb(0 0 0 / 0.3)] - Box shadow at rest.
 * @cssprop [--rc-fab-shadow-hover=0 6px 16px rgb(0 0 0 / 0.3)] - Box shadow on hover.
 * @cssprop [--rc-fab-shadow-active=0 2px 4px rgb(0 0 0 / 0.3)] - Box shadow while pressed.
 * @cssprop [--rc-fab-padding-inline=1rem] - Inline padding (extended variant).
 * @cssprop [--rc-fab-gap=0.5rem] - Gap between icon and label (extended variant).
 * @cssprop [--rc-fab-icon-size=1.5rem] - Font-size applied to the slotted icon.
 * @cssprop [--rc-fab-font-family=inherit] - Font family for the label.
 * @cssprop [--rc-fab-font-size=0.875rem] - Label font size (extended variant).
 * @cssprop [--rc-fab-font-weight=500] - Label font weight.
 * @cssprop [--rc-fab-letter-spacing=0.00625em] - Label letter spacing.
 * @cssprop [--rc-fab-focus-ring=2px solid currentColor] - Focus ring style.
 * @cssprop [--rc-fab-focus-ring-offset=2px] - Focus ring offset.
 * @cssprop [--rc-fab-transition-duration=200ms] - Transition speed for hover/active.
 */
export class RCFab extends LitElement {
  static override styles = fabStyles;

  /** Display variant. `regular` shows only the icon; `extended` adds the label. */
  @property({ type: String, reflect: true })
  variant: 'regular' | 'extended' = 'regular';

  /** Visible label text shown in the `extended` variant and used as `aria-label` for `regular`. */
  @property({ type: String })
  label = '';

  /** Disables the button. */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  protected override render() {
    return html`
      <button
        part="button"
        type="button"
        ?disabled=${this.disabled}
        aria-label=${this.variant === 'regular' ? this.label : nothing}
      >
        <slot name="icon"></slot>

        <span id="label">${this.label}</span>
      </button>
    `;
  }
}

export default RCFab;
