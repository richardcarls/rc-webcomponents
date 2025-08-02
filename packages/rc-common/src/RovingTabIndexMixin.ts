import type { LitElement } from 'lit';
import { state } from 'lit/decorators.js';

import { isFocusable, type FocusableElement } from './isFocusable';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T = object> = new (...args: any[]) => T;

/**
 * Ambient class declaration exposing the public + protected shape added by
 * RovingTabIndexMixin. The `declare class` form (rather than an interface) is
 * required so TypeScript can express protected members — subclasses need access
 * to `_lastFocused` and the hook methods inside their own `_initItems` overrides.
 */
export declare class RovingTabIndexMixinBase {
  protected _lastFocused: FocusableElement | undefined;

  get items(): FocusableElement[];
  get firstItem(): FocusableElement | undefined;
  get lastItem(): FocusableElement | undefined;
  get nextItem(): FocusableElement | undefined;
  get previousItem(): FocusableElement | undefined;

  focusItem(item?: FocusableElement | null): void;
  focusItemAt(index: number): void;
  focusFirst(): void;
  focusLast(): void;

  protected _collectItems(slot: HTMLSlotElement): FocusableElement[];
  protected _handleItemFocus(e: FocusEvent): void;
  protected _onSlotChange(e: Event): void;
  protected _initItems(): void;
}

/**
 * Mixin that adds WAI-ARIA roving-tabindex focus management to a LitElement.
 *
 * Provides item registration from a named slot, focus navigation helpers,
 * tabindex synchronisation on focusin, and hook methods for subclass-specific
 * item configuration (setting roles, collecting items from group containers, etc.).
 *
 * Wire the two event handlers in the subclass `render()`:
 *
 * ```ts
 * html`
 *   <div id="slot-wrap" @focusin=${this._handleItemFocus}>
 *     <slot @slotchange=${this._onSlotChange}></slot>
 *   </div>
 * `
 * ```
 *
 * @example
 * class MyList extends RovingTabIndexMixin(LitElement) {
 *   protected override _initItems() {
 *     super._initItems();                                   // sets tabindex
 *     this.items.forEach(el => el.setAttribute('role', 'option'));
 *   }
 * }
 */
export function RovingTabIndexMixin<T extends Constructor<LitElement>>(
  Base: T,
): T & Constructor<RovingTabIndexMixinBase> {
  class RovingTabIndexElement extends Base {
    @state()
    protected _lastFocused: FocusableElement | undefined;

    private _items: WeakRef<FocusableElement>[] = [];


    get items(): FocusableElement[] {
      return this._items.map((ref) => ref.deref()).filter((el) => el != null);
    }

    get firstItem(): FocusableElement | undefined {
      return this.items.at(0);
    }

    get lastItem(): FocusableElement | undefined {
      return this.items.at(-1);
    }

    get nextItem(): FocusableElement | undefined {
      const index = this._lastFocused ? this.items.indexOf(this._lastFocused) : 0;

      return this.items.at((index + 1) % this.items.length);
    }

    get previousItem(): FocusableElement | undefined {
      const index = this._lastFocused ? this.items.indexOf(this._lastFocused) : 0;

      return this.items.at((index - 1) % this.items.length);
    }


    focusItem(item?: FocusableElement | null) {
      if (item != null) {
        item.focus();
      }
    }

    focusItemAt(index: number) {
      this.focusItem(this.items.at(index));
    }

    focusFirst() {
      this.focusItem(this.firstItem);
    }

    focusLast() {
      this.focusItem(this.lastItem);
    }


    /**
     * Returns the focusable items to register from a slot.
     *
     * Override in subclasses to customise item collection — for example, to
     * traverse into `role="group"` containers or to skip `role="separator"`
     * elements. The default collects direct assigned elements that pass
     * `isFocusable`.
     */
    protected _collectItems(slot: HTMLSlotElement): FocusableElement[] {
      return slot.assignedElements().filter(isFocusable) as FocusableElement[];
    }

    protected _handleItemFocus(e: FocusEvent) {
      // Walk the composed path to find the registered item. A direct match is
      // found immediately for plain elements; for custom elements with
      // delegatesFocus the first composedPath entry is the deep shadow target,
      // not the host, so we search upward until we hit a registered item.
      const $self = e.composedPath().find(
        (el) => this.items.includes(el as FocusableElement),
      ) as FocusableElement | undefined;

      if ($self == null) return; // focus landed outside registered items

      this._lastFocused = $self;

      this.items.forEach((el) => el.setAttribute('tabindex', '-1'));
      $self.setAttribute('tabindex', '0');
    }

    protected _onSlotChange(e: Event) {
      const prevItems = this._items;

      this._items = this._collectItems(e.currentTarget as HTMLSlotElement)
        .map((el) => new WeakRef(el));

      // Defer DOM mutations so this handler is instantaneous when slotchange
      // fires synchronously inside a framework reactive update pass (e.g.
      // SolidJS runUpdates on second+ mount, when the shadow DOM already exists).
      queueMicrotask(() => {
        if (!this.isConnected) return;
        prevItems.forEach((ref) => ref.deref()?.removeAttribute('tabindex'));
        this._initItems();
      });
    }

    /**
     * Called after slot contents change and the item list is rebuilt.
     * Override to configure items (set ARIA roles, move focus, etc.).
     *
     * Default implementation sets `tabindex="0"` on the first item and
     * `tabindex="-1"` on all others so the component is a single tab stop.
     */
    protected _initItems() {
      this.items.forEach((el, i) => {
        el.setAttribute('tabindex', i === 0 ? '0' : '-1');
      });
    }
  }

  return RovingTabIndexElement as unknown as T & Constructor<RovingTabIndexMixinBase>;
}
