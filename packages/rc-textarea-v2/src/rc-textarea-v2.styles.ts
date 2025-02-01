import { css } from 'lit';

export const styles = css`
  :host {
    display: block;
    box-sizing: border-box;
  }

  :host([hidden]) {
    display: none;
  }

  /* ── Root layout ──────────────────────────────────────────────────────── */

  #root {
    display: flex;
    align-items: stretch;
    border: var(--rc-textarea-v2-border, 1px solid ButtonBorder);
    border-radius: var(--rc-textarea-v2-border-radius, 2px);
    background: var(--rc-textarea-v2-background, Field);
    color: var(--rc-textarea-v2-color, FieldText);
    overflow: hidden;
    min-height: var(--_rc-textarea-v2-min-height, auto);
  }

  /* ── Gutter ───────────────────────────────────────────────────────────── */

  #gutter {
    display: none;
    flex-shrink: 0;
    background: var(--rc-textarea-v2-gutter-bg, Canvas);
    color: var(--rc-textarea-v2-gutter-color, GrayText);
    border-right: var(--rc-textarea-v2-gutter-border, 1px solid ButtonBorder);
    overflow: hidden;
    user-select: none;
  }

  :host([line-numbers]) #gutter {
    display: block;
  }

  #line-numbers {
    padding: var(--rc-textarea-v2-padding, 0.5em);
    padding-right: 0.75em;
    font-family: var(--rc-textarea-v2-font-family, monospace);
    font-size: var(--rc-textarea-v2-font-size, 1em);
    line-height: var(--rc-textarea-v2-line-height, 1.5);
    text-align: right;
    min-width: 2.5ch;
  }

  .line-number {
    display: block;
    white-space: pre;
  }

  .line-number--active {
    color: var(--rc-textarea-v2-color, FieldText);
  }

  /* ── Editor area ──────────────────────────────────────────────────────── */

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
    padding: var(--rc-textarea-v2-padding, 0.5em);
    font-family: var(--rc-textarea-v2-font-family, monospace);
    font-size: var(--rc-textarea-v2-font-size, 1em);
    line-height: var(--rc-textarea-v2-line-height, 1.5);
    color: var(--rc-textarea-v2-color, FieldText);
    caret-color: var(
      --rc-textarea-v2-caret-color,
      var(--rc-textarea-v2-color, FieldText)
    );
    background: transparent;
    outline: none;
    overflow: auto;
    resize: none;
    white-space: pre;
    overflow-wrap: normal;
    tab-size: 4;
    word-break: normal;
    /* Prevent contenteditable from injecting <div> wrappers on Enter in some browsers */
    -webkit-user-modify: read-write-plaintext-only;
  }

  :host([word-wrap]) #editor {
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }

  :host([auto-grow]) #editor {
    overflow: visible;
    height: auto;
  }

  :host([auto-grow]) #root {
    height: auto;
  }

  :host([read-only]) #editor {
    cursor: default;
    -webkit-user-modify: read-only;
  }

  /* Focus ring on the root when editor is focused */
  #root:has(#editor:focus) {
    outline: var(--rc-textarea-v2-focus-outline, 2px solid AccentColor);
    outline-offset: -1px;
  }

  /* ── Slot (hidden lightDOM textarea) ──────────────────────────────────── */

  ::slotted(textarea) {
    /* Visually hidden but accessible to form submission.
       Inline styles applied via JS take precedence and are more reliable,
       but this provides a baseline in case of timing issues. */
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

  /* ── Line structure ───────────────────────────────────────────────────── */

  .v2-line {
    position: relative;
    display: block;
    min-height: var(--rc-textarea-v2-line-height, 1.5em);
  }

  /* Active line highlight — opt-in via CSS custom property. */
  .v2-line--active {
    background: var(--rc-textarea-v2-active-line-bg, transparent);
  }

  /* Error-lens style end-of-line message via ::after pseudo-element.
     content: attr(data-message) is set when V2Document assigns data-message.
     Using ::after keeps the annotation completely outside the DOM selection
     and clipboard path — no user-select tricks needed. */
  .v2-line[data-message]::after {
    content: attr(data-message);
    position: absolute;
    right: 0.5em;
    top: 0;
    white-space: nowrap;
    pointer-events: none;
    font-size: 0.875em;
    opacity: 0.8;
    font-style: italic;
  }

  /* ── Inline decoration spans ──────────────────────────────────────────── */

  .v2-mark {
    /* Base class; formatting applied via inline style by V2InlineBlot */
    border-radius: 2px;
  }

  /* ── Widget spans ─────────────────────────────────────────────────────── */

  .v2-widget {
    display: inline-block;
    user-select: none;
    cursor: default;
    vertical-align: middle;
  }

  /* ── Scrollbar sync between editor and gutter ─────────────────────────── */
  /* Gutter doesn't scroll independently; editor scroll is handled in JS */
`;
