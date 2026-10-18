import type { ReactiveController, ReactiveControllerHost } from 'lit';

/** Private visibility marker used only when the native Popover API cannot open a surface. */
export const POPOVER_FALLBACK_OPEN = 'data-rc-popover-fallback-open';

export interface PopoverControllerOptions {
  /** The authored or rendered element with `popover="manual"`. */
  element: HTMLElement | (() => HTMLElement | null);
}

/**
 * Keeps a manual popover visible through the native API or a CSS fallback.
 * The caller owns open state, dismissal, focus, semantics, and positioning.
 * Its CSS must show `[data-rc-popover-fallback-open]` when native opening fails.
 */
export class PopoverController implements ReactiveController {
  private readonly _element: PopoverControllerOptions['element'];
  private _current: HTMLElement | null = null;
  private _connected = false;

  constructor(host: ReactiveControllerHost, options: PopoverControllerOptions) {
    this._element = options.element;
    host.addController(this);
  }

  hostConnected(): void {
    this._connected = true;
  }

  hostDisconnected(): void {
    this._connected = false;
    this._close(this._current);
    this._current = null;
  }

  /** Synchronize visibility after the popup exists in the DOM. */
  sync(open: boolean): void {
    const element = typeof this._element === 'function' ? this._element() : this._element;

    if (element !== this._current) {
      this._close(this._current);
      this._current = element;
    }

    if (!this._connected || !element?.isConnected) {
      return;
    }

    if (!open) {
      this._close(element);

      return;
    }

    if (element.hasAttribute(POPOVER_FALLBACK_OPEN)) {
      return;
    }

    try {
      if (typeof element.showPopover === 'function') {
        if (!element.matches(':popover-open')) {
          element.showPopover();
        }

        return;
      }
    } catch {
      // Missing or partially implemented Popover API: use caller's fallback CSS.
    }

    element.setAttribute(POPOVER_FALLBACK_OPEN, '');
  }

  private _close(element: HTMLElement | null): void {
    if (!element) {
      return;
    }

    element.removeAttribute(POPOVER_FALLBACK_OPEN);

    try {
      if (typeof element.hidePopover === 'function' && element.matches(':popover-open')) {
        element.hidePopover();
      }
    } catch {
      // Disconnected, already closed, or partially implemented native popover.
    }
  }
}
