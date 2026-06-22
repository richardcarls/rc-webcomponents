import { css } from 'lit';

export const fabStyles = css`
  :host {
    position: var(--rc-fab-position, fixed);
    inset-block-end: var(--rc-fab-inset-block, 1.5rem);
    inset-inline-end: var(--rc-fab-inset-inline, 1.5rem);
    z-index: var(--rc-fab-z-index, 10);
    display: inline-flex;
  }

  :host([hidden]) {
    display: none;
  }

  :host([position='bottom-start']) {
    inset-inline-end: unset;
    inset-inline-start: var(--rc-fab-inset-inline, 1.5rem);
  }

  :host([position='top-end']) {
    inset-block-end: unset;
    inset-block-start: var(--rc-fab-inset-block, 1.5rem);
  }

  :host([position='top-start']) {
    inset-block-end: unset;
    inset-block-start: var(--rc-fab-inset-block, 1.5rem);
    inset-inline-end: unset;
    inset-inline-start: var(--rc-fab-inset-inline, 1.5rem);
  }

  ::slotted(button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--rc-fab-gap, 0.5rem);

    min-width: var(--rc-fab-size, 3.5rem);
    height: var(--rc-fab-size, 3.5rem);
    padding-block: 0;
    padding-inline: var(--rc-fab-padding-inline, 1rem);

    background: var(--rc-fab-bg, ButtonFace);
    color: var(--rc-fab-color, ButtonText);

    border: none;
    border-radius: var(--rc-fab-radius, 9999px);
    box-shadow: var(--rc-fab-shadow, var(--rc-shadow-level2, none));

    font-family: var(--rc-fab-font-family, var(--rc-font-family, inherit));
    font-size: var(--rc-fab-font-size, var(--rc-font-size, 0.875rem));
    font-weight: var(--rc-fab-font-weight, 500);
    letter-spacing: var(--rc-fab-letter-spacing, 0.00625em);
    white-space: nowrap;

    cursor: pointer;
    transition:
      background var(--rc-fab-transition-duration, var(--rc-motion-duration, 200ms)) ease,
      box-shadow var(--rc-fab-transition-duration, var(--rc-motion-duration, 200ms)) ease,
      transform var(--rc-fab-transition-duration, var(--rc-motion-duration, 200ms)) ease;
  }

  :host(:has(button:hover)) ::slotted(button) {
    background: var(--rc-fab-bg-hover, var(--rc-fab-bg, ButtonFace));
    box-shadow: var(--rc-fab-shadow-hover, var(--rc-fab-shadow, var(--rc-shadow-level3, none)));
  }

  :host(:has(button:active)) ::slotted(button) {
    box-shadow: var(--rc-fab-shadow-active, none);
    transform: scale(0.96);
  }

  :host(:has(button:focus-visible)) ::slotted(button) {
    outline: var(--rc-fab-focus-ring, var(--rc-focus-ring, 2px solid currentColor));
    outline-offset: var(--rc-fab-focus-ring-offset, var(--rc-focus-ring-offset, 2px));
  }

  :host(:has(button:disabled)) ::slotted(button) {
    opacity: var(--rc-fab-disabled-opacity, var(--rc-disabled-opacity, 0.38));
    pointer-events: none;
    box-shadow: none;
  }

  @keyframes rc-fab-scroll-reveal {
    from {
      opacity: 0;
      visibility: hidden;
    }
    50% {
      visibility: visible;
    }
    to {
      opacity: 1;
      visibility: visible;
    }
  }

  @supports (animation-timeline: scroll()) {
    :host([scroll-reveal]) {
      /*
       * Override for embedded/demo contexts where root does not scroll:
       *   style="--rc-fab-scroll-timeline: scroll(nearest block)"
       */
      --rc-fab-scroll-timeline: scroll(root block);

      animation-name: rc-fab-scroll-reveal;
      animation-duration: 1ms; /* required; scroll position drives progress, not time */
      animation-timing-function: linear;
      animation-fill-mode: both;
      animation-timeline: var(--rc-fab-scroll-timeline);
      animation-range: calc(var(--rc-fab-scroll-threshold, 300px) - 100px)
        var(--rc-fab-scroll-threshold, 300px);
    }

    /* Keyboard escape hatch: always visible when the button has focus */
    :host([scroll-reveal]):has(button:focus-visible) {
      animation: none;
      opacity: 1;
      visibility: visible;
    }

    @media (prefers-reduced-motion: reduce) {
      :host([scroll-reveal]) {
        animation-range: var(--rc-fab-scroll-threshold, 300px) var(--rc-fab-scroll-threshold, 300px);
      }
    }
  }

  /*
   * JS fallback for browsers without scroll-driven animation support.
   * [scroll-below-threshold] is toggled by ScrollObserverController;
   * transitions replicate the CSS animation's show/hide behavior.
   */
  @supports not (animation-timeline: scroll()) {
    /* visible state: visibility snaps immediately, opacity fades in */
    :host([scroll-reveal]) {
      transition:
        opacity 200ms linear,
        visibility 0s linear;
    }

    /* hidden state: opacity fades first, visibility snaps off after delay */
    :host([scroll-reveal][scroll-below-threshold]) {
      opacity: 0;
      visibility: hidden;
      transition:
        opacity 200ms linear,
        visibility 0s linear 200ms;
    }

    /* Keyboard escape hatch */
    :host([scroll-reveal][scroll-below-threshold]):has(button:focus-visible) {
      opacity: 1;
      visibility: visible;
      transition: none;
    }

    @media (prefers-reduced-motion: reduce) {
      :host([scroll-reveal]),
      :host([scroll-reveal][scroll-below-threshold]) {
        transition: none;
      }
    }
  }
`;

export default fabStyles;
