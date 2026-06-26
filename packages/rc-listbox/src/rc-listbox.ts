import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import {
  ActiveDescendantController,
  ItemsCollectionController,
  type ItemsCollectionOption,
  type ItemsCollectionFilterStrategy,
} from '@rcarls/rc-common';

declare global {
  interface HTMLElementTagNameMap {
    'rc-listbox': RCListbox;
  }
}

/** Option shape accepted by `rc-listbox`. */
export type ListboxOption = ItemsCollectionOption;

/**
 * Determines how `filterOptions()` matches option labels against the query string.
 *
 * - `'prefix'`: label must start with the query (default, matches native `<select>` type-ahead).
 * - `'contains'`:  label must contain the query anywhere.
 * - `function`:  custom predicate; receives lowercased label and query, return `true` to show the option.
 */
export type FilterStrategy = ItemsCollectionFilterStrategy;

export interface RCListboxChangeEvent {
  /** Canonical selected value for single mode, or selected values for multi mode. */
  value: string | string[];

  /** Whether the option was selected (false means it was deselected). */
  selected: boolean;

  /** The option value that was activated. `'__create__'` for the create option. */
  optionValue: string;

  /** The option that was activated. */
  option: ListboxOption | null;

  /** Selected values as a consistently-array-shaped convenience value. */
  selectedValues: string[];

  /** Selected option objects. */
  selectedOptions: ListboxOption[];
}

let _uid = 0;

/** Structural CSS injected into the root that contains rc-listbox's light-DOM options. */
const LIGHT_DOM_CSS = `
@layer rc-base {
  rc-listbox ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  rc-listbox li[role='option'] {
    display: flex;
    align-items: center;
    gap: var(--rc-listbox-option-gap, 0.25rem);
    min-block-size: var(--rc-listbox-option-min-block-size, 0px);
    padding: var(--rc-listbox-option-padding-block, 2px) var(--rc-listbox-option-padding-inline, 4px);
    cursor: default;
    user-select: none;
    outline: none;
    background: transparent;
    color: inherit;
    transition: var(--rc-listbox-option-transition);
  }

  rc-listbox li[role='option']:hover {
    background: var(--rc-listbox-hover-bg, color-mix(in srgb, Highlight 8%, transparent));
    color: var(--rc-listbox-hover-color, inherit);
  }

  rc-listbox li[role='option'][data-active] {
    background: var(--rc-listbox-active-bg, color-mix(in srgb, Highlight 8%, transparent));
    color: var(--rc-listbox-active-color, var(--rc-listbox-hover-color, inherit));
  }

  rc-listbox li[role='option'][aria-selected='true'] {
    background: var(--rc-listbox-selected-bg, Highlight);
    color: var(--rc-listbox-selected-color, HighlightText);
  }

  rc-listbox li[role='option'][aria-disabled='true'] {
    color: var(--rc-listbox-disabled-color, GrayText);
    opacity: var(--rc-listbox-disabled-opacity, 1);
    pointer-events: none;
  }

  rc-listbox [part~='option-checkmark'] {
    display: none;
    min-inline-size: 1em;
    text-align: center;
  }

  rc-listbox[checkmark] [part~='option-checkmark'] {
    display: inline;
    visibility: hidden;
  }

  rc-listbox[checkmark] li[role='option'][aria-selected='true'] [part~='option-checkmark'] {
    visibility: visible;
  }
}
`;

