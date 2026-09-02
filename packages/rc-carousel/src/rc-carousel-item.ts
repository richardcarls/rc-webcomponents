import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';

import type { RCCarousel } from './rc-carousel.js';

import carouselItemStyles from './rc-carousel-item.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-carousel-item': RCCarouselItem;
  }
}

/**
 * One slide of an `rc-carousel`. Participates directly in the parent's
 * scroll-snap track as a grid-auto-flow child — `rc-carousel-item` owns its
 * own snap alignment and accessibility state, but authored content (an
 * `<img>` with real alt text, arbitrary markup) stays exactly as slotted,
 * never cloned or re-parented, so it remains directly available to forms,
 * labels, and assistive technology.
 *
 * While off-screen (not the intersecting slide, including a partially
 * visible peek), the slide is marked `aria-hidden` and `inert`: it stays
 * visually and pointer-interactively present as a peek affordance, but
 * drops out of the accessibility tree and the Tab sequence, so a slide's
 * interactive descendants (a button, a link) can't be reached by keyboard
 * or announced by a screen reader until their slide is actually active.
 *
 * @slot - Slide content.
 *
 * @cssprop [--rc-carousel-item-color=CanvasText] - Slide foreground color.
 * @cssprop [--rc-carousel-item-scroll-snap-align=start] - Snap alignment
 *   within the track. Override for a center-aligned layout.
 * @cssprop [--rc-carousel-item-background=transparent] - Slide surface
 *   background, e.g. for an MD3 card-like slide shape.
 * @cssprop [--rc-carousel-item-border-radius=0] - Slide corner radius.
 * @cssprop [--rc-carousel-item-overflow=hidden] - Overflow behavior for
 *   slotted content that exceeds the slide's own box. `hidden` clips to
 *   the corner radius (matching media-item slides); text-heavy slides
 *   that need their own internal scroll may want `auto` instead.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-carousel rc-carousel documentation}
 */
export class RCCarouselItem extends LitElement {
  static override styles = carouselItemStyles;

  private readonly _internals: ElementInternals;

  private _intersectionObserver: IntersectionObserver | null = null;

  /**
   * "N of M" position assigned by the parent `rc-carousel`. Internal
   * integration point, not a public API — see the `@attr` note above.
   */
  @property({ type: String, attribute: false })
  position = '';

  constructor() {
    super();
    this._internals = this.attachInternals();
    this._internals.role = 'group';
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'group');
    }

    if (!this.hasAttribute('aria-roledescription')) {
      this.setAttribute('aria-roledescription', 'slide');
    }

    this._observeIntersection();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();

    this._intersectionObserver?.disconnect();
    this._intersectionObserver = null;
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed);

    if (changed.has('position')) {
      this._syncDefaultLabel();
    }
  }

  private _syncDefaultLabel(): void {
    if (this.hasAttribute('aria-label') || this.hasAttribute('aria-labelledby')) {
      return;
    }

    if (this.position) {
      this.setAttribute('aria-label', this.position);
    }
  }

  /**
   * Observes intersection against the parent carousel's own scroll
   * container (not the viewport — a slide can be viewport-visible yet
   * still clipped/off-screen within the track on a page where the
   * carousel isn't the whole viewport). Reads `trackElement` off the
   * parent `rc-carousel`, an internal integration point rather than a
   * public API — awaits the parent's own first render first, since a
   * slotted item's `connectedCallback` isn't guaranteed to run after its
   * host's, and `trackElement` only exists once the host has rendered.
   */
  private async _observeIntersection(): Promise<void> {
    if (this.hasAttribute('data-clone')) {
      this.setAttribute('aria-hidden', 'true');
      this.setAttribute('inert', '');

      return;
    }

    const $carousel = this.closest('rc-carousel') as RCCarousel | null;

    await $carousel?.updateComplete;

    const $root = $carousel?.trackElement ?? null;

    this._intersectionObserver?.disconnect();

    if (typeof IntersectionObserver !== 'function' || !$root) {
      this.removeAttribute('aria-hidden');
      this.removeAttribute('inert');

      return;
    }

    this._intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        const hidden = entry !== undefined && !entry.isIntersecting;

        if (hidden) {
          if (this.contains(this.ownerDocument.activeElement)) {
            $carousel?.trackElement?.focus();
          }

          this.setAttribute('aria-hidden', 'true');
        } else {
          this.removeAttribute('aria-hidden');
        }

        this.toggleAttribute('inert', hidden);
      },
      // A low/zero threshold would count a peeking neighbor's own sliver
      // of visible pixels as "intersecting", never hiding it — a peek is
      // real but not readable/interactive, so it should still hide. 0.5
      // reliably separates "the active slide" (near-fully visible) from
      // "a peeking neighbor" (a fraction of it showing).
      { root: $root, threshold: 0.5 },
    );

    this._intersectionObserver.observe(this);
  }

  protected override render() {
    return html`<slot></slot>`;
  }
}
