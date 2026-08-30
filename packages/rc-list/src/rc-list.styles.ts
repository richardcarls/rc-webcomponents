import { css } from 'lit';

export const listStyles = css`
  :host {
    --_rc-list-leading-gap: 0;
    --_rc-list-leading-size: 0;
    --_rc-list-trailing-gap: 0;
    --_rc-list-trailing-size: 0;

    display: block;
    min-inline-size: 0;
    color-scheme: inherit;
  }

  :host([hidden]) {
    display: none;
  }

  :host([has-leading]) {
    --_rc-list-leading-gap: var(--rc-list-leading-gap, 1rem);
    --_rc-list-leading-size: minmax(0, max-content);
  }

  :host([has-trailing]) {
    --_rc-list-trailing-gap: var(--rc-list-trailing-gap, 1rem);
    --_rc-list-trailing-size: minmax(0, max-content);
  }

  [part='list'] {
    display: grid;
    grid-template-columns:
      [item-start] var(--rc-list-padding-inline, 0)
      [leading-start] var(--_rc-list-leading-size) [leading-end]
      var(--_rc-list-leading-gap)
      [content-start] minmax(0, 1fr) [content-end]
      var(--_rc-list-trailing-gap)
      [trailing-start] var(--_rc-list-trailing-size) [trailing-end]
      var(--rc-list-padding-inline, 0) [item-end];
    min-inline-size: 0;
    padding-block: var(--rc-list-padding-block, 0);
    row-gap: var(--rc-list-row-gap, 0);
  }

  ::slotted(rc-list-item) {
    grid-column: item-start / item-end;
  }
`;

export default listStyles;
