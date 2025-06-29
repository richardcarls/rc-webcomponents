import { LitElement, html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import {
  ActiveDescendantController,
  AnchorController,
} from '@rcarls/rc-common';
import type { RCListbox, ListboxOption } from '@rcarls/rc-listbox';
import '@rcarls/rc-listbox';
import { selectStyles } from './rc-select.styles.js';

export interface RCSelectChangeEvent {
  value: string | string[];
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
 * @fires rc-select-change - When the selection changes. `detail: { value: string | string[] }`
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

  protected _selectRef: WeakRef<HTMLSelectElement> | null = null;
  private _mutationObserver: MutationObserver | null = null;
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
   * Programmatically replace the current selection without triggering
   * MutationObserver — use from reactive framework wrappers (SolidJS createEffect,
   * React useEffect) instead of setting `option.selected` directly.
   */
  setSelected(values: string[]): void {
    this._selectedValues = new Set(values);
    this._$listbox.setSelectedValues(values);
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

    this._mutationObserver?.disconnect();
    this._mutationObserver = null;

    if (!sel) {
      this._selectRef = null;
      return;
    }

    this._selectRef = new WeakRef(sel);
    this.multiple = sel.multiple;
    this.disabled = sel.disabled;
    this._syncOptionsFromSelect(sel);

    this._mutationObserver = new MutationObserver(() => {
      const s = this._selectRef?.deref();
      if (s) this._syncOptionsFromSelect(s);
    });
    this._mutationObserver.observe(sel, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    this._syncAccessibleName(sel);
  }

  protected _syncOptionsFromSelect(sel: HTMLSelectElement) {
    const opts: ListboxOption[] = [];
    for (const opt of sel.options) {
      if (!opt.value) continue; // skip placeholder <option value="">
      opts.push({ value: opt.value, label: opt.text, disabled: opt.disabled });
    }
    this._$listbox.options = opts;

    // Sync current selection from native select
    const selected: string[] = [];
    for (const opt of sel.options) {
      if (opt.selected && opt.value) selected.push(opt.value);
    }
    this._selectedValues = new Set(selected);
    this._$listbox.setSelectedValues(selected);
    this._syncAccessibleName(sel);
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
    const { value, selected } = e.detail as {
      value: string;
      selected: boolean;
    };
    e.stopPropagation();

    if (this.multiple) {
      const next = new Set(this._selectedValues);
      if (selected) next.add(value);
      else next.delete(value);
      this._selectedValues = next;
    } else {
      this._selectedValues = selected ? new Set([value]) : new Set();
      if (selected) this.closePopup();
    }

    this._syncNativeSelect();
    this.dispatchEvent(
      new CustomEvent<RCSelectChangeEvent>('rc-select-change', {
        bubbles: true,
        composed: true,
        detail: {
          value: this.multiple
            ? [...this._selectedValues]
            : (this._selectedValues.values().next().value ?? ''),
        },
      }),
    );
  }

  protected _removeValue(value: string) {
    const next = new Set(this._selectedValues);
    next.delete(value);
    this._selectedValues = next;
    this._$listbox.setSelectedValues([...next]);
    this._syncNativeSelect();
    this.dispatchEvent(
      new CustomEvent<RCSelectChangeEvent>('rc-select-change', {
        bubbles: true,
        composed: true,
        detail: { value: [...this._selectedValues] },
      }),
    );
  }

  protected _syncNativeSelect() {
    const sel = this._selectRef?.deref();
    if (!sel) return;
    for (const opt of sel.options) {
      opt.selected = this._selectedValues.has(opt.value);
    }
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
        this._selectedValues = new Set([match.value]);
        this._$listbox.setSelectedValues([match.value]);
        this._syncNativeSelect();
        this.dispatchEvent(
          new CustomEvent<RCSelectChangeEvent>('rc-select-change', {
            bubbles: true,
            composed: true,
            detail: { value: match.value },
          }),
        );
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

customElements.get('rc-select') || customElements.define('rc-select', RCSelect);

export default RCSelect;
