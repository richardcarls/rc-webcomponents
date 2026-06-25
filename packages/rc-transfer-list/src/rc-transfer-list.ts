import { LitElement, html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import {
  MutationObserverController,
  NativeChildController,
  warnMissingDirectChild,
} from '@rcarls/rc-common';
import type { ListboxOption, RCListbox, RCListboxChangeEvent } from '@rcarls/rc-listbox';

import '@rcarls/rc-listbox/define';
import '@rcarls/rc-toolbar/define';

import { transferListStyles } from './rc-transfer-list.styles.js';

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
 * Enhances a `<select multiple>` element to become a side-by-side transfer list.
 *
 * The component renders two listboxes and transfer/reorder actions in between.
 * Available options are on the left, and selected options appear on the right. It
 * is an older enterprise/admin UI pattern, but solves the specific problem of
 * multiple selection within a large amount of options.
 *
 * The `available` and `selected` JS array properties write through to the
 * backing `<select>`, so the component can also be driven imperatively from a
 * framework without giving up form participation.
 *
 * @fires rc-transfer-list-change - Fires when the selected/right-hand list changes.
 *
 * @cssprop [--rc-transfer-list-gap=var(--rc-control-gap)] - Gap between panels and the action toolbar
 * @cssprop [--rc-transfer-list-panel-gap=var(--rc-control-gap)] - Gap between a panel label and its listbox
 * @cssprop [--rc-transfer-list-listbox-min-block-size=10rem] - Minimum block size for each listbox
 * @cssprop [--rc-transfer-list-listbox-border=var(--rc-border)] - Border around each listbox
 * @cssprop [--rc-transfer-list-option-gap=var(--rc-item-gap)] - Gap between option adornments and labels
 * @cssprop [--rc-transfer-list-option-padding-block=var(--rc-item-padding-block)] - Block padding for option rows
 * @cssprop [--rc-transfer-list-option-padding-inline=var(--rc-item-padding-inline)] - Inline padding for option rows
 * @cssprop [--rc-transfer-list-option-selected-bg=var(--rc-highlight)] - Selected option background
 * @cssprop [--rc-transfer-list-option-selected-color=var(--rc-highlight-text)] - Selected option foreground
 *
 * @csspart root - Root layout wrapper. Reflects data-can-move-up/down.
 * @csspart panel - Shared list panel surface.
 * @csspart available-panel - Available/left panel. Reflects data-empty and data-has-selection.
 * @csspart selected-panel - Selected/right panel. Reflects data-empty and data-has-selection.
 * @csspart actions - Transfer action toolbar.
 * @csspart button - Shared action button surface.
 */
export class RCTransferList extends LitElement {
  static override styles = transferListStyles;

  /** Enable multi-selection in both lists. */
  @property({ type: Boolean, reflect: true })
  multiple = false;

  /** Stack the panels and action toolbar into a compact one-column layout. */
  @property({ type: Boolean, reflect: true })
  compact = false;

  /** Visible label for the available list. */
  @property({ attribute: 'available-label' })
  availableLabel = 'Available';

  /** Visible label for the selected list. */
  @property({ attribute: 'selected-label' })
  selectedLabel = 'Selected';

  @query('#available-list')
  private _$availableList?: RCListbox;

  @query('#selected-list')
  private _$selectedList?: RCListbox;

  /** Values currently highlighted in the available list. Drives the "Add →" button disable state. */
  @state()
  private _availableSelection: string[] = [];

  /** Values currently highlighted in the selected list. Drives Remove/reorder button disable states. */
  @state()
  private _selectedSelection: string[] = [];

  private _$select: HTMLSelectElement | null = null;

  /** Set while the component mutates the backing <select> to prevent observer feedback loops. */
  private _syncing = false;

  private _defaultSelected: ListboxOption[] | undefined;

  private _selectedInitialized = false;

  private readonly _selectObserver = new MutationObserverController(this, {
    target: null,
    disabled: true,
    callback: () => {
      if (!this._syncing) {
        this.requestUpdate();
      }
    },
  });

  constructor() {
    super();

    new NativeChildController<HTMLSelectElement>(this, {
      selector: ':scope > select[multiple]',
      observe: true,
      onChange: ($select) => this._setupSelect($select),
      onMissing: () => {
        if (import.meta.env.DEV) {
          warnMissingDirectChild(this, {
            selector: ':scope > select[multiple]',
            message:
              '[rc-transfer-list] No direct child <select multiple> found. ' +
              'Add a <select multiple> child for form participation and progressive enhancement.',
          });
        }
      },
    });
  }

  /**
   * Available/left-hand options derived from unselected `<option>` elements.
   *
   * Setting this property replaces all unselected options in the backing
   * `<select>`. Items whose values already appear in the selected list are
   * skipped to prevent duplicate option values.
   */
  get available(): ListboxOption[] {
    if (!this._$select) {
      return [];
    }

    return Array.from(this._$select.options)
      .filter(($option) => !$option.selected)
      .map(($option) => ({ value: $option.value, label: $option.label || $option.text }));
  }

  set available(items: ListboxOption[]) {
    if (!this._$select) {
      return;
    }

    this._syncing = true;

    const selectedValues = new Set(
      Array.from(this._$select.options)
        .filter(($option) => $option.selected)
        .map(($option) => $option.value),
    );

    for (const $option of Array.from(this._$select.options)) {
      if (!$option.selected) {
        $option.remove();
      }
    }

    for (const item of items) {
      if (!selectedValues.has(item.value)) {
        this._$select.add(new Option(item.label, item.value));
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
    if (!this._$select) {
      return [];
    }

    return Array.from(this._$select.options)
      .filter(($option) => $option.selected)
      .map(($option) => ({ value: $option.value, label: $option.label || $option.text }));
  }

  set selected(items: ListboxOption[]) {
    this._selectedInitialized = true;

    if (!this._$select) {
      return;
    }

    this._syncing = true;

    for (const $option of Array.from(this._$select.options)) {
      if ($option.selected) {
        $option.remove();
      }
    }

    for (const item of items) {
      this._$select.add(new Option(item.label, item.value, false, true));
    }

    this._syncing = false;
    this.requestUpdate();
  }

  /** Initial uncontrolled selected list. Applied before any `selected` write from the host. */
  get defaultSelected(): ListboxOption[] | undefined {
    return this._defaultSelected;
  }

  set defaultSelected(items: ListboxOption[] | undefined) {
    this._defaultSelected = items;

    if (!this._selectedInitialized && this._$select && items !== undefined) {
      this._applyDefaultSelected(items);
    }
  }

  private _applyDefaultSelected(items: ListboxOption[]): void {
    if (!this._$select) {
      return;
    }

    this._syncing = true;

    for (const $option of Array.from(this._$select.options)) {
      $option.selected = items.some((item) => item.value === $option.value);
    }

    this._syncing = false;
    this.requestUpdate();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._teardownSelect();
  }

  override render() {
    const available = this.available; // reads <select> directly; requestUpdate() always precedes render
    const selected = this.selected;
    const selectedValues = new Set(this._selectedSelection);
    const noAvailable = available.length === 0;
    const noSelected = selected.length === 0;
    const cannotReorder = selected.length < 2;
    const noAvailableSelection = this._availableSelection.length === 0;
    const noSelectedSelection = this._selectedSelection.length === 0;
    const canMoveUp = this._canMoveSelected(selected, selectedValues, -1);
    const canMoveDown = this._canMoveSelected(selected, selectedValues, 1);

    return html`
      <div
        id="root"
        part="root"
        class="rc-transfer-list-root"
        data-can-move-up=${canMoveUp ? '' : nothing}
        data-can-move-down=${canMoveDown ? '' : nothing}
        @keydown=${this._onKeydown}
      >
        <section
          part="panel available-panel"
          class="rc-transfer-list-panel"
          aria-labelledby="available-label"
          data-empty=${noAvailable ? '' : nothing}
          data-has-selection=${!noAvailableSelection ? '' : nothing}
        >
          <span part="label available-label" id="available-label">${this.availableLabel}</span>
          <rc-listbox
            id="available-list"
            part="listbox available-listbox"
            aria-labelledby="available-label"
            tabindex="0"
            .options=${available}
            .multiple=${this.multiple}
            @rc-listbox-change=${this._onListboxChange}
          ></rc-listbox>
        </section>

        <rc-toolbar
          id="actions"
          orientation=${this.compact ? 'horizontal' : 'vertical'}
          label="Transfer actions"
          part="actions"
          class="rc-transfer-list-actions"
        >
          <button
            type="button"
            part="button add-button"
            ?disabled=${noAvailable || noAvailableSelection}
            @click=${this.addSelected}
          >
            Add &#x2192;
          </button>

          <button
            type="button"
            part="button add-all-button"
            ?disabled=${noAvailable}
            @click=${this.addAll}
          >
            Add all &#x2192;
          </button>

          <button
            type="button"
            part="button remove-button"
            ?disabled=${noSelected || noSelectedSelection}
            @click=${this.removeSelected}
          >
            &#x2190; Remove
          </button>

          <button
            type="button"
            part="button clear-button"
            ?disabled=${noSelected}
            @click=${this.clearSelected}
          >
            &#x2190; Clear
          </button>

          <button
            type="button"
            part="button move-up-button"
            ?disabled=${cannotReorder || noSelectedSelection}
            @click=${this._onMoveUp}
          >
            Move up
          </button>

          <button
            type="button"
            part="button move-down-button"
            ?disabled=${cannotReorder || noSelectedSelection}
            @click=${this._onMoveDown}
          >
            Move down
          </button>
        </rc-toolbar>

        <section
          part="panel selected-panel"
          class="rc-transfer-list-panel"
          aria-labelledby="selected-label"
          data-empty=${noSelected ? '' : nothing}
          data-has-selection=${!noSelectedSelection ? '' : nothing}
        >
          <span part="label selected-label" id="selected-label">${this.selectedLabel}</span>

          <rc-listbox
            id="selected-list"
            part="listbox selected-listbox"
            aria-labelledby="selected-label"
            tabindex="0"
            .options=${selected}
            .multiple=${this.multiple}
            @rc-listbox-change=${this._onListboxChange}
          ></rc-listbox>
        </section>
      </div>
      <slot></slot>
    `;
  }

  /** Adds the highlighted available options to the selected list. */
  addSelected(): void {
    if (!this._$select) {
      return;
    }

    const values = new Set(this._$availableList?.selectedValues ?? []);

    if (values.size === 0) {
      return;
    }

    this._syncing = true;

    for (const $option of Array.from(this._$select.options)) {
      if (!$option.selected && values.has($option.value)) {
        $option.selected = true;
      }
    }

    this._syncing = false;
    this._availableSelection = [];
    this.requestUpdate();
    this._dispatchChange();
  }

  /** Adds every available option to the selected list. */
  addAll(): void {
    if (!this._$select) {
      return;
    }

    this._syncing = true;

    for (const $option of Array.from(this._$select.options)) {
      $option.selected = true;
    }

    this._syncing = false;

    this._availableSelection = [];
    this.requestUpdate();
    this._dispatchChange();
  }

  /** Removes the highlighted right-hand options from the selected list. */
  removeSelected(): void {
    if (!this._$select) {
      return;
    }

    const values = new Set(this._$selectedList?.selectedValues ?? []);

    if (values.size === 0) {
      return;
    }

    this._syncing = true;

    for (const $option of Array.from(this._$select.options)) {
      if ($option.selected && values.has($option.value)) {
        $option.selected = false;
      }
    }

    this._syncing = false;
    this._selectedSelection = [];
    this.requestUpdate();
    this._dispatchChange();
  }

  /** Clears the selected/right-hand list. */
  clearSelected(): void {
    if (!this._$select) {
      return;
    }

    this._syncing = true;

    for (const $option of Array.from(this._$select.options)) {
      $option.selected = false;
    }

    this._syncing = false;

    this._selectedSelection = [];
    this.requestUpdate();
    this._dispatchChange();
  }

  /** Moves highlighted right-hand options by `delta` rows (-1 = up, 1 = down). */
  moveSelected(delta: number): void {
    if (delta === 0 || !this._$select) {
      return;
    }

    const values = new Set(this._$selectedList?.selectedValues ?? []);

    if (values.size === 0) {
      return;
    }

    this._syncing = true;
    this._reorderSelectOptions(values, delta);
    this._syncing = false;

    this.requestUpdate();
    this._dispatchChange(values);
  }

  private _onMoveUp = (): void => {
    this.moveSelected(-1);
  };

  private _onMoveDown = (): void => {
    this.moveSelected(1);
  };

  private _canMoveSelected(
    selected: ListboxOption[],
    selectedValues: Set<string>,
    delta: -1 | 1,
  ): boolean {
    if (selectedValues.size === 0 || selected.length < 2) {
      return false;
    }

    return selected.some((item, index) => {
      if (!selectedValues.has(item.value)) {
        return false;
      }

      const target = index + delta;

      if (target < 0 || target >= selected.length) {
        return false;
      }

      return !selectedValues.has(selected[target].value);
    });
  }

  private _onKeydown = (e: KeyboardEvent): void => {
    if (e.altKey) {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          this.addSelected();

          break;

        case 'ArrowLeft':
          e.preventDefault();
          this.removeSelected();

          break;

        case 'ArrowUp':
          e.preventDefault();
          this.moveSelected(-1);

          break;

        case 'ArrowDown':
          e.preventDefault();
          this.moveSelected(1);

          break;
      }

      return;
    }

    const targetId = this._getListboxEventTargetId(e);

    // APG shortcut: Enter in the available list adds the active item.

    // Restricted to single-select: in multi mode Enter toggles selection in rc-listbox
    // first, so triggering addSelected() here would immediately transfer a single item
    // and discard any multi-item selection the user was building.
    if (targetId === 'available-list' && !this.multiple && e.key === 'Enter') {
      e.preventDefault();
      this.addSelected();

      return;
    }

    // APG shortcut: Delete in the selected list removes the highlighted items.
    if (targetId === 'selected-list' && e.key === 'Delete') {
      e.preventDefault();

      this.removeSelected();
    }
  };

  private _onListboxChange = (e: Event): void => {
    const ev = e as CustomEvent<RCListboxChangeEvent>;
    const raw = ev.detail.value;
    const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const targetId = (e.currentTarget as Element | null)?.id;

    if (targetId === 'available-list') {
      this._availableSelection = values;
    } else if (targetId === 'selected-list') {
      this._selectedSelection = values;
    }
  };

  private _getListboxEventTargetId(e: Event): string | undefined {
    for (const node of e.composedPath()) {
      if (
        node instanceof Element &&
        (node.id === 'available-list' || node.id === 'selected-list')
      ) {
        return node.id;
      }
    }

    return undefined;
  }

  private _setupSelect($select: HTMLSelectElement | null): void {
    if ($select === this._$select) {
      return;
    }

    this._teardownSelect();
    this._$select = $select;

    if (!$select) {
      return;
    }

    // Remove from visual display, AT, and tab order — the rc-listbox UI is the
    // accessible interface; the <select> is only present for form serialisation.
    $select.style.display = 'none';
    $select.setAttribute('aria-hidden', 'true');
    $select.tabIndex = -1;

    // Watch for external option additions/removals (attribute-level opt.selected
    // changes via IDL are not observable; use the component API instead).
    this._selectObserver.setOptions({
      target: $select,
      disabled: false,
      observerOptions: { childList: true },
    });

    if (!this._selectedInitialized && this._defaultSelected !== undefined) {
      this._applyDefaultSelected(this._defaultSelected);
    }

    this.requestUpdate();
  }

  private _teardownSelect(): void {
    if (this._$select) {
      this._$select.style.display = '';
      this._$select.removeAttribute('aria-hidden');
      this._$select.removeAttribute('tabindex');
    }

    this._selectObserver.setOptions({ target: null, disabled: true });
    this._$select = null;
  }

  /**
   * Reorders selected `<option>` DOM nodes inside the backing `<select>` to
   * preserve user-determined order in form serialisation.
   */
  private _reorderSelectOptions(movedValues: Set<string>, delta: number): void {
    const $select = this._$select!;
    const $options = Array.from($select.options).filter(($option) => $option.selected);

    const start = delta < 0 ? 1 : $options.length - 2;
    const end = delta < 0 ? $options.length : -1;
    const step = delta < 0 ? 1 : -1;

    for (let i = start; i !== end; i += step) {
      const target = i + delta;

      if (!movedValues.has($options[i].value) || movedValues.has($options[target].value)) {
        continue;
      }

      if (delta < 0) {
        $select.insertBefore($options[i], $options[target]);
      } else {
        $options[target].insertAdjacentElement('afterend', $options[i]);
      }
    }
  }

  // Restores selection in the selected listbox after a mutation. Options are
  // set declaratively in render() so only selection state needs imperative sync.
  private _syncSelection(selectedValues: Set<string> = new Set()): void {
    this._$selectedList?.setSelectedValues([...selectedValues]);
  }

  private _dispatchChange(selectedValues?: Set<string>): void {
    this.updateComplete.then(() => {
      this._syncSelection(selectedValues);

      this.dispatchEvent(
        new CustomEvent<RCTransferListChangeEvent>('rc-transfer-list-change', {
          bubbles: true,
          composed: true,
          detail: { selected: [...this.selected] },
        }),
      );
    });
  }
}

export default RCTransferList;
