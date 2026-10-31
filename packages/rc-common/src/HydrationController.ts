import { isServer, type ReactiveController, type ReactiveControllerHost } from 'lit';

/**
 * Lets an element that reads its light DOM while rendering hydrate a
 * server-rendered shadow root correctly.
 *
 * A server render cannot see an element's children, so whatever the element
 * derives from them, such as a native child's value or which slots are filled,
 * renders as if they were absent. Lit's hydration adopts that markup as is, so
 * the first client update must render the same thing, and the element must
 * then update again with its real state. While `serverView` is true, render as
 * the server would; the controller then re-dispatches `slotchange` on every
 * slot, which a hydrated root never receives for slots the parser filled, and
 * requests the second update.
 */
export class HydrationController implements ReactiveController {
  private readonly _host: ReactiveControllerHost & Element;
  private _pending: boolean;

  constructor(host: ReactiveControllerHost & Element) {
    this._host = host;
    // A declarative shadow root is attached before the element upgrades.
    this._pending = !isServer && host.shadowRoot !== null;
    host.addController(this);
  }

  /**
   * True on the server and for the first client update over a server-rendered
   * shadow root: render without reading light-DOM children or measuring.
   */
  get serverView(): boolean {
    return isServer || this._pending;
  }

  hostUpdated(): void {
    if (!this._pending) {
      return;
    }

    this._pending = false;

    for (const $slot of this._host.shadowRoot?.querySelectorAll('slot') ?? []) {
      $slot.dispatchEvent(new Event('slotchange', { bubbles: true }));
    }

    this._host.requestUpdate();
  }
}
