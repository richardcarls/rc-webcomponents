import '@rcarls/rc-listbox/define';

import { LitElement, html } from 'lit';
import { property, query } from 'lit/decorators.js';
import type { ListboxOption, RCListbox } from '@rcarls/rc-listbox';

export interface RCTransferListChangeEvent {
  /** Ordered selected/right-hand list options. */
  selected: ListboxOption[];
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-transfer-list': RCTransferList;
  }
}

/**
 * Side-by-side transfer list built from two `rc-listbox` instances.
 *
 * @fires rc-transfer-list-change - Fires when the selected/right-hand list changes.
 */
export class RCTransferList extends LitElement {
  override createRenderRoot() { return this; }

  /** Available/left-hand options. Values must be unique. */
  @property({ attribute: false }) available: ListboxOption[] = [];

  /** Selected/right-hand options. Values must be unique, labels may repeat. */
  @property({ attribute: false }) selected: ListboxOption[] = [];

  /** Enable multi-selection in both lists. */
  @property({ type: Boolean, reflect: true }) multiple = false;

  /** Visible label for the available list. */
  @property({ attribute: 'available-label' }) availableLabel = 'Available';

  /** Visible label for the selected list. */
  @property({ attribute: 'selected-label' }) selectedLabel = 'Selected';

  @query('#available-list') private _$availableList?: RCListbox;
  @query('#selected-list') private _$selectedList?: RCListbox;

  override updated(): void {
    this._syncListboxes();
  }

  override render() {
    return html`
      <div part="root" class="rc-transfer-list-root">
        <section part="panel available-panel" class="rc-transfer-list-panel">
          <label part="label available-label" id="available-label">${this.availableLabel}</label>
          <rc-listbox
            id="available-list"
            part="listbox available-listbox"
            aria-labelledby="available-label"
            ?multiple=${this.multiple}
          ></rc-listbox>
        </section>

        <div part="actions" class="rc-transfer-list-actions">
          <button type="button" part="button add-button" @click=${this.addSelected}><span>Add &gt;</span></button>
          <button type="button" part="button add-all-button" @click=${this.addAll}><span>Add All</span></button>
          <button type="button" part="button remove-button" @click=${this.removeSelected}><span>&lt; Rem</span></button>
          <button type="button" part="button clear-button" @click=${this.clearSelected}><span>&lt; Clear</span></button>
          <button type="button" part="button move-up-button" @click=${() => this.moveSelected(-1)}><span>Up</span></button>
          <button type="button" part="button move-down-button" @click=${() => this.moveSelected(1)}><span>Down</span></button>
        </div>

        <section part="panel selected-panel" class="rc-transfer-list-panel">
          <label part="label selected-label" id="selected-label">${this.selectedLabel}</label>
          <rc-listbox
            id="selected-list"
            part="listbox selected-listbox"
            aria-labelledby="selected-label"
            ?multiple=${this.multiple}
          ></rc-listbox>
        </section>
      </div>
    `;
  }

  /** Adds the selected available options to the selected list. */
  addSelected(): void {
    const values = this._$availableList?.selectedValues ?? [];
    if (values.length === 0) return;

    const additions = values
      .map((value) => this.available.find((option) => option.value === value) ?? null)
      .filter((option): option is ListboxOption => option !== null);

    this._appendSelected(additions);
  }

  /** Adds every available option to the selected list. */
  addAll(): void {
    this._appendSelected(this.available);
  }

  /** Removes the selected right-hand options. */
  removeSelected(): void {
    const values = new Set(this._$selectedList?.selectedValues ?? []);
    if (values.size === 0) return;

    this.selected = this.selected.filter((option) => !values.has(option.value));
    this._dispatchChange();
  }

  /** Clears the selected/right-hand list. */
  clearSelected(): void {
    if (this.selected.length === 0) return;

    this.selected = [];
    this._dispatchChange();
  }

  /** Moves selected right-hand options by `delta` rows. */
  moveSelected(delta: number): void {
    if (delta === 0) return;

    const values = new Set(this._$selectedList?.selectedValues ?? []);
    if (values.size === 0) return;

    const next = [...this.selected];
    const start = delta < 0 ? 1 : next.length - 2;
    const end = delta < 0 ? next.length : -1;
    const step = delta < 0 ? 1 : -1;

    for (let i = start; i !== end; i += step) {
      const target = i + delta;
      if (!values.has(next[i].value) || values.has(next[target].value)) continue;

      const current = next[i];
      next[i] = next[target];
      next[target] = current;
    }

    this.selected = next;
    this._dispatchChange(values);
  }

  private _appendSelected(additions: ListboxOption[]): void {
    if (additions.length === 0) return;

    const offset = this.selected.length;
    const stamped = additions.map((option, index) => ({
      ...option,
      value: this._selectedValue(option.value, offset + index),
    }));

    this.selected = [...this.selected, ...stamped];
    this._dispatchChange();
  }

  private _syncListboxes(selectedValues: Set<string> = new Set()): void {
    if (this._$availableList) {
      this._$availableList.multiple = this.multiple;
      this._$availableList.options = this.available;
    }

    if (this._$selectedList) {
      this._$selectedList.multiple = this.multiple;
      this._$selectedList.options = this.selected;
      this._$selectedList.setSelectedValues([...selectedValues]);
    }
  }

  private _dispatchChange(selectedValues?: Set<string>): void {
    this.requestUpdate();
    this.updateComplete.then(() => this._syncListboxes(selectedValues));

    this.dispatchEvent(
      new CustomEvent<RCTransferListChangeEvent>('rc-transfer-list-change', {
        bubbles: true,
        composed: true,
        detail: { selected: [...this.selected] },
      }),
    );
  }

  private _selectedValue(value: string, index: number): string {
    return `${value}::${Date.now()}::${index}`;
  }
}

export default RCTransferList;
