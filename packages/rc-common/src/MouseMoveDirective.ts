import { nothing } from 'lit';

import { PartType, type PartInfo, type ElementPart } from 'lit/directive.js';

import { directive, AsyncDirective } from 'lit/async-directive.js';

/**
 * Lit element directive that invokes a callback during an active pointer drag.
 *
 * The exported name remains `mouseMove` for compatibility, but the directive
 * listens to Pointer Events so mouse, touch, and pen input share the same path.
 */
class MouseMoveDirective extends AsyncDirective {
  private _element?: WeakRef<HTMLElement>;
  private readonly _pointerDownHandle: (evt: PointerEvent) => void;
  private readonly _pointerMoveHandle: (evt: PointerEvent) => void;
  private readonly _pointerEndHandle: (evt: PointerEvent) => void;
  private _callback!: (evt: MouseEvent) => void;
  private _activePointerId: number | null = null;

  constructor(partInfo: PartInfo) {
    super(partInfo);

    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('The `mouseMove` directive must be used on an element.');
    }

    this._pointerDownHandle = this._onPointerDown.bind(this);
    this._pointerMoveHandle = this._onPointerMove.bind(this);
    this._pointerEndHandle = this._onPointerEnd.bind(this);
  }

  /** Start a pointer drag cycle on the directive-decorated element. */
  protected _onPointerDown(evt: PointerEvent): void {
    if (this._activePointerId !== null) return;

    evt.preventDefault();

    const el = evt.currentTarget as HTMLElement;
    this._activePointerId = evt.pointerId;

    this._capturePointer(el, evt.pointerId);
    el.addEventListener('pointermove', this._pointerMoveHandle);
    el.addEventListener('pointerup', this._pointerEndHandle);
    el.addEventListener('pointercancel', this._pointerEndHandle);
    el.addEventListener('lostpointercapture', this._pointerEndHandle);
    el.focus();
  }

  /** Forward pointer movement during an active drag cycle. */
  protected _onPointerMove(evt: PointerEvent): void {
    if (evt.pointerId !== this._activePointerId) return;

    evt.preventDefault();
    this._callback(evt);
  }

  /** Finish the active pointer drag cycle and remove temporary listeners. */
  protected _onPointerEnd(evt: PointerEvent): void {
    if (evt.pointerId !== this._activePointerId) return;

    evt.preventDefault();

    const el = evt.currentTarget as HTMLElement;
    this._releasePointer(el, evt.pointerId);
    this._removePointerCycleListeners(el);
    this._activePointerId = null;
  }

  /** Attach the permanent pointerdown listener to the current element. */
  protected _init(): void {
    const el = this._element?.deref();

    if (!el) return;

    el.removeEventListener('pointerdown', this._pointerDownHandle);
    el.addEventListener('pointerdown', this._pointerDownHandle);
  }

  /** Remove all listeners associated with the active drag cycle. */
  private _removePointerCycleListeners(el: HTMLElement): void {
    el.removeEventListener('pointermove', this._pointerMoveHandle);
    el.removeEventListener('pointerup', this._pointerEndHandle);
    el.removeEventListener('pointercancel', this._pointerEndHandle);
    el.removeEventListener('lostpointercapture', this._pointerEndHandle);
  }

  private _capturePointer(el: HTMLElement, pointerId: number): void {
    try {
      el.setPointerCapture(pointerId);
    } catch {
      // Synthetic PointerEvents in browser tests may not have a real active pointer.
    }
  }

  private _releasePointer(el: HTMLElement, pointerId: number): void {
    try {
      if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
    } catch {
      // Synthetic PointerEvents in browser tests may not have a real active pointer.
    }
  }

  /** Render no DOM; this directive only wires pointer listeners. */
  render(_cb: (e: MouseEvent) => void) {
    return nothing;
  }

  override update(part: ElementPart, [cb]: Parameters<this['render']>) {
    this._callback = cb.bind(part.options?.host ?? part.element);

    if (!this.isConnected) return;
    if (!(part.element instanceof HTMLElement)) return;

    const el = this._element?.deref();

    if (el !== part.element) {
      el?.removeEventListener('pointerdown', this._pointerDownHandle);
      if (el) this._removePointerCycleListeners(el);
      this._activePointerId = null;
      this._element = new WeakRef(part.element);
      this._init();
    }
  }

  override disconnected(): void {
    const el = this._element?.deref();

    if (!el) return;

    el.removeEventListener('pointerdown', this._pointerDownHandle);
    this._removePointerCycleListeners(el);
    this._activePointerId = null;
  }

  override reconnected(): void {
    this._init();
  }
}

/**
 * Wire pointer-drag movement to an element without rendering DOM.
 *
 * The callback receives the `PointerEvent` as a `MouseEvent`-compatible object.
 */
export const mouseMove = directive(MouseMoveDirective);
export type { MouseMoveDirective };

export default mouseMove;
