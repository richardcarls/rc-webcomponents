import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type ResizeDirection = 'none' | 'both' | 'horizontal' | 'vertical';

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export type ResizeOrigin =
  | ''
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface ResizeLifecycleDetail {
  edge: ResizeEdge;
  inputType: 'pointer' | 'keyboard';
  startWidth: number;
  startHeight: number;
  width: number;
  height: number;
  deltaX: number;
  deltaY: number;
}

export interface ResizeOptions {
  /** The element to resize. Its `width` / `height` (and `left` / `top` for opposite edges) styles are updated. */
  target: Element;
  /** Which edges are resizable, mirroring CSS `resize` values. Defaults to `'none'`. */
  direction?: ResizeDirection;
  /** Custom resize handle element. If omitted, edge detection on `target` is used. */
  handle?: Element | null;
  /** Origin used for an explicit handle, or to constrain edge hit-testing. Empty preserves free edge detection. */
  origin?: ResizeOrigin;
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
  onResizeStart?: (detail: ResizeLifecycleDetail) => void;
  onResize?: (detail: ResizeLifecycleDetail) => void;
  onResizeEnd?: (detail: ResizeLifecycleDetail) => void;
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
  private _opts: Required<
    Omit<
      ResizeOptions,
      'handle' | 'bounds' | 'maxWidth' | 'maxHeight' | 'onResizeStart' | 'onResize' | 'onResizeEnd'
    >
  > &
    Pick<
      ResizeOptions,
      'handle' | 'bounds' | 'maxWidth' | 'maxHeight' | 'onResizeStart' | 'onResize' | 'onResizeEnd'
    >;

  private _resizing: ResizeEdge | null = null;
  private _startX = 0;
  private _startY = 0;
  private _startW = 0;
  private _startH = 0;
  private _startLeft = 0;
  private _startTop = 0;
  private _lastDeltaX = 0;
  private _lastDeltaY = 0;
  private _activeHandle: Element | null = null;

  // Effective minimums for the current resize gesture — the larger of the JS
  // option and the element's computed CSS min-width/min-height. Computed once
  // at pointer-down so the browser's enforcement of CSS min-width doesn't
  // cause the opposite edge (left/top) to drift when the JS minimum is smaller.
  private _effectiveMinW = 0;
  private _effectiveMinH = 0;

  // Effective maximums for the current resize gesture — the smaller of the JS
  // option and the element's computed CSS max-width/max-height (e.g. a themed
  // `max-block-size`). Without this, dragging past a CSS-only max clips the
  // rendered box while the JS math keeps moving the pinned edge, making the
  // whole element appear to slide rather than clamp.
  private _effectiveMaxW = Infinity;
  private _effectiveMaxH = Infinity;

  private _cornerBtn: HTMLButtonElement | null = null;

