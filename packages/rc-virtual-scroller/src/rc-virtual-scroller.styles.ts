import { css } from 'lit';

export const virtualScrollerStyles = css`
  :host {
    display: block;
    min-inline-size: 0;
    box-sizing: border-box;
    /*
     * Scroll anchoring exists to keep the reading position stable when content
     * before the viewport changes size. That is exactly what this element does
     * on every frame, so leaving anchoring on makes the browser fight the
     * spacer writes and the scroll position drifts. This is a correctness
     * requirement, not a tuning knob, so it is not a custom property.
     */
    overflow-anchor: none;
  }

  :host([hidden]) {
    display: none;
  }

  /*
   * Windowing the inline axis lays the spacers and the container out along
   * it. Flex rows follow the writing mode and direction, so the start spacer
   * lands on the logical start in RTL and in vertical text alike.
   */
  :host([axis='inline']) {
    display: flex;
    align-items: stretch;
    inline-size: max-content;
    min-inline-size: 100%;
  }

  :host([axis='inline']) ::slotted(*) {
    flex: none;
  }

  [part='spacer-start'],
  [part='spacer-end'] {
    /*
     * The spacers stand in for the lines that are not rendered. They must not
     * collapse margins with the slotted container or contribute a cross-axis
     * size, and they carry no paint of their own.
     */
    display: block;
    flex: none;
    overflow-anchor: none;
    pointer-events: none;
  }

  :host(:not([axis='inline'])) [part='spacer-start'],
  :host(:not([axis='inline'])) [part='spacer-end'] {
    inline-size: 100%;
  }
`;

export default virtualScrollerStyles;
