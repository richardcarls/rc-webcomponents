import { LitElement, html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import {
  ActiveDescendantController,
  AnchorController,
} from '@rcarls/rc-common';
import type { RCListbox, ListboxOption } from '@rcarls/rc-listbox';
import { selectStyles } from './rc-select.styles.js';

export type RCSelectValue = string | string[];

export interface RCSelectChangeEvent {
  value: RCSelectValue;
  selectedValues: string[];
  selectedOptions: ListboxOption[];
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-select': RCSelect;
  }
}

/**
 * A fully-accessible, form-associated select/combobox component.
 *
 * Wraps a native `<select slot="select">` as the form value reflector while
 * rendering a custom trigger and popup listbox. Follows the WAI-ARIA APG
 * Combobox pattern (select-only variant) with JS-computed popup placement
 * and `aria-activedescendant` for virtual keyboard navigation.
 *
 * @slot select - Required. A native `<select>` element used for form submission
 *   and as the source of truth for options, multiple, and disabled state.
 * @slot display - Optional. Replaces the default value label in the trigger.
 * @slot toggle-icon - Optional. Replaces the default chevron icon.
 *
 * @fires rc-select-change - When user interaction changes selection.
 *   `detail: { value, selectedValues, selectedOptions }`
 * @fires rc-select-open - When the popup opens.
 * @fires rc-select-close - When the popup closes.
 *
 * @csspart anchor - The flex container wrapping chips and trigger.
 * @csspart trigger - The combobox trigger element (div).
 * @csspart chips - The chips group container (when multiple).
 * @csspart chip - Individual chip (when multiple).
 * @csspart chip-label - Text label inside a chip.
 * @csspart chip-remove - Remove button inside a chip.
 * @csspart value-display - The text label showing selected value(s).
 * @csspart toggle-icon - The chevron/arrow icon container.
 *
 * @cssprop [--rc-select-max-height=20em] - Maximum popup height.
 */
export class RCSelect extends LitElement {
  static override styles = selectStyles;

  @property({ type: Boolean, reflect: true }) open = false;
  @property({ type: Boolean, reflect: true }) multiple = false;
  @property({ type: Boolean, reflect: true }) disabled = false;
  @property() placeholder = '';
  @property() display: 'auto' | 'chips' | 'compact' = 'auto';

  @query('#anchor') protected _$anchor!: HTMLElement;
  @query('#trigger') protected _$trigger!: HTMLElement;
  @query('#listbox') protected _$listbox!: RCListbox;

  @state() protected _selectedValues: Set<string> = new Set();
  @state() private _chipNavIndex = -1;
  @state() private _options: ListboxOption[] = [];

  protected _selectRef: WeakRef<HTMLSelectElement> | null = null;
  private _mutationObserver: MutationObserver | null = null;
  private _defaultValue: RCSelectValue | undefined;
  private _propertyOptions: ListboxOption[] | undefined;
  private _value: RCSelectValue | undefined;
  private _selectionInitialized = false;
  private _typeAheadBuffer = '';
  private _typeAheadTimer = 0;

  protected _adc = new ActiveDescendantController(this, {
    host: () => this._$trigger ?? null,
    items: () => this._$listbox?.navigableItems ?? [],
  });

