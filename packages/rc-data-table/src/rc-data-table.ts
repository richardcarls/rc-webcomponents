import { ReactiveElement } from 'lit';
import { property } from 'lit/decorators.js';

import { LiveAnnouncer, MessagesController } from '@rcarls/rc-common';
import { ensureDataTableBaseStyles } from './dataTableBaseStyles.js';

const TABLE_SELECTOR = ':scope > table';
const SORTABLE_HEADER_SELECTOR = 'th[data-rc-sort-key]';
const SORT_CONTROL_SELECTOR = ':scope > :is(button, a)';

/** The direction a column is sorted in. */
export type RCDataTableSortDirection = 'ascending' | 'descending';

/** Built-in text of `rc-data-table`. */
export interface RCDataTableMessages {
  /** Announcement after a sort, when `announce` is set. */
  sorted: (column: string, direction: RCDataTableSortDirection) => string;
}

export const DEFAULT_DATA_TABLE_MESSAGES: Readonly<RCDataTableMessages> = Object.freeze({
  sorted: (column: string, direction: RCDataTableSortDirection) =>
    `Sorted by ${column}, ${direction}`,
});

declare module '@rcarls/rc-common' {
  interface RcMessageCatalog {
    'rc-data-table': RCDataTableMessages;
  }
}

/** Detail of `rc-data-table-sort`. */
export interface RCDataTableSortEvent {
  /** The `data-rc-sort-key` of the column the user asked to sort by. */
  key: string;
  /** The requested direction. */
  direction: RCDataTableSortDirection;
  /** The sort column before the request, if any. */
  previousKey: string | undefined;
  /** The sort direction before the request, if any. */
  previousDirection: RCDataTableSortDirection | undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-data-table': RCDataTable;
  }

  interface HTMLElementEventMap {
    'rc-data-table-sort': CustomEvent<RCDataTableSortEvent>;
  }
}

const isDirection = (value: unknown): value is RCDataTableSortDirection =>
  value === 'ascending' || value === 'descending';

/**
 * Sortable-header enhancer for a native `<table>`, following the WAI-ARIA
 * sortable table example.
 *
 * The consumer authors the table, and in each sortable column header a native
 * `<button>`, or a link to a server-sorted URL, inside a
 * `<th data-rc-sort-key="...">`. The element never sorts rows: it reflects the
 * sort state as `aria-sort` on the active header, draws a sort indicator for
 * every sortable column, and reports each request as `rc-data-table-sort` for
 * the consumer to re-render the rows. Headers that are links still navigate
 * unless a listener cancels the event.
 *
 * The host is the table's inline scroll container. While the table overflows,
 * the host becomes a focusable group named by the table's `<caption>`, so
 * keyboard users can scroll it.
 *
 * Built-in text follows the element's own `lang`, else `<html lang>`: per
 * element through `messages`, or for every instance through
 * `registerMessages()` from `@rcarls/rc-common` under `rc-data-table`.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-data-table rc-data-table docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/ WAI-ARIA sortable table example}
 *
 * @fires rc-data-table-sort - Fired when the user activates a sortable column header.
 *   Cancelable; canceling it also cancels the click, so a header link does not navigate.
 *
 * @attr sort-key - Controlled sort column, matching a header's `data-rc-sort-key`. Host writes
 *   are silent.
 * @attr sort-direction - Controlled sort direction: `ascending` or `descending`.
 * @attr default-sort-key - Initial sort column for uncontrolled use.
 * @attr default-sort-direction - Initial sort direction for uncontrolled use.
 * @attr announce - Announces each user sort through a polite live region.
 *
 * @cssprop [--rc-data-table-cell-padding-block] - Cell block padding. Defers to the user agent
 *   when unset.
 * @cssprop [--rc-data-table-cell-padding-inline] - Cell inline padding. Defers to the user
 *   agent when unset.
 * @cssprop [--rc-data-table-sort-indicator-gap=0.25em] - Space between a header label and its
 *   sort indicator.
 * @cssprop [--rc-data-table-sort-none='\25C7'] - Indicator for a sortable column that is not
 *   sorted.
 * @cssprop [--rc-data-table-sort-ascending='\25B2'] - Indicator for an ascending column.
 * @cssprop [--rc-data-table-sort-descending='\25BC'] - Indicator for a descending column.
 */
export class RCDataTable extends ReactiveElement {
  /** Announces each user sort through a polite live region. */
  @property({ type: Boolean })
  announce = false;

