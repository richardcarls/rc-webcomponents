import { css } from 'lit';

import { rcToken } from '@rcarls/rc-common';

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
    min-block-size: var(--rc-field-min-block-size, ${rcToken('--rc-control-block-size')});
    gap: 0;
    padding: var(
      --rc-field-padding,
      ${rcToken('--rc-control-padding-block')} ${rcToken('--rc-control-padding-inline')}
    );
    border: var(--rc-field-border, ${rcToken('--rc-border')});
    border-radius: var(--rc-field-radius, ${rcToken('--rc-control-radius')});
    background: var(--rc-field-background, ${rcToken('--rc-field')});
    color: var(--rc-field-color, ${rcToken('--rc-field-text')});
    font-family: ${rcToken('--rc-font-family', 'inherit')};
    font-size: ${rcToken('--rc-font-size')};
    font-weight: ${rcToken('--rc-font-weight')};
    line-height: ${rcToken('--rc-line-height')};
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
    color: var(--rc-field-label-color, ${rcToken('--rc-field-text')});
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
    margin-inline-end: var(--rc-field-gap, ${rcToken('--rc-control-gap')});
  }

  #trailing:not(.empty-slot) {
    margin-inline-start: var(--rc-field-gap, ${rcToken('--rc-control-gap')});
  }

  #prefix:not(.empty-slot) {
    margin-inline-end: var(--rc-field-control-gap, ${rcToken('--rc-control-gap')});
  }

  #suffix:not(.empty-slot) {
    margin-inline-start: var(--rc-field-control-gap, ${rcToken('--rc-control-gap')});
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
  ::slotted([data-rc-field-control]),
  ::slotted(rc-select),
  ::slotted(rc-combobox),
  ::slotted(rc-textarea) {
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

  ::slotted([data-rc-field-control]),
  ::slotted(rc-select),
  ::slotted(rc-combobox),
  ::slotted(rc-textarea) {
    display: block;
  }

  #supporting {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--rc-field-supporting-gap, ${rcToken('--rc-control-gap')});
    padding-block-start: var(--rc-field-supporting-padding-block-start, 0.25rem);
    padding-inline: var(
      --rc-field-supporting-padding-inline,
      ${rcToken('--rc-control-padding-inline')}
    );
    color: var(--rc-field-supporting-color, ${rcToken('--rc-field-text')});
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

  :host(:state(invalid)) #field {
    border-color: var(--rc-field-error-color, red);
  }

  :host(:state(disabled)) {
    opacity: var(--rc-field-disabled-opacity, ${rcToken('--rc-disabled-opacity')});
  }

  :host(:state(focused)) #field {
    outline: var(--rc-field-focus-outline, ${rcToken('--rc-focus-ring')});
    outline-offset: var(--rc-field-focus-outline-offset, ${rcToken('--rc-focus-ring-offset')});
  }

  @media (forced-colors: active) {
    :host(:state(invalid)) #field {
      border-color: Mark;
    }

    :host(:state(focused)) #field {
      outline-color: Highlight;
    }
  }
`;

export default fieldStyles;
