import '@rcarls/rc-listbox/define';

import { LitElement, html } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import type { ListboxOption, RCListbox, RCListboxChangeEvent } from '@rcarls/rc-listbox';

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
 * Requires a direct child `<select multiple>` element as the single source of
 * truth for option data and form participation. Unselected `<option>` elements
 * populate the available (left) panel; selected ones populate the selected
 * (right) panel. Transfers are reflected back to the `<select>` so native form
 * submission serialises the right-panel values in user-determined order.
 *
 * The `available` and `selected` JS array properties write through to the
 * backing `<select>`, so the component can also be driven imperatively from a
 * framework without giving up form participation.
 *
 * @fires rc-transfer-list-change - Fires when the selected/right-hand list changes.
 */
export class RCTransferList extends LitElement {
  override createRenderRoot() { return this; }

  /** Enable multi-selection in both lists. */
  @property({ type: Boolean, reflect: true }) multiple = false;

  /** Visible label for the available list. */
  @property({ attribute: 'available-label' }) availableLabel = 'Available';

  /** Visible label for the selected list. */
  @property({ attribute: 'selected-label' }) selectedLabel = 'Selected';

  @query('#available-list') private _$availableList?: RCListbox;
  @query('#selected-list') private _$selectedList?: RCListbox;

  /** Values currently highlighted in the available list. Drives the "Add →" button disable state. */
  @state() private _availableSelection: string[] = [];

  /** Values currently highlighted in the selected list. Drives Remove/reorder button disable states. */
  @state() private _selectedSelection: string[] = [];

  private _select: HTMLSelectElement | null = null;

  /** Set while the component mutates the backing <select> to prevent observer feedback loops. */
  private _syncing = false;

  private _hostObserver = new MutationObserver(() => this._setupSelect());
  private _selectObserver = new MutationObserver(() => {
    if (!this._syncing) this.requestUpdate();
  });


  /**
   * Available/left-hand options derived from unselected `<option>` elements.
   *
   * Setting this property replaces all unselected options in the backing
   * `<select>`. Items whose values already appear in the selected list are
   * skipped to prevent duplicate option values.
   */
  get available(): ListboxOption[] {
    if (!this._select) return [];

    return Array.from(this._select.options)
      .filter((o) => !o.selected)
      .map((o) => ({ value: o.value, label: o.label || o.text }));
  }

  set available(items: ListboxOption[]) {
    if (!this._select) return;

    this._syncing = true;

    const selectedValues = new Set(
      Array.from(this._select.options).filter((o) => o.selected).map((o) => o.value),
    );

    for (const opt of Array.from(this._select.options)) {
      if (!opt.selected) opt.remove();
    }

    for (const item of items) {
      if (!selectedValues.has(item.value)) {
        this._select.add(new Option(item.label, item.value));
      }
    }

    this._syncing = false;
    this.requestUpdate();
  }


  /**
   * Selected/right-hand options derived from selected `<option>` elements.
   *
   * Setting this property replaces all selected options in the backing
   * `<select>`. Unselected options are left unchanged.
   */
  get selected(): ListboxOption[] {
    if (!this._select) return [];

    return Array.from(this._select.options)
      .filter((o) => o.selected)
      .map((o) => ({ value: o.value, label: o.label || o.text }));
  }

  set selected(items: ListboxOption[]) {
    if (!this._select) return;

    this._syncing = true;

    for (const opt of Array.from(this._select.options)) {
      if (opt.selected) opt.remove();
    }

    for (const item of items) {
      this._select.add(new Option(item.label, item.value, false, true));
    }

    this._syncing = false;
    this.requestUpdate();
  }


  override connectedCallback(): void {
    super.connectedCallback();
    this._hostObserver.observe(this, { childList: true });
    this.addEventListener('keydown', this._onKeydown);
    this.addEventListener('rc-listbox-change', this._onListboxChange);
    this._setupSelect();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._hostObserver.disconnect();
    this._teardownSelect();
    this.removeEventListener('keydown', this._onKeydown);
    this.removeEventListener('rc-listbox-change', this._onListboxChange);
  }

