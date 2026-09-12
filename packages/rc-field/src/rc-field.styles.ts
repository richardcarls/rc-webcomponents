import { css } from 'lit';

export const fieldStyles = css`
  :host {
    display: inline-block;
    color-scheme: inherit;
  }

  [hidden] {
    display: none !important;
  }

  #field {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    min-block-size: var(--rc-field-min-block-size, 2.5rem);
    gap: 0;
    padding: var(--rc-field-padding, 0.5rem 0.75rem);
    border: var(--rc-field-border, 1px solid ButtonBorder);
    border-radius: var(--rc-field-radius, 0.125rem);
    background: var(--rc-field-background, Field);
    color: var(--rc-field-color, FieldText);
    font: inherit;
  }

  #field.empty {
    min-block-size: 0;
    padding: 0;
    border: 0;
    background: none;
  }

  #content {
    display: flex;
    flex: 1 1 auto;
    min-inline-size: 0;
    flex-direction: column;
  }

  #label {
    color: var(--rc-field-label-color, CanvasText);
    line-height: 1.25;
  }

  #control {
    display: flex;
    min-inline-size: 0;
    align-items: center;
    gap: 0;
  }

  #leading,
  #trailing,
  #prefix,
  #suffix {
    display: inline-flex;
    flex: none;
    align-items: center;
  }

  #leading:not(.empty-slot) {
    margin-inline-end: var(--rc-field-gap, 0.5rem);
  }

  #trailing:not(.empty-slot) {
    margin-inline-start: var(--rc-field-gap, 0.5rem);
  }

  #prefix:not(.empty-slot) {
    margin-inline-end: var(--rc-field-control-gap, 0.25rem);
  }

  #suffix:not(.empty-slot) {
    margin-inline-start: var(--rc-field-control-gap, 0.25rem);
  }

  .empty-slot {
    display: none;
  }

  ::slotted(input),
  ::slotted(textarea),
  ::slotted([data-rc-field-control]) {
    box-sizing: border-box;
    flex: 1 1 auto;
    min-inline-size: 0;
    max-inline-size: 100%;
    padding: 0;
    border: 0;
    border-radius: 0;
    outline: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    box-shadow: none;
  }

  ::slotted(textarea) {
    min-block-size: 4lh;
    resize: block;
  }

  ::slotted([data-rc-field-control]) {
    display: block;
  }

  #supporting {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--rc-field-supporting-gap, 0.5rem);
    padding-block-start: var(--rc-field-supporting-padding-block-start, 0.25rem);
    padding-inline: var(--rc-field-supporting-padding-inline, 0.75rem);
    color: var(--rc-field-supporting-color, CanvasText);
    font-size: var(--rc-field-supporting-font-size, 0.75rem);
    line-height: 1.333;
  }

  #error {
    color: var(--rc-field-error-color, Mark);
  }

  #counter {
    grid-column: 2;
    grid-row: 1;
    white-space: nowrap;
  }

  :host([data-invalid]) #field {
    border-color: var(--rc-field-error-color, Mark);
  }

  :host([data-disabled]) {
    opacity: var(--rc-field-disabled-opacity, 0.6);
  }

  :host([data-focused]) #field {
    outline: var(--rc-field-focus-outline, 2px solid Highlight);
    outline-offset: var(--rc-field-focus-outline-offset, 0);
  }

  @media (forced-colors: active) {
    :host([data-invalid]) #field {
      border-color: Mark;
    }

    :host([data-focused]) #field {
      outline-color: Highlight;
    }
  }
`;

export default fieldStyles;
