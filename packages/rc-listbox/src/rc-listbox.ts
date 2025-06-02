import { LitElement, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

export interface ListboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RCListboxChangeEvent {
  /** The option value that was activated. `'__create__'` for the create option. */
  value: string;
  /** Whether the option was selected (false means it was deselected). */
  selected: boolean;
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
 *   - Call `setSelectedValues()`, `toggleOption()` to manage selection
 *   - Call `filterOptions()` to filter visible options
 *   - Read `navigableItems` to feed `ActiveDescendantController`
 *
 * @slot — No slots; options are rendered programmatically from the `options` property.
 * @fires rc-listbox-change - Fired when an option is activated (clicked or Enter/Space)
 * @csspart option - Individual option elements
 * @csspart create-option - The "Create" option when allow-create is active
 */
@customElement('rc-listbox')
export class RCListbox extends LitElement {
  /** Renders into the host element — no shadow root — so option IDs resolve in the parent shadow root. */
  override createRenderRoot() {
    return this;
  }

  /** Allow multiple selection. Reflected as `aria-multiselectable` on the host. */
  @property({ type: Boolean, reflect: true })
  multiple = false;

  @state() private _options: ListboxOption[] = [];
  @state() private _selectedValues: Set<string> = new Set();
  @state() private _filterText = '';
  @state() private _createLabel: string | null = null;

  private readonly _uid = `rc-lb-${++_uid}`;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute('role')) this.setAttribute('role', 'listbox');
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
  set options(opts: ListboxOption[]) {
    this._options = [...opts];
  }

  /** Append a single option without replacing the list. */
  appendOption(opt: ListboxOption): void {
    this._options = [...this._options, opt];
  }

  // ── Selection ────────────────────────────────────────────────────────────────

  get selectedValues(): string[] {
    return [...this._selectedValues];
  }

  /** Replace the selection set without firing `rc-listbox-change`. */
  setSelectedValues(values: string[]): void {
    this._selectedValues = new Set(values);
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

    this.dispatchEvent(
      new CustomEvent<RCListboxChangeEvent>('rc-listbox-change', {
        bubbles: true,
        composed: true,
        detail: { value, selected: !wasSelected },
      }),
    );
  }

  clearSelection(): void {
    this._selectedValues = new Set();
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
          ><span part="option-checkmark" aria-hidden="true">&#x2713;</span>${opt.label}</div>
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
                    detail: { value: '__create__', selected: true },
                  }),
                );
              }}
            ><span part="option-checkmark" aria-hidden="true">&#x2713;</span>Create "${this._createLabel}"</div>
          `
        : nothing}
    `;
  }

  private _optId(index: number): string {
    return `${this._uid}-${index}`;
  }

  private _isVisible(opt: ListboxOption): boolean {
    if (!this._filterText) return true;
    return opt.label.toLowerCase().startsWith(this._filterText.toLowerCase());
  }
}

export default RCListbox;
