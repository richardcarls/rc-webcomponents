import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    box-sizing: border-box;
    color-scheme: inherit;
  }

  :host([hidden]) {
    display: none;
  }

  #root {
    display: flex;
    align-items: stretch;
    border: var(--rc-textarea-border, 1px solid ButtonBorder);
    border-radius: var(--rc-textarea-border-radius, 2px);
    background: var(--rc-textarea-background, Field);
    color: var(--rc-textarea-color, var(--rc-text, FieldText));
    overflow: hidden;
    min-height: var(--_rc-textarea-min-height, auto);
  }

  #gutter {
    display: none;
    flex-shrink: 0;
    background: var(--rc-textarea-gutter-bg, Canvas);
    color: var(--rc-textarea-gutter-color, GrayText);
    border-right: var(--rc-textarea-gutter-border, 1px solid ButtonBorder);
    overflow: hidden;
    user-select: none;
  }

  :host([line-numbers]) #gutter,
  :host([list-numbers]) #gutter,
  :host([gutter]) #gutter {
    display: block;
  }

  #gutter-cells {
    padding: var(--rc-textarea-padding, 0.5em);
    padding-inline-end: var(--rc-textarea-gutter-padding-inline-end, 0.75em);
    font-family: var(--rc-textarea-font-family, monospace);
    font-size: var(--rc-textarea-font-size, 1em);
    line-height: var(--rc-textarea-line-height, 1.5);
    text-align: right;
    min-width: 2.5ch;
  }

  .gutter-cell {
    display: block;
    white-space: pre;
  }

  .gutter-cell--active {
    color: var(--rc-textarea-color, var(--rc-text, FieldText));
  }

  #editor-area {
    position: relative;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  #editor {
    position: relative;
    z-index: 1;
    width: 100%;
    min-height: 100%;
    box-sizing: border-box;
    padding: var(--rc-textarea-padding, 0.5em);
    font-family: var(--rc-textarea-font-family, monospace);
    font-size: var(--rc-textarea-font-size, 1em);
    line-height: var(--rc-textarea-line-height, 1.5);
    color: var(--rc-textarea-color, var(--rc-text, FieldText));
    caret-color: var(--rc-textarea-caret-color, var(--rc-textarea-color, FieldText));
    background: transparent;
    outline: none;
    overflow: auto;
    resize: none;
    white-space: pre;
    word-break: normal;
    overflow-wrap: normal;
    tab-size: 4;
    word-break: normal;
    /* Prevent contenteditable from injecting <div> wrappers on Enter in some browsers */
    -webkit-user-modify: read-write-plaintext-only;
  }

  :host([word-wrap]) #editor {
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: normal;
  }

  :host([auto-grow]) #editor {
    overflow: visible;
    height: auto;
  }

  :host([auto-grow]) #root {
    height: auto;
  }

  :host([read-only]) #root {
    border: none;
    background: transparent;
    border-radius: 0;
  }

  :host([read-only]) #editor {
    cursor: default;
    padding: 0;
    -webkit-user-modify: read-only;
  }

  /* Focus ring on the root when editor is focused */
  #root:has(#editor:focus) {
    outline: var(--rc-textarea-focus-outline, 2px solid Highlight);
    outline-offset: -1px;
  }

  /* Slotted textarea is hidden on host upgrade */
  ::slotted(textarea) {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    border: 0 !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }

  .line {
    position: relative;
    display: block;
  }

  /* Active line highlight — opt-in via CSS custom property. */
  .line--active {
    background: var(--rc-textarea-active-line-bg, transparent);
  }

  /* Error-lens -style end-of-line diagnostic message */
  .line[data-message]::after {
    content: attr(data-message);
    display: inline;
    margin-left: 4ch;
    white-space: nowrap;
    pointer-events: none;
    font-size: 0.875em;
    opacity: 0.8;
    font-style: italic;
  }

  .mark {
    border-radius: 2px;
  }

  .widget {
    display: inline-block;
    user-select: none;
    cursor: default;
    vertical-align: middle;
  }
`;
