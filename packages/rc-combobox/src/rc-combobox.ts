import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import { RCSelect } from '@rcarls/rc-select';
import type { FilterStrategy } from '@rcarls/rc-listbox';

import { comboboxStyles } from './rc-combobox.styles.js';

export interface RCComboboxCreateEvent {
  /** The text typed by the user that didn't match any existing option. */
  text: string;
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-combobox': RCCombobox;
  }
}

/**
 * An editable combobox with autocomplete filtering and optional allow-create.
 *
 * Extends `rc-select` by replacing the trigger `<div>` with a text `<input>`
 * and adding: live filtering of the listbox, keyboard navigation from input,
 * and an optional "Create '{text}'" option for new entries.
 *
 * @attr [allowcreate] - When present, shows a "Create 'X'" option for unmatched input.
 *
 * @slot select - Required. A native `<select>` element for form submission.
 * @slot toggle-icon - Optional. Replaces the default chevron icon.
 *
 * @fires rc-select-change - Inherited selection change event.
 * @fires rc-combobox-create - When the "Create" option is activated.
 *   `detail: { text: string }`. Cancelable — call `preventDefault()` to stop
 *   the default insertion of the new option.
 *
 * @csspart anchor - Outer container (includes chips + input + toggle).
 * @csspart chip - Individual chip (multiple mode).
 * @csspart chip-label - Text label inside a chip.
 * @csspart chip-remove - Remove button inside a chip.
 * @csspart input - The text input element.
 * @csspart toggle - The chevron toggle button.
 *
 * @cssprop [--rc-combobox-max-height=20em] - Maximum popup height.
 * @cssprop [--rc-combobox-control-block-size=var(--rc-control-block-size)] - Anchor block size.
 * @cssprop [--rc-combobox-padding-block=calc(var(--rc-control-padding-block) / 2)] - Anchor block-axis padding.
 * @cssprop [--rc-combobox-padding-inline=calc(var(--rc-control-padding-inline) / 2)] - Anchor inline-axis padding.
 * @cssprop [--rc-combobox-gap=var(--rc-control-gap)] - Gap between chips, input, and toggle.
 * @cssprop [--rc-combobox-radius=var(--rc-control-radius)] - Anchor border radius.
 * @cssprop [--rc-combobox-border=var(--rc-border)] - Anchor border.
 * @cssprop [--rc-combobox-listbox-radius=var(--rc-control-radius)] - Popup listbox border radius.
 * @cssprop [--rc-combobox-listbox-padding-block=var(--rc-control-padding-block)] - Popup listbox block padding.
 * @cssprop [--rc-combobox-chip-radius=var(--rc-radius-md)] - Multi-select chip border radius.
 * @cssprop [--rc-combobox-chip-padding-block=0.1em] - Multi-select chip block-axis padding.
 * @cssprop [--rc-combobox-chip-padding-inline=0.3em] - Multi-select chip inline-axis padding.
 */
export class RCCombobox extends RCSelect {
  static override styles = comboboxStyles;

  /** When set, shows a "Create '{text}'" option for text that has no exact match. */
  @property({ type: Boolean, attribute: 'allowcreate' })
  allowCreate = false;

  /**
   * How option labels are matched against typed input.
   *
   * - Forwarded to the internal `rc-listbox`.
   * - Defaults to `'contains'` (substring).
   * - Set to `'prefix'` for starts-with matching, or
   * - Pass a custom `(label, query) => boolean` predicate.
   *
   * Function values are JS-only; string values may be set via the `filter-strategy` attribute.
   */
  @property({ attribute: 'filter-strategy', reflect: false })
  filterStrategy: FilterStrategy = 'contains';

  @query('#trigger')
  protected override _$trigger!: HTMLInputElement;

  @state()
  private _filterText = '';

  // Guard against _handleInputFocus re-opening the popup immediately after close.
  private _closingPopup = false;

  override openPopup() {
    super.openPopup();
    this._$listbox?.filterOptions(this._filterText);
  }

  override closePopup(_returnFocus = true) {
    this._filterText = '';
    this._$listbox?.clearFilter();
    this._$listbox?.setCreateOption(null);
    this._closingPopup = true;

    super.closePopup(false);

    // Deferred past any native focus-return from hidePopover() in Firefox
    setTimeout(() => {
      this._closingPopup = false;
    }, 0);
  }

  private _handleInput(e: InputEvent) {
    this._filterText = (e.target as HTMLInputElement).value;

    if (!this.open && this._filterText) {
      this.openPopup();
    }

    this._$listbox?.filterOptions(this._filterText);
    this._updateCreateOption();

    if (this._$listbox?.navigableItems.length) {
      this._activeDescendantCtrl.navigateToFirst();
    } else {
      this._activeDescendantCtrl.clear();
    }
  }

  private _handleInputFocus() {
    if (!this.open && !this._closingPopup) {
      this.openPopup();
    }
  }

  private _handleToggleClick(e: MouseEvent) {
    e.stopPropagation();

    if (this.open) {
      this.closePopup();
    } else {
      this.openPopup();
      this._$trigger?.focus();
    }
  }

  private _handleAnchorClick(e: MouseEvent) {
    const $target = e.target as HTMLElement;

    if (
      $target.closest('[part~="chip"]') ||
      ($target as HTMLElement & { id?: string }).id === 'toggle'
    ) {
      return;
    }

    this._$trigger?.focus();
  }

  private _updateCreateOption() {
    if (!this.allowCreate || !this._filterText.trim()) {
      this._$listbox?.setCreateOption(null);

      return;
    }

    const trimmed = this._filterText.trim().toLowerCase();
    const hasExact =
      this._$listbox?.allOptions.some((o) => o.label.toLowerCase() === trimmed) ?? false;

    this._$listbox?.setCreateOption(hasExact ? null : this._filterText.trim());
  }

