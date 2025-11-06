import { LitElement, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ActiveDescendantController } from '@rcarls/rc-common';

export interface ListboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Determines how `filterOptions()` matches option labels against the query string.
 *
 * - `'prefix'` — label must start with the query (default, matches native `<select>` type-ahead).
 * - `'contains'` — label must contain the query anywhere.
 * - `function` — custom predicate; receives lowercased label and query, return `true` to show the option.
 */
export type FilterStrategy =
  | 'prefix'
  | 'contains'
  | ((label: string, query: string) => boolean);

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

declare global {
  interface HTMLElementTagNameMap {
    'rc-listbox': RCListbox;
  }
}

let _uid = 0;

/**
 * A headless listbox popup component following the WAI-ARIA listbox pattern.
 *
 * Renders into its own light DOM (no shadow root) so that when placed inside
 * another component's shadow root, option element IDs resolve within that same
 * shadow root — enabling `aria-activedescendant` and `aria-controls` IDREFs to
 * work correctly from the parent trigger.
 *
 * Consumers drive this component via its JS API:
 *   - Set `options` to populate the list
 *   - Set `value` / `defaultValue` to manage selection
 *   - Call `toggleOption()` for internal keyboard/pointer activation
 *   - Call `filterOptions()` to filter visible options
 *   - Read `navigableItems` to feed `ActiveDescendantController`
 *
 * @slot — No slots; options are rendered programmatically from the `options` property.
 * @fires rc-listbox-change - Fired when an option is activated (clicked or Enter/Space)
 * @csspart option - Individual option elements
 * @csspart option-checkmark - The checkmark indicator inside each option
 * @csspart option-label - The label text span inside each option
 * @csspart create-option - The "Create" option when allow-create is active
 */
export class RCListbox extends LitElement {
  /** Renders into the host element — no shadow root — so option IDs resolve in the parent shadow root. */
  override createRenderRoot() {
    return this;
  }

  /** Allow multiple selection. Reflected as `aria-multiselectable` on the host. */
  @property({ type: Boolean, reflect: true })
  multiple = false;

  /**
   * Render a checkmark indicator inside each option element.
   * Hidden by default; enable for combobox / select patterns where the
   * consumer's CSS shows it conditionally via `[aria-selected='true']`.
   */
  @property({ type: Boolean, reflect: true })
  checkmark = false;

  /**
   * How option labels are matched against the active filter text.
   * Defaults to `'contains'` (substring). Set to `'prefix'` for starts-with
   * matching, or pass a custom predicate for full control.
   * Function values are JS-only; string values may be set via the
   * `filter-strategy` attribute.
   */
  @property({ attribute: 'filter-strategy', reflect: false })
  filterStrategy: FilterStrategy = 'contains';

  @state() private _options: ListboxOption[] = [];
  @state() private _selectedValues: Set<string> = new Set();
  @state() private _filterText = '';
  @state() private _createLabel: string | null = null;
  private _defaultValue: string | string[] | undefined;
  private _value: string | string[] | undefined;
  private _selectionInitialized = false;

  private readonly _uid = `rc-lb-${++_uid}`;