/**
 * A [WAI-ARIA listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) component.
 *
 * Renders a `<ul role="presentation">` + `<li role="option">` subtree directly
 * into its own light DOM so that option IDs remain in the same document or
 * shadow root scope as parent consumers (`rc-select`, `rc-combobox`). This
 * keeps `aria-activedescendant` references valid regardless of nesting.
 *
 * Pre-rendered `<ul>/<li>` children are accepted as a progressive enhancement
 * baseline. The component reads them on first connect if no `options` setter
 * has been called.
 *
 * Consumers drive this component via its JS API:
 *   - Set `options` to populate the list
 *   - Set `value` / `defaultValue` to manage selection
 *   - Call `toggleOption()` for internal keyboard/pointer activation
 *   - Call `filterOptions()` to filter visible options
 *   - Read `navigableItems` to feed `ActiveDescendantController`
 *
 * @slot — Accepts pre-rendered `<ul>` with `<li>` children for progressive enhancement.
 *
 * @fires rc-listbox-change - Fired when an option is activated (clicked or Enter/Space)
 *
 * @csspart option - Individual `<li role="option">` elements
 * @csspart option-checkmark - The checkmark `<span>` inside each option (when `checkmark` is true)
 * @csspart create-option - The "Create" option when allow-create is active
 *
 * @cssprop [--rc-listbox-option-gap=0.25rem] - Gap between the checkmark and option label.
 * @cssprop [--rc-listbox-option-min-block-size=0px] - Minimum block size (height) of each option row.
 * @cssprop [--rc-listbox-option-padding-block=2px] - Block-axis padding of each option row.
 * @cssprop [--rc-listbox-option-padding-inline=4px] - Inline-axis padding of each option row.
 * @cssprop [--rc-listbox-option-transition] - CSS transition applied to each option row.
 * @cssprop [--rc-listbox-hover-bg] - Background of a hovered option.
 * @cssprop [--rc-listbox-hover-color] - Text color of a hovered option.
 * @cssprop [--rc-listbox-active-bg] - Background of the keyboard-active option.
 * @cssprop [--rc-listbox-active-color] - Text color of the keyboard-active option.
 * @cssprop [--rc-listbox-selected-bg] - Background of a selected option.
 * @cssprop [--rc-listbox-selected-color] - Text color of a selected option.
 * @cssprop [--rc-listbox-disabled-color] - Text color of a disabled option.
 * @cssprop [--rc-listbox-disabled-opacity] - Opacity of a disabled option.
 */
export class RCListbox extends LitElement {
  static override styles = css`
    :host {
      display: block;
      overflow-y: auto;
    }
  `;

  private static readonly _styledRoots = new Set<Document | ShadowRoot>();

  private static _ensureBaseStyles(root: Document | ShadowRoot): void {
    if (RCListbox._styledRoots.has(root)) return;
    RCListbox._styledRoots.add(root);

    const style = document.createElement('style');
    style.setAttribute('data-rc-light-dom-base', 'rc-listbox');
    style.textContent = LIGHT_DOM_CSS;

    if (root instanceof Document) {
      root.head.appendChild(style);
    } else {
      root.appendChild(style);
    }
  }

  /** Allow multiple selection. Reflected as `aria-multiselectable` on the host. */
  @property({ type: Boolean, reflect: true })
  multiple = false;

  /**
   * Render a checkmark indicator inside each option element.
   *
   * Hidden by default; enable for combobox / select patterns where the
   * consumer's CSS shows it conditionally via `[aria-selected='true']`.
   */
  @property({ type: Boolean, reflect: true })
  checkmark = false;

  /**
   * How option labels are matched against the active filter text.
   *
   * Defaults to `'contains'` (substring). Set to `'prefix'` for starts-with
   * matching, or pass a custom predicate for full control.
   * Function values are JS-only; string values may be set via the
   * `filter-strategy` attribute.
   */
  @property({ attribute: 'filter-strategy', reflect: false })
  filterStrategy: FilterStrategy = 'contains';

  private _defaultValue: string | string[] | undefined;
  private _value: string | string[] | undefined;
  private _selectionInitialized = false;
  private _filterText = '';

  /** Unique ID prefix for all rendered option elements in this instance. */
  protected readonly _uid = `rc-lb-${++_uid}`;

  /** Manages the `<ul>/<li>` option DOM subtree in the component's light DOM. */
  protected readonly _ctrl = new ItemsCollectionController(this, {
    idPrefix: this._uid,
    onInitFromDom: () => this._applySelectionFromSource(),
    onActivate: (value) => this._handleActivate(value),
  });

  /** Active-descendant controller; tracks keyboard focus within the option list. */
  protected readonly _activeDescendantCtrl = new ActiveDescendantController(this, {
    host: () => this,
    items: () => this.navigableItems,
  });

