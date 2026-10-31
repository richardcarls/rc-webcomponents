import { ReactiveElement } from 'lit';
import { property } from 'lit/decorators.js';

import {
  LiveAnnouncer,
  MessagesController,
  numberFormat,
  syncDefaultAttribute,
} from '@rcarls/rc-common';
import { ensurePaginationBaseStyles } from './paginationBaseStyles.js';

const NAV_SELECTOR = ':scope > nav';
const ITEM_SELECTOR = '[data-rc-page]';

/** A `data-rc-page` value: a page number, or a step relative to the current page. */
type PageTarget = number | 'previous' | 'next' | 'first' | 'last';

/** Built-in text of `rc-pagination`. */
export interface RCPaginationMessages {
  /** Accessible name for the `<nav>` landmark when the author gives it none. */
  label: string;
  /** Accessible name of a numbered page link or button. */
  page: (page: number, total: number, locale?: string) => string;
  /** Name of a previous control that has no text of its own. */
  previous: string;
  /** Name of a next control that has no text of its own. */
  next: string;
  /** Name of a first-page control that has no text of its own. */
  first: string;
  /** Name of a last-page control that has no text of its own. */
  last: string;
  /** Announcement after a page change, when `announce` is set. */
  status: (page: number, total: number, locale?: string) => string;
}

const formatPage = (value: number, locale?: string) =>
  numberFormat(locale, { useGrouping: false }).format(value);

export const DEFAULT_PAGINATION_MESSAGES: Readonly<RCPaginationMessages> = Object.freeze({
  label: 'Pagination',
  page: (page: number, _total: number, locale?: string) => `Page ${formatPage(page, locale)}`,
  previous: 'Previous page',
  next: 'Next page',
  first: 'First page',
  last: 'Last page',
  status: (page: number, total: number, locale?: string) =>
    `Page ${formatPage(page, locale)} of ${formatPage(total, locale)}`,
});

declare module '@rcarls/rc-common' {
  interface RcMessageCatalog {
    'rc-pagination': RCPaginationMessages;
  }
}

/** Detail of `rc-pagination-change`. */
export interface RCPaginationChangeEvent {
  /** The page the user asked for. */
  page: number;
  /** The page that was current when the user asked. */
  previousPage: number;
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-pagination': RCPagination;
  }

  interface HTMLElementEventMap {
    'rc-pagination-change': CustomEvent<RCPaginationChangeEvent>;
  }
}

/**
 * Pagination enhancer for a native `<nav>` holding a list of page links or
 * buttons.
 *
 * There is no WAI-ARIA pattern for pagination; the markup follows the GOV.UK
 * and USWDS models. The consumer renders the list, usually from
 * `paginationRange()`, and tags each control with `data-rc-page`: a page
 * number, or `previous`, `next`, `first`, or `last`. The markup works before the
 * element upgrades. The element then keeps `aria-current="page"` on the
 * current page, names the landmark and unlabeled controls, disables steps past
 * either end, and reports each user request as `rc-pagination-change`.
 *
 * Links navigate as usual unless a listener cancels `rc-pagination-change`,
 * which also cancels the click, for client-side routing. Buttons only report.
 * In uncontrolled use the element moves to the requested page itself; set
 * `page` to control it.
 *
 * Built-in text follows the element's own `lang`, else `<html lang>`: per
 * element through `messages`, or for every instance through
 * `registerMessages()` from `@rcarls/rc-common` under `rc-pagination`.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-pagination rc-pagination docs}
 * @see {@link https://design-system.service.gov.uk/components/pagination/ GOV.UK pagination}
 *
 * @fires rc-pagination-change - Fired when the user activates a page control. Cancelable;
 *   canceling it also cancels the click, so a link does not navigate.
 *
 * @attr page - Controlled current page, 1-based. Host writes are silent.
 * @attr default-page - Initial page for uncontrolled use. Defaults to 1.
 * @attr total - Number of pages.
 * @attr announce - Announces the new page through a polite live region after each user change.
 *
 * @cssprop [--rc-pagination-gap=0.25em] - Space between items.
 * @cssprop [--rc-pagination-item-min-inline-size] - Minimum inline size of each item. Defers to
 *   the content size when unset.
 */