  protected _anchorCtrl = new AnchorController(this, {
    anchor: () => this._$anchor ?? null,
    floating: () => this._$listbox ?? null,
    shadowHost: () => this,
    placement: 'bottom-start',
    offset: 2,
  });

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._onDocClick, { capture: true });
    document.addEventListener('keydown', this._onDocKeyDown, { capture: true });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._onDocClick, { capture: true });
    document.removeEventListener('keydown', this._onDocKeyDown, {
      capture: true,
    });
    this._mutationObserver?.disconnect();
  }

  // ── Popup ────────────────────────────────────────────────────────────────────

  openPopup() {
    if (this.open || this.disabled) return;
    this.open = true;
    this._$listbox.showPopover();
    this._anchorCtrl.update();
    this.dispatchEvent(
      new CustomEvent('rc-select-open', { bubbles: true, composed: true }),
    );
    this.requestUpdate();
  }

  closePopup(returnFocus = true) {
    if (!this.open) return;
    this.open = false;
    this._$listbox.hidePopover();
    this._adc.clear();
    if (returnFocus) this._$trigger?.focus();
    this.dispatchEvent(
      new CustomEvent('rc-select-close', { bubbles: true, composed: true }),
    );
  }

  /**
   * Current selection. Host writes update selection silently; user interaction
   * emits `rc-select-change`.
   */
  get value(): RCSelectValue {
    return this.multiple
      ? this.selectedValues
      : (this.selectedValues[0] ?? '');
  }

  set value(value: RCSelectValue | undefined) {
    const oldValue = this._value;

    this._value = value;

    if (value === undefined) {
      this.requestUpdate('value', oldValue);
      return;
    }

    this._selectionInitialized = true;
    this._applySelection(this._normalizeValue(value));
    this.requestUpdate('value', oldValue);
  }

  /** Initial uncontrolled selection, applied before user or native state owns the value. */
  get defaultValue(): RCSelectValue | undefined {
    return this._defaultValue;
  }

  set defaultValue(value: RCSelectValue | undefined) {
    const oldValue = this._defaultValue;

    this._defaultValue = value;

    if (!this._selectionInitialized && this._value === undefined && value !== undefined) {
      this._applySelection(this._normalizeValue(value));
    }

    this.requestUpdate('defaultValue', oldValue);
  }

  /** Programmatic option source. Omit to derive options from the slotted `<select>`. */
  get options(): ListboxOption[] | undefined {
    return this._propertyOptions ? [...this._propertyOptions] : undefined;
  }

  set options(options: ListboxOption[] | undefined) {
    const oldValue = this._propertyOptions;

    this._propertyOptions = options ? [...options] : undefined;
    this._syncOptions(this._currentOptions());
    this._mirrorOptionsToNativeSelect();
    this.requestUpdate('options', oldValue);
  }

  /** Selected values as a consistently-array-shaped convenience getter. */
  get selectedValues(): string[] {
    return [...this._selectedValues];
  }

  protected get selectedOptions(): ListboxOption[] {
    return this._selectedOptionsFor(this.selectedValues);
  }

  protected _applySelection(values: string[]): void {
    const selectedValues = this.multiple ? values : values.slice(0, 1);

    this._selectedValues = new Set(selectedValues);
    this._$listbox?.setSelectedValues(selectedValues);
    this._syncNativeSelect();
    this.requestUpdate();
  }

  // ── Document-level listeners ─────────────────────────────────────────────────

  private _onDocClick = (e: MouseEvent) => {
    if (!this.open) return;
    if (!e.composedPath().includes(this)) this.closePopup(false);
  };

  private _onDocKeyDown = (e: KeyboardEvent) => {
    if (!this.open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.closePopup();
    }
  };

  // ── Slot: native <select> ────────────────────────────────────────────────────

  protected _handleSelectSlotChange(e: Event) {
    const slot = e.target as HTMLSlotElement;
    const sel =
      slot
        .assignedElements()
        .find(
          (el): el is HTMLSelectElement => el instanceof HTMLSelectElement,
        ) ?? null;

    // Disconnect synchronously so the old observer stops immediately.
    this._mutationObserver?.disconnect();
    this._mutationObserver = null;
    this._selectRef = sel ? new WeakRef(sel) : null;

    if (!sel) return;

    // Defer all DOM reads/mutations so this handler is instantaneous when
    // slotchange fires synchronously inside a framework reactive update pass
    // (e.g. SolidJS runUpdates on second+ mount, when shadow DOM already exists).
    queueMicrotask(() => {
      if (!sel.isConnected) return;
      this.multiple = sel.multiple;
      this.disabled = sel.disabled;
      this._syncOptionsFromSelect(sel);
      this._mutationObserver = new MutationObserver(() => {
        const s = this._selectRef?.deref();
        if (!s) return;

        this.multiple = s.multiple;
        this.disabled = s.disabled;

        if (this._propertyOptions !== undefined) {
          this._applySelectionFromCurrentSource();
          return;
        }

        this._syncOptionsFromSelect(s);
      });
      this._mutationObserver.observe(sel, {
        childList: true,
        subtree: true,
        attributes: true,
      });
      this._syncAccessibleName(sel);
    });
  }

  protected _syncOptionsFromSelect(sel: HTMLSelectElement) {
    if (this._propertyOptions !== undefined) {
      this._syncOptions(this._propertyOptions);
      this._mirrorOptionsToNativeSelect();
      this._applySelectionFromCurrentSource();
      return;
    }

    const options = this._optionsFromSelect(sel);

    this._syncOptions(options);
    this._applySelectionFromCurrentSource();
    this._syncAccessibleName(sel);
  }

  private _applySelectionFromCurrentSource(): void {
    if (this._value !== undefined) {
      this._applySelection(this._normalizeValue(this._value));
      return;
    }

    if (!this._selectionInitialized && this._defaultValue !== undefined) {
      this._selectionInitialized = true;
      this._applySelection(this._normalizeValue(this._defaultValue));
      return;
    }

    const selected = this._selectionInitialized
      ? this._selectedValuesFromNativeSelect()
      : this._defaultSelectedValuesFromNativeSelect();

    this._selectionInitialized = true;
    this._applySelection(selected);
  }

  private _syncOptions(options: ListboxOption[]): void {
    this._options = [...options];
    if (this._$listbox) this._$listbox.options = this._options;
  }

  private _currentOptions(): ListboxOption[] {
    if (this._propertyOptions !== undefined) return this._propertyOptions;

    const sel = this._selectRef?.deref();

    return sel ? this._optionsFromSelect(sel) : [];
  }

  private _optionsFromSelect(sel: HTMLSelectElement): ListboxOption[] {
    const options: ListboxOption[] = [];

    for (const opt of sel.options) {
      if (!opt.value) continue;

      options.push({
        value: opt.value,
        label: opt.text,
        disabled: opt.disabled,
      });
    }

    return options;
  }

  private _selectedValuesFromNativeSelect(): string[] {
    const sel = this._selectRef?.deref();
    if (!sel) return this.selectedValues;

    return Array.from(sel.selectedOptions)
      .map((opt) => opt.value)
      .filter(Boolean);
  }

  private _defaultSelectedValuesFromNativeSelect(): string[] {
    const sel = this._selectRef?.deref();
    if (!sel) return this.selectedValues;

    return Array.from(sel.options)
      .filter((opt) => opt.defaultSelected)
      .map((opt) => opt.value)
      .filter(Boolean);
  }

  private _mirrorOptionsToNativeSelect(): void {
    const sel = this._selectRef?.deref();
    if (!sel || this._propertyOptions === undefined) return;

    this._mutationObserver?.disconnect();
    sel.replaceChildren();

    for (const opt of this._propertyOptions) {
      const optionEl = document.createElement('option');

      optionEl.value = opt.value;
      optionEl.text = opt.label;
      optionEl.disabled = opt.disabled ?? false;
      optionEl.selected = this._selectedValues.has(opt.value);

      sel.add(optionEl);
    }

    this._mutationObserver?.observe(sel, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  }

  protected _addOption(option: ListboxOption): void {
    const options = this._options.some((opt) => opt.value === option.value)
      ? this._options.map((opt) => (opt.value === option.value ? option : opt))
      : [...this._options, option];

    if (this._propertyOptions !== undefined) {
      this._propertyOptions = options;
    }

    this._syncOptions(options);

    const sel = this._selectRef?.deref();
    if (!sel || Array.from(sel.options).some((opt) => opt.value === option.value)) return;

    const optionEl = document.createElement('option');

    optionEl.value = option.value;
    optionEl.text = option.label;
    optionEl.disabled = option.disabled ?? false;
    optionEl.selected = this._selectedValues.has(option.value);

    sel.add(optionEl);
  }

  private _normalizeValue(value: RCSelectValue): string[] {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  private _syncAccessibleName(sel: HTMLSelectElement): void {
    if (!this._$trigger) return;
    if (this._$trigger.hasAttribute('aria-label')) return; // don't clobber explicit

    const name =
      sel.getAttribute('aria-label') ??
      sel.labels?.[0]?.textContent?.trim() ??
      null;

    if (name) this._$trigger.setAttribute('aria-label', name);
    else this._$trigger.removeAttribute('aria-label');
  }

  // ── Selection ────────────────────────────────────────────────────────────────

  protected _handleListboxChange(e: CustomEvent) {
    const { optionValue, value, selected } = e.detail as {
      optionValue?: string;
      value: string | string[];
      selected: boolean;
    };
    const activatedValue = optionValue ?? (Array.isArray(value) ? value.at(-1) : value);
    if (!activatedValue) return;

    e.stopPropagation();

    if (this.multiple) {
      const next = new Set(this._selectedValues);
      if (selected) next.add(activatedValue);
      else next.delete(activatedValue);
      this._selectedValues = next;
    } else {
      this._selectedValues = selected ? new Set([activatedValue]) : new Set();
      if (selected) this.closePopup();
    }

    this._selectionInitialized = true;
    this._syncNativeSelect();
    this._$listbox.setSelectedValues(this.selectedValues);
    this._dispatchChange();
  }

  protected _removeValue(value: string) {
    const next = new Set(this._selectedValues);

    next.delete(value);

    this._selectedValues = next;
    this._$listbox.setSelectedValues([...next]);
    this._selectionInitialized = true;
    this._syncNativeSelect();
    this._dispatchChange();
  }

  protected _syncNativeSelect() {
    const sel = this._selectRef?.deref();
    if (!sel) return;
    for (const opt of sel.options) {
      opt.selected = this._selectedValues.has(opt.value);
    }
  }

  protected _dispatchChange(): void {
    this.dispatchEvent(
      new CustomEvent<RCSelectChangeEvent>('rc-select-change', {
        bubbles: true,
        composed: true,
        detail: {
          value: this.value,
          selectedValues: this.selectedValues,
          selectedOptions: this.selectedOptions,
        },
      }),
    );
  }

  private _selectedOptionsFor(values: string[]): ListboxOption[] {
    return values.map((value) => {
      return (
        this._options.find((opt) => opt.value === value) ?? {
          value,
          label: value,
        }
      );
    });
  }

  // ── Display helpers ──────────────────────────────────────────────────────────

  protected get _effectiveDisplay(): 'chips' | 'compact' {
    if (this.display === 'chips') return 'chips';
    if (this.display === 'compact') return 'compact';
    return window.matchMedia('(pointer: coarse)').matches ? 'compact' : 'chips';
  }

  protected _labelFor(value: string): string {
    const sel = this._selectRef?.deref();
    if (sel) {
      for (const opt of sel.options) {
        if (opt.value === value) return opt.text;
      }
    }
    return value;
  }

  protected get _displayLabel(): string {
    if (this._selectedValues.size === 0) return this.placeholder;
    if (this._effectiveDisplay === 'chips' && this.multiple)
      return this.placeholder;
    if (this._selectedValues.size === 1) {
      return this._labelFor([...this._selectedValues][0]);
    }
    // Compact multi: "First, +N more"
    const values = [...this._selectedValues];
    const first = this._labelFor(values[0]);
    return `${first}, +${values.length - 1} more`;
  }

  // ── Keyboard: trigger ────────────────────────────────────────────────────────

  protected _handleTriggerKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this.open) {
          this.openPopup();
          this._adc.navigateToFirst();
        } else this._adc.navigate(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!this.open) {
          this.openPopup();
          this._adc.navigateToLast();
        } else this._adc.navigate(-1);
        break;
      case 'Home':
        if (this.open) {
          e.preventDefault();
          this._adc.navigateToFirst();
        }
        break;
      case 'End':
        if (this.open) {
          e.preventDefault();
          this._adc.navigateToLast();
        }
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        if (!this.open) {
          this.openPopup();
          this._adc.navigateToFirst();
        } else this._activateActive();
        break;
      case 'Tab':
        if (this.open) this.closePopup(false);
        break;
      case 'ArrowLeft':
        if (!this.open && this.multiple && this._selectedValues.size > 0) {
          e.preventDefault();
          this._enterChipNav();
        }
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          this._handleTypeAhead(e.key);
        }
    }
  }

  private _activateActive() {
    const item = this._adc.activeItem;
    if (item) {
      item.dispatchEvent(
        new PointerEvent('pointerdown', { bubbles: true, cancelable: true }),
      );
    }
  }

  // ── Type-ahead ───────────────────────────────────────────────────────────────

  private _handleTypeAhead(char: string) {
    clearTimeout(this._typeAheadTimer);
    this._typeAheadBuffer += char.toLowerCase();
    this._typeAheadTimer = window.setTimeout(() => {
      this._typeAheadBuffer = '';
    }, 500);

    const allOpts = this._$listbox?.allOptions ?? [];
    const match = allOpts.find(
      (o) =>
        !o.disabled && o.label.toLowerCase().startsWith(this._typeAheadBuffer),
    );
    if (!match) return;

    if (!this.open) {
      // Select-only type-ahead: immediately select the match
      if (!this.multiple) {
        this._selectionInitialized = true;
        this._applySelection([match.value]);
        this._dispatchChange();
      }
    } else {
      // Open popup: move virtual cursor to match
      const items = this._$listbox.navigableItems;
      const el = items.find(
        (el) => el.getAttribute('data-value') === match.value,
      );
      if (el) this._adc.navigateToItem(el);
    }
  }

  // ── Chip keyboard navigation ─────────────────────────────────────────────────

  private _enterChipNav() {
    const buttons = this._getChipButtons();
    if (buttons.length === 0) return;
    this._chipNavIndex = buttons.length - 1;
    buttons[this._chipNavIndex].focus();
  }

  private _getChipButtons(): HTMLButtonElement[] {
    return Array.from(
      this.renderRoot.querySelectorAll<HTMLButtonElement>(
        'button[part~="chip"]',
      ),
    );
  }

  protected _handleChipKeyDown(e: KeyboardEvent, value: string) {
    const buttons = this._getChipButtons();
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (this._chipNavIndex > 0) {
          this._chipNavIndex--;
          buttons[this._chipNavIndex]?.focus();
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (this._chipNavIndex < buttons.length - 1) {
          this._chipNavIndex++;
          buttons[this._chipNavIndex]?.focus();
        } else {
          this._chipNavIndex = -1;
          this._$trigger?.focus();
        }
        break;
      case 'Escape':
        e.preventDefault();
        this._chipNavIndex = -1;
        this._$trigger?.focus();
        break;
      case 'Delete':
      case 'Backspace':
      case 'Enter':
      case ' ':
        e.preventDefault();
        this._removeValue(value);
        this._chipNavIndex = -1;
        this._$trigger?.focus();
        break;
    }
  }

  // ── Trigger click ────────────────────────────────────────────────────────────

  protected _handleTriggerClick() {
    if (this.open) this.closePopup();
    else this.openPopup();
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  protected override render() {
    const showChips =
      this.multiple &&
      this._effectiveDisplay === 'chips' &&
      this._selectedValues.size > 0;

    return html`
      <div id="anchor" part="anchor">
        <div
          id="trigger"
          part="trigger"
          role="combobox"
          tabindex=${this.disabled ? '-1' : '0'}
          aria-haspopup="listbox"
          aria-expanded=${this.open ? 'true' : 'false'}
          aria-controls="listbox"
          aria-disabled=${this.disabled ? 'true' : 'false'}
          aria-label=${this.placeholder || nothing}
          @click=${this._handleTriggerClick}
          @keydown=${this._handleTriggerKeyDown}
        >
          ${showChips ? this._renderChips() : nothing}
          <span part="value-display">${this._displayLabel}</span>
          <span part="toggle-icon" aria-hidden="true">
            <slot name="toggle-icon">&#9660;</slot>
          </span>
        </div>
      </div>

      <rc-listbox
        id="listbox"
        part="listbox"
        popover="manual"
        ?multiple=${this.multiple}
        checkmark
        @rc-listbox-change=${this._handleListboxChange}
      ></rc-listbox>

      <slot name="select" @slotchange=${this._handleSelectSlotChange}></slot>
    `;
  }

  protected _renderChips() {
    return html`
      <span part="chips" role="group" aria-label="Selected items">
        ${[...this._selectedValues].map((value) => {
          const label = this._labelFor(value);
          return html`
            <button
              type="button"
              part="chip"
              data-value=${value}
              tabindex="-1"
              aria-label=${`Remove ${label}`}
              @click=${(e: MouseEvent) => {
                e.stopPropagation();
                this._removeValue(value);
              }}
              @keydown=${(e: KeyboardEvent) =>
                this._handleChipKeyDown(e, value)}
            >
              <span part="chip-label">${label}</span
              ><span part="chip-remove" aria-hidden="true">&#215;</span>
            </button>
          `;
        })}
      </span>
    `;
  }
}

export default RCSelect;
