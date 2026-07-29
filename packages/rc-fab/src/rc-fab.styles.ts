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
    gap: var(--rc-fab-gap);

    min-width: var(--rc-fab-size);
    height: var(--rc-fab-size);
    padding-block: var(--rc-fab-padding-block, revert);
    padding-inline: var(--rc-fab-padding-inline, revert);

    background: var(--rc-fab-bg, revert);
    color: var(--rc-fab-color, revert);

    border: var(--rc-fab-border, revert);
    border-radius: var(--rc-fab-radius, revert);
    box-shadow: var(--rc-fab-shadow, revert);

    font-family: var(--rc-fab-font-family, revert);
    font-size: var(--rc-fab-font-size, revert);
    font-weight: var(--rc-fab-font-weight, revert);
    letter-spacing: var(--rc-fab-letter-spacing, revert);
    white-space: nowrap;

    transition: var(--rc-fab-transition, revert);
  }

  :host(:has(button:hover)) ::slotted(button) {
    background: var(--rc-fab-bg-hover, revert);
    box-shadow: var(--rc-fab-shadow-hover, revert);
  }

  :host(:has(button:active)) ::slotted(button) {
    box-shadow: var(--rc-fab-shadow-active, revert);
    transform: var(--rc-fab-active-transform, revert);
  }

  :host(:has(button:focus-visible)) ::slotted(button) {
    outline: var(--rc-fab-focus-ring, revert);
    outline-offset: var(--rc-fab-focus-ring-offset, revert);
  }

  :host(:has(button:disabled)) ::slotted(button) {
    opacity: var(--rc-fab-disabled-opacity, revert);
    pointer-events: none;
    box-shadow: var(--rc-fab-disabled-shadow, revert);
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
