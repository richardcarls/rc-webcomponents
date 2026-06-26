import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface ItemsCollectionOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type ItemsCollectionFilterStrategy =
  | 'prefix'
  | 'contains'
  | ((label: string, query: string) => boolean);

export interface ItemsCollectionControllerOptions {
  /** Stable ID prefix for rendered option elements, e.g. `'rc-lb-1'`. */
  idPrefix: string;
  /**
   * Called once on first connect when pre-rendered `<li>` children are found
   * and `setOptions()` has not yet been called. Use to sync selection state
   * after bootstrap.
   */
  onInitFromDom?: (options: ItemsCollectionOption[]) => void;
  /** Called when the user activates an option by pointer. */
  onActivate: (value: string) => void;
}

/**
 * Manages a `<ul role="presentation">` + `<li role="option">` DOM subtree
 * inside the host element's light DOM.
 *
 * Options and selection state are driven imperatively; the controller syncs
 * changes directly to the DOM without triggering Lit re-renders.
 *
 * On first connect the controller can bootstrap from pre-rendered `<li>`
 * elements, enabling progressive enhancement. Once `setOptions()` is called
 * at any point the DOM is fully controlled and bootstrap will not run again.
 */
export class ItemsCollectionController implements ReactiveController {
  private readonly _host: ReactiveControllerHost & Element;
  private readonly _idPrefix: string;
  private readonly _onInitFromDom?: (options: ItemsCollectionOption[]) => void;
  private readonly _onActivate: (value: string) => void;

  private _ul: HTMLUListElement | null = null;
  private _options: ItemsCollectionOption[] = [];
  private _liElements: HTMLLIElement[] = [];
  private _createLi: HTMLLIElement | null = null;
  private _selectedValues = new Set<string>();
  private _filterText = '';
  private _filterStrategy: ItemsCollectionFilterStrategy = 'contains';
  private _checkmark = false;
  private _optionsInitialized = false;

  constructor(
    host: ReactiveControllerHost & Element,
    options: ItemsCollectionControllerOptions,
  ) {
    this._host = host;
    this._idPrefix = options.idPrefix;
    this._onInitFromDom = options.onInitFromDom;
    this._onActivate = options.onActivate;
    host.addController(this);
  }

  hostConnected(): void {
    this._host.addEventListener('pointerdown', this._onPointerDown);
    if (!this._optionsInitialized) {
      this._bootstrapFromDom();
    }
  }

  hostDisconnected(): void {
    this._host.removeEventListener('pointerdown', this._onPointerDown);
  }

  // -- Accessors --

  get allOptions(): readonly ItemsCollectionOption[] {
    return this._options;
  }

  get selectedValues(): string[] {
    return [...this._selectedValues];
  }

  get filterText(): string {
    return this._filterText;
  }

  isSelected(value: string): boolean {
    return this._selectedValues.has(value);
  }

  /**
   * Navigable option elements: visible (not `[hidden]`) and not `aria-disabled`.
   * Includes the create option when set. Consumed by `ActiveDescendantController`.
   */
  get navigableItems(): Element[] {
    const results: Element[] = [];

    for (let i = 0; i < this._liElements.length; i++) {
      const li = this._liElements[i];
      const opt = this._options[i];
      if (opt?.disabled || li.hidden) continue;
      results.push(li);
    }

    if (this._createLi !== null) {
      results.push(this._createLi);
    }

    return results;
  }

  set checkmark(value: boolean) {
    if (this._checkmark === value) return;
    this._checkmark = value;
    this._syncCheckmarks();
  }

  // -- Mutation methods --

  /** Replace the full option list. Sets the controller as authoritative, preventing DOM bootstrap. */
  setOptions(options: ItemsCollectionOption[]): void {
    this._optionsInitialized = true;
    this._options = [...options];
    this._ensureContainer();
    this._syncOptionsToDom();
  }

  /** Append a single option without replacing the list. */
  appendOption(opt: ItemsCollectionOption): void {
    this._optionsInitialized = true;
    this._options = [...this._options, opt];
    this._ensureContainer();
    const li = this._createLiElement(opt, this._options.length - 1);
    this._liElements.push(li);
    if (this._createLi) {
      this._ul!.insertBefore(li, this._createLi);
    } else {
      this._ul!.appendChild(li);
    }
    this._applyFilterToLi(li, opt);
  }

  /** Update `aria-selected` on all option elements to match `values`. */
  setSelectedValues(values: string[]): void {
    this._selectedValues = new Set(values);
    this._syncSelectedToDom();
  }

  /**
   * Apply a filter — sets `[hidden]` on non-matching `<li>` elements.
   * The strategy is stored and re-used when options change.
   */
  filterOptions(text: string, strategy: ItemsCollectionFilterStrategy = 'contains'): void {
    this._filterText = text;
    this._filterStrategy = strategy;
    this._syncFilterToDom();
  }

  /** Remove `[hidden]` from all option elements. */
  clearFilter(): void {
    this._filterText = '';
    this._syncFilterToDom();
  }

  /**
   * Show or hide the synthetic "Create" option at the end of the list.
   * Pass `null` to remove it.
   */
  setCreateOption(label: string | null): void {
    if (label === null) {
      this._createLi?.remove();
      this._createLi = null;
      return;
    }

    if (!this._createLi) {
      this._ensureContainer();
      const li = document.createElement('li');
      li.setAttribute('id', `${this._idPrefix}-create`);
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', 'false');
      li.setAttribute('data-value', '__create__');
      li.setAttribute('part', 'option create-option');
      if (this._checkmark) this._ensureCheckmark(li);
      this._ul!.appendChild(li);
      this._createLi = li;
    }

    this._setLabelText(this._createLi, `Create "${label}"`);
  }

