import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';

import fabStyles from './rc-fab.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-fab': RCFab;
  }
}

/**
 * A Floating Action Button shell that positions a consumer-provided native
 * `<button>` in a fixed viewport corner and applies elevation styling.
 *
 * Place a native `<button>` as the direct child. The button's own accessible
 * name — its text content or `aria-label` — becomes the FAB's accessible name.
 * Icons go inside the button alongside or instead of visible text.
 *
 * ```html
 * <!-- Icon-only FAB -->
 * <rc-fab>
 *   <button type="button" aria-label="Create">
 *     <span class="material-symbols-outlined" aria-hidden="true">add</span>
 *   </button>
 * </rc-fab>
 *
 * <!-- Extended FAB (icon + visible label) -->
 * <rc-fab>
 *   <button type="button">
 *     <span class="material-symbols-outlined" aria-hidden="true">edit</span>
 *     Compose
 *   </button>
 * </rc-fab>
 * ```
 *
 * @slot default - The native `<button>` element. The button's own accessible
 *   name (text content or `aria-label`) serves as the FAB's accessible name.
 *
 * @cssprop [--rc-fab-inset-block=1.5rem] - Distance from the block-axis edge.
 * @cssprop [--rc-fab-inset-inline=1.5rem] - Distance from the inline-axis edge.
 * @cssprop [--rc-fab-z-index=10] - Stacking order.
 * @cssprop [--rc-fab-bg=ButtonFace] - Button background colour.
 * @cssprop [--rc-fab-bg-hover=var(--rc-fab-bg)] - Hover background colour.
 * @cssprop [--rc-fab-color=ButtonText] - Button foreground colour.
 * @cssprop [--rc-fab-size=3.5rem] - Height and minimum width.
 * @cssprop [--rc-fab-radius=0.25rem] - Border-radius (structural default; themes override).
 * @cssprop [--rc-fab-shadow=none] - Elevation shadow.
 * @cssprop [--rc-fab-shadow-hover=var(--rc-fab-shadow)] - Hover shadow.
 * @cssprop [--rc-fab-shadow-active=none] - Pressed shadow.
 * @cssprop [--rc-fab-padding-inline=1rem] - Inline padding.
 * @cssprop [--rc-fab-gap=0.5rem] - Gap between icon and label text.
 * @cssprop [--rc-fab-font-family=inherit] - Font family for label text.
 * @cssprop [--rc-fab-font-size=0.875rem] - Font size for label text.
 * @cssprop [--rc-fab-font-weight=500] - Font weight for label text.
 * @cssprop [--rc-fab-letter-spacing=0.00625em] - Letter spacing for label text.
 * @cssprop [--rc-fab-focus-ring=2px solid currentColor] - Focus ring style.
 * @cssprop [--rc-fab-focus-ring-offset=2px] - Focus ring offset.
 * @cssprop [--rc-fab-transition-duration=200ms] - Transition speed for hover and active states.
 */
export class RCFab extends LitElement {
  static override styles = fabStyles;

  /** Viewport corner where the FAB is anchored. Uses logical inline/block directions. */
  @property({ type: String, reflect: true })
  position: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start' = 'bottom-end';

  protected override firstUpdated(): void {
    if (import.meta.env.DEV && !this.querySelector(':scope > button')) {
      console.warn(
        '[rc-fab] No direct child <button> found. Place a native <button> inside <rc-fab>.',
        this,
      );
    }
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

export default RCFab;
