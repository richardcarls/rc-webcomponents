import { isServer, type ReactiveController, type ReactiveControllerHost } from 'lit';

/** Options for {@link MorphRecoveryController}. */
export interface MorphRecoveryOptions {
  /**
   * Attribute names the element writes on itself or its light DOM, beyond the
   * defaults: `role`, `tabindex`, `inert`, `hidden`, `disabled`, `style`, and
   * every `aria-*` attribute. A default triggers recovery only when removed, since
   * the element also changes those values during interaction. A listed name
   * triggers on any change, including a morph adding it back.
   */
  attributes?: readonly string[];
  /**
   * The host's default `role`. The controller writes it on connect and after
   * a morph whenever the author has given the host no role of its own.
   */
  role?: string;
  /**
   * Writes the element's attribute state again. Runs once after a batch of
   * removals, after the controller has requested an update and re-dispatched
   * `slotchange` on every shadow slot. It must be idempotent.
   */
  resync?: () => void;
}

const DEFAULT_ATTRIBUTES: ReadonlySet<string> = new Set([
  'role',
  'tabindex',
  'inert',
  'hidden',
  'disabled',
  'style',
]);

/**
 * Restores the attributes an element wrote after something outside it removes
 * them.
 *
 * Turbo page refreshes, Livewire, htmx with idiomorph, and Blazor's enhanced
 * navigation update a page by diffing the live DOM against new server HTML.
 * The server HTML is the author's markup, without the `role`, `tabindex`, ARIA
 * state, and state attributes the element wrote after it upgraded, so the
 * diff removes them. The element itself survives, so nothing reconnects it.
 *
 * The controller watches the host and its light DOM for those attributes
 * being removed and then re-runs the element's own sync: a host update, a
 * `slotchange` on every shadow slot, and the optional `resync` callback. The
 * element's own removals trigger it too, which is harmless because the sync
 * is idempotent and re-adding an attribute is not a removal.
 */
export class MorphRecoveryController implements ReactiveController {
  private readonly _host: ReactiveControllerHost & HTMLElement;
  private readonly _attributes: ReadonlySet<string>;
  private readonly _role: string | undefined;
  private readonly _resync: (() => void) | undefined;
  private _observer: MutationObserver | undefined;
  private _queued = false;
  private _recovering = false;

  constructor(host: ReactiveControllerHost & HTMLElement, options: MorphRecoveryOptions = {}) {
    this._host = host;
    this._attributes = new Set(options.attributes);
    this._role = options.role;
    this._resync = options.resync;
    host.addController(this);
  }

  hostConnected(): void {
    if (isServer) {
      return;
    }

    this._syncRole();

    this._observer ??= new MutationObserver((records) => this._onMutations(records));

    this._observer.observe(this._host, {
      attributes: true,
      attributeOldValue: true,
      subtree: true,
    });
  }

  hostDisconnected(): void {
    this._observer?.disconnect();
  }

  private _onMutations(records: MutationRecord[]): void {
    if (this._recovering) {
      return;
    }

    const tampered = records.some(({ attributeName, oldValue, target }) => {
      if (attributeName === null) {
        return false;
      }

      const value = (target as Element).getAttribute(attributeName);

      if (this._attributes.has(attributeName)) {
        return value !== oldValue;
      }

      return (
        oldValue !== null &&
        value === null &&
        (DEFAULT_ATTRIBUTES.has(attributeName) || attributeName.startsWith('aria-'))
      );
    });

    if (tampered && !this._queued) {
      this._queued = true;

      // After the rest of the morph, which may still be removing attributes.
      queueMicrotask(() => {
        this._queued = false;
        void this._recover();
      });
    }
  }

  private _syncRole(): void {
    if (this._role && !this._host.hasAttribute('role')) {
      this._host.setAttribute('role', this._role);
    }
  }

  private async _recover(): Promise<void> {
    if (!this._host.isConnected) {
      return;
    }

    this._recovering = true;

    try {
      this._syncRole();
      this._host.requestUpdate();

      for (const $slot of this._host.shadowRoot?.querySelectorAll('slot') ?? []) {
        $slot.dispatchEvent(new Event('slotchange', { bubbles: true }));
      }

      this._resync?.();
      await this._host.updateComplete;
    } finally {
      // The element's own resync writes the watched attributes too.
      this._observer?.takeRecords();
      this._recovering = false;
    }
  }
}
