import { nothing } from 'lit';

import { PartType, type PartInfo, type ElementPart } from 'lit/directive.js';

import { directive, AsyncDirective } from 'lit/async-directive.js';

class MouseMoveDirective extends AsyncDirective {
  private _element?: WeakRef<Element>;
  private _mouseDownHandle!: (evt: MouseEvent) => void;
  private _mouseMoveHandle!: (evt: MouseEvent) => void;
  private _mouseUpLeaveHandle!: (evt: MouseEvent) => void;
  private _callback!: (evt: MouseEvent) => void;
  private _isDragging: boolean = false;

  constructor(partInfo: PartInfo) {
    super(partInfo);

    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('The `mouseMove` directive must be used on an element.');
    }
  }

  protected _onMouseDown(evt: MouseEvent) {
    evt.preventDefault();

    const el = evt.currentTarget as HTMLElement;
    // const parent = (el.parentElement ?? globalThis.window) as HTMLElement;
    const parent = globalThis.window;

    parent.addEventListener('mousemove', this._mouseMoveHandle);
    parent.addEventListener('mouseup', this._mouseUpLeaveHandle);
    parent.addEventListener('mouseleave', this._mouseUpLeaveHandle);

    el.focus();

    // if ('ontouchstart' in window) {
    //   this.$elem.addEventListener('touchstart',this._onTouchStart, false);
    //   this.$elem.addEventListener('touchend',this._onTouchEnd, false);
    //   this.$elem.addEventListener('touchcancel',this._onTouchEnd, false);
    // }
  }

  protected _onMouseMove(evt: MouseEvent) {
    evt.preventDefault();

    if (!this._isDragging) {
      this._isDragging = true;
    }

    this._callback(evt);
  }

  protected _onMouseUp(evt: MouseEvent) {
    evt.preventDefault();

    const parent = evt.currentTarget as HTMLElement;

    parent.removeEventListener('mousemove', this._mouseMoveHandle);
    parent.removeEventListener('mouseup', this._mouseUpLeaveHandle);
    parent.removeEventListener('mouseleave', this._mouseUpLeaveHandle);

    this._isDragging = false;
  }

  protected _init() {
    const el = this._element?.deref();

    if (el != null && el instanceof HTMLElement) {
      this._mouseDownHandle = this._onMouseDown.bind(this);
      this._mouseMoveHandle = this._onMouseMove.bind(this);
      this._mouseUpLeaveHandle = this._onMouseUp.bind(this);

      el.addEventListener('mousedown', this._mouseDownHandle);

      // if ('ontouchstart' in window) {
      //   this._onTouchStart = this._onTouchStart.bind(this);
      //   this._onTouchEnd = this._onTouchEnd.bind(this);
      //   this._onTouchMove = this._onTouchMove.bind(this);
      // }
    }
  }

  render(_cb: (e: MouseEvent) => void) {
    return nothing;
  }

  update(part: ElementPart, [cb]: Parameters<this['render']>) {
    if (this.isConnected && this._element?.deref() === undefined) {
      this._element = new WeakRef(part.element);
      this._callback = cb.bind(part.options?.host ?? part.element);

      this._init();
    }
  }

  override disconnected(): void {
    const el = this._element?.deref();

    if (el != null && el instanceof HTMLElement) {
      el.removeEventListener('click', this._mouseDownHandle);
    }
  }

  override reconnected(): void {
    this._init();
  }
}

export const mouseMove = directive(MouseMoveDirective);
export type { MouseMoveDirective };

export default mouseMove;
