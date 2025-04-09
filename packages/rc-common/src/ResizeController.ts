import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type ResizeDirection = 'none' | 'both' | 'horizontal' | 'vertical';

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export interface ResizeOptions {
  /** The element to resize. Its `width` / `height` (and `left` / `top` for opposite edges) styles are updated. */
  target: Element;
  /** Which edges are resizable, mirroring CSS `resize` values. Defaults to `'none'`. */
  direction?: ResizeDirection;
  /** Custom resize handle element. If omitted, edge detection on `target` is used. */
  handle?: Element | null;
  /** Edge hit-test thickness in px (straddles the edge, inside + outside). Defaults to `8`. */
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
 * Supports all 8 resize handles (n, s, e, w, ne, nw, se, sw) depending on
 * the configured `direction`. Opposite-edge resizes (w / n / nw / ne / sw)
 * anchor the far corner and mutate `left` / `top` accordingly, mirroring
 * OS-windowed resize semantics.
 *
 * On resize start the element's position and size are pinned as explicit
 * `border-box` pixel values so UA centering styles (e.g. `inset:0; margin:auto`
 * on `<dialog>`) cannot fight the resize calculations.
 */
export class ResizeController implements ReactiveController {
  private _opts: Required<Omit<ResizeOptions, 'handle' | 'bounds' | 'maxWidth' | 'maxHeight'>>
    & Pick<ResizeOptions, 'handle' | 'bounds' | 'maxWidth' | 'maxHeight'>;

  private _resizing: ResizeEdge | null = null;
  private _startX = 0;
  private _startY = 0;
  private _startW = 0;
  private _startH = 0;
  private _startLeft = 0;
  private _startTop = 0;

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

    host.addController(this);
  }

  setOptions(next: Partial<ResizeOptions>): void {
    Object.assign(this._opts, next);
  }

  hostConnected(): void {
    if (this._opts.direction === 'none') return;
    const target = this._target();
    target.addEventListener('pointermove', this._onPointerMove as EventListener);
    // Capture phase so this fires before any descendant handler (e.g. DragController
    // listening on a child handle). When an edge is detected we stopPropagation,
    // which prevents drag from starting on the same pointerdown.
    target.addEventListener('pointerdown', this._onPointerDown as EventListener, { capture: true });
    target.addEventListener('pointerup', this._onPointerUp as EventListener);
    target.addEventListener('pointerleave', this._onPointerLeave as EventListener);
    this._injectCornerButton();
  }

  hostDisconnected(): void {
    const target = this._target();
    target.removeEventListener('pointermove', this._onPointerMove as EventListener);
    target.removeEventListener('pointerdown', this._onPointerDown as EventListener, { capture: true });
    target.removeEventListener('pointerup', this._onPointerUp as EventListener);
    target.removeEventListener('pointerleave', this._onPointerLeave as EventListener);
    this._removeCornerButton();
  }

  private _target(): HTMLElement {
    return this._opts.target as HTMLElement;
  }

  private _injectCornerButton(): void {
    if (this._opts.handle) return;

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
      case 'horizontal': return 'ew-resize';
      case 'vertical':   return 'ns-resize';
      default:           return 'default';
    }
  }

  private _edgeCursor(edge: ResizeEdge): string {
    const map: Record<ResizeEdge, string> = {
      n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize',
      ne: 'ne-resize', nw: 'nw-resize', se: 'se-resize', sw: 'sw-resize',
    };
    return map[edge];
  }

  private _detectEdge(e: PointerEvent): ResizeEdge | null {
    const { direction, threshold } = this._opts;
    if (direction === 'none') return null;

    const rect = this._target().getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // Each "near" flag straddles the edge: threshold px inside AND outside.
    // Perpendicular extent guards prevent the modal <dialog> backdrop (which
    // routes all pointermove events to the dialog) from triggering resize
    // anywhere in the viewport below/right/above/left of the dialog.
    const nearRight  = x >= rect.right  - threshold && x <= rect.right  + threshold;
    const nearLeft   = x >= rect.left   - threshold && x <= rect.left   + threshold;
    const nearBottom = y >= rect.bottom - threshold && y <= rect.bottom + threshold;
    const nearTop    = y >= rect.top    - threshold && y <= rect.top    + threshold;
    const inHoriz    = x >= rect.left && x <= rect.right;
    const inVert     = y >= rect.top  && y <= rect.bottom;

    if (direction === 'both') {
      // Corners take priority; their two-axis proximity is self-constraining.
      if (nearRight  && nearBottom) return 'se';
      if (nearLeft   && nearBottom) return 'sw';
      if (nearRight  && nearTop)    return 'ne';
      if (nearLeft   && nearTop)    return 'nw';
      if (nearRight  && inVert)     return 'e';
      if (nearLeft   && inVert)     return 'w';
      if (nearBottom && inHoriz)    return 's';
      if (nearTop    && inHoriz)    return 'n';
    }
    if (direction === 'horizontal') {
      if (nearRight && inVert) return 'e';
      if (nearLeft  && inVert) return 'w';
    }
    if (direction === 'vertical') {
      if (nearBottom && inHoriz) return 's';
      if (nearTop    && inHoriz) return 'n';
    }
    return null;
  }

  /**
   * Pins position and size as explicit border-box pixel values.
   *
   * Required before any resize so that:
   * - UA centering styles (`inset:0; margin:auto` on `<dialog>`) don't fight
   *   explicit left/top changes on n/w edges.
   * - Changing width/height alone doesn't redistribute auto-margins and shift
   *   the element for e/s edges.
   * - box-sizing is known, so `style.width = rect.width` is a no-op visually.
   */
  private _pinPosition(target: HTMLElement): DOMRect {
    const rect = target.getBoundingClientRect();
    if (getComputedStyle(target).position === 'static') {
      target.style.position = 'fixed';
    }
    target.style.translate  = 'none';
    target.style.inset      = 'auto';
    target.style.margin     = '0';
    target.style.boxSizing  = 'border-box';
    target.style.left       = `${rect.left}px`;
    target.style.top        = `${rect.top}px`;
    target.style.width      = `${rect.width}px`;
    target.style.height     = `${rect.height}px`;
    return rect;
  }

  private _handlePointerDown(e: PointerEvent): void {
    if (this._opts.disabled) return;
    const edge = this._detectEdge(e);
    if (!edge) return;

    // We have capture-phase priority over any descendant handler (e.g. a drag
    // handle inside this element). Claiming the event here ensures only one
    // controller owns this pointer — no lostpointercapture race needed.
    e.stopPropagation();

    const target = this._target();
    const rect = this._pinPosition(target);

    this._startX    = e.clientX;
    this._startY    = e.clientY;
    this._startW    = rect.width;
    this._startH    = rect.height;
    this._startLeft = rect.left;
    this._startTop  = rect.top;
    this._resizing  = edge;

    target.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  private _handlePointerMove(e: PointerEvent): void {
    if (this._resizing) {
      const target = this._target();
      const [minL, minT, maxR, maxB] = this._boundsRect();
      const { minWidth, maxWidth, minHeight, maxHeight } = this._opts;
      const dx = e.clientX - this._startX;
      const dy = e.clientY - this._startY;
      const edge = this._resizing;

      // Right side extends; left stays fixed.
      if (edge === 'e' || edge === 'se' || edge === 'ne') {
        const maxW = Math.min(maxWidth ?? Infinity, maxR - this._startLeft);
        target.style.width = `${Math.min(Math.max(this._startW + dx, minWidth), maxW)}px`;
      }

      // Left side moves; right stays fixed at startLeft + startW.
      if (edge === 'w' || edge === 'sw' || edge === 'nw') {
        const rightFixed = this._startLeft + this._startW;
        const newLeft = Math.min(
          Math.max(this._startLeft + dx, minL, maxWidth !== undefined ? rightFixed - maxWidth : -Infinity),
          rightFixed - minWidth,
        );
        target.style.left  = `${newLeft}px`;
        target.style.width = `${rightFixed - newLeft}px`;
      }

      // Bottom side extends; top stays fixed.
      if (edge === 's' || edge === 'se' || edge === 'sw') {
        const maxH = Math.min(maxHeight ?? Infinity, maxB - this._startTop);
        target.style.height = `${Math.min(Math.max(this._startH + dy, minHeight), maxH)}px`;
      }

      // Top side moves; bottom stays fixed at startTop + startH.
      if (edge === 'n' || edge === 'ne' || edge === 'nw') {
        const bottomFixed = this._startTop + this._startH;
        const newTop = Math.min(
          Math.max(this._startTop + dy, minT, maxHeight !== undefined ? bottomFixed - maxHeight : -Infinity),
          bottomFixed - minHeight,
        );
        target.style.top    = `${newTop}px`;
        target.style.height = `${bottomFixed - newTop}px`;
      }

      return;
    }

    // Cursor hint when not actively resizing.
    if (this._opts.handle) return;
    const edge = this._detectEdge(e);
    const target = this._target();
    target.style.cursor = edge ? this._edgeCursor(edge) : '';
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

    const { direction } = this._opts;
    const isHoriz = e.key === 'ArrowRight' || e.key === 'ArrowLeft';
    const isVert  = e.key === 'ArrowDown'  || e.key === 'ArrowUp';

    if (isHoriz && direction === 'vertical')   return;
    if (isVert  && direction === 'horizontal') return;
    if (!isHoriz && !isVert) return;

    e.preventDefault();
    e.stopPropagation();

    const target = this._target();
    // Pin on first keyboard resize so auto-margins don't fight explicit sizes.
    const rect = this._pinPosition(target);

    const step = e.shiftKey ? this._opts.step * 10 : this._opts.step;
    const [, , maxR, maxB] = this._boundsRect();
    const { minWidth, maxWidth, minHeight, maxHeight } = this._opts;

    if (e.key === 'ArrowRight') {
      const max = Math.min(maxWidth ?? Infinity, maxR - rect.left);
      target.style.width = `${Math.min(Math.max(target.offsetWidth + step, minWidth), max)}px`;
    }
    if (e.key === 'ArrowLeft') {
      target.style.width = `${Math.max(target.offsetWidth - step, minWidth)}px`;
    }
    if (e.key === 'ArrowDown') {
      const max = Math.min(maxHeight ?? Infinity, maxB - rect.top);
      target.style.height = `${Math.min(Math.max(target.offsetHeight + step, minHeight), max)}px`;
    }
    if (e.key === 'ArrowUp') {
      target.style.height = `${Math.max(target.offsetHeight - step, minHeight)}px`;
    }
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
