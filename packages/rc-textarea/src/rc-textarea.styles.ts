import { css } from 'lit';

export const styles = css`
  .widget.widget--block {
    display: block;
    white-space: normal;
  }

  .line--trailing-widget {
    position: relative;
    padding-inline-end: var(--rc-textarea-trailing-size, 2.5em);
    min-block-size: var(--rc-textarea-trailing-size, 2.5em);
  }

  .widget--trailing {
    position: absolute;
    inset-inline-end: 0;
    inset-block-start: 0;
    inline-size: var(--rc-textarea-trailing-size, 2.5em);
    white-space: normal;
  }

  .line-disclosure-trigger {
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: var(--rc-textarea-trailing-size, 2.5em);
    cursor: pointer;
    color: inherit;
    font: inherit;
  }

  .line-disclosure-panel[hidden] {
    display: none;
  }

  :host {
    display: block;
    box-sizing: border-box;
    min-inline-size: 0;
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
    color: var(--rc-textarea-color, var(--rc-field-text, FieldText));
    overflow: hidden;
    min-height: var(--_rc-textarea-min-height, auto);
  }

  #gutter {
    display: none;
    flex-shrink: 0;
    background: var(--rc-textarea-gutter-bg, Canvas);
    color: var(--rc-textarea-gutter-color, GrayText);
    border-inline-end: var(--rc-textarea-gutter-border, 1px solid ButtonBorder);
    overflow: hidden;
    user-select: none;
  }

  :host([line-numbers]) #gutter,
  :host([gutter]) #gutter {
    display: block;
  }

  #gutter-cells {
    padding: var(--rc-textarea-padding, 0.5em);
    padding-inline-end: var(--rc-textarea-gutter-padding-inline-end, 0.75em);
    font-family: var(--rc-textarea-gutter-font-family, var(--rc-textarea-font-family, monospace));
    font-size: var(--rc-textarea-font-size, 1em);
    line-height: var(--rc-textarea-line-height, 1.5);
    text-align: end;
    min-inline-size: 2.5ch;
  }

  .gutter-cell {
    display: block;
    white-space: pre;
  }

  .gutter-cell-composite {
    display: inline-flex;
    align-items: center;
    gap: var(--rc-textarea-gutter-content-gap, 0.25em);
  }

  .gutter-cell-number {
    font-variant-numeric: tabular-nums;
  }

  .gutter-cell-content {
    display: inline-flex;
    align-items: center;
  }

  .gutter-cell--active {
    position: relative;
    isolation: isolate;
    color: var(--rc-textarea-color, var(--rc-field-text, FieldText));
    background: var(--rc-textarea-active-line-bg, transparent);
  }

  .gutter-cell--active::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset-block: 0;
    inset-inline-start: calc(-1 * var(--rc-textarea-padding, 0.5em));
    inset-inline-end: calc(-1 * var(--rc-textarea-gutter-padding-inline-end, 0.75em));
    background: inherit;
    pointer-events: none;
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
    color: var(--rc-textarea-color, var(--rc-field-text, FieldText));
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

  :host(:not([word-wrap])) .line {
    inline-size: max-content;
    min-inline-size: 100%;
  }

  /* Paint the active row through the editor padding without clipping its text
     or overflowing into adjacent rows. */
  .line--active {
    isolation: isolate;
    background: var(--rc-textarea-active-line-bg, transparent);
  }

  .line--active::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset-block: 0;
    inset-inline: calc(-1 * var(--rc-textarea-padding, 0.5em));
    background: inherit;
    pointer-events: none;
  }

  /* Error-lens -style end-of-line diagnostic message */
  .line[data-message]::after {
    content: attr(data-message);
    display: inline;
    margin-inline-start: 4ch;
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
