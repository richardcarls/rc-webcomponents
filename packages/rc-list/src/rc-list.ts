import { LitElement, html } from 'lit';
import { property, query } from 'lit/decorators.js';

import { ReorderController, type ReorderMessages } from '@rcarls/rc-common';
import type { RCListItem } from './rc-list-item.js';
import { ensureListBaseStyles } from './listBaseStyles.js';

import listStyles from './rc-list.styles.js';

export type RCListVariant = 'standard' | 'segmented';
export type RCListSelection = 'none' | 'single' | 'multiple';

interface AuthoredItemState {
  disabled: boolean;
  interactive: boolean;
  selected: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-list': RCList;
  }

  interface HTMLElementEventMap {
    'rc-list-reorder': CustomEvent<RCListReorderDetail>;
  }
}

/** Detail shape for `rc-list-reorder`. Positions are 0-based among visible items. */
export interface RCListReorderDetail {
  /** The moved item. */
  item: RCListItem;
  /** Position the item is moving from. */
  from: number;
  /** Position the item is moving to. */
  to: number;
}

/** Overridable reorder announcements. Positions passed to the functions are 1-based. */
export type RCListReorderMessages = Partial<ReorderMessages>;

const REORDER_HANDLE = '[data-rc-reorder-handle]';

/**
 * A row's position in the whole set. A virtualized list renders only a slice,
 * so rows that carry `aria-posinset` and `aria-setsize` are placed by those,
 * and only the set's real first and last rows get end styling. Other rows are
 * placed by their rendered order.
 */
// Writing an unchanged value would still notify the list's own attribute observer.
function setAttributeIfChanged($element: Element, name: string, value: string): void {
  if ($element.getAttribute(name) !== value) {
    $element.setAttribute(name, value);
  }
}

function rowPosition(item: Element, index: number, count: number): RCListPosition {
  const position = Number(item.getAttribute('aria-posinset'));
  const size = Number(item.getAttribute('aria-setsize'));
  const [at, of] = position > 0 && size > 0 ? [position - 1, size] : [index, count];

  if (of === 1) {
    return 'only';
  }

  return at === 0 ? 'first' : at === of - 1 ? 'last' : 'middle';
}

type RCListPosition = 'only' | 'first' | 'middle' | 'last';

/**
 * Shared-column list layout with optional native-backed selection.
 *
 * In `single` and `multiple` selection modes, each direct `rc-list-item`
 * must contain one direct native radio or checkbox respectively. Native
 * checked and disabled state remain authoritative; the list only mirrors
 * them to the row for styling and makes non-control row surfaces operable.
 *
 * @slot - Direct `rc-list-item` children.
 *
 * @csspart list - Shared list grid.
 *
 * @attr variant - Appearance hint: `standard` or `segmented`.
 * @attr selection - Native selection coordination: `none`, `single`, or `multiple`.
 * @attr ordered - Marks the item order as meaningful. Visible items without authored
 *   `aria-posinset`/`aria-setsize` receive their position so assistive technology reports it.
 *   No counters are rendered; item content carries any visible numbering.
 * @attr reorderable - Lets people reorder items with a handle, by pointer or keyboard.
 *   Implies `ordered`. Each item provides a native `<button data-rc-reorder-handle>`.
 * @attr [data-reordering] - Reflected while an item is lifted.
 *
 * @fires rc-list-reorder - Fires, cancelable, when a reorder moves an item;
 *   `detail: { item, from, to }`. Unless the event is canceled the list moves the item's
 *   node itself. A framework that renders the items cancels it and reorders its own data.
 *   A pointer drag fires once on drop; the keyboard fires on each step, and once more to
 *   move the item back when the reorder is canceled.
 * @attr [has-leading] - Reflected when a visible item uses the leading slot.
 * @attr [has-trailing] - Reflected when a visible item uses the trailing slot.
 *
 * @cssprop [--rc-list-padding-inline=0] - Shared inline content padding.
 * @cssprop [--rc-list-padding-block=0] - List block padding.
 * @cssprop [--rc-list-leading-size=minmax(0, max-content)] - Shared leading column size when any visible item has leading content.
 * @cssprop [--rc-list-leading-gap=1rem] - Gap after the leading column.
 * @cssprop [--rc-list-trailing-size=minmax(0, max-content)] - Shared trailing column size when any visible item has trailing content.
 * @cssprop [--rc-list-trailing-gap=1rem] - Gap before the trailing column.
 * @cssprop [--rc-list-row-gap=0] - Gap between rows.
 *
 * ## Reordering
 *
 * With `reorderable`, a native `<button data-rc-reorder-handle>` inside an item starts a
 * reorder. Label the button yourself, for example "Reorder Photo 2". Handles without an
 * authored `aria-description` get a short keyboard hint.
 *
 * - Pointer: press the handle and drag. The lifted item follows the pointer, the items
 *   it passes shift out of its way, and the nearest scroll container scrolls near its
 *   edges. Escape cancels.
 * - Keyboard: Space or Enter picks the item up, the block-axis arrow keys, Home, and End
 *   move it, Space or Enter drops it, and Escape returns it. Leaving the handle drops it.
 *
 * Each step is announced through a polite live region mounted in the nearest open
 * `dialog` or popover, else the document body; override the text with `reorderMessages`. Focus stays on the moved item's handle, and is restored to
 * the item at the new position when a framework replaces the item's nodes.
 *
 * The lifted item carries `data-dragging`, and the list carries `data-reordering`. The
 * list writes inline `translate` offsets to items while a pointer drag previews a move.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-list rc-list documentation}
 * @see {@link https://m3.material.io/components/lists/overview Material Design lists}
 */
