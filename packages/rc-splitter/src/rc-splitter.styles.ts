import { css } from 'lit';

export const splitterStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  :host {
    --rc-splitter-separator-size: 6px;

    position: relative;
    display: flex;
    flex-direction: row;
    align-items: stretch;
  }

  :host([orientation='vertical']) {
    flex-direction: column;
  }

  :host([hidden]) {
    display: none;
  }

  /* because :has(:focus-visible) doesn't work across slot boundary */
  :host([data-interaction-mode='keyboard']):focus-within {
    outline: auto;
  }

  ::slotted(*) {
    width: 100%;
    height: 100%;
  }

  #separator {
    grid-column: separator;
    flex: 0 0 var(--rc-splitter-separator-size, 6px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    background-color: var(--rc-splitter-separator-color, color-mix(in srgb, ButtonBorder 35%, Canvas 65%));
    border-left: var(--rc-splitter-separator-border-inline-start, var(--rc-splitter-keyline, 1px solid ButtonBorder));
    border-right: var(--rc-splitter-separator-border-inline-end, var(--rc-splitter-keyline, 1px solid ButtonBorder));
    /* z-index: 1 as a flex item stacks separator above pane siblings so the
       ::after touch-target circle (which extends past the strip) is hittable */
    z-index: 1;

    :host([orientation='vertical']) & {
      flex-direction: row;
      border-left: unset;
      border-right: unset;
      border-top: var(--rc-splitter-separator-border-block-start, var(--rc-splitter-keyline, 1px solid ButtonBorder));
      border-bottom: var(--rc-splitter-separator-border-block-end, var(--rc-splitter-keyline, 1px solid ButtonBorder));
    }
  }

  #separator-handle {
    width: 100%;
    height: var(--rc-splitter-separator-handle-size, 100%);
    cursor: col-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    /* Required so ::after is positioned relative to this element */
    position: relative;

    /* ── Visual drag indicator ─────────────────────────────────────────────
       Default: 3-dot vertical grip (horizontal splitter / vertical bar).
       Themes override via --rc-splitter-handle-pattern (background-image) and
       --rc-splitter-handle-fill (background-color). */
    &::before {
      content: '';
      display: block;
      width: var(--rc-splitter-handle-thickness, 4px);
      height: 100%;
      background-color: var(--rc-splitter-handle-fill, transparent);
      background-image: var(
        --rc-splitter-handle-pattern,
        radial-gradient(circle 1px at 50% calc(50% - 5px), var(--rc-splitter-handle-color, ButtonBorder) 100%, transparent 100%),
        radial-gradient(circle 1px at 50% 50%, var(--rc-splitter-handle-color, ButtonBorder) 100%, transparent 100%),
        radial-gradient(circle 1px at 50% calc(50% + 5px), var(--rc-splitter-handle-color, ButtonBorder) 100%, transparent 100%)
      );
      border-radius: var(--rc-splitter-handle-border-radius, 0);
      pointer-events: none;
      transition: background-color var(--rc-splitter-handle-transition, 0ms);
    }

    /* Hover highlight stays on the visual indicator only, never the full strip */
    &:hover::before {
      background-color: var(--rc-splitter-handle-hover-fill, transparent);
    }

    /* ── Touch target circle ───────────────────────────────────────────────
       24 px diameter transparent circle, centered on the handle. Invisible
       and non-interactive for mouse/keyboard. On coarse-pointer (touch)
       devices the circle becomes hittable, giving a WCAG-compliant touch
       target without widening the visual separator. */
    &::after {
      content: '';
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }

    :host([orientation='vertical']) & {
      width: var(--rc-splitter-separator-handle-size, 100%);
      height: 100%;
      cursor: row-resize;

      /* Horizontal 3-dot grip (vertical splitter / horizontal bar) */
      &::before {
        width: 100%;
        height: var(--rc-splitter-handle-thickness, 4px);
        background-image: var(
          --rc-splitter-handle-pattern,
          radial-gradient(circle 1px at calc(50% - 5px) 50%, var(--rc-splitter-handle-color, ButtonBorder) 100%, transparent 100%),
          radial-gradient(circle 1px at 50% 50%, var(--rc-splitter-handle-color, ButtonBorder) 100%, transparent 100%),
          radial-gradient(circle 1px at calc(50% + 5px) 50%, var(--rc-splitter-handle-color, ButtonBorder) 100%, transparent 100%)
        );
      }
    }

    :host([fixed]) & {
      pointer-events: none;
    }
  }

  /* Activate the touch target circle only on coarse-pointer (touch) devices */
  @media (any-pointer: coarse) {
    #separator-handle::after {
      pointer-events: auto;
    }
  }

  #primary,
  #secondary {
    overflow: hidden;
  }

  #primary {
    grid-column: primary;
    flex: 0 0 auto;
  }

  #secondary {
    grid-column: secondary;
    flex: 1;
  }
`;

export default splitterStyles;