  override connectedCallback(): void {
    super.connectedCallback();

    RCListbox._ensureBaseStyles(this.getRootNode() as Document | ShadowRoot);

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'listbox');
    }

    this.addEventListener('keydown', this._onKeydown);
    this.addEventListener('blur', this._onBlur);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._onKeydown);
    this.removeEventListener('blur', this._onBlur);
  }

  override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('multiple')) {
      this.multiple
        ? this.setAttribute('aria-multiselectable', 'true')
        : this.removeAttribute('aria-multiselectable');
    }

    if (changed.has('checkmark')) {
      this._ctrl.checkmark = this.checkmark;
    }
  }

  protected override render() {
    return html`<slot></slot>`;
  }

  /** All options regardless of filter state. */
  get allOptions(): readonly ListboxOption[] {
    return this._ctrl.allOptions;
  }

  /** Options currently passing the active filter. */
  get filteredOptions(): readonly ListboxOption[] {
    const filterText = this._filterText;
    if (!filterText) return [...this._ctrl.allOptions];
    return this._ctrl.allOptions.filter((o) => this._isVisible(o));
  }

  /** Replace the full options list. */
  get options(): ListboxOption[] {
    return [...this._ctrl.allOptions];
  }

  /** Replace the full options list. */
  set options(opts: ListboxOption[]) {
    this._ctrl.setOptions([...opts]);
    this._applySelectionFromSource();
  }

  /** Append a single option without replacing the list. */
  appendOption(opt: ListboxOption): void {
    this._ctrl.appendOption(opt);
  }

  /** Current selection as a consistently-array-shaped read-only view. */
  get selectedValues(): string[] {
    return this._ctrl.selectedValues;
  }

  /** Current selection. Host writes update silently. */
  get value(): string | string[] {
    return this.multiple ? this.selectedValues : (this.selectedValues[0] ?? '');
  }

  /** Current selection. Host writes update silently. */
  set value(value: string | string[] | undefined) {
    this._value = value;

    if (value === undefined) return;

    this._selectionInitialized = true;
    this._applySelection(this._normalizeValue(value));
  }

  /** Initial uncontrolled selection. */
  get defaultValue(): string | string[] | undefined {
    return this._defaultValue;
  }

  /** Initial uncontrolled selection. */
  set defaultValue(value: string | string[] | undefined) {
    this._defaultValue = value;

    if (!this._selectionInitialized && this._value === undefined && value !== undefined) {
      this._applySelection(this._normalizeValue(value));
    }
  }

  /** Replace the selection set without firing `rc-listbox-change`. */
  setSelectedValues(values: string[]): void {
    this._applySelection(values);
  }

  /**
   * Toggle the selected state of the option with `value`.
   * In single-select mode, toggling a selected item deselects it (and selects
   * the new item). Fires `rc-listbox-change`.
   */
  toggleOption(value: string): void {
    const opt = this._ctrl.allOptions.find((o) => o.value === value);

    if (!opt || opt.disabled) return;

    const wasSelected = this._ctrl.isSelected(value);

    if (this.multiple) {
      const next = new Set(this._ctrl.selectedValues);

      if (wasSelected) {
        next.delete(value);
      } else {
        next.add(value);
      }

      this._ctrl.setSelectedValues([...next]);
    } else {
      this._ctrl.setSelectedValues(wasSelected ? [] : [value]);
    }

    this._selectionInitialized = true;
    this._dispatchChange(opt, !wasSelected);
  }

  /** Clears all selected values without firing `rc-listbox-change`. */
  clearSelection(): void {
    this._applySelection([]);
  }

  /** Filter visible options to those whose label matches `text` (case-insensitive). */
  filterOptions(text: string): void {
    this._filterText = text;
    this._ctrl.filterOptions(text, this.filterStrategy);
  }

  /** Removes any active filter, making all options visible. */
  clearFilter(): void {
    this._filterText = '';
    this._ctrl.clearFilter();
  }

  /**
   * Ordered list of currently navigable option elements (visible and not disabled).
   *
   * Feed this to `ActiveDescendantController.items` in the parent component.
   * Includes the create option element when one is set.
   */
  get navigableItems(): Element[] {
    return this._ctrl.navigableItems;
  }

  /**
   * Show or hide the "Create" option at the end of the list.
   *
   * Pass `null` to hide it, or a non-empty string to show `Create "{label}"`.
   * Fires `rc-listbox-change` with `optionValue: '__create__'` when activated.
   */
  setCreateOption(label: string | null): void {
    this._ctrl.setCreateOption(label);
  }

  /** Clears the active descendant when focus leaves the listbox. */
  protected _onBlur = (): void => {
    this._activeDescendantCtrl.clear();
  };

  /**
   * Handles arrow-key navigation and Enter/Space activation.
   *
   * Passes modifier-key combos through to parent handlers unchanged.
   */
  protected _onKeydown = (e: KeyboardEvent): void => {
    // Pass modifier-key combos to parent handlers (e.g. Alt+Arrow in rc-transfer-list).
    if (e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();

        if (this._activeDescendantCtrl.activeItem) {
          this._activeDescendantCtrl.navigate(1);
        } else {
          this._activeDescendantCtrl.navigateToFirst();
        }

        if (!this.multiple) {
          this._selectActiveItem();
        }

        break;
      }

      case 'ArrowUp': {
        e.preventDefault();

        if (this._activeDescendantCtrl.activeItem) {
          this._activeDescendantCtrl.navigate(-1);
        } else {
          this._activeDescendantCtrl.navigateToLast();
        }

        if (!this.multiple) {
          this._selectActiveItem();
        }

        break;
      }

      case 'Home': {
        e.preventDefault();

        this._activeDescendantCtrl.navigateToFirst();

        if (!this.multiple) {
          this._selectActiveItem();
        }

        break;
      }

      case 'End': {
        e.preventDefault();
        this._activeDescendantCtrl.navigateToLast();

        if (!this.multiple) {
          this._selectActiveItem();
        }

        break;
      }

      case ' ':
      case 'Enter': {
        e.preventDefault();

        const value = this._activeDescendantCtrl.activeItem?.getAttribute('data-value');

        if (value == null) {
          break;
        }

        if (this.multiple) {
          this.toggleOption(value);
        } else {
          this._selectActiveItem();
        }

        break;
      }
    }
  };

  /** Routes pointer activations from the controller. */
  private _handleActivate(value: string): void {
    if (value === '__create__') {
      this.dispatchEvent(
        new CustomEvent<RCListboxChangeEvent>('rc-listbox-change', {
          bubbles: true,
          composed: true,
          detail: {
            value: this.value,
            selected: true,
            optionValue: '__create__',
            option: null,
            selectedValues: this.selectedValues,
            selectedOptions: this._selectedOptionsFor(this.selectedValues),
          },
        }),
      );
    } else {
      this.toggleOption(value);
    }
  }

  /**
   * Selects the active-descendant item without toggling.
   *
   * Used by arrow-key navigation so the item under the cursor is always selected.
   */
  protected _selectActiveItem(): void {
    const value = this._activeDescendantCtrl.activeItem?.getAttribute('data-value');

    if (value == null) return;

    const opt = this._ctrl.allOptions.find((o) => o.value === value);

    if (!opt || opt.disabled) return;

    const current = this._ctrl.selectedValues;
    if (current.length === 1 && current[0] === value) return;

    this._ctrl.setSelectedValues([value]);
    this._selectionInitialized = true;
    this._dispatchChange(opt, true);
  }

  /**
   * Returns `true` when `opt` passes the current `_filterText` and `filterStrategy`.
   */
  protected _isVisible(opt: ListboxOption): boolean {
    if (!this._filterText) return true;

    const label = opt.label.toLowerCase();
    const query = this._filterText.toLowerCase();

    if (typeof this.filterStrategy === 'function') {
      return this.filterStrategy(label, query);
    }

    if (this.filterStrategy === 'contains') {
      return label.includes(query);
    }

    return label.startsWith(query);
  }

  /**
   * Directly replaces the selection without firing an event.
   * Enforces the single-select limit when `multiple` is false.
   */
  protected _applySelection(values: string[]): void {
    this._ctrl.setSelectedValues(this.multiple ? values : values.slice(0, 1));
  }

  /**
   * Re-applies `_value` or `_defaultValue` after `options` or DOM bootstrap changes.
   */
  protected _applySelectionFromSource(): void {
    if (this._value !== undefined) {
      this._applySelection(this._normalizeValue(this._value));
      return;
    }

    if (!this._selectionInitialized && this._defaultValue !== undefined) {
      this._selectionInitialized = true;
      this._applySelection(this._normalizeValue(this._defaultValue));
    }
  }

  /** Coerces a `string | string[]` value to `string[]`. */
  protected _normalizeValue(value: string | string[]): string[] {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  /** Fires `rc-listbox-change` with a fully-populated detail object. */
  protected _dispatchChange(option: ListboxOption, selected: boolean): void {
    this.dispatchEvent(
      new CustomEvent<RCListboxChangeEvent>('rc-listbox-change', {
        bubbles: true,
        composed: true,
        detail: {
          value: this.value,
          selected,
          optionValue: option.value,
          option,
          selectedValues: this.selectedValues,
          selectedOptions: this._selectedOptionsFor(this.selectedValues),
        },
      }),
    );
  }

  /**
   * Maps value strings to their `ListboxOption` objects.
   * Creates synthetic `{ value, label: value }` entries for values not in the list.
   */
  protected _selectedOptionsFor(values: string[]): ListboxOption[] {
    return values.map(
      (value) =>
        this._ctrl.allOptions.find((opt) => opt.value === value) ?? { value, label: value },
    );
  }
}

export default RCListbox;
