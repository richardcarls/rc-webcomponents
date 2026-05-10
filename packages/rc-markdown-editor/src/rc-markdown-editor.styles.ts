import { css } from 'lit';

export const rmeStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  #rich-view {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    box-sizing: border-box;
    outline: none;
    /* Consumer themes via CSS custom properties */
    font-family:    var(--rme-font-family, inherit);
    font-size:      var(--rme-font-size, inherit);
    line-height:    var(--rme-line-height, 1.6);
    padding:        var(--rme-padding, 0.75em 1em);
    background:     var(--rme-background, Canvas);
    color:          var(--rme-color, CanvasText);
    border:         var(--rme-border, 1px solid ButtonBorder);
    border-top:     none;
    border-radius:  var(--rme-border-radius, 0 0 4px 4px);
  }

  #rich-view:focus {
    outline: var(--rme-focus-outline, 2px solid Highlight);
    outline-offset: -2px;
  }

  #rich-view[hidden] { display: none; }

  /* Block-level spacing within the rich view */
  #rich-view > :first-child { margin-top: 0; }
  #rich-view > :last-child  { margin-bottom: 0; }

  /* Source mode wrapper */
  #source-wrapper {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  #source-wrapper[hidden] { display: none; }

  #source-editor {
    flex: 1 1 auto;
    display: block;
    --rc-textarea-border-radius: 0 0 4px 4px;
    --rc-textarea-border-top: none;
  }

  /* ── Toolbar ─────────────────────────────────────────────────────────────── */

  rc-editor-toolbar [role='toolbar'] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--rme-toolbar-gap, 1px);
    padding: 4px;
    border: 1px solid ButtonBorder;
    border-radius: 4px 4px 0 0;
    background: Canvas;
  }

  rc-editor-toolbar button {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: var(--rme-toolbar-button-size, 2rem);
    min-block-size: var(--rme-toolbar-button-size, 2rem);
    padding: 0.3em;
    border: 1px solid transparent;
    border-radius: 3px;
    background: transparent;
    color: ButtonText;
    font: inherit;
    font-size: 0.875em;
    cursor: pointer;
    line-height: 1;
  }

  rc-editor-toolbar button svg {
    inline-size: 1.15em;
    block-size: 1.15em;
    flex-shrink: 0;
  }

  rc-editor-toolbar button:hover {
    background: ButtonFace;
    border-color: ButtonBorder;
  }

  rc-editor-toolbar button:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 1px;
  }

  rc-editor-toolbar button[aria-pressed='true'] {
    background: Highlight;
    color: HighlightText;
    border-color: Highlight;
  }

  /* Heading select */
  rc-editor-toolbar select {
    appearance: auto;
    padding: 0.25em 0.35em;
    border: 1px solid ButtonBorder;
    border-radius: 3px;
    background: ButtonFace;
    color: ButtonText;
    font: inherit;
    font-size: 0.8125em;
    cursor: pointer;
  }

  rc-editor-toolbar select:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 1px;
  }

  rc-editor-toolbar select.toolbar-active {
    background: Highlight;
    color: HighlightText;
    border-color: Highlight;
  }

  /* Code block language input */
  rc-editor-toolbar .lang-input {
    padding: 0.25em 0.5em;
    border: 1px solid ButtonBorder;
    border-radius: 3px;
    background: Field;
    color: FieldText;
    font: inherit;
    font-size: 0.8125em;
    width: 8em;
  }

  rc-editor-toolbar .lang-input:focus {
    outline: 2px solid Highlight;
    outline-offset: 1px;
  }

  rc-editor-toolbar .lang-input::placeholder {
    color: GrayText;
  }

  /* ── Source mode decoration classes ─────────────────────────────────────── */

  .rme-blockquote    { color: GrayText; }
  .rme-list-bullet,
  .rme-list-ordered  { color: GrayText; }
  .rme-code-block    { color: GrayText; font-style: italic; }
  .rme-strikethrough { text-decoration: line-through; }
  .rme-underline     { text-decoration: underline; }

  /* ── Rich view block element spacing ─────────────────────────────────────── */

  #rich-view blockquote {
    margin: 0.5em 0;
    padding-left: 1em;
    border-left: 3px solid ButtonBorder;
    color: GrayText;
  }

  #rich-view pre {
    margin: 0.5em 0;
    padding: 0.65em 0.85em;
    background: Field;
    border: 1px solid ButtonBorder;
    border-radius: 4px;
    overflow-x: auto;
  }

  #rich-view pre code {
    font-family: 'Cascadia Code', 'Fira Code', ui-monospace, monospace;
    font-size: 0.875em;
  }

  #rich-view ul, #rich-view ol {
    margin: 0.5em 0;
    padding-left: 1.75em;
  }

  #rich-view li { margin: 0.2em 0; }

  /* ── Hide the slotted native textarea ────────────────────────────────────── */
  ::slotted(textarea) {
    display: none !important;
  }

  ::slotted(label) {
    display: block;
    margin-bottom: 0.25em;
    font-size: 0.875em;
  }
`;