export class RCPagination extends ReactiveElement {
  /** Number of pages. */
  @property({ type: Number })
  total = 1;

  /** Announces each user change through a polite live region. */
  @property({ type: Boolean })
  announce = false;

  /** Built-in text overrides; unset keys fall back to registered text, then English. */
  @property({ attribute: false })
  messages: Partial<RCPaginationMessages> | undefined;

  private _page: number | undefined;
  private _defaultPage = 1;
  private _uncontrolledPage: number | undefined;
  private _pageInitialized = false;

  private readonly _messages = new MessagesController(
    this,
    'rc-pagination',
    DEFAULT_PAGINATION_MESSAGES,
    { overrides: () => this.messages },
  );

  // Created on connect or first use, so constructing the element without a
  // DOM (a server render) cannot throw.
  private _observer: MutationObserver | undefined;
  private _announcer: LiveAnnouncer | undefined;
  private _writtenLabel: string | null = null;
  private readonly _writtenNames = new WeakMap<Element, string | null>();
  private readonly _$managedCurrent = new Set<Element>();
  private readonly _$managedDisabled = new Set<Element>();

  /** Current page, 1-based and clamped to `[1, total]`. Host writes are silent. */
  @property({ type: Number })
  get page(): number {
    return this._clamp(this._page ?? this._uncontrolledPage ?? this._defaultPage);
  }

  set page(value: number | undefined) {
    const oldValue = this.page;

    this._page = value;
    this._pageInitialized = true;
    this.requestUpdate('page', oldValue);
  }

  /** Initial page for uncontrolled use. */
  @property({ type: Number, attribute: 'default-page' })
  get defaultPage(): number {
    return this._defaultPage;
  }

  set defaultPage(value: number) {
    const oldValue = this._defaultPage;

    this._defaultPage = value;

    if (
      !this._pageInitialized &&
      this._page === undefined &&
      this._uncontrolledPage === undefined
    ) {
      this.requestUpdate('page', this.page);
    }

    this.requestUpdate('defaultPage', oldValue);
  }

  /** Renders nothing: the consumer's `<nav>` stays the element's only content. */
  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    ensurePaginationBaseStyles(this.getRootNode() as Document | ShadowRoot);
    this._observer ??= new MutationObserver(() => this._sync());