  /** Built-in text overrides; unset keys fall back to registered text, then English. */
  @property({ attribute: false })
  messages: Partial<RCDataTableMessages> | undefined;

  private _sortKey: string | undefined;
  private _sortDirection: RCDataTableSortDirection | undefined;
  private _defaultSortKey: string | undefined;
  private _defaultSortDirection: RCDataTableSortDirection = 'ascending';
  private _uncontrolledKey: string | undefined;
  private _uncontrolledDirection: RCDataTableSortDirection | undefined;

  private readonly _messages = new MessagesController(
    this,
    'rc-data-table',
    DEFAULT_DATA_TABLE_MESSAGES,
    { overrides: () => this.messages },
  );

  // Created on connect or first use, so constructing the element without a
  // DOM (a server render) cannot throw.
  private _mutationObserver: MutationObserver | undefined;
  private _resizeObserver: ResizeObserver | undefined;
  private _announcer: LiveAnnouncer | undefined;
  private readonly _$managedSort = new Set<Element>();
  private _scrollableWritten = false;
  private _captionIdWritten = false;

  /** Current sort column. Host writes are silent; assign `undefined` to release control. */
  @property({ attribute: 'sort-key' })
  get sortKey(): string | undefined {
    return this._sortKey ?? this._uncontrolledKey ?? this._defaultSortKey;
  }

  set sortKey(value: string | undefined) {
    const oldValue = this.sortKey;

    this._sortKey = value ?? undefined;
    this.requestUpdate('sortKey', oldValue);
  }

  /** Current sort direction. Host writes are silent. */
  @property({ attribute: 'sort-direction' })
  get sortDirection(): RCDataTableSortDirection {
    const value = this._sortDirection ?? this._uncontrolledDirection ?? this._defaultSortDirection;

    return isDirection(value) ? value : 'ascending';
  }

  set sortDirection(value: RCDataTableSortDirection | undefined) {
    const oldValue = this.sortDirection;

    this._sortDirection = isDirection(value) ? value : undefined;
    this.requestUpdate('sortDirection', oldValue);
  }

  /** Initial sort column for uncontrolled use. */
  @property({ attribute: 'default-sort-key' })
  get defaultSortKey(): string | undefined {
    return this._defaultSortKey;
  }

  set defaultSortKey(value: string | undefined) {
    const oldValue = this._defaultSortKey;

    this._defaultSortKey = value ?? undefined;
    this.requestUpdate('defaultSortKey', oldValue);
  }

  /** Initial sort direction for uncontrolled use. */
  @property({ attribute: 'default-sort-direction' })
  get defaultSortDirection(): RCDataTableSortDirection {
    return this._defaultSortDirection;
  }

  set defaultSortDirection(value: RCDataTableSortDirection) {
    const oldValue = this._defaultSortDirection;

    this._defaultSortDirection = isDirection(value) ? value : 'ascending';
    this.requestUpdate('defaultSortDirection', oldValue);
  }

  /** Renders nothing: the consumer's `<table>` stays the element's only content. */
  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    ensureDataTableBaseStyles(this.getRootNode() as Document | ShadowRoot);
    this._mutationObserver ??= new MutationObserver(() => this._sync());

