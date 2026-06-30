import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import {
  ActiveDescendantController,
  AnchorController,
  NativeChildController,
  warnMissingDirectChild,
} from '@rcarls/rc-common';
import type {
  RCListbox,
  RCListboxChangeEvent,
  ListboxOption,
  ListboxSelectableOption,
} from '@rcarls/rc-listbox';

import { selectStyles } from './rc-select.styles.js';

export type RCSelectValue = string | string[];

export interface RCSelectChangeEvent {
  /** Updated value after the change. */
  value: RCSelectValue;

  /** All selected option values after the change. */
  selectedValues: string[];

  /** All selected option objects after the change. */
  selectedOptions: ListboxSelectableOption[];
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-select': RCSelect;
  }
}

/**
 * Select-only combobox backed by a native <select>, following the WAI-ARIA Combobox
 * pattern.
 *
 * Wraps a native `<select>` (default slot) as the form value reflector while
 * rendering a custom button trigger and popup listbox. Popup placement
 * and `aria-activedescendant` virtual keyboard navigation are supported.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-select rc-select docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ WAI-ARIA Combobox pattern}
 *
 * @slot - Required. A native `<select>` element used for form submission
 *   and as the source of truth for options, multiple, and disabled state.
 * @slot display - Optional. Replaces the default value label in the trigger.
 * @slot toggle-indicator - Optional. Replaces the default chevron indicator. Accepts any
 *   element(s); the container shifts to inline-start in RTL via flex direction.
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
 * @csspart toggle-indicator - The open/close indicator container.
 *
 * @attr [has-value] - Present when one or more options are selected. Use with CSS
 *   selectors (e.g. `rc-select[has-value]`) for floating-label wrappers.
 *
 * @cssprop [--rc-select-max-height=20em] - Maximum popup height.
 * @cssprop [--rc-select-control-block-size=var(--rc-control-block-size)] - Trigger block size.
 * @cssprop [--rc-select-padding-block=var(--rc-control-padding-block)] - Trigger block-axis padding.
 * @cssprop [--rc-select-padding-inline=var(--rc-control-padding-inline)] - Trigger inline-axis padding.
 * @cssprop [--rc-select-gap=var(--rc-control-gap)] - Gap between trigger content, chips, and icon.
 * @cssprop [--rc-select-radius=var(--rc-control-radius)] - Trigger border radius.
 * @cssprop [--rc-select-border=var(--rc-border)] - Trigger border.
 * @cssprop [--rc-select-listbox-radius=var(--rc-control-radius)] - Popup listbox border radius.
 * @cssprop [--rc-select-listbox-padding-block=var(--rc-control-padding-block)] - Popup listbox block padding.
 * @cssprop [--rc-select-chip-radius=var(--rc-radius-md)] - Multi-select chip border radius.
 * @cssprop [--rc-select-chip-padding-block=0.1em] - Multi-select chip block-axis padding.
 * @cssprop [--rc-select-chip-padding-inline=0.3em] - Multi-select chip inline-axis padding.
 * @cssprop [--rc-select-toggle-indicator-size=1.1em] - Inline size of the toggle indicator container.
 */
export class RCSelect extends LitElement {
  static override styles = selectStyles;

  /** Reflects whether the popup listbox is open. */
  @property({ type: Boolean, reflect: true })
  open = false;

  /** Enables selection of multiple options simultaneously. */
  @property({ type: Boolean, reflect: true })
  multiple = false;

  /** Disables the trigger and prevents the popup from opening. */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Text shown in the trigger when no value is selected. */
  @property()
  placeholder = '';

  /**
   * Controls how selected values appear in the trigger.
   *
   * - `'chips'` — each selected value renders as a removable chip.
   * - `'compact'` — selected values are summarized as "First, +N more".
   * - `'auto'` — uses `'chips'` on pointer devices and `'compact'` on touch.
   */
  @property()
  display: 'auto' | 'chips' | 'compact' = 'auto';

  /** Flex container used by `_anchorCtrl` as the positioning reference for the popup. */
  @query('#anchor')
  protected _$anchor!: HTMLElement;