  // -- Private: DOM management --

  private _ensureContainer(): HTMLUListElement {
    if (this._ul) return this._ul;

    let ul = this._host.querySelector<HTMLUListElement>(':scope > ul');
    if (!ul) {
      ul = document.createElement('ul');
      this._host.appendChild(ul);
    }

    ul.setAttribute('role', 'presentation');
    ul.setAttribute('aria-hidden', 'true');
    this._ul = ul;
    return ul;
  }

  private _bootstrapFromDom(): void {
    const ul = this._host.querySelector<HTMLUListElement>(':scope > ul');
    if (!ul) return;

    this._ul = ul;
    ul.setAttribute('role', 'presentation');
    ul.setAttribute('aria-hidden', 'true');

    const liElements = Array.from(ul.querySelectorAll<HTMLLIElement>(':scope > li'));
    if (liElements.length === 0) return;

    const options: ItemsCollectionOption[] = [];

    for (let i = 0; i < liElements.length; i++) {
      const li = liElements[i];
      const value =
        li.getAttribute('data-value') ?? li.getAttribute('value') ?? li.textContent?.trim() ?? '';
      const label = li.textContent?.trim() ?? '';
      const disabled =
        li.hasAttribute('disabled') || li.getAttribute('aria-disabled') === 'true';

      options.push({ value, label, disabled });

      li.setAttribute('role', 'option');
      li.setAttribute('id', `${this._idPrefix}-${i}`);
      li.setAttribute('part', 'option');
      li.setAttribute('data-value', value);
      li.setAttribute('aria-selected', this._selectedValues.has(value) ? 'true' : 'false');
      li.setAttribute('aria-disabled', disabled ? 'true' : 'false');

      if (this._checkmark) this._ensureCheckmark(li);
    }

    this._options = options;
    this._liElements = liElements;
    this._onInitFromDom?.(options);
  }

  private _syncOptionsToDom(): void {
    const ul = this._ensureContainer();

    for (const li of this._liElements) li.remove();
    this._liElements = [];

    for (let i = 0; i < this._options.length; i++) {
      const li = this._createLiElement(this._options[i], i);
      this._liElements.push(li);
      ul.appendChild(li);
    }

    if (this._createLi) ul.appendChild(this._createLi);

    this._syncFilterToDom();
  }

  private _createLiElement(opt: ItemsCollectionOption, index: number): HTMLLIElement {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.setAttribute('id', `${this._idPrefix}-${index}`);
    li.setAttribute('part', 'option');
    li.setAttribute('data-value', opt.value);
    li.setAttribute('aria-selected', this._selectedValues.has(opt.value) ? 'true' : 'false');
    li.setAttribute('aria-disabled', opt.disabled ? 'true' : 'false');

    if (this._checkmark) this._ensureCheckmark(li);
    this._setLabelText(li, opt.label);

    return li;
  }

  private _setLabelText(li: HTMLLIElement, text: string): void {
    for (const child of li.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        child.textContent = text;
        return;
      }
    }
    li.appendChild(document.createTextNode(text));
  }

  private _ensureCheckmark(li: HTMLLIElement): void {
    if (li.querySelector('[part="option-checkmark"]')) return;
    const span = document.createElement('span');
    span.setAttribute('part', 'option-checkmark');
    span.setAttribute('aria-hidden', 'true');
    span.textContent = '✓';
    li.insertBefore(span, li.firstChild);
  }

  private _removeCheckmark(li: HTMLLIElement): void {
    li.querySelector('[part="option-checkmark"]')?.remove();
  }

  private _syncCheckmarks(): void {
    const allLis = this._createLi
      ? [...this._liElements, this._createLi]
      : [...this._liElements];

    for (const li of allLis) {
      if (this._checkmark) {
        this._ensureCheckmark(li);
      } else {
        this._removeCheckmark(li);
      }
    }
  }

  private _syncSelectedToDom(): void {
    for (let i = 0; i < this._liElements.length; i++) {
      const opt = this._options[i];
      if (!opt) continue;
      this._liElements[i].setAttribute(
        'aria-selected',
        this._selectedValues.has(opt.value) ? 'true' : 'false',
      );
    }
  }

  private _syncFilterToDom(): void {
    for (let i = 0; i < this._liElements.length; i++) {
      const opt = this._options[i];
      if (!opt) continue;
      this._applyFilterToLi(this._liElements[i], opt);
    }
  }

  private _applyFilterToLi(li: HTMLLIElement, opt: ItemsCollectionOption): void {
    li.hidden = !this._isVisible(opt);
  }

  private _isVisible(opt: ItemsCollectionOption): boolean {
    if (!this._filterText) return true;

    const label = opt.label.toLowerCase();
    const query = this._filterText.toLowerCase();

    if (typeof this._filterStrategy === 'function') {
      return this._filterStrategy(label, query);
    }

    if (this._filterStrategy === 'contains') {
      return label.includes(query);
    }

    return label.startsWith(query);
  }

  private _onPointerDown = (e: Event): void => {
    const target = e.target as Element | null;
    if (!target) return;

    const li = target.closest<HTMLElement>('li[data-value]');
    if (!li || li.getAttribute('role') !== 'option') return;
    if (li.parentElement !== this._ul) return;

    e.preventDefault();
    this._onActivate(li.getAttribute('data-value')!);
  };
}