export class RCList extends LitElement {
  static override styles = listStyles;

  private readonly _internals: ElementInternals;
  private _syncQueued = false;
  private readonly _warnedInvalidChildren = new WeakSet<Element>();
  private readonly _warnedInvalidSelection = new WeakMap<RCListItem, RCListSelection>();
  private readonly _authoredItemState = new Map<RCListItem, AuthoredItemState>();

  @query('slot', true)
  private _$slot!: HTMLSlotElement;

  private _mutationObserver: MutationObserver | null = null;

  /** Appearance hint. */
  @property({ reflect: true })
  variant: RCListVariant = 'standard';

  /** Native selection coordination mode. */
  @property({ reflect: true })
  selection: RCListSelection = 'none';

  /** Whether item order is meaningful; positions are exposed without rendered counters. */
  @property({ type: Boolean, reflect: true })
  ordered = false;

  /** Whether people can reorder items with a handle. Implies `ordered`. */
  @property({ type: Boolean, reflect: true })
  reorderable = false;

  /** Overrides for the reorder announcements and the handle hint. */
  @property({ attribute: false })
  reorderMessages: RCListReorderMessages | undefined;

  private readonly _reorder: ReorderController;

  /** Handle descriptions this list wrote, released when no longer reorderable. */
  private readonly _describedHandles = new Map<HTMLElement, string>();

  /**
   * Positions this list wrote, by item. An item whose attributes no longer
   * match was repositioned by its author, possibly after the first sync, and
   * is left alone from then on.
   */
  private readonly _positionedItems = new Map<RCListItem, { posinset: string; setsize: string }>();

  constructor() {
    super();
    this._internals = this.attachInternals();
    this._internals.role = 'list';

    this._reorder = new ReorderController(this, {
      items: () => (this.reorderable ? this._visibleItems() : []),
      handleSelector: REORDER_HANDLE,
      disabled: () => !this.reorderable,
      messages: () => this.reorderMessages,
      onMove: (item, from, to) => this._moveItem(item as RCListItem, from, to),
      onActiveChange: (item) => {
        this.toggleAttribute('data-reordering', item !== null);
        this._items().forEach(($item) => $item.toggleAttribute('data-dragging', $item === item));
      },
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'list');
    }

    this.addEventListener('change', this._handleChange);

    const root = this.getRootNode();

    ensureListBaseStyles(root instanceof ShadowRoot ? root : this.ownerDocument);

    if (typeof MutationObserver === 'function') {
      this._mutationObserver ??= new MutationObserver(() => this._queueSync());

      this._mutationObserver.observe(this, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: [
          'aria-description',
          'aria-posinset',
          'aria-setsize',
          'checked',
          'disabled',
          'has-leading',
          'has-trailing',
          'hidden',
        ],
      });
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('change', this._handleChange);
    this._mutationObserver?.disconnect();
    this._restoreAllItems();
  }

