import { cssText } from '@rcarls/rc-common';

/**
 * Light-DOM base styles for the disclosure panel recipe.
 *
 * `rc-disclosure` and `rc-accordion` coordinate consumer-authored native
 * `<details>` elements that stay in light DOM, so `::slotted()` cannot reach the
 * `<summary>`, the marker, the content children, or `::details-content`. This
 * installs one structural stylesheet per containing `Document` or `ShadowRoot`,
 * following the same pattern as `rc-button` and `rc-listbox`.
 *
 * One recipe serves both supported child forms: a `<details>` directly inside
 * `rc-accordion`, and one wrapped in `rc-disclosure`. Themes map their tokens to
 * these properties rather than re-selecting the native elements.
 *
 * Defaults stay close to what a user agent would render on its own, so an
 * unthemed disclosure keeps native behavior and no theme is required for the
 * component to work. In particular `--rc-disclosure-duration` defaults to `0ms`:
 * a disclosure snaps open the way the platform does until a theme opts into
 * motion.
 */
export const DISCLOSURE_BASE_CSS = cssText`
@layer rc-base {
  rc-disclosure {
    display: block;
  }

  :is(rc-disclosure, rc-accordion) > details {
    box-sizing: border-box;
    border: var(--rc-disclosure-border, 0);
    border-radius: var(--rc-disclosure-radius, 0);
    background: var(--rc-disclosure-background, transparent);
    color: var(--rc-disclosure-color, inherit);
  }

  :is(rc-disclosure, rc-accordion) > details[open] {
    background: var(--rc-disclosure-open-background, var(--rc-disclosure-background, transparent));
    box-shadow: var(--rc-disclosure-open-shadow, none);
  }

  /*
   * Deliberately no \`display\` here. Setting \`display: grid\` on a summary drops
   * its \`list-item\` box, which silently removes the native disclosure marker,
   * so that choice belongs to whichever theme also supplies a replacement.
   */
  :is(rc-disclosure, rc-accordion) > details > summary {
    box-sizing: border-box;
    min-block-size: var(--rc-disclosure-summary-min-block-size, 0);
    padding-block: var(--rc-disclosure-summary-padding-block, 0);
    padding-inline: var(--rc-disclosure-summary-padding-inline, 0);
    gap: var(--rc-disclosure-summary-gap, 0);
    color: var(--rc-disclosure-summary-color, inherit);
    font: var(--rc-disclosure-summary-font, inherit);
    cursor: pointer;
  }

  :is(rc-disclosure, rc-accordion) > details > summary::marker {
    color: var(--rc-disclosure-summary-marker-color, currentColor);
  }

  /*
   * Touch browsers keep :hover on the last tapped element, which would leave
   * a just-toggled summary looking highlighted, so only a hovering pointer
   * gets the layer.
   */
  @media (hover: hover) {
    :is(rc-disclosure, rc-accordion) > details > summary:hover {
      background: var(--rc-disclosure-summary-hover-background, transparent);
    }
  }

  :is(rc-disclosure, rc-accordion) > details > summary:focus-visible {
    outline: var(--rc-disclosure-focus-ring, var(--rc-focus-ring, 2px solid Highlight));
    outline-offset: var(--rc-disclosure-focus-ring-offset, 0);
  }

  :is(rc-disclosure, rc-accordion) > details > :not(summary) {
    box-sizing: border-box;
    padding-block: var(--rc-disclosure-content-padding-block, 0);
    padding-inline: var(--rc-disclosure-content-padding-inline, 0);
    color: var(--rc-disclosure-content-color, inherit);
    font: var(--rc-disclosure-content-font, inherit);
  }

  /*
   * Height animation is a feature-detected enhancement on the single
   * \`::details-content\` box, never a max-height ceiling on each child: a ceiling
   * clips content taller than the guess, and animating every non-summary child
   * makes each one its own animation unit. Without \`::details-content\` the
   * panel keeps the platform's snap-open behavior.
   */
  @supports selector(::details-content) {
    :is(rc-disclosure, rc-accordion) > details {
      interpolate-size: allow-keywords;
    }

    :is(rc-disclosure, rc-accordion) > details::details-content {
      block-size: 0;
      overflow: clip;
      content-visibility: hidden;
      transition:
        block-size var(--rc-disclosure-duration, 0ms) var(--rc-disclosure-easing, ease),
        content-visibility var(--rc-disclosure-duration, 0ms) var(--rc-disclosure-easing, ease)
          allow-discrete;
      transition-behavior: allow-discrete;
    }

    :is(rc-disclosure, rc-accordion) > details[open]::details-content {
      block-size: auto;
      content-visibility: visible;
    }
  }

  /*
   * Split by what actually moves: \`::details-content\`'s own transition is the
   * block-size expand/collapse, which is spatial and goes fully to zero. The
   * base component sets no transition of its own on the \`<details>\`, summary,
   * or content boxes, but this stays as a backstop for a theme that adds one
   * there (Material adds background-color/border-color/box-shadow, all
   * effects motion), shortened rather than zeroed so it does not silently
   * cancel a theme's own reduced-motion handling.
   */
  @media (prefers-reduced-motion: reduce) {
    :is(rc-disclosure, rc-accordion) > details,
    :is(rc-disclosure, rc-accordion) > details > summary,
    :is(rc-disclosure, rc-accordion) > details > :not(summary) {
      transition-duration: 50ms;
    }

    @supports selector(::details-content) {
      :is(rc-disclosure, rc-accordion) > details::details-content {
        transition-duration: 0ms;
      }
    }
  }
}
`;

const styledRoots = new WeakSet<Document | ShadowRoot>();

/** Installs the shared disclosure panel styles once per containing root. */
export function ensureDisclosureBaseStyles(root: Document | ShadowRoot): void {
  if (styledRoots.has(root)) {
    return;
  }

  styledRoots.add(root);

  const $style = (root instanceof Document ? root : root.ownerDocument).createElement('style');

  $style.setAttribute('data-rc-light-dom-base', 'rc-disclosure');
  $style.textContent = DISCLOSURE_BASE_CSS;

  if (root instanceof Document) {
    root.head.append($style);
  } else {
    root.append($style);
  }
}
