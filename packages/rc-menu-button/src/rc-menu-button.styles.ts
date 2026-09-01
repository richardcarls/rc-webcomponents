import { css } from 'lit';

export const menuButtonStyles = css`
  :host {
    display: inline-block;
  }

  :host([orientation='vertical']) {
    display: block;
  }

  #root {
    display: inline-block;
  }

  :host([orientation='vertical']) #root {
    display: block;
    inline-size: 100%;
  }

  #trigger-wrap {
    position: relative;
    display: inline-block;
  }

  :host([orientation='vertical']) #trigger-wrap {
    display: block;
    inline-size: 100%;
  }

  /*
   * Icon-only triggers (e.g. a toolbar's overflow button) can render
   * visually smaller than the accessible 48dp touch-target minimum,
   * especially at a narrow width. This is a floor, not a fixed size: a
   * trigger already at or above it (the default width, or a labeled
   * trigger) is unaffected. #trigger-wrap reserves the layout space and
   * centers the (possibly smaller) slotted trigger within it; the actual
   * larger hit region comes from the light-DOM hit-slop pseudo-element in
   * rc-menu-button.ts. Mirrors rc-button's own touch-target affordance.
   *
   * Scoped to [icon-only] rather than applied unconditionally: switching
   * #trigger-wrap to a flex/grid container would blockify the slotted
   * trigger's own inline-flex display (its getComputedStyle().display
   * becomes "flex", per the CSS Display spec's flex-item blockification —
   * harmless for layout, since a flex item is sized by its container's
   * flex algorithm regardless of its own inline/block outer type, but an
   * observable change other callers shouldn't have to account for).
   */
  :host([icon-only]) #trigger-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-block-size: var(--rc-menu-button-touch-target-block-size, 3rem);
    min-inline-size: var(
      --rc-menu-button-touch-target-inline-size,
      var(--rc-menu-button-touch-target-block-size, 3rem)
    );
    /*
     * Zero by default. A theme or consumer sets one of these on a trigger
     * that sits at a real edge (no neighbor on that side) to let the
     * touch-target inflation above overlap into whatever sits just outside
     * the host instead of also reserving layout space there. Mirrors
     * rc-button's own --rc-button-touch-target-overlap-inline-* tokens.
     */
    margin-inline-start: calc(-1 * var(--rc-menu-button-touch-target-overlap-inline-start, 0px));
    margin-inline-end: calc(-1 * var(--rc-menu-button-touch-target-overlap-inline-end, 0px));
  }

  :host([icon-only][orientation='vertical']) #trigger-wrap {
    display: flex;
  }

  /*
   * Icon-only trigger width: square by default (matches its own block
   * size), or a distinct value for a narrower/wider variant. Padding is
   * cleared since an icon-only trigger centers its (typically single) icon
   * child via the flex alignment above rather than via inline padding.
   */
  :host([icon-only]) slot[name='trigger']::slotted(button),
  :host([icon-only]) slot[name='trigger']::slotted([role='button']) {
    inline-size: var(
      --rc-menu-button-icon-size,
      var(--rc-menu-button-trigger-block-size, var(--rc-control-block-size, 2.25em))
    );
    min-inline-size: var(
      --rc-menu-button-icon-size,
      var(--rc-menu-button-trigger-block-size, var(--rc-control-block-size, 2.25em))
    );
    padding-inline: 0;
  }

  slot[name='trigger']::slotted(button),
  slot[name='trigger']::slotted([role='button']) {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--rc-menu-button-trigger-gap, var(--rc-item-gap, 0.5em));
    min-block-size: var(--rc-menu-button-trigger-block-size, var(--rc-control-block-size, 2.25em));
    padding: var(--rc-menu-button-trigger-padding-block, var(--rc-control-padding-block, 0.25em))
      var(--rc-menu-button-trigger-padding-inline, var(--rc-control-padding-inline, 0.5em));
    appearance: none;
    box-sizing: border-box;
    border: var(--rc-menu-button-trigger-border, var(--rc-border, 1px solid ButtonBorder));
    border-radius: var(--rc-menu-button-trigger-radius, var(--rc-control-radius, 0.125em));
    background: var(--rc-menu-button-trigger-background, var(--rc-button-bg, ButtonFace));
    color: var(--rc-menu-button-trigger-color, var(--rc-button-text, ButtonText));
    font: inherit;
    text-decoration: none;
    cursor: default;
    user-select: none;
    transition: var(--rc-menu-button-trigger-transition);
  }

  slot[name='trigger']::slotted(button:hover),
  slot[name='trigger']::slotted([role='button']:hover) {
    border-color: var(--rc-menu-button-trigger-hover-border-color, currentColor);
    background: var(
      --rc-menu-button-trigger-hover-background,
      color-mix(in srgb, Highlight 8%, transparent)
    );
    color: var(--rc-menu-button-trigger-hover-color, inherit);
  }

  slot[name='trigger']::slotted(button[aria-expanded='true']),
  slot[name='trigger']::slotted([role='button'][aria-expanded='true']) {
    border-color: var(--rc-menu-button-trigger-open-border-color, currentColor);
    background: var(
      --rc-menu-button-trigger-open-background,
      color-mix(in srgb, Highlight 12%, transparent)
    );
    color: var(--rc-menu-button-trigger-open-color, inherit);
  }

  :host([orientation='vertical']) slot[name='trigger']::slotted(button),
  :host([orientation='vertical']) slot[name='trigger']::slotted([role='button']) {
    inline-size: 100%;
    text-align: start;
  }

  :host([has-indicator]) slot[name='trigger']::slotted(button),
  :host([has-indicator]) slot[name='trigger']::slotted([role='button']) {
    padding-inline-end: calc(
      var(
          --rc-menu-button-indicator-inset,
          var(--rc-menu-button-trigger-padding-inline, var(--rc-control-padding-inline, 0.5em))
        ) +
        var(--rc-menu-button-indicator-size, 1em) +
        var(--rc-menu-button-trigger-gap, var(--rc-item-gap, 0.5em))
    );
  }

  slot[name='indicator'] {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-end: var(
      --rc-menu-button-indicator-inset,
      var(--rc-menu-button-trigger-padding-inline, var(--rc-control-padding-inline, 0.5em))
    );
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--rc-menu-button-indicator-size, 1em);
    block-size: var(--rc-menu-button-indicator-size, 1em);
    color: var(--rc-menu-button-indicator-color, currentColor);
    pointer-events: none;
    transform: translateY(-50%);
  }

  slot[name='indicator']::slotted(*) {
    inline-size: 100%;
    block-size: 100%;
  }

  #popup {
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    overflow: visible;
    color: inherit;
  }
`;

export default menuButtonStyles;
