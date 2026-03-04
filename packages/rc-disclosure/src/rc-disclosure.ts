export interface RCDisclosureToggleEvent {
  /** Whether the disclosure is now open. */
  open: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-disclosure': RCDisclosure;
  }
}

/**
 * Light behavioral wrapper for a direct child native `<details>` element.
 *
 * The browser keeps ownership of open/close behavior, keyboard support, and
 * accessibility. This element only mirrors state, emits a consistent custom
 * event, and optionally opens matching fragment targets.
 *
 * @fires rc-disclosure-toggle - Fires when the child `<details>` toggles.
 */
export class RCDisclosure extends HTMLElement {
  private _details: HTMLDetailsElement | null = null;
  private _observer = new MutationObserver(() => this._setupDetails());

  static get observedAttributes(): string[] {
    return ['open', 'fragment'];
  }

  /** Current open state mirrored to the child `<details>`. */
  get open(): boolean {
    return this._details?.open ?? this.hasAttribute('open');
  }

  set open(value: boolean) {
    this._setOpen(value, true);
  }

  /** Enable location-hash opening when the details/summary target matches. */
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
    this._openForCurrentHash();
  }

  disconnectedCallback(): void {
    this._observer.disconnect();
    window.removeEventListener('hashchange', this._onHashChange);
    this._teardownDetails();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    if (name === 'open') this._syncDetailsOpen();
    if (name === 'fragment') this._openForCurrentHash();
  }

  private _setupDetails(): void {
    const details = this.querySelector<HTMLDetailsElement>(':scope > details');
    if (details === this._details) return;

    this._teardownDetails();
    this._details = details;

    if (!details) {
      if (import.meta.env.DEV) {
        console.warn(
          '[rc-disclosure] No direct child <details> found. Place native ' +
          '<details><summary>...</summary>...</details> inside <rc-disclosure>.',
          this,
        );
      }
      return;
    }

    if (!details.id) details.id = crypto.randomUUID();

    const summary = details.querySelector<HTMLElement>(':scope > summary');
    if (summary) summary.setAttribute('aria-controls', details.id);

    details.addEventListener('toggle', this._onToggle);
    this._syncDetailsOpen();
    this._reflectOpen(details.open);
    this._openForCurrentHash();
  }

  private _teardownDetails(): void {
    const summary = this._details?.querySelector<HTMLElement>(':scope > summary');
    summary?.removeAttribute('aria-controls');

    this._details?.removeEventListener('toggle', this._onToggle);
    this._details = null;
  }

  private _syncDetailsOpen(): void {
    const details = this._details;
    if (!details) return;

    const nextOpen = this.hasAttribute('open');
    if (details.open !== nextOpen) details.open = nextOpen;
  }

  private _setOpen(value: boolean, reflect: boolean): void {
    const details = this._details;
    if (details && details.open !== value) details.open = value;
    // _reflectOpen is called here for programmatic opens because the <details>
    // toggle event is async (queued task per HTML spec). _onToggle also calls
    // _reflectOpen for user-initiated clicks, but that arrives after a tick.
    if (reflect) this._reflectOpen(value);
  }

  private _reflectOpen(value: boolean): void {
    if (value) {
      if (!this.hasAttribute('open')) this.setAttribute('open', '');
      return;
    }

    if (this.hasAttribute('open')) this.removeAttribute('open');
  }

  private _onToggle = (): void => {
    const open = this._details?.open ?? false;

    this._reflectOpen(open);
    this.dispatchEvent(
      new CustomEvent<RCDisclosureToggleEvent>('rc-disclosure-toggle', {
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
    if (!this.fragment || !location.hash) return;

    const targetId = decodeURIComponent(location.hash.slice(1));
    if (!targetId) return;

    const details = this._details;
    if (!details) return;

    const summary = details.querySelector<HTMLElement>(':scope > summary');
    if (details.id !== targetId && summary?.id !== targetId) return;

    this.open = true;
  }
}

export default RCDisclosure;
