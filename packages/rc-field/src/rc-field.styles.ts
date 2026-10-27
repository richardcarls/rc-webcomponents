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
    min-block-size: var(--rc-field-min-block-size, var(--rc-control-block-size, 2.5rem));
    gap: 0;
    padding: var(
      --rc-field-padding,
      var(--rc-control-padding-block, 0.5rem) var(--rc-control-padding-inline, 0.75rem)
    );
    border: var(--rc-field-border, var(--rc-border, 1px solid ButtonBorder));
    border-radius: var(--rc-field-radius, var(--rc-control-radius, 0.125rem));
    background: var(--rc-field-background, var(--rc-field, Field));
    color: var(--rc-field-color, var(--rc-field-text, FieldText));
    font-family: var(--rc-font-family, inherit);
    font-size: var(--rc-font-size, 1em);
    font-weight: var(--rc-font-weight, 400);
    line-height: var(--rc-line-height, normal);
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
    color: var(--rc-field-label-color, var(--rc-field-text, CanvasText));
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
    margin-inline-end: var(--rc-field-gap, var(--rc-control-gap, 0.5rem));
  }

  #trailing:not(.empty-slot) {
    margin-inline-start: var(--rc-field-gap, var(--rc-control-gap, 0.5rem));
  }

  #prefix:not(.empty-slot) {
    margin-inline-end: var(--rc-field-control-gap, var(--rc-control-gap, 0.25rem));
  }

  #suffix:not(.empty-slot) {
    margin-inline-start: var(--rc-field-control-gap, var(--rc-control-gap, 0.25rem));
  }

  /*
   * Must repeat the #leading/#trailing/#prefix/#suffix id selectors: a class alone
   * (0,1,0) can never beat their own display:inline-flex rule above, an id selector
   * (1,0,0) — an empty slot region reflowed as an invisible box but kept its
   * inline-flex layout box (and any margin set for the non-empty case), silently
   * eating into the control's available width.
   */
  #leading.empty-slot,
  #trailing.empty-slot,
  #prefix.empty-slot,
  #suffix.empty-slot {
    display: none;
  }

  ::slotted(input),
  ::slotted(select),
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
    /*
     * Chromium's own tap-highlight flash on touch is not an outline and
     * isn't covered by outline: 0 above; Firefox has no equivalent
     * behavior, which is why an unstyled control only flashes on Chrome.
     */
    -webkit-tap-highlight-color: transparent;
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
    gap: var(--rc-field-supporting-gap, var(--rc-control-gap, 0.5rem));
    padding-block-start: var(--rc-field-supporting-padding-block-start, 0.25rem);
    padding-inline: var(
      --rc-field-supporting-padding-inline,
      var(--rc-control-padding-inline, 0.75rem)
    );
    color: var(--rc-field-supporting-color, var(--rc-field-text, CanvasText));
    font-size: var(--rc-field-supporting-font-size, 0.75rem);
    line-height: 1.333;
  }

  #error {
    /*
     * Falls back to the validation red a user agent uses for an invalid
     * control, not to a system color. Mark is the background of highlighted
     * text, which renders as pure yellow and is unreadable as a foreground.
     */
    color: var(--rc-field-error-color, red);
  }

  #counter {
    grid-column: 2;
    grid-row: 1;
    white-space: nowrap;
  }

  :host([data-invalid]) #field {
    border-color: var(--rc-field-error-color, red);
  }

  :host([data-disabled]) {
    opacity: var(--rc-field-disabled-opacity, var(--rc-disabled-opacity, 0.6));
  }

  :host([data-focused]) #field {
    outline: var(--rc-field-focus-outline, var(--rc-focus-ring, 2px solid Highlight));
    outline-offset: var(--rc-field-focus-outline-offset, var(--rc-focus-ring-offset, 0));
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
