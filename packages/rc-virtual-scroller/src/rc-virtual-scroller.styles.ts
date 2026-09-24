import { css } from 'lit';

export const virtualScrollerStyles = css`
  :host {
    display: block;
    min-inline-size: 0;
    box-sizing: border-box;
    /*
     * Scroll anchoring exists to keep the reading position stable when content
     * above the viewport changes size. That is exactly what this element does
     * on every frame, so leaving anchoring on makes the browser fight the
     * spacer writes and the scroll position drifts. This is a correctness
     * requirement, not a tuning knob, so it is not a custom property.
     */
    overflow-anchor: none;
  }

  :host([hidden]) {
    display: none;
  }

  [part='spacer-start'],
  [part='spacer-end'] {
    /*
     * The spacers stand in for the rows that are not rendered. They must not
     * collapse margins with the slotted container or contribute an inline
     * size, and they carry no paint of their own.
     */
    display: block;
    flex: none;
    inline-size: 100%;
    overflow-anchor: none;
    pointer-events: none;
  }
`;

export default virtualScrollerStyles;
