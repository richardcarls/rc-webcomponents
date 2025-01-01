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
    /* currentColor resolves at point of use; since ::slotted(textarea) has
       color:transparent, we must reference --rc-textarea-color explicitly */
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

  /* Root flex container — must be a flex row so #gutter and #editor-area
     can use their flex properties. Without this, #editor-area has no height
     and the absolutely-positioned textarea/mirror collapse to zero. */
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

  /* Editor area: contains mirror + slotted textarea */
  #editor-area {
    flex: 1;
    position: relative;
    overflow: hidden;
    min-width: 0;
  }

  /* Mirror div: visually behind the textarea */
  #mirror {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    overflow: hidden;
    white-space: pre;
    word-break: normal;
    overflow-wrap: normal;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    /* Typography is further synced via inline styles from getComputedStyle(textarea) */
    /* 1px transparent border matches the textarea's border; with box-sizing:border-box
       on both (textarea via ::slotted rule, mirror via * rule + syncTypography),
       content areas are exactly equal */
    border: 1px solid transparent;
  }

  /* Auto-grow mode: mirror drives height via static flow.
     Host and root must not clip the growing content. */
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

  :host([autogrow]) #mirror {
    position: static;
    width: 100%;
    overflow: visible;
    min-height: calc(var(--rc-textarea-line-height) * 1em);
  }

  /* Word wrap */
  :host([wordwrap]) #mirror,
  :host([wordwrap][autogrow]) #mirror {
    white-space: pre-wrap;
    overflow-wrap: break-word;
    word-break: normal;
  }

  /* Slotted textarea sits on top of the mirror */
  ::slotted(textarea) {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    /* border-box so width:100% means the same total box as the mirror's
       left:0;right:0 expansion — content areas are then identical */
    box-sizing: border-box;
    /* Text is transparent so the mirror shows through; caret remains visible.
       !important guards against host-app global textarea rules (e.g. design
       system resets) which win over ::slotted() at equal specificity. */
    color: transparent !important;
    background: transparent !important;
    caret-color: var(--rc-textarea-caret-color);
    /* 1px transparent border matches the mirror's border so content areas align */
    border: 1px solid transparent;
    outline: none;
    resize: none;
    overflow: auto;
    white-space: pre;
    overflow-wrap: normal;
    /* Typography properties are synced via inline styles on the mirror;
       these custom properties apply to the textarea itself */
    font-family: var(--rc-textarea-font-family);
    font-size: var(--rc-textarea-font-size);
    line-height: var(--rc-textarea-line-height);
    padding: var(--rc-textarea-padding);
    tab-size: 4;
  }

  :host([autogrow]) ::slotted(textarea) {
    /* No scrolling in auto-grow mode — the textarea fills the mirror height */
    overflow: hidden;
  }

  :host([wordwrap]) ::slotted(textarea) {
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }

  /* Lines in the mirror */
  .line {
    display: block;
    position: relative;
    min-height: calc(var(--rc-textarea-line-height) * 1em);
  }

  /* Error Lens-style diagnostics: inline after line text */
  .diagnostic {
    display: inline;
    margin-left: 2em;
    opacity: 0.85;
    font-style: italic;
    pointer-events: none;
    white-space: nowrap;
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

  /* Built-in diagnostic mark decoration — wavy underline driven by CSS vars.
     Applied automatically when a Diagnostic includes a range. */
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

  /* Built-in diagnostic line decoration — tinted background driven by CSS vars.
     Applied when lineClassName is set to diagnostic-line--{severity}. */
  .diagnostic-line--error   { background-color: color-mix(in srgb, var(--rc-textarea-mark-error-color)   8%, transparent); }
  .diagnostic-line--warning { background-color: color-mix(in srgb, var(--rc-textarea-mark-warning-color) 8%, transparent); }
  .diagnostic-line--info    { background-color: color-mix(in srgb, var(--rc-textarea-mark-info-color)    8%, transparent); }
  .diagnostic-line--hint    { background-color: color-mix(in srgb, var(--rc-textarea-mark-hint-color)    8%, transparent); }

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
