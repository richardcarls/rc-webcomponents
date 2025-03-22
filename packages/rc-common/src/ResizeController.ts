import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type ResizeDirection = 'none' | 'both' | 'horizontal' | 'vertical';

type ResizeEdge = 'e' | 's' | 'se';

export interface ResizeOptions {
  /** The element to resize. Its `width` / `height` styles are updated. */
  target: Element;
  /** Which edges are resizable, mirroring CSS `resize` values. Defaults to `'none'`. */
  direction?: ResizeDirection;
  /** Custom resize handle element. If omitted, edge detection on `target` is used. */
  handle?: Element | null;
  /** Edge hit-test thickness in px. Defaults to `8`. */
  threshold?: number;
  /** Bounds constraint. Defaults to `'viewport'`. */
  bounds?: 'viewport' | 'parent' | Element;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  /** Keyboard arrow-key step in px. Shift multiplies by 10. Defaults to `4`. */
  step?: number;
  disabled?: boolean;
}

/**
 * Makes an element resizable via pointer (edge detection) and keyboard.
 *
 * When no custom `handle` is provided, the controller detects pointer proximity
 * to active edges and updates the cursor. A small transparent `<button>` is
 * injected at the bottom-right corner for keyboard-accessible resizing via
 * Arrow keys.
 */
export class ResizeController implements ReactiveController {
  private _opts: Required<Omit<ResizeOptions, 'handle' | 'bounds' | 'maxWidth' | 'maxHeight'>>
    & Pick<ResizeOptions, 'handle' | 'bounds' | 'maxWidth' | 'maxHeight'>;

  private _resizing: ResizeEdge | null = null;
  private _startX = 0;
  private _startY = 0;
  private _startW = 0;
  private _startH = 0;

  private _cornerBtn: HTMLButtonElement | null = null;

  private readonly _onPointerMove: (e: PointerEvent) => void;
  private readonly _onPointerDown: (e: PointerEvent) => void;
  private readonly _onPointerUp: (e: PointerEvent) => void;
  private readonly _onPointerLeave: (e: PointerEvent) => void;
  private readonly _onKeyDown: (e: KeyboardEvent) => void;

  constructor(host: ReactiveControllerHost, options: ResizeOptions) {
    this._opts = {
      direction: 'none',
      threshold: 8,
      step: 4,
      disabled: false,
      minWidth: 100,
      minHeight: 60,
      handle: null,
      bounds: 'viewport',
      ...options,
    };

    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerDown = this._handlePointerDown.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);
    this._onPointerLeave = this._handlePointerLeave.bind(this);
    this._onKeyDown = this._handleKeyDown.bind(this);