  protected override _handleListboxChange(e: CustomEvent) {
    const { optionValue, value } = e.detail as {
      optionValue?: string;
      value: string | string[];
      selected: boolean;
    };
    const activatedValue = optionValue ?? (Array.isArray(value) ? value.at(-1) : value);

    if (activatedValue === '__create__') {
      e.stopPropagation();
      void this._activateCreate(this._filterText.trim());

      return;
    }

    super._handleListboxChange(e);

    if (!this.multiple) {
      this._syncInputToSelection();
    } else {
      this._filterText = '';

      if (this._$trigger) {
        this._$trigger.value = '';
      }

      this._$listbox?.clearFilter();
      this._updateCreateOption();
    }
  }

  private async _activateCreate(text: string) {
    if (!text) {
      return;
    }

    const createEvent = new CustomEvent<RCComboboxCreateEvent>('rc-combobox-create', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { text },
    });

    if (!this.dispatchEvent(createEvent)) {
      return;
    }

    this._addOption({ value: text, label: text });

    if (this.multiple) {
      this._$listbox?.toggleOption(text);
      this._filterText = '';

      if (this._$trigger) {
        this._$trigger.value = '';
      }

      this._$listbox?.clearFilter();
      this._$listbox?.setCreateOption(null);

      return;
    }

    this._applySelection([text]);
    this._syncInputToSelection();
    this.closePopup(true);
    this._dispatchChange();
  }

  override set value(value: string | string[] | undefined) {
    super.value = value;
    this._syncInputToSelection();
  }

  override get value(): string | string[] {
    return super.value;
  }

  private _syncInputToSelection(): void {
    if (this.multiple) {
      return;
    }

    const value = this.selectedValues[0];
    const label = value ? this._labelFor(value) : '';

    this._filterText = label;

    if (this._$trigger) {
      this._$trigger.value = label;
    }
  }

  private _handleInputKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();

        if (!this.open) {
          this.openPopup();
          this._activeDescendantCtrl.navigateToFirst();
        } else {
          this._activeDescendantCtrl.navigate(1);
        }

        break;

      case 'ArrowUp':
        e.preventDefault();

        if (this.open) {
          this._activeDescendantCtrl.navigate(-1);
        }

        break;

      case 'Home':
        if (this.open) {
          e.preventDefault();

          this._activeDescendantCtrl.navigateToFirst();
        }
        break;

      case 'End':
        if (this.open) {
          e.preventDefault();

          this._activeDescendantCtrl.navigateToLast();
        }
        break;

      case 'Enter': {
        e.preventDefault();
        const active = this._activeDescendantCtrl.activeItem;

        if (active) {
          active.dispatchEvent(
            new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
          );
        } else if (this.open && this._$listbox?.navigableItems.length) {
          const $first = this._$listbox.navigableItems[0];

          $first?.dispatchEvent(
            new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
          );
        }

        break;
      }

      case 'Tab':
        if (this.open) {
          const $first = this._$listbox?.navigableItems[0];

          if ($first) {
            $first.dispatchEvent(
              new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
            );
          }

          this.closePopup(false);
        }

        break;

      case 'Escape':
        e.preventDefault();
        this._filterText = '';

        if (this._$trigger) {
          this._$trigger.value = '';
        }

        this.closePopup();
        break;

      case 'Backspace':
        if (this._filterText === '' && this.multiple && this._selectedValues.size > 0) {
          e.preventDefault();
          this._focusLastChipRemove();
        }

        break;

      case 'ArrowLeft':
        if (
          (e.target as HTMLInputElement).selectionStart === 0 &&
          this.multiple &&
          this._selectedValues.size > 0
        ) {
          e.preventDefault();
          this._focusLastChipRemove();
        }

        break;
    }
  }

  private _focusLastChipRemove() {
    const $buttons = Array.from(
      this.renderRoot.querySelectorAll<HTMLButtonElement>('button[part~="chip"]'),
    );

    $buttons[$buttons.length - 1]?.focus();
  }

  private get _inputPlaceholder(): string {
    if (this.multiple && this._selectedValues.size > 0) {
      return '';
    }

    return this.placeholder;
  }

  protected override render() {
    const showChips = this.multiple && this._selectedValues.size > 0;

    return html`
      <div id="anchor" part="anchor" @click=${this._handleAnchorClick}>
        ${showChips ? this._renderChips() : nothing}

        <input
          id="trigger"
          part="input"
          type="text"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-controls="listbox"
          aria-autocomplete="list"
          ?disabled=${this.disabled}
          placeholder=${this._inputPlaceholder}
          .value=${this._filterText}
          autocomplete="off"
          spellcheck="false"
          @input=${this._handleInput}
          @keydown=${this._handleInputKeyDown}
          @focus=${this._handleInputFocus}
        />

        <button
          id="toggle"
          type="button"
          part="toggle"
          aria-hidden="true"
          tabindex="-1"
          @click=${this._handleToggleClick}
        >
          <slot name="toggle-icon">&#9660;</slot>
        </button>
      </div>

      <rc-listbox
        id="listbox"
        part="listbox"
        popover="manual"
        ?multiple=${this.multiple}
        checkmark
        .filterStrategy=${this.filterStrategy}
        @rc-listbox-change=${this._handleListboxChange}
      ></rc-listbox>

      <slot name="select" @slotchange=${this._handleSelectSlotChange}></slot>
    `;
  }
}

export default RCCombobox;