  /**
   * The combobox trigger div.
   *
   * Owns `role="combobox"`, `aria-activedescendant`,
   * `aria-expanded`, and receives focus during keyboard navigation.
   */
  @query('#trigger')
  protected _$trigger!: HTMLElement;

  /** The `<rc-listbox>` popup. Receives option lists and selected-value updates from the host. */
  @query('#listbox')
  protected _$listbox!: RCListbox;

  /**
   * Reactive set of currently selected option values.
   *
   * Drive changes through `_applySelection` rather than mutating this directly
   * so the listbox and native `<select>` stay in sync.
   */
  @state()
  protected _selectedValues: Set<string> = new Set();

  /**
   * Index into the chip button array for roving-tabindex chip navigation.
   *
   * `-1` means focus is on the trigger.
   */
  @state()
  protected _chipNavIndex = -1;

  /**
   * The resolved option list, as rendered in the listbox.
   *
   * `_options` is sourced from the `options` property or the slotted `<select>`.
   */
  @state()
  protected _options: ListboxOption[] = [];

  /** WeakRef to the slotted `<select>`. Refreshed on every `slotchange`; `null` when absent. */
  protected _selectRef: WeakRef<HTMLSelectElement> | null = null;

  protected readonly _selectController = new NativeChildController<HTMLSelectElement>(this, {
    selector: ':scope > select',
    observe: true,
    onChange: ($select) => this._setupSelect($select),
    onMissing: () => {
      if (import.meta.env.DEV) {
        warnMissingDirectChild(this, {
          selector: ':scope > select',
          message:
            '[rc-select] No direct child <select> found. Place a native <select> inside <rc-select>.',
        });
      }
    },
  });

  /**
   * Watches the slotted `<select>` for `childList`, `subtree`, and `attributes` changes
   * so the option list and disabled/multiple state stay in sync with author mutations.
   */
  protected _mutationObserver: MutationObserver | null = null;

  private _defaultValue: RCSelectValue | undefined;

  private _propertyOptions: ListboxOption[] | undefined;

  private _value: RCSelectValue | undefined;

  private _selectionInitialized = false;

  /** Accumulated printable characters for type-ahead matching; cleared after 500 ms idle. */
  protected _typeAheadBuffer = '';

  /** `window.setTimeout` handle for resetting `_typeAheadBuffer`; cancel before modifying. */
  protected _typeAheadTimer = 0;

  /**
   * Manages `aria-activedescendant` on `_$trigger` and keyboard cursor position
   * within `_$listbox.navigableItems`.
   */
  protected _activeDescendantCtrl = new ActiveDescendantController(this, {
    host: () => this._$trigger ?? null,
    items: () => this._$listbox?.navigableItems ?? [],
  });

  /** Manages CSS-anchored (or JS-fallback) placement of `_$listbox` relative to `_$anchor`. */
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

  override updated(changed: PropertyValues) {
    super.updated(changed);
    this.toggleAttribute('has-value', this._selectedValues.size > 0);
  }

  /** Opens the popup listbox if not already open or disabled. */
  openPopup() {
    if (this.open || this.disabled) {
      return;
    }

    this.open = true;
    this._$listbox.showPopover();
    this._anchorCtrl.update();

    this.dispatchEvent(new CustomEvent('rc-select-open', { bubbles: true, composed: true }));
    this.requestUpdate();
  }

  /**
   * Closes the popup listbox.
   *
   * @param returnFocus - When `true` (default), returns focus to the trigger.
   */
  closePopup(returnFocus = true) {
    if (!this.open) {
      return;
    }

    this.open = false;
    this._$listbox.hidePopover();
    this._activeDescendantCtrl.clear();

    if (returnFocus) {
      this._$trigger?.focus();
    }

    this.dispatchEvent(new CustomEvent('rc-select-close', { bubbles: true, composed: true }));
  }