  private readonly _adc = new ActiveDescendantController(this, {
    host: () => this,
    items: () => this.navigableItems,
  });

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'listbox');
    this.addEventListener('keydown', this._onKeydown);
    this.addEventListener('blur', this._onBlur);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._onKeydown);
    this.removeEventListener('blur', this._onBlur);
  }

  override updated() {
    if (this.multiple) {
      this.setAttribute('aria-multiselectable', 'true');
    } else {
      this.removeAttribute('aria-multiselectable');
    }
  }

  // ── Options ─────────────────────────────────────────────────────────────────

  /** All options regardless of filter state. */
  get allOptions(): readonly ListboxOption[] {
    return this._options;
  }

  /** Options currently passing the active filter. */
  get filteredOptions(): readonly ListboxOption[] {
    return this._options.filter((o) => this._isVisible(o));
  }

  /** Replace the full options list. Triggers a re-render. */
  get options(): ListboxOption[] {
    return [...this._options];
  }

  /** Replace the full options list. Triggers a re-render. */
  set options(opts: ListboxOption[]) {
    this._options = [...opts];
    this._applySelectionFromSource();
  }

  /** Append a single option without replacing the list. */
  appendOption(opt: ListboxOption): void {
    this._options = [...this._options, opt];
  }

  // ── Selection ────────────────────────────────────────────────────────────────

  get selectedValues(): string[] {
    return [...this._selectedValues];
  }

  /** Current selection. Host writes update silently. */
  get value(): string | string[] {
    return this.multiple
      ? this.selectedValues
      : (this.selectedValues[0] ?? '');
  }

  /** Current selection. Host writes update silently. */
  set value(value: string | string[] | undefined) {
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

  /** Initial uncontrolled selection. */
  get defaultValue(): string | string[] | undefined {
    return this._defaultValue;
  }

  /** Initial uncontrolled selection. */
  set defaultValue(value: string | string[] | undefined) {
    const oldValue = this._defaultValue;

    this._defaultValue = value;

    if (!this._selectionInitialized && this._value === undefined && value !== undefined) {
      this._applySelection(this._normalizeValue(value));
    }

    this.requestUpdate('defaultValue', oldValue);
  }

  /** Replace the selection set without firing `rc-listbox-change`. */
  setSelectedValues(values: string[]): void {
    this._applySelection(values);
  }

  /**
   * Toggle the selected state of the option with `value`.
   * In single-select mode, toggleing a selected item deselects it (and selects
   * the new item). Fires `rc-listbox-change`.
   */
  toggleOption(value: string): void {
    const opt = this._options.find((o) => o.value === value);
    if (!opt || opt.disabled) return;

    const wasSelected = this._selectedValues.has(value);

    if (this.multiple) {
      const next = new Set(this._selectedValues);
      if (wasSelected) next.delete(value); else next.add(value);
      this._selectedValues = next;
    } else {
      this._selectedValues = wasSelected ? new Set() : new Set([value]);
    }

    this._selectionInitialized = true;
    this._dispatchChange(opt, !wasSelected);
  }

  clearSelection(): void {
    this._applySelection([]);
  }

  // ── Filtering ────────────────────────────────────────────────────────────────

  /** Filter visible options to those whose label starts with `text` (case-insensitive). */
  filterOptions(text: string): void {
    this._filterText = text;
  }

  clearFilter(): void {
    this._filterText = '';
  }

  // ── Navigation target ────────────────────────────────────────────────────────

  /**
   * Ordered list of option elements currently navigable: visible and not disabled.
   * Feed this to `ActiveDescendantController.items` in the parent component.
   * Includes the create option element when one is set.
   */
  get navigableItems(): Element[] {
    const results: Element[] = [];
    for (let i = 0; i < this._options.length; i++) {
      const opt = this._options[i];
      if (opt.disabled || !this._isVisible(opt)) continue;
      const el = this.querySelector<Element>(`#${this._optId(i)}`);
      if (el) results.push(el);
    }
    if (this._createLabel !== null) {
      const el = this.querySelector<Element>(`#${this._uid}-create`);
      if (el) results.push(el);
    }
    return results;
  }

  // ── Allow-create ─────────────────────────────────────────────────────────────

  /**
   * Show or hide the "Create" option at the end of the list.
   * Pass `null` to hide it, or a non-empty string to show "Create '{label}'".
   * Fires `rc-listbox-change` with `value: '__create__'` when activated.
   */
  setCreateOption(label: string | null): void {
    this._createLabel = label;
  }

  // ── Rendering ────────────────────────────────────────────────────────────────

  protected override render() {
    return html`
      ${this._options.map(
        (opt, i) => html`
          <div
            id=${this._optId(i)}
            part="option"
            role="option"
            aria-selected=${this._selectedValues.has(opt.value) ? 'true' : 'false'}
            aria-disabled=${opt.disabled ? 'true' : 'false'}
            data-value=${opt.value}
            ?hidden=${!this._isVisible(opt)}
            @pointerdown=${(e: PointerEvent) => {
              e.preventDefault();
              this.toggleOption(opt.value);
            }}
          >${this.checkmark ? html`<span part="option-checkmark" aria-hidden="true">&#x2713;</span>` : nothing}<span part="option-label">${opt.label}</span></div>
        `,
      )}
      ${this._createLabel !== null
        ? html`
            <div
              id=${`${this._uid}-create`}
              part="option create-option"
              role="option"
              aria-selected="false"
              data-value="__create__"
              @pointerdown=${(e: PointerEvent) => {
                e.preventDefault();
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
              }}
            >${this.checkmark ? html`<span part="option-checkmark" aria-hidden="true">&#x2713;</span>` : nothing}<span part="option-label">Create "${this._createLabel}"</span></div>
          `
        : nothing}
    `;
  }

  private _onBlur = (): void => {
    this._adc.clear();
  };

  private _onKeydown = (e: KeyboardEvent): void => {
    // Pass modifier-key combos to parent handlers (e.g. Alt+Arrow in rc-transfer-list).
    if (e.altKey || e.ctrlKey || e.metaKey) return;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (this._adc.activeItem) this._adc.navigate(1);
        else this._adc.navigateToFirst();
        if (!this.multiple) this._selectActiveItem();
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (this._adc.activeItem) this._adc.navigate(-1);
        else this._adc.navigateToLast();
        if (!this.multiple) this._selectActiveItem();
        break;
      }
      case 'Home': {
        e.preventDefault();
        this._adc.navigateToFirst();
        if (!this.multiple) this._selectActiveItem();
        break;
      }
      case 'End': {
        e.preventDefault();
        this._adc.navigateToLast();
        if (!this.multiple) this._selectActiveItem();
        break;
      }
      case ' ':
      case 'Enter': {
        e.preventDefault();
        const value = this._adc.activeItem?.getAttribute('data-value');
        if (value == null) break;
        if (this.multiple) {
          this.toggleOption(value);
        } else {
          this._selectActiveItem();
        }
        break;
      }
    }
  };

  /**
   * Selects the active-descendant item without toggling (single-select safe).
   * Used by arrow-key navigation so the item under the cursor is always selected.
   */
  private _selectActiveItem(): void {
    const value = this._adc.activeItem?.getAttribute('data-value');
    if (value == null) return;

    const opt = this._options.find((o) => o.value === value);
    if (!opt || opt.disabled) return;

    if (this._selectedValues.has(value) && this._selectedValues.size === 1) return;

    this._selectedValues = new Set([value]);
    this._selectionInitialized = true;
    this._dispatchChange(opt, true);
  }

  private _optId(index: number): string {
    return `${this._uid}-${index}`;
  }

  private _isVisible(opt: ListboxOption): boolean {
    if (!this._filterText) return true;

    const label = opt.label.toLowerCase();
    const query = this._filterText.toLowerCase();

    if (typeof this.filterStrategy === 'function') return this.filterStrategy(label, query);
    if (this.filterStrategy === 'contains') return label.includes(query);

    return label.startsWith(query); // 'prefix' default
  }

  private _applySelection(values: string[]): void {
    this._selectedValues = new Set(this.multiple ? values : values.slice(0, 1));
  }

  private _applySelectionFromSource(): void {
    if (this._value !== undefined) {
      this._applySelection(this._normalizeValue(this._value));
      return;
    }

    if (!this._selectionInitialized && this._defaultValue !== undefined) {
      this._selectionInitialized = true;
      this._applySelection(this._normalizeValue(this._defaultValue));
    }
  }

  private _normalizeValue(value: string | string[]): string[] {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  private _dispatchChange(option: ListboxOption, selected: boolean): void {
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
}

export default RCListbox;