    // Must be last: if host is already connected, addController calls hostConnected() synchronously.
    host.addController(this);
  }

  setOptions(next: Partial<ResizeOptions>): void {
    Object.assign(this._opts, next);
  }

  hostConnected(): void {
    if (this._opts.direction === 'none') return;
    const target = this._target();
    target.addEventListener('pointermove', this._onPointerMove as EventListener);
    target.addEventListener('pointerdown', this._onPointerDown as EventListener);
    target.addEventListener('pointerup', this._onPointerUp as EventListener);
    target.addEventListener('pointerleave', this._onPointerLeave as EventListener);
    this._injectCornerButton();
  }

  hostDisconnected(): void {
    const target = this._target();
    target.removeEventListener('pointermove', this._onPointerMove as EventListener);
    target.removeEventListener('pointerdown', this._onPointerDown as EventListener);
    target.removeEventListener('pointerup', this._onPointerUp as EventListener);
    target.removeEventListener('pointerleave', this._onPointerLeave as EventListener);
    this._removeCornerButton();
  }

  private _target(): HTMLElement {
    return this._opts.target as HTMLElement;
  }

  private _injectCornerButton(): void {
    if (this._opts.handle) return;

    // Ensure target is a positioned ancestor for absolute children
    const target = this._target();
    if (getComputedStyle(target).position === 'static') {
      target.style.position = 'relative';
    }

    const btn = document.createElement('button');
    btn.setAttribute('data-rc-resize-corner', '');
    btn.setAttribute('aria-label', 'Resize');
    btn.type = 'button';
    Object.assign(btn.style, {
      position: 'absolute',
      bottom: '0',
      right: '0',
      width: '12px',
      height: '12px',
      padding: '0',
      border: 'none',
      background: 'transparent',
      cursor: this._cornerCursor(),
      zIndex: '1',
    });
    btn.addEventListener('keydown', this._onKeyDown as EventListener);
    target.appendChild(btn);
    this._cornerBtn = btn;
  }

  private _removeCornerButton(): void {
    if (!this._cornerBtn) return;
    this._cornerBtn.removeEventListener('keydown', this._onKeyDown as EventListener);
    this._cornerBtn.remove();
    this._cornerBtn = null;
  }

  private _cornerCursor(): string {
    switch (this._opts.direction) {
      case 'both':       return 'se-resize';
      case 'horizontal': return 'e-resize';
      case 'vertical':   return 's-resize';
      default:           return 'default';
    }
  }

  private _detectEdge(e: PointerEvent): ResizeEdge | null {
    const { direction, threshold } = this._opts;
    if (direction === 'none') return null;

    const rect = this._target().getBoundingClientRect();
    const nearE = direction !== 'vertical'   && e.clientX >= rect.right  - threshold;
    const nearS = direction !== 'horizontal' && e.clientY >= rect.bottom - threshold;

    if (nearE && nearS && direction === 'both') return 'se';
    if (nearE) return 'e';
    if (nearS) return 's';
    return null;
  }

  private _handlePointerMove(e: PointerEvent): void {
    if (this._resizing) {
      const target = this._target();
      const [, , maxR, maxB] = this._boundsRect();
      const rect = target.getBoundingClientRect();
      const { minWidth = 100, maxWidth, minHeight = 60, maxHeight } = this._opts;

      if (this._resizing === 'e' || this._resizing === 'se') {
        const newW = Math.max(this._startW + (e.clientX - this._startX), minWidth);
        target.style.width = `${maxWidth !== undefined ? Math.min(newW, maxWidth, maxR - rect.left) : Math.min(newW, maxR - rect.left)}px`;
      }
      if (this._resizing === 's' || this._resizing === 'se') {
        const newH = Math.max(this._startH + (e.clientY - this._startY), minHeight);
        target.style.height = `${maxHeight !== undefined ? Math.min(newH, maxHeight, maxB - rect.top) : Math.min(newH, maxB - rect.top)}px`;
      }
      return;
    }

    // Cursor detection when not actively resizing
    if (this._opts.handle) return;
    const edge = this._detectEdge(e);
    const target = this._target();
    switch (edge) {
      case 'se': target.style.cursor = 'se-resize'; break;
      case 'e':  target.style.cursor = 'e-resize';  break;
      case 's':  target.style.cursor = 's-resize';  break;
      default:   target.style.cursor = '';
    }
  }

  private _handlePointerDown(e: PointerEvent): void {
    if (this._opts.disabled) return;
    const edge = this._detectEdge(e);
    if (!edge) return;

    const target = this._target();
    this._startX = e.clientX;
    this._startY = e.clientY;
    this._startW = target.offsetWidth;
    this._startH = target.offsetHeight;
    this._resizing = edge;

    target.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  private _handlePointerUp(_e: PointerEvent): void {
    this._resizing = null;
  }

  private _handlePointerLeave(_e: PointerEvent): void {
    if (!this._resizing) {
      this._target().style.cursor = '';
    }
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (this._opts.disabled) return;

    const step = e.shiftKey ? this._opts.step * 10 : this._opts.step;
    const target = this._target();
    const [, , maxR, maxB] = this._boundsRect();
    const rect = target.getBoundingClientRect();
    const { minWidth = 100, maxWidth, minHeight = 60, maxHeight, direction } = this._opts;

    switch (e.key) {
      case 'ArrowRight': {
        if (direction === 'vertical') return;
        const max = maxWidth !== undefined ? Math.min(maxWidth, maxR - rect.left) : maxR - rect.left;
        target.style.width = `${Math.min(Math.max(target.offsetWidth + step, minWidth), max)}px`;
        break;
      }
      case 'ArrowLeft': {
        if (direction === 'vertical') return;
        target.style.width = `${Math.max(target.offsetWidth - step, minWidth)}px`;
        break;
      }
      case 'ArrowDown': {
        if (direction === 'horizontal') return;
        const max = maxHeight !== undefined ? Math.min(maxHeight, maxB - rect.top) : maxB - rect.top;
        target.style.height = `${Math.min(Math.max(target.offsetHeight + step, minHeight), max)}px`;
        break;
      }
      case 'ArrowUp': {
        if (direction === 'horizontal') return;
        target.style.height = `${Math.max(target.offsetHeight - step, minHeight)}px`;
        break;
      }
      default: return;
    }

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
