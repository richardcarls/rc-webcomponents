import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type NativeChildHost = ReactiveControllerHost & Element;

export interface MissingDirectChildWarningOptions {
  /** Selector scoped to direct children, such as `:scope > button`. */
  selector: string;
  /** Minimum matching child count required before no warning is emitted. Defaults to `1`. */
  minimum?: number;
  /** Human-readable child description used by the default warning text. */
  childDescription?: string;
  /** Component name used by the default warning text. Defaults to `host.localName`. */
  hostName?: string;
  /** Full warning message. Overrides the generated message. */
  message?: string;
}

export interface NativeChildControllerOptions<E extends Element> {
  /** Selector scoped to the host's light DOM. Prefer `:scope > ...`. */
  selector: string;
  /** Called when the matched child changes. */
  onChange?: (child: E | null, previous: E | null) => void;
  /** Called when no child is found during a sync pass. */
  onMissing?: (host: NativeChildHost) => void;
  /**
   * Observe light-DOM child changes and re-sync automatically. Defaults to
   * `false`; leave off for static direct-child checks.
   */
  observe?: boolean | MutationObserverInit;
}

/** Returns the first matching child under `host`, or `null` when absent. */
export function getDirectChild<E extends Element = Element>(
  host: ParentNode,
  selector: string,
): E | null {
  return host.querySelector<E>(selector);
}

/** Returns all matching children under `host`. */
export function getDirectChildren<E extends Element = Element>(
  host: ParentNode,
  selector: string,
): E[] {
  return Array.from(host.querySelectorAll<E>(selector));
}

/**
 * Emits a standard direct-child warning when the expected child is absent.
 * Call this from a DEV-guarded component lifecycle hook.
 */
export function warnMissingDirectChild(
  host: Element,
  options: MissingDirectChildWarningOptions,
): boolean {
  if (getDirectChildren(host, options.selector).length >= (options.minimum ?? 1)) return false;

  const hostName = options.hostName ?? host.localName;
  const childDescription = options.childDescription ?? options.selector.replace(':scope > ', '');
  const message =
    options.message ??
    `[${hostName}] No direct child ${childDescription} found. Place ${childDescription} inside <${hostName}>.`;

  console.warn(message, host);

  return true;
}

/**
 * Tracks a native light-DOM child and re-runs setup when it is replaced.
 * Useful for progressive-enhancement wrappers that wire listeners to a
 * consumer-provided native control.
 */
export class NativeChildController<E extends Element = Element> implements ReactiveController {
  private _observer: MutationObserver | null = null;

  private _child: E | null = null;

  private readonly _host: NativeChildHost;

  private readonly _options: NativeChildControllerOptions<E>;

  constructor(host: NativeChildHost, options: NativeChildControllerOptions<E>) {
    this._host = host;
    this._options = options;
    host.addController(this);
  }

  get child(): E | null {
    return this._child;
  }

  hostConnected(): void {
    this.sync();

    if (!this._options.observe) return;

    this._observer ??= new MutationObserver(() => this.sync());
    const observerOptions =
      this._options.observe === true ? { childList: true } : this._options.observe;

    this._observer.observe(this._host, observerOptions);
  }

  hostDisconnected(): void {
    this._observer?.disconnect();
  }

  /** Re-read the child from the host and invoke `onChange` when it changes. */
  sync(): E | null {
    const previous = this._child;
    const next = getDirectChild<E>(this._host, this._options.selector);

    this._child = next;

    if (!next) this._options.onMissing?.(this._host);
    if (next !== previous) this._options.onChange?.(next, previous);

    return next;
  }
}

export default NativeChildController;
