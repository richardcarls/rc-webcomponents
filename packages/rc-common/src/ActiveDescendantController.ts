import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface ActiveDescendantOptions {
  /**
   * The element that receives `aria-activedescendant`. Must be focusable
   * (e.g. has `tabindex="0"`) and remain focused while the virtual cursor
   * navigates the item list — do NOT move DOM focus to items.
   */
  host: () => Element | null;

  /**
   * Live getter for the ordered list of navigable items. Called on every
   * navigation so dynamic lists (filtered, lazily rendered) are handled
   * automatically. The returned array should already exclude items that are
   * structurally unavailable; use `isSkipped` for items that are in the DOM
   * but temporarily non-navigable (e.g. `aria-disabled`).
   */
  items: () => Element[];

  /**
   * Return `true` to skip an item during navigation (e.g. `aria-disabled`,
   * temporarily hidden). Skipped items are never set as active.
   */
  isSkipped?: (item: Element) => boolean;

  /** Wrap at list boundaries. Default `true`. */
  wrap?: boolean;
}

let _uid = 0;

/**
 * Manages the WAI-ARIA `aria-activedescendant` virtual cursor pattern.
 *
 * Keeps DOM focus on the host element (e.g. a combobox trigger) while
 * signalling which popup item is logically "active" to assistive technology
 * via `aria-activedescendant`. Contrast with `RovingTabIndexMixin`, which
 * moves real DOM focus between items.
 *
 * On each navigation call the controller:
 * 1. Assigns a stable `id` to the target item if it lacks one.
 * 2. Sets `aria-activedescendant="[id]"` on the host element.
 * 3. Scrolls the item into view (`block: 'nearest'`).
 *
 * On `clear()` it removes `aria-activedescendant` from the host.
 *
 * @example
 * ```ts
 * class MyCombobox extends LitElement {
 *   private _adc = new ActiveDescendantController(this, {
 *     host: () => this.renderRoot.querySelector('#trigger'),
 *     items: () => this._listbox?.navigableItems ?? [],
 *   });
 *
 *   private _onArrowDown() { this._adc.navigate(1); }
 *   private _onEnter() { this._adc.activeItem?.click(); }
 * }
 * ```
 */
export class ActiveDescendantController implements ReactiveController {
  private readonly _opts: ActiveDescendantOptions;
  private readonly _instanceId: string;
  private _activeItem: Element | null = null;
  private _activeIndex = -1;
  private _itemCounter = 0;

  constructor(host: ReactiveControllerHost, options: ActiveDescendantOptions) {
    this._opts = options;
    this._instanceId = `rc-adc-${++_uid}`;
    host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {
    this.clear();
  }

  /** The currently active item, or `null` when cleared. */
  get activeItem(): Element | null {
    return this._activeItem;
  }

  /** Index into the current `items()` array. `-1` when cleared. */
  get activeIndex(): number {
    return this._activeIndex;
  }

  /**
   * Move the virtual cursor by `delta` steps (+1 forward, -1 backward),
   * skipping any items for which `isSkipped` returns true.
   */
  navigate(delta: 1 | -1): void {
    const items = this._opts.items();
    if (items.length === 0) return;

    const wrap = this._opts.wrap ?? true;
    let index = this._activeIndex < 0
      ? (delta > 0 ? -1 : items.length)
      : this._activeIndex;

    const max = items.length;
    let steps = 0;
    do {
      index += delta;
      if (wrap) {
        index = ((index % max) + max) % max;
      } else {
        index = Math.max(0, Math.min(max - 1, index));
      }
      steps++;
      if (!this._isSkipped(items[index])) break;
    } while (steps < max);

    this._setActive(items[index] ?? null, index);
  }

  /** Move the virtual cursor to the first non-skipped item. */
  navigateToFirst(): void {
    const items = this._opts.items();
    const index = items.findIndex((el) => !this._isSkipped(el));
    if (index >= 0) this._setActive(items[index], index);
  }

  /** Move the virtual cursor to the last non-skipped item. */
  navigateToLast(): void {
    const items = this._opts.items();
    let index = -1;
    for (let i = items.length - 1; i >= 0; i--) {
      if (!this._isSkipped(items[i])) { index = i; break; }
    }
    if (index >= 0) this._setActive(items[index], index);
  }

  /** Move the virtual cursor to the item at `index`. */
  navigateTo(index: number): void {
    const items = this._opts.items();
    const item = items[index];
    if (item && !this._isSkipped(item)) this._setActive(item, index);
  }

  /** Move the virtual cursor to a specific item reference. */
  navigateToItem(item: Element): void {
    const items = this._opts.items();
    const index = items.indexOf(item);
    if (index >= 0 && !this._isSkipped(item)) this._setActive(item, index);
  }

  /**
   * Clear the virtual cursor: removes `aria-activedescendant` from the host,
   * removes `data-active` from the previously active item, and resets internal state.
   */
  clear(): void {
    this._activeItem?.removeAttribute('data-active');
    this._activeItem = null;
    this._activeIndex = -1;

    const host = this._opts.host();
    if (host) host.removeAttribute('aria-activedescendant');
  }

  private _isSkipped(item: Element): boolean {
    if (!item) return true;
    if ((item as HTMLElement).hidden) return true;
    if (item.getAttribute('aria-disabled') === 'true') return true;
    return this._opts.isSkipped?.(item) ?? false;
  }

  private _setActive(item: Element | null, index: number): void {
    this._activeItem?.removeAttribute('data-active'); // clear before reassigning
    this._activeItem = item;
    this._activeIndex = index;

    const host = this._opts.host();
    if (!host) return;

    if (!item) {
      host.removeAttribute('aria-activedescendant');
      return;
    }

    if (!item.id) {
      item.id = `${this._instanceId}-${++this._itemCounter}`;
    }

    host.setAttribute('aria-activedescendant', item.id);
    item.setAttribute('data-active', '');
    item.scrollIntoView({ block: 'nearest' });
  }
}
