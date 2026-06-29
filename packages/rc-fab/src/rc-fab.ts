import { LitElement, html } from 'lit';
import type { PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';

import {
  NativeChildController,
  ScrollObserverController,
  findNearestScrollAncestor,
  warnMissingDirectChild,
} from '@rcarls/rc-common';

import fabStyles from './rc-fab.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-fab': RCFab;
  }
}

/**
 * Sticky floating action button modeled after the Material 3 Floating action button,
 * wrapping a consumer-supplied button with scroll-aware visibility.
 *
 * Adapted from the Material Design FAB component, use this for "back to top",
 * sticky CTAs, chat launchers, and of course as FABs in your Material Design PWA.
 *
 * Place a native `<button>` as the direct child. The button's own accessible
 * name (text content or `aria-label`) becomes the FAB's accessible name.
 *
 * Icons go inside the button alongside or instead of visible text.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-fab rc-fab docs}
 * @see {@link https://m3.material.io/components/floating-action-button/overview Material 3 Floating action button}
 *
 * @example Back to top (scroll-triggered)
 * ```html
 * <rc-fab scroll-reveal>
 *   <button type="button" aria-label="Back to top" onclick="scrollTo({top:0,behavior:'smooth'})">
 *     <span aria-hidden="true">↑</span>
 *   </button>
 * </rc-fab>
 * ```
 *
 * @example Icon-only FAB (always visible)
 * ```html
 * <rc-fab>
 *   <button type="button" aria-label="Create">
 *     <span class="material-symbols-outlined" aria-hidden="true">add</span>
 *   </button>
 * </rc-fab>
 * ```
 *
 * @example Extended FAB (icon + visible label)
 * ```html
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
 * @cssprop [--rc-fab-position=fixed] - CSS position value. Override to `absolute` for layout-relative placement or `sticky` for scroll-snapping.
 * @cssprop [--rc-fab-inset-block=1.5rem] - Distance from the block-axis edge.
 * @cssprop [--rc-fab-inset-inline=1.5rem] - Distance from the inline-axis edge.
 * @cssprop [--rc-fab-z-index=10] - Stacking order.
 * @cssprop [--rc-fab-bg=ButtonFace] - Button background colour.
 * @cssprop [--rc-fab-bg-hover=var(--rc-fab-bg)] - Hover background colour.
 * @cssprop [--rc-fab-color=ButtonText] - Button foreground colour.
 * @cssprop [--rc-fab-size=3.5rem] - Height and minimum width.
 * @cssprop [--rc-fab-radius=9999px] - Border-radius. Default is pill-shaped. Override to `50%` for a circle (icon-only), `1rem` for Material rounded-square, etc.
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
 * @cssprop [--rc-fab-disabled-opacity=0.38] - Opacity applied when the button is disabled.
 * @cssprop [--rc-fab-transition-duration=200ms] - Transition speed for hover and active states.
 * @cssprop [--rc-fab-scroll-threshold=300px] - Scroll distance at which the FAB becomes fully visible. Requires the `scroll-reveal` attribute. The JS fallback reads this value once on connect; px units only.
 * @cssprop [--rc-fab-scroll-timeline=scroll(root block)] - The `animation-timeline` value used for scroll-reveal. Override to target a different scroller, e.g. `scroll(nearest block)` for embedded contexts. CSS path only; the JS fallback discovers the nearest scrollable ancestor automatically.
 *
 */
export class RCFab extends LitElement {
  static override styles = fabStyles;

  private _scrollCtrl?: ScrollObserverController;

  /** Viewport corner where the FAB is anchored. Uses logical inline/block directions. */
  @property({ type: String, reflect: true })
  position: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start' = 'bottom-end';

  /** Reveal the FAB only after the page scrolls past `--rc-fab-scroll-threshold` (default 300 px). Uses CSS scroll-driven animations; falls back to a passive scroll listener in unsupported browsers. */
  @property({ type: Boolean, attribute: 'scroll-reveal', reflect: true })
  scrollReveal = false;

  constructor() {
    super();

    new NativeChildController<HTMLButtonElement>(this, {
      selector: ':scope > button',
      observe: true,
      onMissing: () => {
        if (import.meta.env.DEV) {
          warnMissingDirectChild(this, {
            selector: ':scope > button',
            message:
              '[rc-fab] No direct child <button> found. Place a native <button> inside <rc-fab>.',
          });
        }
      },
    });
  }

  protected override updated(changed: PropertyValues): void {
    super.updated(changed);

    if (changed.has('scrollReveal') || (this.scrollReveal && !this._scrollCtrl)) {
      this._syncScrollFallback();
    }
  }

  private _syncScrollFallback(): void {
    if (this._scrollCtrl) {
      this._scrollCtrl.setOptions({ disabled: true });
      this.removeController(this._scrollCtrl);
      this._scrollCtrl = undefined;

      this.removeAttribute('scroll-below-threshold');
    }

    if (!this.scrollReveal || CSS.supports('animation-timeline: scroll()')) return;

    const threshold = this._getThreshold();

    this._scrollCtrl = new ScrollObserverController(this, {
      target: () => findNearestScrollAncestor(this),
      threshold,
      onScroll: (scrollTop) => {
        this.toggleAttribute('scroll-below-threshold', scrollTop < threshold);
      },
    });
  }

  private _getThreshold(): number {
    const raw = getComputedStyle(this).getPropertyValue('--rc-fab-scroll-threshold').trim();
    const n = parseFloat(raw);

    return Number.isFinite(n) ? n : 300;
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}

export default RCFab;
