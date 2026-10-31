import { ReactiveElement } from 'lit';
import { property } from 'lit/decorators.js';

import { MessagesController, syncDefaultAttribute } from '@rcarls/rc-common';
import { ensureBreadcrumbsBaseStyles } from './breadcrumbsBaseStyles.js';

const NAV_SELECTOR = ':scope > nav';
const CURRENT_SELECTOR = '[aria-current="page"]';

/** Built-in text of `rc-breadcrumbs`. */
export interface RCBreadcrumbsMessages {
  /** Accessible name for the `<nav>` landmark when the author gives it none. */
  label: string;
}

export const DEFAULT_BREADCRUMBS_MESSAGES: Readonly<RCBreadcrumbsMessages> = Object.freeze({
  label: 'Breadcrumb',
});

declare module '@rcarls/rc-common' {
  interface RcMessageCatalog {
    'rc-breadcrumbs': RCBreadcrumbsMessages;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-breadcrumbs': RCBreadcrumbs;
  }
}

/**
 * Breadcrumb trail enhancer for a native `<nav>` and ordered list of links,
 * following the WAI-ARIA Breadcrumb pattern.
 *
 * The consumer authors the whole trail: a `<nav>` holding an `<ol>` of links,
 * with `aria-current="page"` on the link to the current page. The markup is a
 * complete breadcrumb before the element upgrades. The element lays the list
 * out as a wrapping row, draws separators in CSS so assistive technology never
 * reads them, and names the landmark when the author has not.
 *
 * The landmark name follows the element's own `lang`, else `<html lang>`: per
 * element through `messages`, or for every instance through
 * `registerMessages()` from `@rcarls/rc-common` under `rc-breadcrumbs`.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-breadcrumbs rc-breadcrumbs docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/ WAI-ARIA Breadcrumb pattern}
 *
 * @attr current-href - URL of the current page. When set, the element moves
 *   `aria-current="page"` to the link whose resolved `href` matches it, ignoring
 *   any fragment. When unset, the author owns `aria-current`.
 *
 * @cssprop [--rc-breadcrumbs-gap=0.5em] - Space between an item and its separator.
 * @cssprop [--rc-breadcrumbs-separator='/'] - Separator drawn before every item after the first.
 *   It is CSS generated content with empty alternative text, so it is never announced.
 * @cssprop [--rc-breadcrumbs-separator-color=currentColor] - Separator color.
 * @cssprop [--rc-breadcrumbs-current-color] - Color of the current-page item. Defers to the
 *   inherited color when unset.
 */
export class RCBreadcrumbs extends ReactiveElement {
  /** URL of the current page; see the `current-href` attribute. */
  @property({ attribute: 'current-href' })
  currentHref: string | undefined;

  /** Built-in text overrides; unset keys fall back to registered text, then English. */
  @property({ attribute: false })
  messages: Partial<RCBreadcrumbsMessages> | undefined;

  private readonly _messages = new MessagesController(
    this,
    'rc-breadcrumbs',
    DEFAULT_BREADCRUMBS_MESSAGES,
    { overrides: () => this.messages },
  );

  // Created on connect rather than construction, so constructing the element
  // where `MutationObserver` does not exist (a server render) cannot throw.
  private _observer: MutationObserver | undefined;
  private _writtenLabel: string | null = null;
  private _$managedCurrent = new Set<Element>();

  /** Renders nothing: the consumer's `<nav>` stays the element's only content. */
  protected override createRenderRoot(): HTMLElement {
    return this;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    ensureBreadcrumbsBaseStyles(this.getRootNode() as Document | ShadowRoot);
    this._observer ??= new MutationObserver(() => this._sync());

    this._observer.observe(this, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'aria-label', 'aria-labelledby'],
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
  }

  protected override firstUpdated(): void {
    if (import.meta.env.DEV && !this.querySelector(NAV_SELECTOR)) {
      console.warn(
        '[rc-breadcrumbs] No direct child <nav> found. Place a native ' +
          '<nav><ol><li><a href="...">...</a></li></ol></nav> inside <rc-breadcrumbs>.',
        this,
      );
    }
  }

  protected override updated(): void {
    this._sync();
  }

  private _sync(): void {
    const $nav = this.querySelector<HTMLElement>(NAV_SELECTOR);

    if (!$nav) {
      return;
    }

    if ($nav.hasAttribute('aria-labelledby')) {
      this._writtenLabel = null;
    } else {
      this._writtenLabel = syncDefaultAttribute(
        $nav,
        'aria-label',
        this._messages.value.label,
        this._writtenLabel,
      );
    }

    if (this.currentHref) {
      this._syncCurrent($nav, this.currentHref);
    } else {
      this._releaseCurrent();

      if (import.meta.env.DEV && $nav.querySelectorAll(CURRENT_SELECTOR).length > 1) {
        console.warn('[rc-breadcrumbs] More than one item is marked aria-current="page".', this);
      }
    }
  }

  private _syncCurrent($nav: HTMLElement, currentHref: string): void {
    const current = pageUrl(currentHref, this.ownerDocument.baseURI);
    const $match = [...$nav.querySelectorAll<HTMLAnchorElement>('a[href]')].find(
      ($link) =>
        current !== undefined && pageUrl($link.href, this.ownerDocument.baseURI) === current,
    );

    for (const $el of $nav.querySelectorAll(CURRENT_SELECTOR)) {
      if ($el !== $match) {
        $el.removeAttribute('aria-current');
      }
    }

    this._$managedCurrent.clear();

    if ($match) {
      if ($match.getAttribute('aria-current') !== 'page') {
        $match.setAttribute('aria-current', 'page');
      }

      this._$managedCurrent.add($match);
    }
  }

  /** Clears only the `aria-current` the element wrote, once `current-href` is removed. */
  private _releaseCurrent(): void {
    for (const $el of this._$managedCurrent) {
      $el.removeAttribute('aria-current');
    }

    this._$managedCurrent.clear();
  }
}

/** A URL without its fragment, so `#section` links still match their page. */
function pageUrl(href: string, base: string): string | undefined {
  try {
    const url = new URL(href, base);

    url.hash = '';

    return url.href;
  } catch {
    return undefined;
  }
}

export default RCBreadcrumbs;