  override render() {
    const noAvailable = this.available.length === 0;
    const noSelected = this.selected.length === 0;
    const cannotReorder = this.selected.length < 2;
    const noAvailableSelection = this._availableSelection.length === 0;
    const noSelectedSelection = this._selectedSelection.length === 0;

    return html`
      <div part="root" class="rc-transfer-list-root">
        <section
          part="panel available-panel"
          class="rc-transfer-list-panel"
          aria-labelledby="available-label"
        >
          <span part="label available-label" id="available-label">${this.availableLabel}</span>
          <rc-listbox
            id="available-list"
            part="listbox available-listbox"
            aria-labelledby="available-label"
            .options=${this.available}
            .multiple=${this.multiple}
          ></rc-listbox>
        </section>

        <div part="actions" class="rc-transfer-list-actions">
          <button
            type="button"
            part="button add-button"
            ?disabled=${noAvailable || noAvailableSelection}
            @click=${this.addSelected}
          >Add &#x2192;</button>
          <button
            type="button"
            part="button add-all-button"
            ?disabled=${noAvailable}
            @click=${this.addAll}
          >Add all &#x2192;</button>
          <button
            type="button"
            part="button remove-button"
            ?disabled=${noSelected || noSelectedSelection}
            @click=${this.removeSelected}
          >&#x2190; Remove</button>
          <button
            type="button"
            part="button clear-button"
            ?disabled=${noSelected}
            @click=${this.clearSelected}
          >&#x2190; Clear</button>
          <button
            type="button"
            part="button move-up-button"
            ?disabled=${cannotReorder || noSelectedSelection}
            @click=${this._onMoveUp}
          >Move up</button>
          <button
            type="button"
            part="button move-down-button"
            ?disabled=${cannotReorder || noSelectedSelection}
            @click=${this._onMoveDown}
          >Move down</button>
        </div>

        <section
          part="panel selected-panel"
          class="rc-transfer-list-panel"
          aria-labelledby="selected-label"
        >
          <span part="label selected-label" id="selected-label">${this.selectedLabel}</span>
          <rc-listbox
            id="selected-list"
            part="listbox selected-listbox"
            aria-labelledby="selected-label"
            .options=${this.selected}
            .multiple=${this.multiple}
          ></rc-listbox>
        </section>
      </div>
    `;
  }

  /** Adds the highlighted available options to the selected list. */
  addSelected(): void {
    if (!this._select) return;

    const values = new Set(this._$availableList?.selectedValues ?? []);
    if (values.size === 0) return;

    this._syncing = true;

    for (const opt of Array.from(this._select.options)) {
      if (!opt.selected && values.has(opt.value)) opt.selected = true;
    }

    this._syncing = false;
    this._availableSelection = [];
    this.requestUpdate();
    this._dispatchChange();
  }

  /** Adds every available option to the selected list. */
  addAll(): void {
    if (!this._select) return;

    this._syncing = true;
    for (const opt of Array.from(this._select.options)) opt.selected = true;
    this._syncing = false;

    this._availableSelection = [];
    this.requestUpdate();
    this._dispatchChange();
  }

  /** Removes the highlighted right-hand options from the selected list. */
  removeSelected(): void {
    if (!this._select) return;

    const values = new Set(this._$selectedList?.selectedValues ?? []);
    if (values.size === 0) return;

    this._syncing = true;

    for (const opt of Array.from(this._select.options)) {
      if (opt.selected && values.has(opt.value)) opt.selected = false;
    }

    this._syncing = false;
    this._selectedSelection = [];
    this.requestUpdate();
    this._dispatchChange();
  }

  /** Clears the selected/right-hand list. */
  clearSelected(): void {
    if (!this._select) return;

    this._syncing = true;
    for (const opt of Array.from(this._select.options)) opt.selected = false;
    this._syncing = false;

    this._selectedSelection = [];
    this.requestUpdate();
    this._dispatchChange();
  }

