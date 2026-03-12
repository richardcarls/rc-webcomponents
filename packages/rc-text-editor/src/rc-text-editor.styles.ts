import { css } from 'lit';

export const rteStyles = css`
  :host {
    display: flex;
    flex-direction: column;
  }

  /* rc-textarea's #root fills the remaining space */
  #root {
    flex: 1 1 auto;
    min-height: 0;
  }

  /* Preview panel */
  #rte-preview {
    overflow-y: auto;
    padding: 0.5em;
    box-sizing: border-box;
  }

  /* Toolbar layout — targets the light-DOM children of rc-editor-toolbar,
     which are visible here because the toolbar renders without a shadow root. */
  rc-editor-toolbar [role='toolbar'] {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    padding: 2px;
  }

  rc-editor-toolbar button {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2em;
    padding: 0.25em 0.5em;
    border: 1px solid ButtonBorder;
    border-radius: 3px;
    background: ButtonFace;
    color: ButtonText;
    font: inherit;
    font-size: 0.875em;
    cursor: pointer;
    line-height: 1;
  }

  rc-editor-toolbar button:hover {
    background: Highlight;
    color: HighlightText;
    border-color: Highlight;
  }

  rc-editor-toolbar button:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 1px;
  }
`;