  protected override firstUpdated(): void {
    this._syncItems();
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (
      changed.has('selection') ||
      changed.has('ordered') ||
      changed.has('reorderable') ||
      changed.has('reorderMessages')
    ) {
      this._queueSync();
    }

    if (changed.has('reorderable') && !this.reorderable && this._reorder.active) {
      this._reorder.cancel();
    }
  }

  private _items(): RCListItem[] {
    return this._$slot
      .assignedElements({ flatten: true })
      .filter((element): element is RCListItem => element.localName === 'rc-list-item');
  }

  private _visibleItems(): RCListItem[] {
    return this._items().filter((item) => !item.hidden);
  }

  private _expectedInputType(): 'radio' | 'checkbox' | undefined {
    if (this.selection === 'single') {
      return 'radio';
    }

    if (this.selection === 'multiple') {
      return 'checkbox';
    }

    return undefined;
  }

  private _inputFor(item: RCListItem): HTMLInputElement | null {
    const expectedType = this._expectedInputType();

    if (!expectedType) {
      return null;
    }

    return item.querySelector(`:scope > input[type="${expectedType}"]`);
  }

  private _queueSync(): void {
    if (this._syncQueued) {
      return;
    }

    this._syncQueued = true;

    queueMicrotask(() => {
      this._syncQueued = false;

      if (this.isConnected && this.hasUpdated) {
        this._syncItems();
      }
    });
  }

  private _syncItems(): void {
    const assigned = this._$slot.assignedElements({ flatten: true });
    const items = this._visibleItems();
    const expectedType = this._expectedInputType();

    for (const [$item, state] of this._authoredItemState) {
      if (!items.includes($item) || !expectedType) {
        this._restoreItem($item, state);
        this._authoredItemState.delete($item);
      }
    }

    this.toggleAttribute(
      'has-leading',
      items.some((item) => item.hasAttribute('has-leading')),
    );

    this.toggleAttribute(
      'has-trailing',
      items.some((item) => item.hasAttribute('has-trailing')),
    );

    this._syncOrderedPositions(items);
    this._syncHandleDescriptions(items);

    for (const [index, item] of items.entries()) {
      item.dataset.rcListPosition = rowPosition(item, index, items.length);

      if (expectedType) {
        const input = this._inputFor(item);

        if (!this._authoredItemState.has(item)) {
          this._authoredItemState.set(item, {
            disabled: item.disabled,
            interactive: item.interactive,
            selected: item.selected,
          });
        }

        item.selected = input?.checked ?? false;
        item.disabled = input?.disabled ?? false;
        item.interactive = Boolean(input);
      }
    }

    if (import.meta.env.DEV) {
      const invalidChildren = assigned.filter(
        (element) =>
          element.localName !== 'rc-list-item' && !this._warnedInvalidChildren.has(element),
      );

      if (invalidChildren.length > 0) {
        console.warn('[rc-list] Direct children should be rc-list-item elements.', invalidChildren);
        invalidChildren.forEach((element) => this._warnedInvalidChildren.add(element));
      }

      if (expectedType) {
        const invalidItems = items.filter(
          (item) =>
            !this._inputFor(item) && this._warnedInvalidSelection.get(item) !== this.selection,
        );

        if (invalidItems.length > 0) {
          console.warn(
            `[rc-list] selection="${this.selection}" expects each rc-list-item to contain a direct native ${expectedType} input.`,
            invalidItems,
          );

          invalidItems.forEach((item) => this._warnedInvalidSelection.set(item, this.selection));
        }
      }
    }
  }

