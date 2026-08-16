import type { ReactiveController, ReactiveControllerHost } from 'lit';

import { DragGestureController, type DragGestureDetail } from './DragGestureController';

export interface DragOptions {
  /** The element to move. Its `left` / `top` styles are updated during drag. */
  target: Element;
  /** Element that initiates the drag. Defaults to `target`. */
  handle?: Element | null;
  /** Bounds constraint for movement. Defaults to `'viewport'`. */
  bounds?: 'viewport' | 'parent' | Element;
  /** Constrain movement to one axis. Defaults to `'both'`. */
  axis?: 'x' | 'y' | 'both';
  /** Keyboard arrow-key step in px. Shift multiplies by 10. Defaults to `4`. */
  step?: number;
  disabled?: boolean;
}

/**
 * Makes an element draggable via pointer and keyboard.
 *
 * Attach to a host and pass a `target` element (the element to move) and
 * optionally a `handle` element (the drag initiator). Arrow keys on the
 * focused handle also move the target for keyboard accessibility.
 *
 * Named `DragController` internally; `movable` is the attribute name on
 * `<rc-dialog>` to avoid colliding with the HTML `draggable` global attribute.
 */
export class DragController implements ReactiveController {
  private _opts: Required<Omit<DragOptions, 'handle' | 'bounds'>> &
    Pick<DragOptions, 'handle' | 'bounds'>;

  private _dragging = false;
  private _startLeft = 0;
  private _startTop = 0;

  private readonly _gesture: DragGestureController;
  private readonly _onKeyDown: (e: KeyboardEvent) => void;

  constructor(host: ReactiveControllerHost, options: DragOptions) {
    this._opts = {
      axis: 'both',
      step: 4,
      disabled: false,
      handle: null,
      bounds: 'viewport',
      ...options,
    };

    this._onKeyDown = this._handleKeyDown.bind(this);

    this._gesture = new DragGestureController(host, {
      target: () => this._handle(),
      axis: this._opts.axis,
      canStart: (event) => this._canStartGesture(event),
      onStart: (detail) => this._startDrag(detail),
      onMove: (detail) => this._moveDrag(detail),
      onEnd: () => this._finishDrag(),
      onCancel: () => this._finishDrag(),
    });

    // Must be last: if host is already connected, addController calls hostConnected() synchronously.
    host.addController(this);
  }

  setOptions(next: Partial<DragOptions>): void {
    const prevHandle = this._handle();

    Object.assign(this._opts, next);
    this._gesture.setOptions({ axis: this._opts.axis, target: () => this._handle() });

    const nextHandle = this._handle();

    if (prevHandle !== nextHandle) {
      this._detachFrom(prevHandle);
      this._attachTo(nextHandle);
    }
  }

  hostConnected(): void {
    this._attachTo(this._handle());
  }

  hostDisconnected(): void {
    this._detachFrom(this._handle());
  }

  private _handle(): Element {
    return this._opts.handle ?? this._opts.target;
  }

  private _target(): HTMLElement {
    return this._opts.target as HTMLElement;
  }

  private _attachTo(handle: Element): void {
    handle.addEventListener('keydown', this._onKeyDown as EventListener);

    if (!handle.hasAttribute('tabindex')) {
      (handle as HTMLElement).setAttribute('tabindex', '0');
    }
  }

  private _detachFrom(handle: Element): void {
    handle.removeEventListener('keydown', this._onKeyDown as EventListener);
  }

  private _canStartGesture(event: PointerEvent): boolean {
    if (this._opts.disabled) {
      return false;
    }

    // Don't start drag when clicking interactive children (buttons, links)
    return !(event.target as Element).closest('button, [role="button"], a');
  }

  private _startDrag(_detail: DragGestureDetail): void {
    const target = this._target();
    const rect = target.getBoundingClientRect();

    if (getComputedStyle(target).position === 'static') {
      target.style.position = 'fixed';
    }

    // Clear all competing positioning constraints (UA <dialog> uses inset:0 +
    // margin:auto to center; those fight explicit left/top values and cause a
    // jump + coordinate mismatch on drag start).
    target.style.translate = 'none';
    target.style.inset = 'auto';
    target.style.margin = '0';
    target.style.left = `${rect.left}px`;
    target.style.top = `${rect.top}px`;

    this._startLeft = rect.left;
    this._startTop = rect.top;
    this._dragging = true;
  }

  private _moveDrag(detail: DragGestureDetail): void {
    if (!this._dragging) {
      return;
    }

    const target = this._target();
    const { axis } = this._opts;
    const [minL, minT, maxR, maxB] = this._boundsRect();

    const newLeft =
      axis !== 'y'
        ? Math.min(Math.max(this._startLeft + detail.deltaX, minL), maxR - target.offsetWidth)
        : parseFloat(target.style.left) || 0;

    const newTop =
      axis !== 'x'
        ? Math.min(Math.max(this._startTop + detail.deltaY, minT), maxB - target.offsetHeight)
        : parseFloat(target.style.top) || 0;

    target.style.left = `${newLeft}px`;
    target.style.top = `${newTop}px`;
  }

  private _finishDrag(): void {
    if (!this._dragging) {
      return;
    }

    this._dragging = false;
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (this._opts.disabled) {
      return;
    }

    // Only when the handle itself has focus, not a child element
    if (e.currentTarget !== e.target) {
      return;
    }

    const { axis } = this._opts;
    const step = e.shiftKey ? this._opts.step * 10 : this._opts.step;
    let dx = 0;
    let dy = 0;

    switch (e.key) {
      case 'ArrowLeft':
        if (axis === 'y') {
          return;
        }

        dx = -step;
        break;
      case 'ArrowRight':
        if (axis === 'y') {
          return;
        }

        dx = step;
        break;
      case 'ArrowUp':
        if (axis === 'x') {
          return;
        }

        dy = -step;
        break;
      case 'ArrowDown':
        if (axis === 'x') {
          return;
        }

        dy = step;
        break;
      default:
        return;
    }

    const target = this._target();

    if (getComputedStyle(target).position === 'static') {
      const rect = target.getBoundingClientRect();

      target.style.position = 'fixed';
      target.style.translate = 'none';
      target.style.left = `${rect.left}px`;
      target.style.top = `${rect.top}px`;
    }

    const [minL, minT, maxR, maxB] = this._boundsRect();
    const curLeft = parseFloat(target.style.left) || 0;
    const curTop = parseFloat(target.style.top) || 0;

    target.style.left = `${Math.min(Math.max(curLeft + dx, minL), maxR - target.offsetWidth)}px`;
    target.style.top = `${Math.min(Math.max(curTop + dy, minT), maxB - target.offsetHeight)}px`;

    e.preventDefault();
    e.stopPropagation();
  }

  private _boundsRect(): [number, number, number, number] {
    const { bounds } = this._opts;

    if (!bounds || bounds === 'viewport') {
      return [0, 0, window.innerWidth, window.innerHeight];
    }

    if (bounds === 'parent') {
      const parent = (this._opts.target as HTMLElement).parentElement;

      if (!parent) {
        return [0, 0, window.innerWidth, window.innerHeight];
      }

      const r = parent.getBoundingClientRect();

      return [r.left, r.top, r.right, r.bottom];
    }

    const r = (bounds as Element).getBoundingClientRect();

    return [r.left, r.top, r.right, r.bottom];
  }
}
