import type { ReactiveController, ReactiveControllerHost } from 'lit';

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
  private _opts: Required<Omit<DragOptions, 'handle' | 'bounds'>> & Pick<DragOptions, 'handle' | 'bounds'>;

  private _dragging = false;
  private _startX = 0;
  private _startY = 0;
  private _startLeft = 0;
  private _startTop = 0;

  private readonly _onPointerDown: (e: PointerEvent) => void;
  private readonly _onPointerMove: (e: PointerEvent) => void;
  private readonly _onPointerUp: (e: PointerEvent) => void;
  private readonly _onPointerCancel: (e: PointerEvent) => void;
  private readonly _onLostPointerCapture: (e: PointerEvent) => void;
  private readonly _onKeyDown: (e: KeyboardEvent) => void;

  constructor(host: ReactiveControllerHost, options: DragOptions) {
    this._opts = { axis: 'both', step: 4, disabled: false, handle: null, bounds: 'viewport', ...options };

    this._onPointerDown = this._handlePointerDown.bind(this);
    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);
    this._onPointerCancel = this._cancelDrag.bind(this);
    this._onLostPointerCapture = this._handleLostPointerCapture.bind(this);
    this._onKeyDown = this._handleKeyDown.bind(this);

    // Must be last: if host is already connected, addController calls hostConnected() synchronously.
    host.addController(this);
  }

  setOptions(next: Partial<DragOptions>): void {
    const prevHandle = this._handle();
    Object.assign(this._opts, next);
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
    handle.addEventListener('pointerdown', this._onPointerDown as EventListener);
    handle.addEventListener('keydown', this._onKeyDown as EventListener);
    if (!handle.hasAttribute('tabindex')) {
      (handle as HTMLElement).setAttribute('tabindex', '0');
    }
  }

  private _detachFrom(handle: Element): void {
    handle.removeEventListener('pointerdown', this._onPointerDown as EventListener);
    handle.removeEventListener('keydown', this._onKeyDown as EventListener);
    handle.removeEventListener('pointermove', this._onPointerMove as EventListener);
    handle.removeEventListener('pointerup', this._onPointerUp as EventListener);
    handle.removeEventListener('pointercancel', this._onPointerCancel as EventListener);
    handle.removeEventListener('lostpointercapture', this._onLostPointerCapture as EventListener);
  }

  private _handlePointerDown(e: PointerEvent): void {
    if (this._opts.disabled) return;
    // Don't start drag when clicking interactive children (buttons, links)
    if ((e.target as Element).closest('button, [role="button"], a')) return;

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

    this._startX = e.clientX;
    this._startY = e.clientY;
    this._startLeft = rect.left;
    this._startTop = rect.top;
    this._dragging = true;

    const handle = this._handle() as HTMLElement;
    handle.setPointerCapture(e.pointerId);
    handle.addEventListener('pointermove', this._onPointerMove as EventListener);
    handle.addEventListener('pointerup', this._onPointerUp as EventListener);
    handle.addEventListener('pointercancel', this._onPointerCancel as EventListener);
    // If another controller steals pointer capture, lostpointercapture fires on
    // the handle and we abort — belt-and-suspenders alongside ResizeController's
    // capture-phase stopPropagation.
    handle.addEventListener('lostpointercapture', this._onLostPointerCapture as EventListener);

    e.preventDefault();
  }

  private _handlePointerMove(e: PointerEvent): void {
    if (!this._dragging) return;
    const target = this._target();
    const { axis } = this._opts;
    const [minL, minT, maxR, maxB] = this._boundsRect();

    const newLeft = axis !== 'y'
      ? Math.min(Math.max(this._startLeft + e.clientX - this._startX, minL), maxR - target.offsetWidth)
      : parseFloat(target.style.left) || 0;

    const newTop = axis !== 'x'
      ? Math.min(Math.max(this._startTop + e.clientY - this._startY, minT), maxB - target.offsetHeight)
      : parseFloat(target.style.top) || 0;

    target.style.left = `${newLeft}px`;
    target.style.top = `${newTop}px`;
  }

  private _handlePointerUp(_e: PointerEvent): void {
    this._cancelDrag();
  }

  private _handleLostPointerCapture(_e: PointerEvent): void {
    this._cancelDrag();
  }

  private _cancelDrag(): void {
    if (!this._dragging) return;

    this._dragging = false;

    const handle = this._handle();
    handle.removeEventListener('pointermove', this._onPointerMove as EventListener);
    handle.removeEventListener('pointerup', this._onPointerUp as EventListener);
    handle.removeEventListener('pointercancel', this._onPointerCancel as EventListener);
    handle.removeEventListener('lostpointercapture', this._onLostPointerCapture as EventListener);
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (this._opts.disabled) return;
    // Only when the handle itself has focus, not a child element
    if (e.currentTarget !== e.target) return;

    const { axis } = this._opts;
    const step = e.shiftKey ? this._opts.step * 10 : this._opts.step;
    let dx = 0;
    let dy = 0;

    switch (e.key) {
      case 'ArrowLeft':  if (axis === 'y') return; dx = -step; break;
      case 'ArrowRight': if (axis === 'y') return; dx =  step; break;
      case 'ArrowUp':    if (axis === 'x') return; dy = -step; break;
      case 'ArrowDown':  if (axis === 'x') return; dy =  step; break;
      default: return;
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
      if (!parent) return [0, 0, window.innerWidth, window.innerHeight];
      const r = parent.getBoundingClientRect();
      return [r.left, r.top, r.right, r.bottom];
    }
    const r = (bounds as Element).getBoundingClientRect();
    return [r.left, r.top, r.right, r.bottom];
  }
}
