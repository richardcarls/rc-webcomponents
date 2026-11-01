import { css } from 'lit';

export const rmeStyles = css`
  :host {
    position: relative;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  #rich-view {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    overflow-block: auto;
    box-sizing: border-box;
    outline: none;
    /* Consumer themes via CSS custom properties */
    font-family: var(--rc-markdown-editor-font-family, inherit);
    font-size: var(--rc-markdown-editor-font-size, inherit);
    line-height: var(--rc-markdown-editor-line-height, 1.6);
    padding: var(--rc-markdown-editor-padding, 0.75em 1em);
    background: var(--rc-markdown-editor-background, Canvas);
    color: var(--rc-markdown-editor-color, CanvasText);
    border: var(--rc-markdown-editor-border, 1px solid ButtonBorder);
    border-top: none;
    border-radius: var(--rc-markdown-editor-border-radius, 0 0 4px 4px);
  }

  #rich-view:focus {
    outline: var(--rc-markdown-editor-focus-outline, 2px solid Highlight);
    outline-offset: -2px;
  }

  #rich-view[hidden] {
    display: none;
  }

  /* Block-level spacing within the rich view */
  #rich-view > :first-child {
    margin-top: 0;
  }
  #rich-view > :last-child {
    margin-bottom: 0;
  }

  /* Source mode wrapper */
  #source-wrapper {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  #source-wrapper[hidden] {
    display: none;
  }

  #source-editor {
    flex: 1 1 auto;
    display: block;
    font-family: var(
      --rc-markdown-editor-src-font-family,
      'Cascadia Code',
      'Fira Code',
      ui-monospace,
      monospace
    );
    --rc-textarea-border-radius: 0 0 4px 4px;
    --rc-textarea-border-top: none;
  }

  #rich-view a {
    cursor: pointer;
    text-decoration: underline;
  }

  #rich-view blockquote {
    margin: 0.5em 0;
    padding-inline-start: 1em;
    border-inline-start: 3px solid ButtonBorder;
    color: GrayText;
  }

  #rich-view pre {
    margin: 0.5em 0;
    padding: 0.65em 0.85em;
    background: Field;
    border: 1px solid ButtonBorder;
    border-radius: 4px;
    overflow-x: auto;
    overflow-inline: auto;
  }

  #rich-view pre code {
    font-family: 'Cascadia Code', 'Fira Code', ui-monospace, monospace;
    font-size: 0.875em;
  }

  #rich-view ul,
  #rich-view ol {
    margin: 0.5em 0;
    padding-inline-start: 1.75em;
  }

  #rich-view li {
    margin: 0.2em 0;
  }

  .link-popover {
    position: absolute;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px;
    background: Canvas;
    border: 1px solid ButtonBorder;
    border-radius: 4px;
    box-shadow: 0 2px 8px color-mix(in srgb, CanvasText 15%, transparent);
  }

  .link-popover-input {
    min-inline-size: 16em;
    padding: 0.25em 0.4em;
    border: 1px solid ButtonBorder;
    border-radius: 3px;
    background: Field;
    color: FieldText;
    font: inherit;
    font-size: 0.875em;
  }

  .link-popover-input:focus {
    outline: 2px solid Highlight;
    outline-offset: 1px;
  }

  .link-popover-btn {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: 1.75rem;
    min-block-size: 1.75rem;
    padding: 0.15em;
    border: 1px solid transparent;
    border-radius: 3px;
    background: transparent;
    color: ButtonText;
    font: inherit;
    font-size: 0.875em;
    cursor: pointer;
    line-height: 1;
  }

  .link-popover-btn:hover:not(:disabled) {
    background: ButtonFace;
    border-color: ButtonBorder;
  }

  .link-popover-btn:focus-visible {
    outline: 2px solid Highlight;
    outline-offset: 1px;
  }

  .link-popover-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }

  ::slotted(textarea) {
    display: none !important;
  }

  ::slotted(label) {
    display: block;
    margin-bottom: 0.25em;
    font-size: 0.875em;
  }
`;