    this._mutationObserver.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-rc-sort-key'],
    });

    if (typeof ResizeObserver === 'function') {
      this._resizeObserver ??= new ResizeObserver(() => this._syncScrollable());
      this._resizeObserver.observe(this);
    }

    this.addEventListener('click', this._onClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._mutationObserver?.disconnect();
    this._resizeObserver?.disconnect();
    this.removeEventListener('click', this._onClick);
    this._announcer?.dispose();
    this._announcer = undefined;
  }

  protected override firstUpdated(): void {
    if (!import.meta.env.DEV) {
      return;
    }

    const $table = this.querySelector(TABLE_SELECTOR);

    if (!$table) {
      console.warn(
        '[rc-data-table] No direct child <table> found. Place a native <table> inside <rc-data-table>.',
        this,
      );

      return;
    }

    for (const $th of $table.querySelectorAll(SORTABLE_HEADER_SELECTOR)) {
      if (!$th.querySelector(SORT_CONTROL_SELECTOR)) {
        console.warn(
          '[rc-data-table] A sortable header has no direct child <button> or <a>. Put the ' +
            'header text in a native <button type="button"> inside the <th>.',
          $th,
        );
      }
    }

    if (
      $table.querySelector(SORTABLE_HEADER_SELECTOR) &&
      !$table.querySelector(':scope > caption')
    ) {
      console.warn(
        '[rc-data-table] A sortable table has no <caption>. Name the table, and say there that ' +
          'column headers with buttons sort the table.',
        $table,
      );
    }
  }

  protected override updated(): void {
    this._sync();
  }

  private _headers(): HTMLTableCellElement[] {
    const $table = this.querySelector(TABLE_SELECTOR);

    return $table
      ? [...$table.querySelectorAll<HTMLTableCellElement>(SORTABLE_HEADER_SELECTOR)]
      : [];
  }

  private _sync(): void {
    const key = this.sortKey;
    const direction = this.sortDirection;
    const $active = new Set<Element>();

    for (const $th of this._headers()) {
      if (key !== undefined && $th.dataset.rcSortKey === key) {
        $active.add($th);

        if ($th.getAttribute('aria-sort') !== direction) {
          $th.setAttribute('aria-sort', direction);
        }
      }
    }

    // Unsorted columns carry no aria-sort, rather than "none".
    for (const $th of this._$managedSort) {
      if (!$active.has($th)) {
        $th.removeAttribute('aria-sort');
      }
    }

    this._$managedSort.clear();
    $active.forEach(($th) => this._$managedSort.add($th));
    this._syncScrollable();
  }

  /** While the table overflows, the host is a focusable group named by the caption. */
  private _syncScrollable(): void {
    const overflowing =
      this.scrollWidth > this.clientWidth + 1 || this.scrollHeight > this.clientHeight + 1;
    const $caption = this.querySelector<HTMLElement>(`${TABLE_SELECTOR} > caption`);

    if (overflowing && !this._scrollableWritten) {
      if (!this.hasAttribute('tabindex')) {
        this.tabIndex = 0;
      }

      if (!this.hasAttribute('role')) {
        this.setAttribute('role', 'group');
      }

      if ($caption) {
        if (!$caption.id) {
          $caption.id = `rc-data-table-caption-${crypto.randomUUID()}`;
          this._captionIdWritten = true;
        }

        this.setAttribute('aria-labelledby', $caption.id);
      }

      this._scrollableWritten = true;
    } else if (!overflowing && this._scrollableWritten) {
      this.removeAttribute('tabindex');
      this.removeAttribute('role');
      this.removeAttribute('aria-labelledby');

      if ($caption && this._captionIdWritten) {
        $caption.removeAttribute('id');
        this._captionIdWritten = false;
      }

      this._scrollableWritten = false;
    }
  }

  private _onClick = (event: MouseEvent): void => {
    const $control = (event.target as Element | null)?.closest?.(':is(button, a)');
    const $th = $control?.parentElement;

    if (
      !$control ||
      !($th instanceof HTMLTableCellElement) ||
      !$th.matches(SORTABLE_HEADER_SELECTOR) ||
      !this._headers().includes($th)
    ) {
      return;
    }

    const key = $th.dataset.rcSortKey ?? '';
    const previousKey = this.sortKey;
    const previousDirection = previousKey === undefined ? undefined : this.sortDirection;
    const first =
      $th.getAttribute('data-rc-sort-first') === 'descending' ? 'descending' : 'ascending';
    const direction: RCDataTableSortDirection =
      key === previousKey
        ? previousDirection === 'ascending'
          ? 'descending'
          : 'ascending'
        : first;

    const sort = new CustomEvent<RCDataTableSortEvent>('rc-data-table-sort', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { key, direction, previousKey, previousDirection },
    });

    if (!this.dispatchEvent(sort)) {
      event.preventDefault();

      return;
    }

    if (this._sortKey === undefined && this._sortDirection === undefined) {
      this._uncontrolledKey = key;
      this._uncontrolledDirection = direction;
      this.requestUpdate('sortKey', previousKey);
      this.requestUpdate('sortDirection', previousDirection);
    }

    if (this.announce) {
      const column = $control.textContent?.replace(/\s+/g, ' ').trim() || key;

      // The live region lives outside the host so it never joins the
      // consumer's table markup, which a framework may own.
      this._announcer ??= new LiveAnnouncer(this.ownerDocument.body);
      this._announcer.announce(this._messages.value.sorted(column, direction));
    }
  };
}

export default RCDataTable;
