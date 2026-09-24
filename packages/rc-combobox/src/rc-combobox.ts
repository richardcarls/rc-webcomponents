import { html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import { inlineArrowKeys, resolveFlow } from '@rcarls/rc-common';
import { RCSelect, type RCSelectPopupMode } from '@rcarls/rc-select';
import type { FilterStrategy, RCListboxChangeEvent } from '@rcarls/rc-listbox';

import { comboboxStyles } from './rc-combobox.styles.js';

export interface RCComboboxCreateEvent {
  /** The text typed by the user that didn't match any existing option. */
  text: string;
}

export type RCComboboxPopupMode = RCSelectPopupMode;

declare global {
  interface HTMLElementTagNameMap {
    'rc-combobox': RCCombobox;
  }
}

/**
 * Editable combobox with filtering and optional allow-create behavior, configured from
 * native option data and following the WAI-ARIA Combobox pattern.
 *
 * Extends `rc-select` by replacing the trigger `<div>` with a text `<input>`
 * and adding: live filtering of the listbox, keyboard navigation from input,
 * and an optional "Create '{text}'" option for new entries.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-combobox rc-combobox docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ WAI-ARIA Combobox pattern}
 *
 * @slot - Required. A native `<select>` element for form submission.
 * @slot toggle-icon - Optional. Replaces the default chevron icon.
 *
 * @fires rc-select-change - Inherited selection change event.
 * @fires rc-combobox-create - When the "Create" option is activated.
 *   `detail: { text: string }`. Cancelable — call `preventDefault()` to stop
 *   the default insertion of the new option.
 *
 * @csspart anchor - Outer container (includes chips + input + toggle).
 * @csspart chips - The chip group container (multiple mode).
 * @csspart chip - Individual chip (multiple mode).
 * @csspart chip-label - Text label inside a chip.
 * @csspart chip-remove - Remove button inside a chip.
 * @csspart input - The text input element.
 * @csspart toggle - The chevron toggle button.
 * @csspart listbox - The `<rc-listbox>` popup element.
 * @csspart dialog - Dialog popup surface.
 * @csspart dialog-header - Dialog title and action row.
 * @csspart dialog-title - Visible dialog title.
 * @csspart dialog-selected - Scrollable selected-chip region.
 * @csspart dialog-search - Dialog search field wrapper.
 * @csspart dialog-input - Dialog search input.
 * @csspart dialog-listbox - Dialog option list.
 * @csspart dialog-actions - Dialog action group.
 * @csspart dialog-confirm - Commits pending dialog selection and closes the dialog.
 * @csspart dialog-cancel - Discards pending dialog selection and closes the dialog.
 *
 * @attr allow-create - When present, shows a "Create 'X'" option for unmatched input.
 * @attr required - Inherited from `rc-select`; mirrors the slotted native `<select>`'s own
 *   `required`, for `aria-required` on the input trigger.
 * @attr filter-strategy - How option labels are matched against typed input: `'contains'`
 *   (default), `'prefix'`, or a custom predicate set via the `filterStrategy` JS property.
 * @attr popup-mode - Presents options in an anchored `popover` (default) or modal `dialog`.
 *
 * @cssprop [--rc-combobox-max-height=20em] - Maximum popup height.
 * @cssprop [--rc-combobox-control-block-size=var(--rc-control-block-size)] - Anchor block size.
 * @cssprop [--rc-combobox-padding-block=calc(var(--rc-control-padding-block) / 2)] - Anchor block-axis padding.
 * @cssprop [--rc-combobox-padding-inline=calc(var(--rc-control-padding-inline) / 2)] - Anchor inline-axis padding.
 * @cssprop [--rc-combobox-gap=var(--rc-control-gap)] - Gap between chips, input, and toggle.
 * @cssprop [--rc-combobox-radius=var(--rc-control-radius)] - Anchor border radius.
 * @cssprop [--rc-combobox-border=var(--rc-border)] - Anchor border.
 * @cssprop [--rc-combobox-listbox-radius=var(--rc-control-radius)] - Popup listbox border radius.
 * @cssprop [--rc-combobox-listbox-duration=150ms] - Popup listbox open/close fade transition duration.
 * @cssprop [--rc-combobox-listbox-border=var(--rc-border)] - Popup listbox border.
 * @cssprop [--rc-combobox-shadow=var(--rc-shadow)] - Popup listbox box shadow.
 * @cssprop [--rc-combobox-listbox-padding-block=var(--rc-control-padding-block)] - Popup listbox block padding.
 * @cssprop [--rc-combobox-dialog-input-border=var(--rc-border)] - Dialog search input border.
 * @cssprop [--rc-combobox-dialog-input-radius=var(--rc-control-radius)] - Dialog search input radius.
 * @cssprop [--rc-combobox-dialog-input-background=var(--rc-field)] - Dialog search input background.
 * @cssprop [--rc-combobox-dialog-gap=1rem] - Gap between fullscreen dialog regions.
 * @cssprop [--rc-combobox-dialog-header-gap=0.5rem] - Gap between fullscreen dialog header slots.
 * @cssprop [--rc-combobox-dialog-search-gap=0.25rem] - Gap between the dialog search label and input.
 * @cssprop [--rc-anchor-viewport-inline-size] - Visual-viewport inline space supplied by the anchor controller.
 * @cssprop [--rc-anchor-viewport-block-size] - Visual-viewport block space supplied by the anchor controller.
 * @cssprop [--rc-combobox-chip-radius=var(--rc-radius-md)] - Multi-select chip border radius.
 * @cssprop [--rc-combobox-chip-padding-block=0.1em] - Multi-select chip block-axis padding.
 * @cssprop [--rc-combobox-chip-padding-inline-start=0.3em] - Multi-select chip leading padding.
 * @cssprop [--rc-combobox-chip-padding-inline-end=calc(var(--rc-chip-remove-target-size, 1.5rem) + var(--rc-chip-remove-offset-inline, 0.125rem))] - Multi-select chip trailing padding, including the remove affordance.
 * @cssprop [--rc-combobox-chip-gap=calc(var(--rc-control-gap, 0.25em) * 0.8)] - Gap between chip
 *   content items.
 * @cssprop [--rc-combobox-chip-border=var(--rc-border)] - Multi-select chip border.
 * @cssprop [--rc-chip-remove-target-size=1.5rem] - Inherited remove-target width reserved by
 *   generated multi-select chips.
 * @cssprop [--rc-chip-remove-offset-inline=0.125rem] - Inherited edge offset reserved by
 *   generated multi-select chips.
 * @cssprop [--rc-combobox-toggle-size=1.1em] - Inline size of the toggle button's icon area.
 */
export class RCCombobox extends RCSelect {
  static override styles = comboboxStyles;

  /** When set, shows a "Create '{text}'" option for text that has no exact match. */
  @property({ type: Boolean, attribute: 'allow-create' })
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
  protected override _$trigger!: HTMLElement;

  @query('#dialog-input')
  private _$dialogInput?: HTMLInputElement;

  @state()
  private _filterText = '';

  // Guard against _handleInputFocus re-opening the popup immediately after close.
  private _closingPopup = false;

  private _provisionalOptions = new Map<string, { value: string; label: string }>();
  private _preDialogOptions: typeof this._options | null = null;

  private get _$filterInput(): HTMLInputElement | null {
    if (this._activePopupMode === 'dialog') {
      return this._$dialogInput ?? null;
    }

    return this._$trigger instanceof HTMLInputElement ? this._$trigger : null;
  }

  protected override get _$activeDescendantHost(): HTMLElement | null {
    return this._$filterInput;
  }

  override openPopup() {
    super.openPopup();

    if (this._activePopupMode === 'popover') {
      this._$listbox?.filterOptions(this._filterText);
    }
  }

  override closePopup(_returnFocus = true) {
    if (!this.open) {
      return;
    }

    this._filterText = '';
    this._$listbox?.clearFilter();
    this._$listbox?.setCreateOption(null);
    this._closingPopup = true;

    super.closePopup(_returnFocus);

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
    if (this.popupMode === 'popover' && !this.open && !this._closingPopup) {
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

    this._$filterInput?.focus();
  }

  private _handleDialogAnchorClick(e: MouseEvent): void {
    const $target = e.target as HTMLElement;

    if ($target.closest('[part~="chip"]')) {
      return;
    }

    this.openPopup();
  }

  private _handleDialogTriggerKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case ' ':
      case 'Enter':
      case 'ArrowDown':
        e.preventDefault();
        this.openPopup();

        break;

      default:
        // Chips sit before the trigger along the inline axis, so the arrow
        // toward the inline start reaches them: ArrowRight in RTL.
        if (
          e.key === inlineArrowKeys(resolveFlow(this)).prev &&
          this.multiple &&
          this._selectedValues.size > 0
        ) {
          e.preventDefault();
          this._focusLastChipRemove();
        }

        break;
    }
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
    const detail = e.detail as RCListboxChangeEvent;

    if (detail.reason === 'action' && detail.action === 'create') {
      e.stopPropagation();
      void this._activateCreate(this._filterText.trim());

      return;
    }

    super._handleListboxChange(e);

    if (!this.multiple && this._activePopupMode === 'popover') {
      this._syncInputToSelection();
    } else {
      this._filterText = '';

      if (this._$filterInput) {
        this._$filterInput.value = '';
      }

      this._$listbox?.clearFilter();
      this._updateCreateOption();
    }
  }

  private async _activateCreate(text: string) {
    if (!text) {
      return;
    }

    if (this._activePopupMode === 'dialog') {
      const option = { value: text, label: text };

      this._preDialogOptions ??= [...this._options];
      this._provisionalOptions.set(text, option);
      this._syncOptions([...this._preDialogOptions, ...this._provisionalOptions.values()]);

      const next = new Set(this._pendingSelectedValues ?? this._selectedValues);

      if (!this.multiple) {
        next.clear();
      }

      next.add(text);
      this._pendingSelectedValues = next;
      this._$listbox?.setSelectedValues([...next]);
      this._filterText = '';

      if (this._$filterInput) {
        this._$filterInput.value = '';
      }

      this._$listbox?.clearFilter();
      this._$listbox?.setCreateOption(null);
      this.requestUpdate();

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

      if (this._$filterInput) {
        this._$filterInput.value = '';
      }

      this._$listbox?.clearFilter();
      this._$listbox?.setCreateOption(null);

      return;
    }

    this._applySelection([text], true);
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

    if (this._$filterInput) {
      this._$filterInput.value = label;
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
        if (this.open && this._activePopupMode === 'popover') {
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

        if (this._$filterInput) {
          this._$filterInput.value = '';
        }

        this.closePopup();
        break;

      case 'Backspace':
        if (this._filterText === '' && this.multiple && this._selectedValues.size > 0) {
          e.preventDefault();
          this._focusLastChipRemove();
        }

        break;

      default:
        // With the caret at the text's logical start, the arrow toward the
        // inline start moves on to the chips before the input.
        if (
          e.key === inlineArrowKeys(resolveFlow(this)).prev &&
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
    const $buttons = this._$chipButtons();

    $buttons[$buttons.length - 1]?.focus();
  }

  private get _inputPlaceholder(): string {
    const selectedCount =
      this._activePopupMode === 'dialog'
        ? this._dialogSelectedValues.length
        : this._selectedValues.size;

    if (this.multiple && selectedCount > 0) {
      return '';
    }

    return this.placeholder;
  }

  protected override _syncAccessibleName($select: HTMLSelectElement): void {
    const accessibleName =
      $select.getAttribute('aria-label') ?? $select.labels?.[0]?.textContent?.trim() ?? '';

    this._accessibleName = accessibleName;
    super._syncAccessibleName($select);
  }

  protected override _focusDialogContent(): void {
    this._$listbox?.filterOptions(this._filterText);
    this._$dialogInput?.focus();
  }

  protected override _prepareDialogCommit(): void {
    const baseOptions = this._preDialogOptions ?? [...this._options];
    const pending = new Set(this._dialogSelectedValues);

    this._syncOptions(baseOptions);

    for (const option of this._provisionalOptions.values()) {
      if (!pending.has(option.value)) {
        continue;
      }

      const createEvent = new CustomEvent<RCComboboxCreateEvent>('rc-combobox-create', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: { text: option.label },
      });

      if (this.dispatchEvent(createEvent)) {
        this._addOption(option);
      } else {
        pending.delete(option.value);
      }
    }

    this._pendingSelectedValues = pending;
    this._provisionalOptions.clear();
    this._preDialogOptions = null;
  }

  protected override _commitDialogSelection(): void {
    super._commitDialogSelection();
    this._syncInputToSelection();
  }

  protected override _discardDialogSelection(): void {
    if (this._preDialogOptions) {
      this._syncOptions(this._preDialogOptions);
    }

    this._provisionalOptions.clear();
    this._preDialogOptions = null;
    super._discardDialogSelection();
  }

  protected override _finishDialogClose(returnFocus: boolean): void {
    this._filterText = '';
    this._$listbox?.clearFilter();
    this._$listbox?.setCreateOption(null);
    super._finishDialogClose(returnFocus);
  }

  protected override _renderDialogBody() {
    const title = this._accessibleName || 'Options';

    return html`
      <label part="dialog-search">
        <span>Search ${title}</span>
        <input
          id="dialog-input"
          part="dialog-input"
          type="text"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded="true"
          aria-controls="dialog-listbox"
          aria-autocomplete="list"
          aria-required=${this.required ? 'true' : 'false'}
          ?disabled=${this.disabled}
          placeholder=${this._inputPlaceholder}
          .value=${this._filterText}
          autocomplete="off"
          spellcheck="false"
          @input=${this._handleInput}
          @keydown=${this._handleInputKeyDown}
        />
      </label>

      <rc-listbox
        id="dialog-listbox"
        part="listbox dialog-listbox"
        tabindex="-1"
        ?multiple=${this.multiple}
        checkmark
        .options=${this._options}
        .filterStrategy=${this.filterStrategy}
        @rc-listbox-change=${this._handleListboxChange}
      ></rc-listbox>
    `;
  }

  protected override render() {
    const showChips = this.multiple && this._selectedValues.size > 0;
    const popupMode = this.open ? this._activePopupMode : this.popupMode;

    if (popupMode === 'dialog') {
      return html`
        <div id="anchor" part="anchor" @click=${this._handleDialogAnchorClick}>
          <div class="value">
            ${showChips ? this._renderChips() : nothing}

            <div
              id="trigger"
              part="input"
              role="combobox"
              tabindex=${this.disabled ? '-1' : '0'}
              aria-label=${this._accessibleName || nothing}
              aria-haspopup="dialog"
              aria-expanded=${this.open ? 'true' : 'false'}
              aria-controls="dialog"
              aria-required=${this.required ? 'true' : 'false'}
              aria-disabled=${this.disabled ? 'true' : 'false'}
              @keydown=${this._handleDialogTriggerKeyDown}
            >
              ${this._displayLabel}
            </div>
          </div>

          <span id="toggle" part="toggle" aria-hidden="true">
            <slot name="toggle-icon">
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="1,1 5,5 9,1"></polyline>
              </svg>
            </slot>
          </span>
        </div>

        ${this._renderDialogPopup()}
        <slot @slotchange=${this._handleSelectSlotChange}></slot>
      `;
    }

    return html`
      <div id="anchor" part="anchor" @click=${this._handleAnchorClick}>
        <div class="value">
          ${showChips ? this._renderChips() : nothing}

          <input
            id="trigger"
            part="input"
            type="text"
            role="combobox"
            aria-label=${this._accessibleName || nothing}
            aria-haspopup="listbox"
            aria-expanded=${this.open ? 'true' : 'false'}
            aria-controls="listbox"
            aria-autocomplete="list"
            aria-required=${this.required ? 'true' : 'false'}
            ?disabled=${this.disabled}
            placeholder=${this._inputPlaceholder}
            .value=${this._filterText}
            autocomplete="off"
            spellcheck="false"
            @input=${this._handleInput}
            @keydown=${this._handleInputKeyDown}
            @focus=${this._handleInputFocus}
          />
        </div>

        <button
          id="toggle"
          type="button"
          part="toggle"
          aria-hidden="true"
          tabindex="-1"
          @click=${this._handleToggleClick}
        >
          <slot name="toggle-icon">
            <svg
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="1,1 5,5 9,1" />
            </svg>
          </slot>
        </button>
      </div>

      <rc-listbox
        id="listbox"
        part="listbox"
        popover="manual"
        ?multiple=${this.multiple}
        checkmark
        .filterStrategy=${this.filterStrategy}
        .options=${this._options}
        @rc-listbox-change=${this._handleListboxChange}
      ></rc-listbox>

      <slot @slotchange=${this._handleSelectSlotChange}></slot>
    `;
  }
}

export default RCCombobox;