  /**
   * Current selection. Host writes update selection silently; user interaction
   * emits `rc-select-change`.
   */
  get value(): RCSelectValue {
    return this.multiple ? this.selectedValues : (this.selectedValues[0] ?? '');
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

  /** `ListboxOption` objects for the current selection; falls back to label-only stubs for unknown values. */
  protected get selectedOptions(): ListboxSelectableOption[] {
    return this._selectedOptionsFor(this.selectedValues);
  }

  /**
   * Applies an already-normalized array of values as the current selection.
   *
   * In single-select mode only the first value is kept. Syncs `_$listbox` and the
   * native `<select>` but does NOT dispatch `rc-select-change`.
   */
  protected _applySelection(values: string[]): void {
    const selectedValues = this.multiple ? values : values.slice(0, 1);

    this._selectedValues = new Set(selectedValues);
    this._$listbox?.setSelectedValues(selectedValues);
    this._syncNativeSelect();
    this.requestUpdate();
  }

  /** Document-capture click handler that closes the popup when a click lands outside `this`. */
  protected _onDocClick = (e: MouseEvent) => {
    if (!this.open) {
      return;
    }

    if (!e.composedPath().includes(this)) {
      this.closePopup(false);
    }
  };

  /** Document-capture keydown handler; closes the popup on `Escape`. */
  protected _onDocKeyDown = (e: KeyboardEvent) => {
    if (!this.open) {
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();

      this.closePopup();
    }
  };

  /**
   * Resolves the slotted `<select>` on every `slotchange`, wires `_mutationObserver`,
   * and seeds initial state via `queueMicrotask` to stay safe inside framework reactive passes.
   */
  protected _handleSelectSlotChange() {
    this._selectController.sync();
  }

  protected _setupSelect($select: HTMLSelectElement | null) {
    // Disconnect synchronously so the old observer stops immediately.
    this._mutationObserver?.disconnect();
    this._mutationObserver = null;
    this._selectRef = $select ? new WeakRef($select) : null;

    if (!$select) {
      return;
    }

    // Defer all DOM reads/mutations so this handler is instantaneous when
    // slotchange fires synchronously inside a framework reactive update pass
    // (e.g. SolidJS runUpdates on second+ mount, when shadow DOM already exists).
    queueMicrotask(() => {
      if (!$select.isConnected) {
        return;
      }

      this.multiple = $select.multiple;
      this.disabled = $select.disabled;
      this._syncOptionsFromSelect($select);

      this._mutationObserver = new MutationObserver(() => {
        const $current = this._selectRef?.deref();

        if (!$current) {
          return;
        }

        this.multiple = $current.multiple;
        this.disabled = $current.disabled;

        if (this._propertyOptions !== undefined) {
          this._applySelectionFromCurrentSource();

          return;
        }

        this._syncOptionsFromSelect($current);
      });
      this._mutationObserver.observe($select, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      this._syncAccessibleName($select);
    });
  }

  /**
   * Derives options from `$select` (or defers to `_propertyOptions` when set)
   * and re-applies selection from the current authoritative source.
   */
  protected _syncOptionsFromSelect($select: HTMLSelectElement) {
    if (this._propertyOptions !== undefined) {
      this._syncOptions(this._propertyOptions);
      this._mirrorOptionsToNativeSelect();
      this._applySelectionFromCurrentSource();

      return;
    }

    const options = this._optionsFromSelect($select);

    this._syncOptions(options);
    this._applySelectionFromCurrentSource();
    this._syncAccessibleName($select);
  }

  /**
   * Picks the correct selection source in priority order:
   * controlled `_value` → `_defaultValue` → native `<select>` default/current state.
   */
  protected _applySelectionFromCurrentSource(): void {
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

  /** Writes `_options` and pushes the list to `_$listbox` when it is mounted. */
  protected _syncOptions(options: ListboxOption[]): void {
    this._options = [...options];

    if (this._$listbox) {
      this._$listbox.options = this._options;
    }
  }

  /** Returns `_propertyOptions` when set; otherwise reads live from the slotted `<select>`. */
  protected _currentOptions(): ListboxOption[] {
    if (this._propertyOptions !== undefined) {
      return this._propertyOptions;
    }

    const $select = this._selectRef?.deref();

    return $select ? this._optionsFromSelect($select) : [];
  }

  /**
   * Maps non-empty native `<option>` nodes to `ListboxOption` objects.
   *
   * Options with empty `value` are skipped (placeholder guard).
   */
  protected _optionsFromSelect($select: HTMLSelectElement): ListboxOption[] {
    const options: ListboxOption[] = [];

    for (const $option of $select.options) {
      if (!$option.value) {
        continue;
      }

      options.push({
        value: $option.value,
        label: $option.text,
        disabled: $option.disabled,
      });
    }

    return options;
  }

  /** Returns values of currently selected `<option>` nodes; falls back to `selectedValues` when no native select is present. */
  protected _selectedValuesFromNativeSelect(): string[] {
    const $select = this._selectRef?.deref();

    if (!$select) {
      return this.selectedValues;
    }

    return Array.from($select.selectedOptions)
      .map(($opt) => $opt.value)
      .filter(Boolean);
  }

  /** Returns values of `defaultSelected` `<option>` nodes (author `selected` attribute); falls back to `selectedValues`. */
  protected _defaultSelectedValuesFromNativeSelect(): string[] {
    const $select = this._selectRef?.deref();

    if (!$select) {
      return this.selectedValues;
    }

    return Array.from($select.options)
      .filter(($option) => $option.defaultSelected)
      .map(($option) => $option.value)
      .filter(Boolean);
  }

  /**
   * Rebuilds native `<select>` options from `_propertyOptions`.
   *
   * Only runs when `_propertyOptions` is set; pauses then resumes `_mutationObserver`
   * while writing to avoid re-entrant sync.
   */
  protected _mirrorOptionsToNativeSelect(): void {
    const $select = this._selectRef?.deref();

    if (!$select || this._propertyOptions === undefined) {
      return;
    }

    this._mutationObserver?.disconnect();
    $select.replaceChildren();

    for (const opt of this._propertyOptions) {
      const $option = document.createElement('option');

      $option.value = opt.value;
      $option.text = opt.label;
      $option.disabled = opt.disabled ?? false;
      $option.selected = this._selectedValues.has(opt.value);

      $select.add($option);
    }

    this._mutationObserver?.observe($select, {
      childList: true,
      subtree: true,
      attributes: true,
    });
  }

  /**
   * Upserts a single option into `_options` (and `_propertyOptions` when set)
   * and adds the corresponding `<option>` to the native `<select>` if absent.
   */
  protected _addOption(option: ListboxOption): void {
    const options = this._options.some((opt) => opt.value === option.value)
      ? this._options.map((opt) => (opt.value === option.value ? option : opt))
      : [...this._options, option];

    if (this._propertyOptions !== undefined) {
      this._propertyOptions = options;
    }

    this._syncOptions(options);

    const $select = this._selectRef?.deref();

    if (!$select || Array.from($select.options).some(($opt) => $opt.value === option.value)) {
      return;
    }

    const $option = document.createElement('option');

    $option.value = option.value;
    $option.text = option.label;
    $option.disabled = option.disabled ?? false;
    $option.selected = this._selectedValues.has(option.value);

    $select.add($option);
  }

  /** Coerces `RCSelectValue` (string or string[]) to `string[]`; returns `[]` for empty-string singles. */
  protected _normalizeValue(value: RCSelectValue): string[] {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  /**
   * Copies `aria-label` or first-label text from the native `<select>` to `_$trigger`.
   *
   * No-op when the trigger already has an explicit `aria-label`.
   */
  protected _syncAccessibleName($sel: HTMLSelectElement): void {
    if (!this._$trigger) {
      return;
    }

    // Don't clobber an explicit aria-label.
    if (this._$trigger.hasAttribute('aria-label')) {
      return;
    }

    const name = $sel.getAttribute('aria-label') ?? $sel.labels?.[0]?.textContent?.trim() ?? null;

    if (name) {
      this._$trigger.setAttribute('aria-label', name);
    } else {
      this._$trigger.removeAttribute('aria-label');
    }
  }

  /**
   * Handles `rc-listbox-change` from the popup.
   *
   * Stops propagation, mutates `_selectedValues`, syncs state, and fires
   * `rc-select-change`.
   */
  protected _handleListboxChange(e: CustomEvent) {
    const detail = e.detail as RCListboxChangeEvent;

    if (detail.reason === 'action') {
      e.stopPropagation();
      return;
    }

    const { optionValue, value, selected } = detail;
    const activatedValue = optionValue ?? (Array.isArray(value) ? value.at(-1) : value);

    if (!activatedValue) {
      return;
    }

    e.stopPropagation();

    if (this.multiple) {
      const next = new Set(this._selectedValues);

      if (selected) {
        next.add(activatedValue);
      } else {
        next.delete(activatedValue);
      }

      this._selectedValues = next;
    } else {
      this._selectedValues = selected ? new Set([activatedValue]) : new Set();

      if (selected) {
        this.closePopup();
      }
    }

    this._selectionInitialized = true;
    this._syncNativeSelect();
    this._$listbox.setSelectedValues(this.selectedValues);
    this._dispatchChange();
  }

  /** Removes a single value from `_selectedValues`, syncs the listbox and native select, and dispatches `rc-select-change`. */
  protected _removeValue(value: string) {
    const next = new Set(this._selectedValues);

    next.delete(value);

    this._selectedValues = next;
    this._$listbox.setSelectedValues([...next]);
    this._selectionInitialized = true;

    this._syncNativeSelect();
    this._dispatchChange();
  }

  /** Flips `selected` on each `<option>` in the native `<select>` to match `_selectedValues`; no-op when no native select is present. */
  protected _syncNativeSelect() {
    const $select = this._selectRef?.deref();

    if (!$select) {
      return;
    }

    for (const $option of $select.options) {
      $option.selected = this._selectedValues.has($option.value);
    }
  }

  /** Constructs and dispatches `rc-select-change` with current `value`, `selectedValues`, and `selectedOptions`. */
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

  /** Maps value strings to `ListboxOption` objects from `_options`; creates label-only fallback stubs for unknown values. */
  protected _selectedOptionsFor(values: string[]): ListboxSelectableOption[] {
    return values.map((value) => {
      return (
        this._options.find(
          (opt): opt is ListboxSelectableOption => opt.kind !== 'action' && opt.value === value,
        ) ?? {
          value,
          label: value,
        }
      );
    });
  }

  /** Resolved display mode after `auto` pointer-detection: `'chips'` on fine-pointer devices, `'compact'` on coarse. */
  protected get _effectiveDisplay(): 'chips' | 'compact' {
    if (this.display === 'chips') {
      return 'chips';
    }

    if (this.display === 'compact') {
      return 'compact';
    }

    return window.matchMedia('(pointer: coarse)').matches ? 'compact' : 'chips';
  }

  /** Looks up the display label for `value` from native `<select>` option text; returns `value` itself as a fallback. */
  protected _labelFor(value: string): string {
    const $select = this._selectRef?.deref();

    if ($select) {
      for (const $option of $select.options) {
        if ($option.value === value) {
          return $option.text;
        }
      }
    }

    return value;
  }

  /** Text shown in the trigger's value-display area; returns placeholder when chips are active or nothing is selected. */
  protected get _displayLabel(): string {
    if (this._selectedValues.size === 0) {
      return this.placeholder;
    }

    if (this._effectiveDisplay === 'chips' && this.multiple) {
      return this.placeholder;
    }

    if (this._selectedValues.size === 1) {
      return this._labelFor([...this._selectedValues][0]);
    }

    // Compact multi: "First, +N more"
    const values = [...this._selectedValues];
    const first = this._labelFor(values[0]);

    return `${first}, +${values.length - 1} more`;
  }

  /**
   * APG Combobox keyboard handler on the trigger.
   *
   * Arrow keys navigate/open, Space/Enter activate, Tab closes without focus return,
   * ArrowLeft enters chip navigation, and printable chars forward to type-ahead.
   */
  protected _handleTriggerKeyDown(e: KeyboardEvent) {
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
        if (!this.open) {
          this.openPopup();
          this._activeDescendantCtrl.navigateToLast();
        } else {
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

      case ' ':
      case 'Enter':
        e.preventDefault();
        if (!this.open) {
          this.openPopup();
          this._activeDescendantCtrl.navigateToFirst();
        } else {
          this._activateActive();
        }
        break;

      case 'Tab':
        if (this.open) {
          this.closePopup(false);
        }
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

  /**
   * Dispatches a synthetic `pointerdown` on the active listbox item to activate it.
   *
   * Prefers `pointerdown` over a direct call so listbox item click logic
   * (which is bound to `pointerdown`) fires through its normal path.
   */
  protected _activateActive() {
    const $item = this._activeDescendantCtrl.activeItem;

    if ($item) {
      $item.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    }
  }

  /**
   * Accumulates characters in `_typeAheadBuffer` and either immediately selects
   * the first match (closed single-select) or moves the virtual cursor (open popup).
   */
  protected _handleTypeAhead(char: string) {
    clearTimeout(this._typeAheadTimer);

    this._typeAheadBuffer += char.toLowerCase();

    this._typeAheadTimer = window.setTimeout(() => {
      this._typeAheadBuffer = '';
    }, 500);

    const options = this._$listbox?.allOptions ?? [];
    const match = options.find(
      (option) => !option.disabled && option.label.toLowerCase().startsWith(this._typeAheadBuffer),
    );

    if (!match) {
      return;
    }

    if (!this.open) {
      // Select-only type-ahead: immediately select the match
      if (!this.multiple) {
        this._selectionInitialized = true;
        this._applySelection([match.value]);
        this._dispatchChange();
      }
    } else {
      // Open popup: move virtual cursor to match
      const $items = this._$listbox.navigableItems;
      const $item = $items.find(($el) => $el.getAttribute('data-value') === match.value);

      if ($item) {
        this._activeDescendantCtrl.navigateToItem($item);
      }
    }
  }

  /** Focuses the last chip button and sets `_chipNavIndex` to begin roving-tabindex navigation within the chip group. */
  protected _enterChipNav() {
    const $buttons = this._$chipButtons();

    if ($buttons.length === 0) {
      return;
    }

    this._chipNavIndex = $buttons.length - 1;
    $buttons[this._chipNavIndex].focus();
  }

  /** Queries all `button[part~="chip"]` elements in `renderRoot`; order matches DOM order. */
  protected _$chipButtons(): HTMLButtonElement[] {
    return Array.from(this.renderRoot.querySelectorAll<HTMLButtonElement>('button[part~="chip"]'));
  }

  /**
   * Keyboard handler for chip buttons.
   *
   * ArrowLeft/Right rove chip focus, Escape returns to trigger,
   * Delete/Backspace/Enter/Space remove the chip's value
   * and return focus to the trigger.
   */
  protected _handleChipKeyDown(e: KeyboardEvent, value: string) {
    const $buttons = this._$chipButtons();

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (this._chipNavIndex > 0) {
          this._chipNavIndex--;
          $buttons[this._chipNavIndex]?.focus();
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        if (this._chipNavIndex < $buttons.length - 1) {
          this._chipNavIndex++;
          $buttons[this._chipNavIndex]?.focus();
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

  /** Toggles the popup open or closed on trigger click. */
  protected _handleTriggerClick() {
    if (this.open) {
      this.closePopup();
    } else {
      this.openPopup();
    }
  }

  protected override render() {
    const showChips =
      this.multiple && this._effectiveDisplay === 'chips' && this._selectedValues.size > 0;

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

          <span part="toggle-indicator" aria-hidden="true">
            <slot name="toggle-indicator">
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

      <slot @slotchange=${this._handleSelectSlotChange}></slot>
    `;
  }

  /** Renders the chip group `<span>` with one `<button>` per selected value for multi-select chip display mode. */
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
              @keydown=${(e: KeyboardEvent) => this._handleChipKeyDown(e, value)}
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
