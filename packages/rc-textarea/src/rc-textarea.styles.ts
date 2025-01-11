import { css } from 'lit';

export const textareaStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  :host {
    --rc-textarea-font-family: monospace;
    --rc-textarea-font-size: 1em;
    --rc-textarea-line-height: 1.5;
    --rc-textarea-padding: 0.5em;
    --rc-textarea-gutter-color: GrayText;
    --rc-textarea-gutter-bg: Canvas;
    --rc-textarea-gutter-border: ButtonBorder;
    --rc-textarea-background: Field;
    --rc-textarea-color: FieldText;
    --rc-textarea-caret-color: var(--rc-textarea-color);
    --rc-textarea-border: 1px solid ButtonBorder;
    --rc-textarea-border-radius: 2px;
    --rc-textarea-focus-outline: 2px solid AccentColor;
    --rc-textarea-mark-error-color: #e06c75;
    --rc-textarea-mark-warning-color: #e5c07b;
    --rc-textarea-mark-info-color: #61afef;
    --rc-textarea-mark-hint-color: #98c379;

    display: flex;
    flex-direction: row;
    align-items: stretch;
    overflow: hidden;
    background: var(--rc-textarea-background);
    color: var(--rc-textarea-color);
    font-family: var(--rc-textarea-font-family);
    font-size: var(--rc-textarea-font-size);
    line-height: var(--rc-textarea-line-height);
    border: var(--rc-textarea-border);
    border-radius: var(--rc-textarea-border-radius);
    resize: both;
  }

  :host(:focus-within) {
    outline: var(--rc-textarea-focus-outline);
    outline-offset: -1px;
  }

  :host([hidden]) {
    display: none;
  }

  #root {
    display: flex;
    flex-direction: row;
    flex: 1;
    min-width: 0;
    min-height: 0;
  }

  /* Gutter (line numbers) */
  #gutter {
    flex: 0 0 auto;
    min-width: 3ch;
    overflow: hidden;
    user-select: none;
    text-align: right;
    color: var(--rc-textarea-gutter-color);
    background: var(--rc-textarea-gutter-bg);
    border-right: 1px solid var(--rc-textarea-gutter-border);
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
  }

  :host(:not([linenumbers])) #gutter {
    display: none;
  }

  #line-numbers {
    padding: var(--rc-textarea-padding) 0.5em;
  }

  .line-number {
    display: block;
    line-height: var(--rc-textarea-line-height);
    white-space: nowrap;
  }

  /* Editor area: contains the overlay + contenteditable */
  #editor-area {
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  /* Auto-grow: let the editor area grow with its content */
  :host([autogrow]) {
    overflow: visible;
    resize: none;
  }

  :host([autogrow]) #root {
    overflow: visible;
  }

  :host([autogrow]) #editor-area {
    overflow: visible;
  }

  /*
   * Absolutely-positioned line overlay — sits behind the contenteditable.
   * Rendered content: one .overlay-line div per logical line.
   * Carries line-highlight backgrounds and inline diagnostic annotations.
   * Scroll-synced via JS: transform: translate(-scrollLeft, -scrollTop).
   */
  #line-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    overflow: visible;
    pointer-events: none;
    padding: var(--rc-textarea-padding);
    font-family: var(--rc-textarea-font-family);
    font-size: var(--rc-textarea-font-size);
    line-height: var(--rc-textarea-line-height);
    tab-size: 4;
  }

  /* One overlay row per logical line */
  .overlay-line {
    display: block;
    min-height: calc(var(--rc-textarea-line-height) * 1em);
    text-align: right;
  }

  /* The contenteditable editing surface */
  #editor {
    flex: 1;
    outline: none;
    overflow: auto;
    white-space: pre;
    word-break: normal;
    overflow-wrap: normal;
    padding: var(--rc-textarea-padding);
    font-family: var(--rc-textarea-font-family);
    font-size: var(--rc-textarea-font-size);
    line-height: var(--rc-textarea-line-height);
    color: var(--rc-textarea-color);
    caret-color: var(--rc-textarea-caret-color);
    tab-size: 4;
    min-height: calc(var(--rc-textarea-line-height) * 1em + 2 * var(--rc-textarea-padding));
  }

  :host([autogrow]) #editor {
    overflow: visible;
    min-height: calc(var(--rc-textarea-line-height) * 1em + 2 * var(--rc-textarea-padding));
  }

  :host([wordwrap]) #editor {
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: normal;
  }

  :host([wordwrap]) #line-overlay {
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: normal;
  }

  /* Widget spans: non-editable, atomic inline-block elements */
  [contenteditable='false']:not(.diagnostic) {
    display: inline-block;
    cursor: default;
    /* Selected as a unit by the browser */
  }

  /* Error Lens-style diagnostics: inline after line text */
  .diagnostic {
    display: inline;
    margin-left: 2em;
    opacity: 0.85;
    font-style: italic;
    pointer-events: none;
    white-space: nowrap;
    user-select: none;
    cursor: default;
  }

  .diagnostic--error {
    color: var(--rc-textarea-mark-error-color);
  }

  .diagnostic--warning {
    color: var(--rc-textarea-mark-warning-color);
  }

  .diagnostic--info {
    color: var(--rc-textarea-mark-info-color);
  }

  .diagnostic--hint {
    color: var(--rc-textarea-mark-hint-color);
  }

  .diagnostic-icon {
    display: inline;
    margin-right: 0.25em;
  }

  /* Built-in diagnostic mark decoration — wavy underline */
  .diagnostic-mark {
    text-decoration-line: underline;
    text-decoration-style: wavy;
    text-decoration-color: var(--rc-textarea-mark-diagnostic-color, currentColor);
    text-decoration-thickness: 1.5px;
  }
  .diagnostic-mark--error   { --rc-textarea-mark-diagnostic-color: var(--rc-textarea-mark-error-color);   }
  .diagnostic-mark--warning { --rc-textarea-mark-diagnostic-color: var(--rc-textarea-mark-warning-color); }
  .diagnostic-mark--info    { --rc-textarea-mark-diagnostic-color: var(--rc-textarea-mark-info-color);    }
  .diagnostic-mark--hint    { --rc-textarea-mark-diagnostic-color: var(--rc-textarea-mark-hint-color);    }

  /* Built-in diagnostic line decoration — tinted background */
  .diagnostic-line--error   { background-color: color-mix(in srgb, var(--rc-textarea-mark-error-color)   8%, transparent); }
  .diagnostic-line--warning { background-color: color-mix(in srgb, var(--rc-textarea-mark-warning-color) 8%, transparent); }
  .diagnostic-line--info    { background-color: color-mix(in srgb, var(--rc-textarea-mark-info-color)    8%, transparent); }
  .diagnostic-line--hint    { background-color: color-mix(in srgb, var(--rc-textarea-mark-hint-color)    8%, transparent); }

  /* Hidden light-DOM textarea: kept for form association fallback and
     progressive enhancement (visible before JS hydrates). */
  ::slotted(textarea) {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
    opacity: 0;
    pointer-events: none;
  }

  /* Visually hidden ARIA live region for diagnostics */
  #diagnostic-status {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
`;

export default textareaStyles;
