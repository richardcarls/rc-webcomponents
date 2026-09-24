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
    background-color: var(
      --rc-splitter-separator-color,
      color-mix(in srgb, ButtonBorder 35%, Canvas 65%)
    );
    border-inline-start: var(
      --rc-splitter-separator-border-inline-start,
      var(--rc-splitter-keyline, 1px solid ButtonBorder)
    );
    border-inline-end: var(
      --rc-splitter-separator-border-inline-end,
      var(--rc-splitter-keyline, 1px solid ButtonBorder)
    );
    /* z-index: 1 as a flex item stacks separator above pane siblings so the
       ::after touch-target circle (which extends past the strip) is hittable */
    z-index: 1;
    /* Required for collapse-button absolute positioning */
    position: relative;

    :host([orientation='vertical']) & {
      flex-direction: row;
      border-inline-start: unset;
      border-inline-end: unset;
      border-block-start: var(
        --rc-splitter-separator-border-block-start,
        var(--rc-splitter-keyline, 1px solid ButtonBorder)
      );
      border-block-end: var(
        --rc-splitter-separator-border-block-end,
        var(--rc-splitter-keyline, 1px solid ButtonBorder)
      );
    }
  }

  #collapse-button {
    /* Positioned at the start of the separator strip, centered on the cross
       axis. The button intentionally protrudes into the primary pane so it
       is visible and hittable at a reasonable size even on narrow strips. */
    position: absolute;
    /* Centered on the cross axis with auto margins, which hold in RTL and in
       vertical text where a physical 50% offset plus translate would not. */
    inset-block-start: var(--rc-splitter-collapse-button-offset, 8px);
    inset-inline: 0;
    margin-inline: auto;
    inline-size: var(--rc-splitter-collapse-button-size, 20px);
    block-size: var(--rc-splitter-collapse-button-size, 20px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid var(--rc-splitter-collapse-button-border, ButtonBorder);
    border-radius: 50%;
    background: var(--rc-splitter-collapse-button-bg, Canvas);
    color: var(--rc-splitter-collapse-button-color, ButtonText);
    cursor: pointer;
    line-height: 1;

    &:hover {
      background: var(--rc-splitter-collapse-button-hover-bg, ButtonFace);
    }

    &:focus-visible {
      outline: 2px solid Highlight;
      outline-offset: 2px;
    }

    /* The chevron points toward the primary pane, which is on the right in RTL. */
    :host(:dir(rtl):not([orientation='vertical'])) & svg {
      transform: scaleX(-1);
    }

    :host([orientation='vertical']) & {
      inset-block: 0;
      margin-block: auto;
      inset-inline: var(--rc-splitter-collapse-button-offset, 8px) auto;
      margin-inline: 0;
    }
  }

  #separator-handle {
    touch-action: none;
    inline-size: 100%;
    block-size: var(--rc-splitter-separator-handle-size, 100%);
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
      inline-size: var(--rc-splitter-handle-thickness, 4px);
      block-size: 100%;
      background-color: var(--rc-splitter-handle-fill, transparent);
      background-image: var(
        --rc-splitter-handle-pattern,
        radial-gradient(
          circle 1px at 50% calc(50% - 5px),
          var(--rc-splitter-handle-color, ButtonBorder) 100%,
          transparent 100%
        ),
        radial-gradient(
          circle 1px at 50% 50%,
          var(--rc-splitter-handle-color, ButtonBorder) 100%,
          transparent 100%
        ),
        radial-gradient(
          circle 1px at 50% calc(50% + 5px),
          var(--rc-splitter-handle-color, ButtonBorder) 100%,
          transparent 100%
        )
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
      inset: 0;
      margin: auto;
      inline-size: 24px;
      block-size: 24px;
      border-radius: 50%;
      pointer-events: none;
    }

    :host([orientation='vertical']) & {
      inline-size: var(--rc-splitter-separator-handle-size, 100%);
      block-size: 100%;
      cursor: row-resize;

      /* Horizontal 3-dot grip (vertical splitter / horizontal bar) */
      &::before {
        inline-size: 100%;
        block-size: var(--rc-splitter-handle-thickness, 4px);
        background-image: var(
          --rc-splitter-handle-pattern,
          radial-gradient(
            circle 1px at calc(50% - 5px) 50%,
            var(--rc-splitter-handle-color, ButtonBorder) 100%,
            transparent 100%
          ),
          radial-gradient(
            circle 1px at 50% 50%,
            var(--rc-splitter-handle-color, ButtonBorder) 100%,
            transparent 100%
          ),
          radial-gradient(
            circle 1px at calc(50% + 5px) 50%,
            var(--rc-splitter-handle-color, ButtonBorder) 100%,
            transparent 100%
          )
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
