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
 * @attr position - Viewport corner where the FAB is anchored.
 * @attr scroll-reveal - Reveal the FAB only after the page scrolls past
 *   `--rc-fab-scroll-threshold`.
 * @attr [scroll-below-threshold] - Present when `scroll-reveal` is active and the page hasn't
 *   scrolled past `--rc-fab-scroll-threshold` yet. Only used by the JS scroll-driven-animation
 *   fallback; unused when the browser supports `animation-timeline: scroll()`.
 *
 * @cssprop [--rc-fab-position=fixed] - CSS position value. Override to `absolute` for layout-relative placement or `sticky` for scroll-snapping.
 * @cssprop [--rc-fab-inset-block=1.5rem] - Distance from the block-axis edge.
 * @cssprop [--rc-fab-inset-inline=1.5rem] - Distance from the inline-axis edge.
 * @cssprop [--rc-fab-z-index=10] - Stacking order.
 * @cssprop [--rc-fab-gap] - Gap between icon and label text. Unset by default; packaged themes
 *   such as `rc-theme-material` set `0.5rem`.
 * @cssprop [--rc-fab-size] - Minimum inline size and block size of the button. Unset by
 *   default (native button sizing applies); packaged themes such as `rc-theme-material` set
 *   `3.5rem`.
 * @cssprop [--rc-fab-padding-block] - Button block-axis padding (defers to native button
 *   padding when unset).
 * @cssprop [--rc-fab-padding-inline] - Button inline-axis padding (defers to native button
 *   padding when unset).
 * @cssprop [--rc-fab-bg] - Button background (defers to native button background when unset).
 * @cssprop [--rc-fab-color] - Button foreground color (defers to native button color when
 *   unset).
 * @cssprop [--rc-fab-border] - Button border (defers to native button border when unset).
 * @cssprop [--rc-fab-radius] - Button border-radius (defers to native button radius when
 *   unset). Override to `9999px` for pill-shaped, `50%` for a circle (icon-only), `1rem` for
 *   Material rounded-square, etc.
 * @cssprop [--rc-fab-shadow] - Elevation shadow (defers to native button shadow when unset).
 * @cssprop [--rc-fab-font-family] - Font family for label text (defers to native button font
 *   when unset).
 * @cssprop [--rc-fab-font-size] - Font size for label text (defers to native button font when
 *   unset).
 * @cssprop [--rc-fab-font-weight] - Font weight for label text (defers to native button font
 *   when unset).
 * @cssprop [--rc-fab-letter-spacing] - Letter spacing for label text (defers to native button
 *   styling when unset).
 * @cssprop [--rc-fab-transition] - Transition shorthand for hover/active state changes (defers
 *   to native button transition when unset).
 * @cssprop [--rc-fab-bg-hover] - Hover background (defers to native `:hover` styling when
 *   unset).
 * @cssprop [--rc-fab-shadow-hover] - Hover shadow (defers to native `:hover` styling when
 *   unset).
 * @cssprop [--rc-fab-shadow-active] - Pressed shadow (defers to native `:active` styling when
 *   unset).
 * @cssprop [--rc-fab-active-transform] - Transform applied while pressed, e.g. `scale(0.96)`
 *   (defers to native `:active` styling when unset).
 * @cssprop [--rc-fab-focus-ring] - Focus ring style (defers to native `:focus-visible` styling
 *   when unset).
 * @cssprop [--rc-fab-focus-ring-offset] - Focus ring offset (defers to native `:focus-visible`
 *   styling when unset).
 * @cssprop [--rc-fab-disabled-opacity] - Opacity applied when the button is disabled (defers to
 *   native `:disabled` styling when unset).
 * @cssprop [--rc-fab-disabled-shadow] - Shadow applied when the button is disabled (defers to
 *   native `:disabled` styling when unset).
 * @cssprop [--rc-fab-scroll-threshold=300px] - Scroll distance at which the FAB becomes fully visible. Requires the `scroll-reveal` attribute. The JS fallback reads this value once on connect; px units only.
 * @cssprop [--rc-fab-scroll-timeline=scroll(root block)] - The `animation-timeline` value used for scroll-reveal. Override to target a different scroller, e.g. `scroll(nearest block)` for embedded contexts. CSS path only; the JS fallback discovers the nearest scrollable ancestor automatically.
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

    if (!this.scrollReveal || CSS.supports('animation-timeline: scroll()')) {
      return;
    }

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