  /** Moves highlighted right-hand options by `delta` rows (-1 = up, 1 = down). */
  moveSelected(delta: number): void {
    if (delta === 0 || !this._select) return;

    const values = new Set(this._$selectedList?.selectedValues ?? []);
    if (values.size === 0) return;

    this._syncing = true;
    this._reorderSelectOptions(values, delta);
    this._syncing = false;

    this.requestUpdate();
    this._dispatchChange(values);
  }

  private _onMoveUp = (): void => { this.moveSelected(-1); };

  private _onMoveDown = (): void => { this.moveSelected(1); };

  private _onKeydown = (e: KeyboardEvent): void => {
    if (!e.altKey) return;

    switch (e.key) {
      case 'ArrowRight': e.preventDefault(); this.addSelected(); break;
      case 'ArrowLeft':  e.preventDefault(); this.removeSelected(); break;
      case 'ArrowUp':    e.preventDefault(); this.moveSelected(-1); break;
      case 'ArrowDown':  e.preventDefault(); this.moveSelected(1); break;
    }
  };

  private _onListboxChange = (e: Event): void => {
    const ev = e as CustomEvent<RCListboxChangeEvent>;
    const raw = ev.detail.value;
    const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const targetId = (e.target as Element | null)?.id;
    if (targetId === 'available-list') this._availableSelection = values;
    else if (targetId === 'selected-list') this._selectedSelection = values;
  };

  private _setupSelect(): void {
    const select = this.querySelector<HTMLSelectElement>(':scope > select[multiple]');

    if (select === this._select) return;

    this._teardownSelect();
    this._select = select;

    if (!select) {
      if (import.meta.env.DEV) {
        console.warn(
          '[rc-transfer-list] No direct child <select multiple> found. ' +
          'Add a <select multiple> child for form participation and progressive enhancement.',
          this,
        );
      }
      return;
    }

    // Hide from AT and tab order — the rc-listbox UI is the accessible interface;
    // the <select> is only present for form serialisation.
    select.setAttribute('aria-hidden', 'true');
    select.tabIndex = -1;

    // Watch for external option additions/removals (attribute-level opt.selected
    // changes via IDL are not observable; use the component API instead).
    this._selectObserver.observe(select, { childList: true });
    this.requestUpdate();
  }

  private _teardownSelect(): void {
    if (this._select) {
      this._select.removeAttribute('aria-hidden');
      this._select.removeAttribute('tabindex');
    }
    this._selectObserver.disconnect();
    this._select = null;
  }

  /**
   * Reorders selected `<option>` DOM nodes inside the backing `<select>` to
   * preserve user-determined order in form serialisation.
   */
  private _reorderSelectOptions(movedValues: Set<string>, delta: number): void {
    const select = this._select!;
    const opts = Array.from(select.options).filter((o) => o.selected);

    const start = delta < 0 ? 1 : opts.length - 2;
    const end = delta < 0 ? opts.length : -1;
    const step = delta < 0 ? 1 : -1;

    for (let i = start; i !== end; i += step) {
      const target = i + delta;
      if (!movedValues.has(opts[i].value) || movedValues.has(opts[target].value)) continue;

      if (delta < 0) {
        select.insertBefore(opts[i], opts[target]);
      } else {
        opts[target].insertAdjacentElement('afterend', opts[i]);
      }
    }
  }

  // Restores selection in the selected listbox after a mutation. Options are
  // set declaratively in render() so only selection state needs imperative sync.
  private _syncSelection(selectedValues: Set<string> = new Set()): void {
    this._$selectedList?.setSelectedValues([...selectedValues]);
  }

  private _dispatchChange(selectedValues?: Set<string>): void {
    this.updateComplete.then(() => this._syncSelection(selectedValues));

    this.dispatchEvent(
      new CustomEvent<RCTransferListChangeEvent>('rc-transfer-list-change', {
        bubbles: true,
        composed: true,
        detail: { selected: [...this.selected] },
      }),
    );
  }
}

export default RCTransferList;