    this._observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-rc-page', 'aria-label', 'aria-labelledby'],
    });

    this.addEventListener('click', this._onClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
    this.removeEventListener('click', this._onClick);
    this._announcer?.dispose();
    this._announcer = undefined;
  }

  protected override firstUpdated(): void {
    if (import.meta.env.DEV && !this.querySelector(NAV_SELECTOR)) {
      console.warn(
        '[rc-pagination] No direct child <nav> found. Place a native <nav> with a list of ' +
          '<a data-rc-page="2"> or <button data-rc-page="2"> controls inside <rc-pagination>.',
        this,
      );
    }
  }

  protected override updated(): void {
    this._sync();
  }

  private _clamp(page: number): number {
    const last = Math.max(1, Math.floor(this.total) || 1);
    const value = Number.isFinite(page) ? Math.floor(page) : 1;

    return Math.min(Math.max(1, value), last);
  }

  private _target($item: Element): PageTarget | undefined {
    const raw = $item.getAttribute('data-rc-page')?.trim() ?? '';

    if (raw === 'previous' || raw === 'next' || raw === 'first' || raw === 'last') {
      return raw;
    }

    const value = Number(raw);

    return Number.isInteger(value) && value > 0 ? value : undefined;
  }

  private _resolve(target: PageTarget): number {
    switch (target) {
      case 'previous':
        return this._clamp(this.page - 1);
      case 'next':
        return this._clamp(this.page + 1);
      case 'first':
        return 1;
      case 'last':
        return this._clamp(this.total);
      default:
        return target;
    }
  }

  private _sync(): void {
    const $nav = this.querySelector<HTMLElement>(NAV_SELECTOR);

    if (!$nav) {
      return;
    }

    const messages = this._messages.value;
    const locale = this._messages.locale;

    if ($nav.hasAttribute('aria-labelledby')) {
      this._writtenLabel = null;
    } else {
      this._writtenLabel = syncDefaultAttribute(
        $nav,
        'aria-label',
        messages.label,
        this._writtenLabel,
      );
    }

    const page = this.page;
    const total = this._clamp(this.total);
    const $current = new Set<Element>();
    const $disabled = new Set<Element>();

    for (const $item of $nav.querySelectorAll(ITEM_SELECTOR)) {
      const target = this._target($item);

      if (target === undefined) {
        continue;
      }

      if (typeof target === 'number') {
        if (target === page) {
          $current.add($item);
        }

        this._syncName($item, messages.page(target, total, locale), true);
      } else {
        const atEdge =
          ((target === 'previous' || target === 'first') && page <= 1) ||
          ((target === 'next' || target === 'last') && page >= total);

        if (atEdge) {
          $disabled.add($item);
        }

        this._syncName($item, messages[target], false);
      }
    }

    for (const $item of this._$managedCurrent) {
      if (!$current.has($item)) {
        $item.removeAttribute('aria-current');
      }
    }

    for (const $item of $current) {
      $item.setAttribute('aria-current', 'page');
    }

    this._$managedCurrent.clear();
    $current.forEach(($item) => this._$managedCurrent.add($item));

    for (const $item of this._$managedDisabled) {
      if (!$disabled.has($item)) {
        setDisabled($item, false);
      }
    }

    for (const $item of $disabled) {
      setDisabled($item, true);
    }

    this._$managedDisabled.clear();
    $disabled.forEach(($item) => this._$managedDisabled.add($item));
  }

  /**
   * Gives a control its default name unless the author named it. Numbered
   * controls always get one ("Page 3" contains the visible "3"); steps only
   * when they have no visible text, such as an icon-only button.
   */
  private _syncName($item: Element, name: string, numbered: boolean): void {
    if (!numbered && $item.textContent?.trim()) {
      return;
    }

    const written = syncDefaultAttribute(
      $item,
      'aria-label',
      name,
      this._writtenNames.get($item) ?? null,
    );

    this._writtenNames.set($item, written);
  }

  private _onClick = (event: MouseEvent): void => {
    const $item = (event.target as Element | null)?.closest?.(ITEM_SELECTOR);
    const $nav = this.querySelector(NAV_SELECTOR);

    if (!$item || !$nav?.contains($item)) {
      return;
    }

    const target = this._target($item);

    if (target === undefined) {
      return;
    }

    if (this._$managedDisabled.has($item)) {
      event.preventDefault();

      return;
    }

    const previousPage = this.page;
    const page = this._resolve(target);

    if (page === previousPage) {
      return;
    }

    const change = new CustomEvent<RCPaginationChangeEvent>('rc-pagination-change', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { page, previousPage },
    });

    if (!this.dispatchEvent(change)) {
      event.preventDefault();

      return;
    }

    if (this._page === undefined) {
      this._uncontrolledPage = page;
      this.requestUpdate('page', previousPage);
    }

    if (this.announce) {
      this._announcer ??= new LiveAnnouncer(this);

      this._announcer.announce(
        this._messages.value.status(page, this._clamp(this.total), this._messages.locale),
      );
    }
  };
}

/** Disables a button natively and a link through `aria-disabled`, which the click guard enforces. */
function setDisabled($item: Element, disabled: boolean): void {
  if ($item instanceof HTMLButtonElement) {
    $item.disabled = disabled;
  } else if (disabled) {
    $item.setAttribute('aria-disabled', 'true');
  } else {
    $item.removeAttribute('aria-disabled');
  }
}

export default RCPagination;
