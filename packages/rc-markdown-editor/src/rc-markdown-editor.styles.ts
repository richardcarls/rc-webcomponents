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
    box-sizing: border-box;
    outline: none;
    /* Consumer themes via CSS custom properties */
    font-family: var(--rme-font-family, inherit);
    font-size: var(--rme-font-size, inherit);
    line-height: var(--rme-line-height, 1.6);
    padding: var(--rme-padding, 0.75em 1em);
    background: var(--rme-background, Canvas);
    color: var(--rme-color, CanvasText);
    border: var(--rme-border, 1px solid ButtonBorder);
    border-top: none;
    border-radius: var(--rme-border-radius, 0 0 4px 4px);
  }

  #rich-view:focus {
    outline: var(--rme-focus-outline, 2px solid Highlight);
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
    font-family: var(--rme-src-font-family, 'Cascadia Code', 'Fira Code', ui-monospace, monospace);
    --rc-textarea-border-radius: 0 0 4px 4px;
    --rc-textarea-border-top: none;
  }

  rc-editor-toolbar rc-toolbar {
    display: block;
    inline-size: 100%;
    --rc-toolbar-flex-wrap: wrap;
    --rc-toolbar-gap-inline: var(--rme-toolbar-gap, 1px);
    --rc-toolbar-padding-block: var(--rme-toolbar-padding, 4px);
    --rc-toolbar-padding-inline: var(--rme-toolbar-padding, 4px);
    --rc-toolbar-radius: var(--rme-toolbar-radius, 4px 4px 0 0);
  }

  rc-editor-toolbar rc-toolbar::part(root) {
    border: var(--rme-toolbar-border, 1px solid ButtonBorder);
    background: var(--rme-toolbar-background, Canvas);
    color: var(--rme-toolbar-color, CanvasText);
  }

  rc-editor-toolbar rc-button {
    --rc-button-bg: var(--rme-toolbar-button-background, transparent);
    --rc-button-color: var(--rme-toolbar-button-color, ButtonText);
    --rc-button-border: var(--rme-toolbar-button-border, 1px solid transparent);
    --rc-button-radius: var(--rme-toolbar-button-radius, 3px);
    --rc-button-block-size: var(--rme-toolbar-button-size, 2rem);
    --rc-button-icon-size: var(--rme-toolbar-button-size, 2rem);
    --rc-button-padding-block: 0;
    --rc-button-padding-inline: 0;
    --rc-button-font: inherit;
    --rc-button-state-layer-bg: currentColor;
    --rc-button-hover-state-layer-opacity: var(--rme-toolbar-button-hover-opacity, 0.08);
    --rc-button-focus-state-layer-opacity: var(--rme-toolbar-button-focus-opacity, 0.12);
    --rc-button-pressed-state-layer-opacity: var(--rme-toolbar-button-pressed-opacity, 0.12);
  }

  rc-editor-toolbar rc-button.toolbar-active {
    --rc-button-bg: var(--rme-toolbar-button-active-background, Highlight);
    --rc-button-color: var(--rme-toolbar-button-active-color, HighlightText);
    --rc-button-border: var(--rme-toolbar-button-active-border, 1px solid Highlight);
  }

  rc-editor-toolbar rc-button > button:focus-visible {
    outline: var(--rme-toolbar-focus-outline, 2px solid Highlight);
    outline-offset: var(--rme-toolbar-focus-outline-offset, 1px);
  }

  rc-editor-toolbar [data-rc-button-icon] svg {
    inline-size: 1.15em;
    block-size: 1.15em;
    flex-shrink: 0;
  }

  /* Heading select */
  rc-editor-toolbar rc-select {
    font-size: 0.8125em;
    --rc-select-padding-block: 0.25em;
    --rc-select-padding-inline: 0.35em;
    --rc-select-border: var(--rme-toolbar-select-border, 1px solid ButtonBorder);
    --rc-select-radius: var(--rme-toolbar-select-radius, 3px);
  }

  rc-editor-toolbar rc-select::part(trigger) {
    min-width: 0;
    background: var(--rme-toolbar-select-background, ButtonFace);
    color: var(--rme-toolbar-select-color, ButtonText);
    cursor: pointer;
  }

  rc-editor-toolbar rc-select::part(listbox) {
    border-radius: 3px;
  }

  rc-editor-toolbar rc-select.toolbar-active::part(trigger) {
    background: var(--rme-toolbar-select-active-background, Highlight);
    color: var(--rme-toolbar-select-active-color, HighlightText);
    border-color: var(--rme-toolbar-select-active-border-color, Highlight);
  }

  /* Code block language input */
  rc-editor-toolbar .lang-input {
    padding: 0.25em 0.5em;
    border: var(--rme-toolbar-input-border, 1px solid ButtonBorder);
    border-radius: var(--rme-toolbar-input-radius, 3px);
    background: var(--rme-toolbar-input-background, Field);
    color: var(--rme-toolbar-input-color, FieldText);
    font: inherit;
    font-size: 0.8125em;
    width: 8em;
  }

  rc-editor-toolbar .lang-input:focus {
    outline: var(--rme-toolbar-focus-outline, 2px solid Highlight);
    outline-offset: var(--rme-toolbar-focus-outline-offset, 1px);
  }

  rc-editor-toolbar .lang-input::placeholder {
    color: GrayText;
  }

  #rich-view a {
    cursor: pointer;
    text-decoration: underline;
  }

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

  #rich-view ul,
  #rich-view ol {
    margin: 0.5em 0;
    padding-left: 1.75em;
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