  private readonly _onPointerMove: (e: PointerEvent) => void;
  private readonly _onPointerDown: (e: PointerEvent) => void;
  private readonly _onPointerUp: (e: PointerEvent) => void;
  private readonly _onPointerCancel: (e: PointerEvent) => void;
  private readonly _onLostPointerCapture: (e: PointerEvent) => void;
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
      origin: '',
      bounds: 'viewport',
      ...options,
    };

    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerDown = this._handlePointerDown.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);
    this._onPointerCancel = this._cancelResize.bind(this);
    this._onLostPointerCapture = this._cancelResize.bind(this);
    this._onPointerLeave = this._handlePointerLeave.bind(this);
    this._onKeyDown = this._handleKeyDown.bind(this);

    host.addController(this);
  }

  setOptions(next: Partial<ResizeOptions>): void {
    const previousHandle = this._opts.handle;

    Object.assign(this._opts, next);

    if (previousHandle !== this._opts.handle) {
      this._detachFromHandle(previousHandle);
      this._attachToHandle(this._opts.handle);
    }
  }

  hostConnected(): void {
    if (this._opts.direction === 'none') {
      return;
    }

    if (this._opts.handle) {
      this._attachToHandle(this._opts.handle);

      return;
    }

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
    if (this._opts.handle) {
      this._detachFromHandle(this._opts.handle);

      return;
    }

    const target = this._target();

    target.removeEventListener('pointermove', this._onPointerMove as EventListener);

    target.removeEventListener('pointerdown', this._onPointerDown as EventListener, {
      capture: true,
    });

    target.removeEventListener('pointerup', this._onPointerUp as EventListener);
    target.removeEventListener('pointerleave', this._onPointerLeave as EventListener);
    this._removeCornerButton();
  }

  private _target(): HTMLElement {
    return this._opts.target as HTMLElement;
  }

  private _handle(): HTMLElement | null {
    return this._opts.handle as HTMLElement | null;
  }

  private _attachToHandle(handle: Element | null | undefined): void {
    if (!handle || this._opts.direction === 'none') {
      return;
    }

    handle.addEventListener('pointerdown', this._onPointerDown as EventListener);
    handle.addEventListener('keydown', this._onKeyDown as EventListener);
    (handle as HTMLElement).style.cursor = this._edgeCursor(this._handleEdge());
    (handle as HTMLElement).style.touchAction = 'none';

    if (!handle.hasAttribute('tabindex')) {
      (handle as HTMLElement).setAttribute('tabindex', '0');
    }
  }

  private _detachFromHandle(handle: Element | null | undefined): void {
    if (!handle) {
      return;
    }

    handle.removeEventListener('pointerdown', this._onPointerDown as EventListener);
    handle.removeEventListener('keydown', this._onKeyDown as EventListener);
    handle.removeEventListener('pointermove', this._onPointerMove as EventListener);
    handle.removeEventListener('pointerup', this._onPointerUp as EventListener);
    handle.removeEventListener('pointercancel', this._onPointerCancel as EventListener);
    handle.removeEventListener('lostpointercapture', this._onLostPointerCapture as EventListener);
  }

  private _injectCornerButton(): void {
    if (this._opts.handle) {
      return;
    }

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
    if (!this._cornerBtn) {
      return;
    }

    this._cornerBtn.removeEventListener('keydown', this._onKeyDown as EventListener);
    this._cornerBtn.remove();
    this._cornerBtn = null;
  }

  private _cornerCursor(): string {
    switch (this._opts.direction) {
      case 'both':
        return 'se-resize';
      case 'horizontal':
        return 'ew-resize';
      case 'vertical':
        return 'ns-resize';
      default:
        return 'default';
    }
  }

  private _edgeCursor(edge: ResizeEdge): string {
    const map: Record<ResizeEdge, string> = {
      n: 'n-resize',
      s: 's-resize',
      e: 'e-resize',
      w: 'w-resize',
      ne: 'ne-resize',
      nw: 'nw-resize',
      se: 'se-resize',
      sw: 'sw-resize',
    };

    return map[edge];
  }

  private _handleEdge(): ResizeEdge {
    return this._edgeForOrigin(this._opts.origin) ?? this._defaultHandleEdge();
  }

  private _defaultHandleEdge(): ResizeEdge {
    switch (this._opts.direction) {
      case 'both':
        return 'se';
      case 'horizontal':
        return 'e';
      case 'vertical':
        return 's';
      default:
        return 'se';
    }
  }

  private _edgeForOrigin(origin: ResizeOrigin): ResizeEdge | null {
    if (!origin) {
      return null;
    }

    const hasTop = origin.includes('top');
    const hasBottom = origin.includes('bottom');
    const hasLeft = origin.includes('left');
    const hasRight = origin.includes('right');

    if (this._opts.direction === 'vertical') {
      if (hasTop) {
        return 'n';
      }

      if (hasBottom) {
        return 's';
      }

      return null;
    }

    if (this._opts.direction === 'horizontal') {
      if (hasLeft) {
        return 'w';
      }

      if (hasRight) {
        return 'e';
      }

      return null;
    }

    if (this._opts.direction === 'both') {
      if (hasTop && hasLeft) {
        return 'nw';
      }

      if (hasTop && hasRight) {
        return 'ne';
      }

      if (hasBottom && hasLeft) {
        return 'sw';
      }

      if (hasBottom && hasRight) {
        return 'se';
      }

      if (hasTop) {
        return 'n';
      }

      if (hasBottom) {
        return 's';
      }

      if (hasLeft) {
        return 'w';
      }

      if (hasRight) {
        return 'e';
      }
    }

    return null;
  }

  private _edgeAllowsPointer(edge: ResizeEdge, e: PointerEvent): boolean {
    const { threshold } = this._opts;
    const rect = this._target().getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    const nearRight = x >= rect.right - threshold && x <= rect.right + threshold;
    const nearLeft = x >= rect.left - threshold && x <= rect.left + threshold;
    const nearBottom = y >= rect.bottom - threshold && y <= rect.bottom + threshold;
    const nearTop = y >= rect.top - threshold && y <= rect.top + threshold;
    const inHoriz = x >= rect.left && x <= rect.right;
    const inVert = y >= rect.top && y <= rect.bottom;

    switch (edge) {
      case 'n':
        return nearTop && inHoriz;
      case 's':
        return nearBottom && inHoriz;
      case 'e':
        return nearRight && inVert;
      case 'w':
        return nearLeft && inVert;
      case 'ne':
        return nearTop && nearRight;
      case 'nw':
        return nearTop && nearLeft;
      case 'se':
        return nearBottom && nearRight;
      case 'sw':
        return nearBottom && nearLeft;
    }
  }

  private _detectEdge(e: PointerEvent): ResizeEdge | null {
    const { direction, threshold } = this._opts;

    if (direction === 'none') {
      return null;
    }

    const originEdge = this._edgeForOrigin(this._opts.origin);

    if (originEdge) {
      return this._edgeAllowsPointer(originEdge, e) ? originEdge : null;
    }

    const rect = this._target().getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    // Each "near" flag straddles the edge: threshold px inside AND outside.
    // Perpendicular extent guards prevent the modal <dialog> backdrop (which
    // routes all pointermove events to the dialog) from triggering resize
    // anywhere in the viewport below/right/above/left of the dialog.
    const nearRight = x >= rect.right - threshold && x <= rect.right + threshold;
    const nearLeft = x >= rect.left - threshold && x <= rect.left + threshold;
    const nearBottom = y >= rect.bottom - threshold && y <= rect.bottom + threshold;
    const nearTop = y >= rect.top - threshold && y <= rect.top + threshold;
    const inHoriz = x >= rect.left && x <= rect.right;
    const inVert = y >= rect.top && y <= rect.bottom;

    if (direction === 'both') {
      // Corners take priority; their two-axis proximity is self-constraining.
      if (nearRight && nearBottom) {
        return 'se';
      }

      if (nearLeft && nearBottom) {
        return 'sw';
      }

      if (nearRight && nearTop) {
        return 'ne';
      }

      if (nearLeft && nearTop) {
        return 'nw';
      }

      if (nearRight && inVert) {
        return 'e';
      }

      if (nearLeft && inVert) {
        return 'w';
      }

      if (nearBottom && inHoriz) {
        return 's';
      }

      if (nearTop && inHoriz) {
        return 'n';
      }
    }

    if (direction === 'horizontal') {
      if (nearRight && inVert) {
        return 'e';
      }

      if (nearLeft && inVert) {
        return 'w';
      }
    }

    if (direction === 'vertical') {
      if (nearBottom && inHoriz) {
        return 's';
      }

      if (nearTop && inHoriz) {
        return 'n';
      }
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

    target.style.translate = 'none';
    target.style.inset = 'auto';
    target.style.margin = '0';
    target.style.boxSizing = 'border-box';
    target.style.left = `${rect.left}px`;
    target.style.top = `${rect.top}px`;
    target.style.width = `${rect.width}px`;
    target.style.height = `${rect.height}px`;

    return rect;
  }

  private _handlePointerDown(e: PointerEvent): void {
    if (this._opts.disabled) {
      return;
    }

    const handle = this._handle();
    const edge = handle ? this._handleEdge() : this._detectEdge(e);

    if (!edge) {
      return;
    }

    // We have capture-phase priority over any descendant handler (e.g. a drag
    // handle inside this element). Claiming the event here ensures only one
    // controller owns this pointer — no lostpointercapture race needed.
    e.stopPropagation();

    this._startResize(edge, e.clientX, e.clientY);

    const captureTarget = handle ?? this._target();

    this._activeHandle = handle;
    captureTarget.setPointerCapture(e.pointerId);

    if (handle) {
      handle.addEventListener('pointermove', this._onPointerMove as EventListener);
      handle.addEventListener('pointerup', this._onPointerUp as EventListener);
      handle.addEventListener('pointercancel', this._onPointerCancel as EventListener);
      handle.addEventListener('lostpointercapture', this._onLostPointerCapture as EventListener);
    }

    e.preventDefault();
  }

  private _startResize(edge: ResizeEdge, startX: number, startY: number): void {
    const target = this._target();
    const rect = this._pinPosition(target);

    this._startX = startX;
    this._startY = startY;
    this._startW = rect.width;
    this._startH = rect.height;
    this._startLeft = rect.left;
    this._startTop = rect.top;
    this._lastDeltaX = 0;
    this._lastDeltaY = 0;
    this._resizing = edge;

    this._computeEffectiveExtents(target);
    this._opts.onResizeStart?.(this._lifecycleDetail('pointer'));
  }

  /**
   * Computed once per resize gesture (pointer-down or keyboard step) so the
   * browser's enforcement of CSS min/max-width/height doesn't fight the JS
   * math — otherwise a CSS-only max (e.g. a themed `max-block-size`) clips
   * the rendered box while the pinned edge keeps moving, making the whole
   * element appear to slide once dragged past its extent.
   */
  private _computeEffectiveExtents(target: HTMLElement): void {
    const cs = getComputedStyle(target);

    this._effectiveMinW = Math.max(this._opts.minWidth, parseFloat(cs.minWidth) || 0);
    this._effectiveMinH = Math.max(this._opts.minHeight, parseFloat(cs.minHeight) || 0);

    this._effectiveMaxW = Math.min(
      this._opts.maxWidth ?? Infinity,
      parseFloat(cs.maxWidth) || Infinity,
    );

    this._effectiveMaxH = Math.min(
      this._opts.maxHeight ?? Infinity,
      parseFloat(cs.maxHeight) || Infinity,
    );
  }

  private _lifecycleDetail(inputType: 'pointer' | 'keyboard'): ResizeLifecycleDetail {
    const target = this._target();

    return {
      edge: this._resizing ?? this._handleEdge(),
      inputType,
      startWidth: this._startW,
      startHeight: this._startH,
      width: target.getBoundingClientRect().width,
      height: target.getBoundingClientRect().height,
      deltaX: this._lastDeltaX,
      deltaY: this._lastDeltaY,
    };
  }

  private _handlePointerMove(e: PointerEvent): void {
    if (this._resizing) {
      const dx = e.clientX - this._startX;
      const dy = e.clientY - this._startY;
      const edge = this._resizing;

      this._lastDeltaX = dx;
      this._lastDeltaY = dy;
      this._applyDelta(edge, dx, dy);

      this._opts.onResize?.(this._lifecycleDetail('pointer'));

      return;
    }

    // Cursor hint when not actively resizing.
    if (this._opts.handle) {
      return;
    }

    const edge = this._detectEdge(e);
    const target = this._target();

    target.style.cursor = edge ? this._edgeCursor(edge) : '';
  }

  private _handlePointerUp(_e: PointerEvent): void {
    this._finishResize('pointer');
  }

  private _finishResize(inputType: 'pointer' | 'keyboard'): void {
    if (!this._resizing) {
      return;
    }

    const detail = this._lifecycleDetail(inputType);

    this._resizing = null;
    this._opts.onResizeEnd?.(detail);
    this._detachActiveHandleListeners();
  }

  private _cancelResize(): void {
    this._resizing = null;
    this._detachActiveHandleListeners();
  }

  private _detachActiveHandleListeners(): void {
    const handle = this._activeHandle;

    if (!handle) {
      return;
    }

    handle.removeEventListener('pointermove', this._onPointerMove as EventListener);
    handle.removeEventListener('pointerup', this._onPointerUp as EventListener);
    handle.removeEventListener('pointercancel', this._onPointerCancel as EventListener);
    handle.removeEventListener('lostpointercapture', this._onLostPointerCapture as EventListener);
    this._activeHandle = null;
  }

  private _handlePointerLeave(_e: PointerEvent): void {
    if (!this._resizing) {
      this._target().style.cursor = '';
    }
  }

  private _handleKeyDown(e: KeyboardEvent): void {
    if (this._opts.disabled) {
      return;
    }

    const { direction } = this._opts;
    const isHoriz = e.key === 'ArrowRight' || e.key === 'ArrowLeft';
    const isVert = e.key === 'ArrowDown' || e.key === 'ArrowUp';

    if (isHoriz && direction === 'vertical') {
      return;
    }

    if (isVert && direction === 'horizontal') {
      return;
    }

    if (!isHoriz && !isVert) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const target = this._target();
    // Pin on first keyboard resize so auto-margins don't fight explicit sizes.
    const rect = this._pinPosition(target);
    const edge = this._keyboardEdge(e.key);

    if (!edge) {
      return;
    }

    this._resizing = edge;
    this._startX = 0;
    this._startY = 0;
    this._startW = rect.width;
    this._startH = rect.height;
    this._startLeft = rect.left;
    this._startTop = rect.top;

    const step = e.shiftKey ? this._opts.step * 10 : this._opts.step;

    this._computeEffectiveExtents(target);

    const dx = e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0;
    const dy = e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0;

    this._lastDeltaX = dx;
    this._lastDeltaY = dy;
    this._applyDelta(edge, dx, dy);
    this._opts.onResize?.(this._lifecycleDetail('keyboard'));
    this._finishResize('keyboard');
  }

  private _keyboardEdge(key: string): ResizeEdge | null {
    const originEdge = this._edgeForOrigin(this._opts.origin);

    if (originEdge) {
      return originEdge;
    }

    if (key === 'ArrowRight' || key === 'ArrowLeft') {
      return this._opts.direction === 'both' || this._opts.direction === 'horizontal' ? 'e' : null;
    }

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      return this._opts.direction === 'both' || this._opts.direction === 'vertical' ? 's' : null;
    }

    return null;
  }

  private _applyDelta(edge: ResizeEdge, dx: number, dy: number): void {
    const target = this._target();
    const [minL, minT, maxR, maxB] = this._boundsRect();
    const minW = this._effectiveMinW;
    const minH = this._effectiveMinH;
    const maxW = this._effectiveMaxW;
    const maxH = this._effectiveMaxH;

    if (edge === 'e' || edge === 'se' || edge === 'ne') {
      const boundedMaxW = Math.min(maxW, maxR - this._startLeft);

      target.style.width = `${Math.min(Math.max(this._startW + dx, minW), boundedMaxW)}px`;
    }

    if (edge === 'w' || edge === 'sw' || edge === 'nw') {
      const rightFixed = this._startLeft + this._startW;
      const newLeft = Math.min(
        Math.max(this._startLeft + dx, minL, rightFixed - maxW),
        rightFixed - minW,
      );

      target.style.left = `${newLeft}px`;
      target.style.width = `${rightFixed - newLeft}px`;
    }

    if (edge === 's' || edge === 'se' || edge === 'sw') {
      const boundedMaxH = Math.min(maxH, maxB - this._startTop);

      target.style.height = `${Math.min(Math.max(this._startH + dy, minH), boundedMaxH)}px`;
    }

    if (edge === 'n' || edge === 'ne' || edge === 'nw') {
      const bottomFixed = this._startTop + this._startH;
      const newTop = Math.min(
        Math.max(this._startTop + dy, minT, bottomFixed - maxH),
        bottomFixed - minH,
      );

      target.style.top = `${newTop}px`;
      target.style.height = `${bottomFixed - newTop}px`;
    }
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
