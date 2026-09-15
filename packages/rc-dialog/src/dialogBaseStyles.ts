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
