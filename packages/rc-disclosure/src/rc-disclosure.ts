export interface RCDisclosureToggleEvent {
  /** Whether the disclosure is now open. */
  open: boolean;
}

const TOGGLE_EVENT = 'rc-disclosure-toggle';
const DETAILS_SELECTOR = ':scope > details';
const SUMMARY_SELECTOR = ':scope > summary';

declare global {
  interface HTMLElementTagNameMap {
    'rc-disclosure': RCDisclosure;
  }
}

/**
 * Light behavioral wrapper for a direct child native `<details>` element.
 *
 * The browser keeps ownership of open/close behavior, keyboard support, and
 * accessibility. This element mirrors state, emits a consistent custom event,
 * and automatically opens when the URL hash matches any id within its subtree.
 *
 * @fires rc-disclosure-toggle - Fires when the child `<details>` toggles.
 */
export class RCDisclosure extends HTMLElement {
  private _observer = new MutationObserver(() => this._setupDetails());

  private _$details: HTMLDetailsElement | null = null;

  private _scrollFrame = 0;

  static get observedAttributes(): string[] {
    return ['open', 'fragment'];
  }

  /** Current open state mirrored to the child `<details>`. */
  get open(): boolean {
    return this._$details?.open ?? this.hasAttribute('open');
  }

  set open(value: boolean) {
    this._setOpen(value, true);
  }

  /**
   * @deprecated No longer required. `rc-disclosure` now automatically opens and
   * scrolls when the URL hash matches any id within its subtree. Will be removed
   * in v1.0 release.
   */
  get fragment(): boolean {
    return this.hasAttribute('fragment');
  }

  set fragment(value: boolean) {
    this.toggleAttribute('fragment', value);
  }

  connectedCallback(): void {
    this._observer.observe(this, { childList: true });
    window.addEventListener('hashchange', this._onHashChange);
    this._setupDetails();
  }

  disconnectedCallback(): void {
    this._observer.disconnect();
    window.removeEventListener('hashchange', this._onHashChange);
    cancelAnimationFrame(this._scrollFrame);
    this._teardownDetails();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) {
      return;
    }

    if (name === 'open') {
      this._syncDetailsOpen();

      return;
    }

    if (name === 'fragment') {
      this._openForCurrentHash();
    }
  }

  private _setupDetails(): void {
    const $details = this.querySelector<HTMLDetailsElement>(DETAILS_SELECTOR);
    if ($details === this._$details) {
      return;
    }

    this._teardownDetails();
    this._$details = $details;

    if (!$details) {
      if (import.meta.env.DEV) {
        console.warn(
          '[rc-disclosure] No direct child <details> found. Place native ' +
            '<details><summary>...</summary>...</details> inside <rc-disclosure>.',
          this,
        );
      }

      return;
    }

    if (!$details.id) {
      $details.id = crypto.randomUUID();
    }

    const $summary = $details.querySelector<HTMLElement>(SUMMARY_SELECTOR);
    $summary?.setAttribute('aria-controls', $details.id);

    $details.addEventListener('toggle', this._onToggle);
    this._syncDetailsOpen();
    this._reflectOpen($details.open);
    this._openForCurrentHash();
  }

  private _teardownDetails(): void {
    const $summary = this._$details?.querySelector<HTMLElement>(SUMMARY_SELECTOR);
    $summary?.removeAttribute('aria-controls');

    this._$details?.removeEventListener('toggle', this._onToggle);
    this._$details = null;
  }

  private _syncDetailsOpen(): void {
    const $details = this._$details;
    if (!$details) {
      return;
    }

    const nextOpen = this.hasAttribute('open');
    if ($details.open !== nextOpen) {
      $details.open = nextOpen;
    }
  }

  private _setOpen(value: boolean, reflect: boolean): void {
    const $details = this._$details;
    if ($details && $details.open !== value) {
      $details.open = value;
    }

    // _reflectOpen is called here for programmatic opens because the <details>
    // toggle event is async (queued task per HTML spec). _onToggle also calls
    // _reflectOpen for user-initiated clicks, but that arrives after a tick.
    if (reflect) {
      this._reflectOpen(value);
    }
  }

  private _reflectOpen(value: boolean): void {
    if (value) {
      if (!this.hasAttribute('open')) {
        this.setAttribute('open', '');
      }

      return;
    }

    if (this.hasAttribute('open')) {
      this.removeAttribute('open');
    }
  }

  private _onToggle = (): void => {
    const open = this._$details?.open ?? false;

    this._reflectOpen(open);
    this.dispatchEvent(
      new CustomEvent<RCDisclosureToggleEvent>(TOGGLE_EVENT, {
        bubbles: true,
        composed: true,
        detail: { open },
      }),
    );
  };

  private _onHashChange = (): void => {
    this._openForCurrentHash();
  };

  private _openForCurrentHash(): void {
    if (!location.hash) {
      return;
    }

    const targetId = decodeURIComponent(location.hash.slice(1));
    if (!targetId) {
      return;
    }

    const $target = this.querySelector(`#${CSS.escape(targetId)}`);
    if (!$target) {
      return;
    }

    const wasOpen = this.open;

    this.open = true;

    if (wasOpen) {
      return;
    }

    cancelAnimationFrame(this._scrollFrame);
    this._scrollFrame = requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView();
    });
  }
}

export default RCDisclosure;