  /**
   * Expose each visible item's position in an ordered list. Items that carry
   * authored positions (a virtualized slice) keep them; positions this list
   * wrote are released when the item leaves or the list stops being ordered.
   */
  private _syncOrderedPositions(items: RCListItem[]): void {
    for (const [$item, written] of this._positionedItems) {
      if (
        $item.getAttribute('aria-posinset') !== written.posinset ||
        $item.getAttribute('aria-setsize') !== written.setsize
      ) {
        // Authored after this list positioned it: hand the attributes over.
        this._positionedItems.delete($item);
      } else if (!this._isOrdered() || !items.includes($item)) {
        this._releasePosition($item);
      }
    }

    if (!this._isOrdered()) {
      return;
    }

    for (const [index, $item] of items.entries()) {
      if (!this._positionedItems.has($item) && $item.hasAttribute('aria-posinset')) {
        continue;
      }

      const written = { posinset: String(index + 1), setsize: String(items.length) };

      this._positionedItems.set($item, written);
      setAttributeIfChanged($item, 'aria-posinset', written.posinset);
      setAttributeIfChanged($item, 'aria-setsize', written.setsize);
    }
  }

  private _isOrdered(): boolean {
    return this.ordered || this.reorderable;
  }

  /**
   * Give each handle a keyboard hint unless its author described it. A
   * description the author rewrites afterward is theirs from then on.
   */
  private _syncHandleDescriptions(items: RCListItem[]): void {
    const handles = this.reorderable
      ? items.flatMap(($item) => [...$item.querySelectorAll<HTMLElement>(REORDER_HANDLE)])
      : [];
    const hint = this._reorder.message('instructions');

    for (const [$handle, written] of this._describedHandles) {
      if ($handle.getAttribute('aria-description') !== written) {
        this._describedHandles.delete($handle);
      } else if (!handles.includes($handle) || written !== hint) {
        $handle.removeAttribute('aria-description');
        this._describedHandles.delete($handle);
      }
    }

    for (const $handle of handles) {
      if (!this._describedHandles.has($handle) && $handle.hasAttribute('aria-description')) {
        continue;
      }

      this._describedHandles.set($handle, hint);
      setAttributeIfChanged($handle, 'aria-description', hint);
    }
  }

  /** Dispatch a reorder and, unless a consumer took it over, move the node. */
  private _moveItem(item: RCListItem, from: number, to: number): void {
    const event = new CustomEvent<RCListReorderDetail>('rc-list-reorder', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { item, from, to },
    });

    if (!this.dispatchEvent(event)) {
      return;
    }

    const $target = this._visibleItems()[to];

    if (!$target || $target === item) {
      return;
    }

    if (to > from) {
      $target.after(item);
    } else {
      $target.before(item);
    }
  }

  private _releasePosition($item: RCListItem): void {
    $item.removeAttribute('aria-posinset');
    $item.removeAttribute('aria-setsize');
    this._positionedItems.delete($item);
  }

  private _restoreItem($item: RCListItem, state: AuthoredItemState): void {
    $item.selected = state.selected;
    $item.disabled = state.disabled;
    $item.interactive = state.interactive;
    delete $item.dataset.rcListPosition;
  }

  private _restoreAllItems(): void {
    for (const [$item, state] of this._authoredItemState) {
      this._restoreItem($item, state);
    }

    for (const $item of this._positionedItems.keys()) {
      this._releasePosition($item);
    }

    for (const $handle of this._describedHandles.keys()) {
      $handle.removeAttribute('aria-description');
    }

    this._describedHandles.clear();

    this._authoredItemState.clear();
  }

  private readonly _handleChange = (event: Event): void => {
    if (
      this.selection !== 'none' &&
      event.target instanceof HTMLInputElement &&
      event.target.parentElement?.localName === 'rc-list-item' &&
      event.target.type === this._expectedInputType()
    ) {
      this._queueSync();
    }
  };

  private _handleSlotChange(): void {
    this._queueSync();
  }

  protected override render() {
    return html`
      <div part="list">
        <slot @slotchange=${this._handleSlotChange}></slot>
      </div>
    `;
  }
}
