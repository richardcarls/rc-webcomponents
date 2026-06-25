import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface MutationObserverControllerOptions {
  /** Node to observe. Accepts a node reference or getter. */
  target: Node | (() => Node | null) | null;
  /** Native observer callback. */
  callback: MutationCallback;
  /** Native observer options. Defaults to `{ childList: true }`. */
  observerOptions?: MutationObserverInit;
  /** When true, disconnects and stays inert. */
  disabled?: boolean;
}

/**
 * Lifecycle-safe wrapper around `MutationObserver`.
 *
 * A null target is silently inert; call `setOptions()` when the target or
 * observer options change.
 */
export class MutationObserverController implements ReactiveController {
  private _attached: Node | null = null;

  private _observer: MutationObserver | null = null;

  private _options: MutationObserverControllerOptions;

  constructor(host: ReactiveControllerHost, options: MutationObserverControllerOptions) {
    this._options = options;
    host.addController(this);
  }

  setOptions(next: Partial<MutationObserverControllerOptions>): void {
    this._detach();
    Object.assign(this._options, next);
    this._attach();
  }

  hostConnected(): void {
    this._attach();
  }

  hostDisconnected(): void {
    this._detach();
  }

  private _resolveTarget(): Node | null {
    const { target } = this._options;

    return typeof target === 'function' ? target() : (target ?? null);
  }

  private _attach(): void {
    if (this._options.disabled || this._attached) return;

    const target = this._resolveTarget();
    if (!target) return;

    this._observer ??= new MutationObserver(this._options.callback);
    this._observer.observe(target, this._options.observerOptions ?? { childList: true });
    this._attached = target;
  }

  private _detach(): void {
    this._observer?.disconnect();
    this._attached = null;
  }
}

export default MutationObserverController;
