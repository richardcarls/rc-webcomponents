import { css } from 'lit';

/**
 * Styles of `rc-editor-toolbar`. The editor's `--rc-markdown-editor-toolbar-*`
 * tokens inherit into this shadow root.
 */
export const editorToolbarStyles = css`
  :host {
    display: block;
  }

  rc-toolbar {
    display: block;
    inline-size: 100%;
    --rc-toolbar-flex-wrap: wrap;
    --rc-toolbar-gap-inline: var(--rc-markdown-editor-toolbar-gap, 1px);
    --rc-toolbar-padding-block: var(--rc-markdown-editor-toolbar-padding, 4px);
    --rc-toolbar-padding-inline: var(--rc-markdown-editor-toolbar-padding, 4px);
    --rc-toolbar-radius: var(--rc-markdown-editor-toolbar-radius, 4px 4px 0 0);
  }

  rc-toolbar::part(root) {
    border: var(--rc-markdown-editor-toolbar-border, 1px solid ButtonBorder);
    background: var(--rc-markdown-editor-toolbar-background, Canvas);
    color: var(--rc-markdown-editor-toolbar-color, CanvasText);
  }

  rc-button {
    --rc-button-bg: var(--rc-markdown-editor-toolbar-button-background, transparent);
    --rc-button-color: var(--rc-markdown-editor-toolbar-button-color, ButtonText);
    --rc-button-border: var(--rc-markdown-editor-toolbar-button-border, 1px solid transparent);
    --rc-button-radius: var(--rc-markdown-editor-toolbar-button-radius, 3px);
    --rc-button-block-size: var(--rc-markdown-editor-toolbar-button-size, 2rem);
    --rc-button-icon-size: var(--rc-markdown-editor-toolbar-button-size, 2rem);
    --rc-button-padding-block: 0;
    --rc-button-padding-inline: 0;
    --rc-button-font: inherit;
    --rc-button-state-layer-bg: currentColor;
    --rc-button-hover-state-layer-opacity: var(
      --rc-markdown-editor-toolbar-button-hover-opacity,
      0.08
    );
    --rc-button-focus-state-layer-opacity: var(
      --rc-markdown-editor-toolbar-button-focus-opacity,
      0.12
    );
    --rc-button-pressed-state-layer-opacity: var(
      --rc-markdown-editor-toolbar-button-pressed-opacity,
      0.12
    );
  }

  rc-button.toolbar-active {
    --rc-button-bg: var(--rc-markdown-editor-toolbar-button-active-background, Highlight);
    --rc-button-color: var(--rc-markdown-editor-toolbar-button-active-color, HighlightText);
    --rc-button-border: var(--rc-markdown-editor-toolbar-button-active-border, 1px solid Highlight);
  }

  rc-button > button:focus-visible {
    outline: var(--rc-markdown-editor-toolbar-focus-outline, 2px solid Highlight);
    outline-offset: var(--rc-markdown-editor-toolbar-focus-outline-offset, 1px);
  }

  [data-rc-icon] svg {
    inline-size: 1.15em;
    block-size: 1.15em;
    flex-shrink: 0;
  }

  /* Heading select */
  .heading-select {
    padding: 0.25em 0.35em;
    border: var(--rc-markdown-editor-toolbar-select-border, 1px solid ButtonBorder);
    border-radius: var(--rc-markdown-editor-toolbar-select-radius, 3px);
    background: var(--rc-markdown-editor-toolbar-select-background, ButtonFace);
    color: var(--rc-markdown-editor-toolbar-select-color, ButtonText);
    font: inherit;
    font-size: 0.8125em;
    cursor: pointer;
  }

  .heading-select:focus-visible {
    outline: var(--rc-markdown-editor-toolbar-focus-outline, 2px solid Highlight);
    outline-offset: var(--rc-markdown-editor-toolbar-focus-outline-offset, 1px);
  }

  .heading-select.toolbar-active {
    border-color: var(--rc-markdown-editor-toolbar-select-active-border-color, Highlight);
    background: var(--rc-markdown-editor-toolbar-select-active-background, Highlight);
    color: var(--rc-markdown-editor-toolbar-select-active-color, HighlightText);
  }

  /* Code block language input */
  .lang-input {
    padding: 0.25em 0.5em;
    border: var(--rc-markdown-editor-toolbar-input-border, 1px solid ButtonBorder);
    border-radius: var(--rc-markdown-editor-toolbar-input-radius, 3px);
    background: var(--rc-markdown-editor-toolbar-input-background, Field);
    color: var(--rc-markdown-editor-toolbar-input-color, FieldText);
    font: inherit;
    font-size: 0.8125em;
    width: 8em;
  }

  .lang-input:focus {
    outline: var(--rc-markdown-editor-toolbar-focus-outline, 2px solid Highlight);
    outline-offset: var(--rc-markdown-editor-toolbar-focus-outline-offset, 1px);
  }

  .lang-input::placeholder {
    color: GrayText;
  }
`;
