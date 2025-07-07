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
 * @attr [allowcreate] - When present, shows a "Create 'X'" option for unmatched input.
 */
export class RCCombobox extends RCSelect {
  static override styles = comboboxStyles;

  /** When set, shows a "Create '{text}'" option for text that has no exact match. */
  @property({ type: Boolean, attribute: 'allowcreate' }) allowCreate = false;

  /**
   * How option labels are matched against typed input. Forwarded to the internal `rc-listbox`.
   * Defaults to `'contains'` (substring). Set to `'prefix'` for starts-with matching,
   * or pass a custom `(label, query) => boolean` predicate.
   * Function values are JS-only; string values may be set via the `filter-strategy` attribute.
   */
  @property({ attribute: 'filter-strategy', reflect: false }) filterStrategy: FilterStrategy = 'contains';

  @query('#trigger') protected override _$trigger!: HTMLInputElement;

  @state() private _filterText = '';

  // ── Override popup lifecycle ──────────────────────────────────────────────────

  override openPopup() {
    super.openPopup();
    this._$listbox?.filterOptions(this._filterText);
  }

  override closePopup(returnFocus = true) {
    this._filterText = '';
    this._$listbox?.clearFilter();
    this._$listbox?.setCreateOption(null);
    super.closePopup(returnFocus);
    // super.closePopup calls _$trigger.focus() too, but we need input focus
    if (returnFocus && this._$trigger) this._$trigger.focus();
  }

  // ── Input events ──────────────────────────────────────────────────────────────

  private _handleInput(e: InputEvent) {
    this._filterText = (e.target as HTMLInputElement).value;
    if (!this.open && this._filterText) this.openPopup();
    this._$listbox?.filterOptions(this._filterText);
    this._updateCreateOption();
    if (this._$listbox?.navigableItems.length) {
      this._adc.navigateToFirst();
    } else {
      this._adc.clear();
    }
  }

  private _handleInputFocus() {
    if (!this.open) this.openPopup();
  }

  private _handleToggleClick(e: MouseEvent) {
    e.stopPropagation();
    if (this.open) this.closePopup();
    else {
      this.openPopup();
      this._$trigger?.focus();
    }
  }

  private _handleAnchorClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('[part~="chip"]') || (target as HTMLElement & { id?: string }).id === 'toggle') return;
    this._$trigger?.focus();
  }

  // ── Create option ─────────────────────────────────────────────────────────────

  private _updateCreateOption() {
    if (!this.allowCreate || !this._filterText.trim()) {
      this._$listbox?.setCreateOption(null);
      return;
    }
    const trimmed = this._filterText.trim().toLowerCase();
    const hasExact = this._$listbox?.allOptions.some(
      (o) => o.label.toLowerCase() === trimmed
    ) ?? false;
    this._$listbox?.setCreateOption(hasExact ? null : this._filterText.trim());
  }

  protected override _handleListboxChange(e: CustomEvent) {
    const { value } = e.detail as { value: string; selected: boolean };
    if (value === '__create__') {
      e.stopPropagation();
      void this._activateCreate(this._filterText.trim());
      return;
    }
    super._handleListboxChange(e);
    if (!this.multiple) {
      const label = this._labelFor(value);
      this._filterText = label;
      if (this._$trigger) this._$trigger.value = label;
    } else {
      this._filterText = '';
      if (this._$trigger) this._$trigger.value = '';
      this._$listbox?.clearFilter();
      this._updateCreateOption();
    }
  }

  private async _activateCreate(text: string) {
    if (!text) return;
    const createEvent = new CustomEvent<RCComboboxCreateEvent>('rc-combobox-create', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { text },
    });
    if (!this.dispatchEvent(createEvent)) return;

    const sel = this._selectRef?.deref();
    if (sel) {
      const opt = document.createElement('option');
      opt.value = text;
      opt.text = text;
      sel.add(opt);
    }

    this._$listbox?.appendOption({ value: text, label: text });

    if (this.multiple) {
      this._$listbox?.toggleOption(text);
      this._filterText = '';
      if (this._$trigger) this._$trigger.value = '';
      this._$listbox?.clearFilter();
      this._$listbox?.setCreateOption(null);
    } else {
      this._filterText = text;
      if (this._$trigger) this._$trigger.value = text;
      this._$listbox?.setSelectedValues([text]);
      this._selectedValues = new Set([text]);
      this._syncNativeSelect();
      this.closePopup(true);
    }

    this.dispatchEvent(new CustomEvent('rc-select-change', {
      bubbles: true,
      composed: true,
      detail: { value: this.multiple ? [...this._selectedValues] : text },
    }));
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────────

  private _handleInputKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this.open) { this.openPopup(); this._adc.navigateToFirst(); }
        else this._adc.navigate(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (this.open) this._adc.navigate(-1);
        break;
      case 'Home':
        if (this.open) { e.preventDefault(); this._adc.navigateToFirst(); }
        break;
      case 'End':
        if (this.open) { e.preventDefault(); this._adc.navigateToLast(); }
        break;
      case 'Enter': {
        e.preventDefault();
        const active = this._adc.activeItem;
        if (active) {
          active.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
        } else if (this.open && this._$listbox?.navigableItems.length) {
          const first = this._$listbox.navigableItems[0];
          first?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
        }
        break;
      }
      case 'Tab':
        if (this.open) {
          const first = this._$listbox?.navigableItems[0];
          if (first) {
            first.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
          }
          this.closePopup(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        this._filterText = '';
        if (this._$trigger) this._$trigger.value = '';
        this.closePopup();
        break;
      case 'Backspace':
        if (this._filterText === '' && this.multiple && this._selectedValues.size > 0) {
          e.preventDefault();
          this._focusLastChipRemove();
        }
        break;
      case 'ArrowLeft':
        if ((e.target as HTMLInputElement).selectionStart === 0
            && this.multiple && this._selectedValues.size > 0) {
          e.preventDefault();
          this._focusLastChipRemove();
        }
        break;
    }
  }

  private _focusLastChipRemove() {
    const buttons = Array.from(
      this.renderRoot.querySelectorAll<HTMLButtonElement>('button[part~="chip"]')
    );
    buttons[buttons.length - 1]?.focus();
  }

  private get _inputPlaceholder(): string {
    if (this.multiple && this._selectedValues.size > 0) return '';
    return this.placeholder;
  }

  // ── Render ────────────────────────────────────────────────────────────────────

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
        >

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
        .filterStrategy=${this.filterStrategy}
        @rc-listbox-change=${this._handleListboxChange}
      ></rc-listbox>

      <slot name="select" @slotchange=${this._handleSelectSlotChange}></slot>
    `;
  }
}

export default RCCombobox;
