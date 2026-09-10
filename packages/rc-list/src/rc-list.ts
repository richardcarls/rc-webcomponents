import { LitElement, html } from 'lit';
import { property, query } from 'lit/decorators.js';

import type { RCListItem } from './rc-list-item.js';

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
}

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

  constructor() {
    super();
    this._internals = this.attachInternals();
    this._internals.role = 'list';
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'list');
    }

    this.addEventListener('change', this._handleChange);

    if (typeof MutationObserver === 'function') {
      this._mutationObserver ??= new MutationObserver(() => this._queueSync());

      this._mutationObserver.observe(this, {
        attributes: true,
        subtree: true,
        attributeFilter: ['checked', 'disabled', 'has-leading', 'has-trailing', 'hidden'],
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
    if (changed.has('selection')) {
      this._queueSync();
    }
  }

  private _items(): RCListItem[] {
    return this._$slot
      .assignedElements({ flatten: true })
      .filter((element): element is RCListItem => element.localName === 'rc-list-item');
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
    const items = this._items().filter((item) => !item.hidden);
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

    for (const [index, item] of items.entries()) {
      item.dataset.rcListPosition =
        items.length === 1
          ? 'only'
          : index === 0
            ? 'first'
            : index === items.length - 1
              ? 'last'
              : 'middle';

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
