/**
 * Light-DOM base styles for the dialog surface.
 *
 * `rc-dialog` coordinates a consumer-authored native `<dialog>` that stays in
 * light DOM, so `::slotted()` cannot reach it or its `::backdrop`. This installs
 * one structural stylesheet per containing `Document` or `ShadowRoot`, following
 * the same pattern as `rc-button` and `rc-disclosure`.
 *
 * Themes map their tokens onto these properties rather than re-selecting the
 * native element. Defaults stay close to a plain `<dialog>`, so the component
 * needs no theme to be usable.
 */
const SURFACE = 'rc-dialog > dialog';
const FULLSCREEN = "rc-dialog[variant='fullscreen'] > dialog";

export const DIALOG_BASE_CSS = `
@layer rc-base {
  ${SURFACE} {
    box-sizing: border-box;
    min-inline-size: var(--rc-dialog-min-inline-size, auto);
    max-inline-size: var(--rc-dialog-max-inline-size, none);
    /*
     * A native dialog's own default max-block-size plus overflow:auto is what
     * would otherwise bound a tall dialog, but Chromium does not reliably clip
     * a scrolling element's own border-radius once it actually needs to scroll:
     * a short dialog renders correctly rounded on every edge, and the same
     * dialog forced to overflow loses the radius on whichever edge sits at the
     * scroll boundary. An explicit bound plus overflow: hidden replaces that
     * reliance, so this outer surface never scrolls itself and its corners
     * always clip. A scrollable dialog scrolls a dedicated inner region.
     */
    max-block-size: var(--rc-dialog-max-block-size, calc(100dvb - 2rem));
    overflow: hidden;
    padding: var(--rc-dialog-padding, 1em);
    border: var(--rc-dialog-border, 0);
    border-radius: var(--rc-dialog-radius, 0);
    background: var(--rc-dialog-background, Canvas);
    color: var(--rc-dialog-color, CanvasText);
    box-shadow: var(--rc-dialog-shadow, none);
  }

  ${SURFACE}::backdrop {
    background: var(--rc-dialog-scrim, color-mix(in srgb, CanvasText 32%, transparent));
  }

  /*
   * A native <dialog> can animate its own open/close entirely through CSS:
   * @starting-style plus transition-behavior: allow-discrete lets it fade and
   * scale in and out without any JavaScript coordinating the timing.
   * showModal()/close() still run synchronously; the discrete transition on
   * display/overlay is what keeps the surface (and its backdrop) rendered
   * and interactive for the duration of the exit transition instead of
   * vanishing the instant close() removes [open]. Nothing here is gated on a
   * transition event finishing, so a zero-duration theme or an unsupported
   * browser both degrade to an instant, fully correct open and close.
   */
  @media (prefers-reduced-motion: no-preference) {
    /*
     * Opacity only, deliberately not scale: this surface supports pointer
     * resize (data-rc-dialog-resize-axis/-origin), which measures
     * getBoundingClientRect() to compute a drag delta. scale is a visual
     * transform, so getBoundingClientRect() reports the transformed
     * (shrunk) box for as long as an entrance scale is still animating,
     * corrupting that measurement if a resize starts during it — caught
     * directly by three existing resize tests failing at ~95% of their
     * expected geometry the moment a scale transition was added here.
     * Opacity has no such effect on layout or the measured box.
     *
     * The transition shorthand is fully redeclared per state rather than
     * shared, because the timing function that actually runs is the one on
     * the state being transitioned TO: opening reads [open]'s (enter,
     * decelerating), closing reads :not([open])'s (exit, accelerating).
     */
    ${SURFACE}[open] {
      opacity: 1;
      transition:
        opacity var(--rc-motion-effects-duration-default, 200ms)
          var(--rc-motion-effects-easing-enter, ease-out),
        overlay var(--rc-motion-effects-duration-default, 200ms) allow-discrete,
        display var(--rc-motion-effects-duration-default, 200ms) allow-discrete;
    }

    ${SURFACE}:not([open]) {
      opacity: 0;
      transition:
        opacity var(--rc-motion-effects-duration-default, 200ms)
          var(--rc-motion-effects-easing-exit, ease-in),
        overlay var(--rc-motion-effects-duration-default, 200ms) allow-discrete,
        display var(--rc-motion-effects-duration-default, 200ms) allow-discrete;
    }

    @starting-style {
      ${SURFACE}[open] {
        opacity: 0;
      }
    }

    /* The scrim fades in step with the surface, not instantly. */
    ${SURFACE}[open]::backdrop {
      opacity: 1;
      transition: opacity var(--rc-motion-effects-duration-default, 200ms)
        var(--rc-motion-effects-easing-enter, ease-out);
    }

    ${SURFACE}:not([open])::backdrop {
      opacity: 0;
      transition: opacity var(--rc-motion-effects-duration-default, 200ms)
        var(--rc-motion-effects-easing-exit, ease-in);
    }

    @starting-style {
      ${SURFACE}[open]::backdrop {
        opacity: 0;
      }
    }
  }

  /*
   * Fullscreen geometry is structural rather than a theme choice: the surface
   * fills the visual viewport, which is what keeps it correct under browser
   * zoom and a software keyboard. The viewport values are written by the
   * component; see the note on RCDialog.
   *
   * Only padding and background are left for a theme to set, since those are
   * the two that genuinely differ from the standard surface.
   */
  ${FULLSCREEN} {
    position: fixed;
    inset: auto;
    top: var(--rc-dialog-visual-viewport-top, 0);
    left: var(--rc-dialog-visual-viewport-left, 0);
    inline-size: var(--rc-dialog-visual-viewport-width, 100dvw);
    block-size: var(--rc-dialog-visual-viewport-height, 100dvh);
    max-inline-size: none;
    max-block-size: none;
    margin: 0;
    padding-block: var(
      --rc-dialog-fullscreen-padding-block,
      max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-bottom))
    );
    padding-inline: var(
      --rc-dialog-fullscreen-padding-inline,
      max(1rem, env(safe-area-inset-left)) max(1rem, env(safe-area-inset-right))
    );
    background: var(--rc-dialog-fullscreen-background, var(--rc-dialog-background, Canvas));
    border: 0;
    border-radius: 0;
    box-shadow: none;
    resize: none;
    transform: none;
  }
}
`;

const styledRoots = new WeakSet<Document | ShadowRoot>();

/** Installs the dialog surface styles once per containing root. */
export function ensureDialogBaseStyles(root: Document | ShadowRoot): void {
  if (styledRoots.has(root)) {
    return;
  }

  styledRoots.add(root);

  const $style = (root instanceof Document ? root : root.ownerDocument).createElement('style');

  $style.setAttribute('data-rc-light-dom-base', 'rc-dialog');
  $style.textContent = DIALOG_BASE_CSS;

  if (root instanceof Document) {
    root.head.append($style);
  } else {
    root.append($style);
  }
}
