import { LitElement, html } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import virtualCanvasStyles from './rc-virtual-canvas.styles';

export type RCVirtualCanvasViewRect = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type RCVirtualCanvasRenderMode =
  | 'continuous'
  | 'viewport-change'
  | 'manual';

export type RCVirtualCanvasRenderReason =
  | 'animation-frame'
  | 'viewport-change'
  | 'manual';

export type RCVirtualCanvasPoint = Readonly<{
  x: number;
  y: number;
}>;

export type RCVirtualCanvasPointerInit = {
  type: string;
  clientX: number;
  clientY: number;
  contentX: number;
  contentY: number;
  viewRect: RCVirtualCanvasViewRect;
  button: number;
  buttons: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  sourceEvent: PointerEvent | MouseEvent;
};

export type RCVirtualCanvasImageRendering =
  | 'auto'
  | 'crisp-edges'
  | 'pixelated';

export type RCVirtualCanvasRenderInit = {
  time: DOMHighResTimeStamp;
  reason: RCVirtualCanvasRenderReason;
  viewRect: RCVirtualCanvasViewRect;
  contentRect: RCVirtualCanvasViewRect;
};

function createRectSnapshot(rect: RCVirtualCanvasViewRect) {
  return Object.freeze({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  });
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-virtual-canvas': RCVirtualCanvas;
  }

  interface HTMLElementEventMap {
    'rc-virtual-canvas-render': CustomEvent<RCVirtualCanvasRenderInit>;
    'rc-virtual-canvas-pointer': CustomEvent<RCVirtualCanvasPointerInit>;
  }
}

/**
 * An accessible virtual scrollable canvas component.
 *
 * @slot - The HTMLCanvasElement
 * @slot overlay - Optional viewport-positioned content rendered inside the
 * scroll container above the canvas.
 * @fires rc-virtual-canvas-render - Fires with viewport data when the canvas should redraw.
 * @fires rc-virtual-canvas-pointer - Fires pointer/mouse input mapped to virtual content coordinates.
 */
export class RCVirtualCanvas extends LitElement {
  static styles = [virtualCanvasStyles];

  private _rafHandle: number = 0;
  private _pendingRenderReason?: RCVirtualCanvasRenderReason;
  private readonly _handledPointerEvents = new WeakSet<Event>();

  // Stored bound reference so the same closure is used for scheduling and
  // cancellation — `bind()` returns a new function every call.
  private readonly _boundUpdate = (time: DOMHighResTimeStamp) =>
    this._update(time);

  private readonly _boundPointerEvent = (event: PointerEvent | MouseEvent) =>
    this._onPointerEvent(event);

  /** Pixel width of the virtual content */
  @property({ type: Number })
  set contentWidth(val: number) {
    const oldValue = this._contentWidth;

    this._contentWidth = val;

    this._contentRect.width = this._contentWidth;
    this.requestUpdate('contentWidth', oldValue);
    this._scheduleRender('viewport-change');
  }
  get contentWidth() {
    return this._contentWidth;
  }
  protected _contentWidth: number = 0;

  /** Pixel height of the virtual content */
  @property({ type: Number })
  set contentHeight(val: number) {
    const oldValue = this._contentHeight;

    this._contentHeight = val;

    this._contentRect.height = this._contentHeight;
    this.requestUpdate('contentHeight', oldValue);
    this._scheduleRender('viewport-change');
  }
  get contentHeight() {
    return this._contentHeight;
  }
  protected _contentHeight: number = 0;

  /** When true, keep the slotted canvas backing store aligned to the viewport. */
  @property({ attribute: 'auto-resize-canvas', type: Boolean })
  autoResizeCanvas: boolean = true;

  /** Controls when render events are dispatched. */
  @property({ attribute: 'render-mode' })
  renderMode: RCVirtualCanvasRenderMode = 'continuous';

  /** Convenience image-rendering value applied to the slotted canvas. */
  @property({ attribute: 'image-rendering' })
  imageRendering: RCVirtualCanvasImageRendering = 'auto';

  @query('#root', true)
  protected _$root!: HTMLDivElement;

  @query('#placeholder', true)
  protected _$placeholder!: HTMLDivElement;

  @state()
  protected _$canvas: HTMLCanvasElement | null = null;

  @state()
  protected _viewRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  @state()
  protected _contentRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  protected _resizeObserver = new ResizeObserver(
    (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const devicePixelBoxSize = Array.isArray(
          entry.devicePixelContentBoxSize,
        )
          ? entry.devicePixelContentBoxSize[0]
          : entry.devicePixelContentBoxSize;

        this._viewRect.width = this._getMeasuredCanvasWidth(
          devicePixelBoxSize?.inlineSize
            ?? Math.round(entry.contentRect.width * window.devicePixelRatio),
        );
        this._viewRect.height = this._getMeasuredCanvasHeight(
          devicePixelBoxSize?.blockSize
            ?? Math.round(entry.contentRect.height * window.devicePixelRatio),
        );

        this._syncCanvasBackingStore();
        this._scheduleRender('viewport-change');
      }
    },
  );

  protected _onScroll() {
    this._viewRect.x = this._$root.scrollLeft;
    this._viewRect.y = this._$root.scrollTop;

    this._scheduleRender('viewport-change');
  }

  protected _onSlotChange(e: Event) {
    this._resizeObserver.disconnect();

    this._$canvas =
      (e.currentTarget as HTMLSlotElement)
        .assignedElements()
        .filter((el) => el instanceof HTMLCanvasElement)
        .at(0) ?? null;

    if (this._$canvas != null) {
      this._viewRect = {
        x: this._$root.scrollLeft ?? 0,
        y: this._$root.scrollTop ?? 0,
        width: this._getMeasuredCanvasWidth(this._$canvas.clientWidth),
        height: this._getMeasuredCanvasHeight(this._$canvas.clientHeight),
      };

      this._syncCanvasBackingStore();
      this._resizeObserver.observe(this._$canvas, {
        box: 'device-pixel-content-box',
      });
      this._scheduleRender('viewport-change');
    }
  }

  getViewRect() {
    return createRectSnapshot(this._viewRect);
  }

  scrollToContent(x: number, y: number, options: ScrollOptions = {}) {
    this._$root.scrollTo({
      ...options,
      left: x,
      top: y,
    });

    this._viewRect.x = this._$root.scrollLeft;
    this._viewRect.y = this._$root.scrollTop;
    this._scheduleRender('viewport-change');
  }

  centerOnContent(x: number, y: number, options: ScrollOptions = {}) {
    this.scrollToContent(
      x - (this._$root.clientWidth * 0.5),
      y - (this._$root.clientHeight * 0.5),
      options,
    );
  }

  clientToContent(clientX: number, clientY: number) {
    const canvasRect = this._getCanvasClientRect();
    const scaleX = this._getViewportScaleX(canvasRect);
    const scaleY = this._getViewportScaleY(canvasRect);

    return Object.freeze({
      x: this._viewRect.x + ((clientX - canvasRect.left) * scaleX),
      y: this._viewRect.y + ((clientY - canvasRect.top) * scaleY),
    });
  }

  contentToClient(x: number, y: number) {
    const canvasRect = this._getCanvasClientRect();
    const scaleX = this._getViewportScaleX(canvasRect);
    const scaleY = this._getViewportScaleY(canvasRect);

    return Object.freeze({
      x: canvasRect.left + ((x - this._viewRect.x) / scaleX),
      y: canvasRect.top + ((y - this._viewRect.y) / scaleY),
    });
  }

  requestRender(reason: RCVirtualCanvasRenderReason = 'manual') {
    this._scheduleRender(reason);
  }

  protected _onPointerEvent(event: PointerEvent | MouseEvent) {
    if (this._handledPointerEvents.has(event)) return;
    if (this._isOverlayEvent(event)) return;

    this._handledPointerEvents.add(event);

    const contentPoint = this.clientToContent(event.clientX, event.clientY);

    const shouldContinue = this.dispatchEvent(
      new CustomEvent<RCVirtualCanvasPointerInit>('rc-virtual-canvas-pointer', {
        bubbles: true,
        composed: true,
        cancelable: true,
        detail: {
          type: event.type,
          clientX: event.clientX,
          clientY: event.clientY,
          contentX: contentPoint.x,
          contentY: contentPoint.y,
          viewRect: createRectSnapshot(this._viewRect),
          button: event.button,
          buttons: event.buttons,
          altKey: event.altKey,
          ctrlKey: event.ctrlKey,
          shiftKey: event.shiftKey,
          metaKey: event.metaKey,
          sourceEvent: event,
        },
      }),
    );

    if (!shouldContinue) event.preventDefault();
  }

  private _isOverlayEvent(event: Event): boolean {
    return event.composedPath().some((node) =>
      node instanceof HTMLSlotElement
      && node.name === 'overlay',
    );
  }

  protected _update(time: DOMHighResTimeStamp) {
    this._rafHandle = 0;

    if (!this.isConnected || this._$canvas == null) {
      return;
    }

    const reason = this._pendingRenderReason
      ?? (this.renderMode === 'continuous' ? 'animation-frame' : 'manual');

    this._pendingRenderReason = undefined;

    this.dispatchEvent(
      new CustomEvent<RCVirtualCanvasRenderInit>('rc-virtual-canvas-render', {
        bubbles: true,
        composed: true,
        detail: {
          time,
          reason,
          viewRect: createRectSnapshot(this._viewRect),
          contentRect: createRectSnapshot(this._contentRect),
        },
      }),
    );

    if (this.renderMode === 'continuous') {
      this._scheduleRender('animation-frame');
    }
  }

  override connectedCallback() {
    super.connectedCallback();

    this.addEventListener('pointerdown', this._boundPointerEvent);
    this.addEventListener('pointermove', this._boundPointerEvent);
    this.addEventListener('pointerup', this._boundPointerEvent);
    this.addEventListener('click', this._boundPointerEvent);
    this.addEventListener('dblclick', this._boundPointerEvent);
    this.addEventListener('contextmenu', this._boundPointerEvent);

    if (this._rafHandle) {
      cancelAnimationFrame(this._rafHandle);
      this._rafHandle = 0;
    }

    if (this.renderMode === 'continuous') {
      this._scheduleRender('animation-frame');
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    cancelAnimationFrame(this._rafHandle);
    this._rafHandle = 0;
    this._resizeObserver.disconnect();

    this.removeEventListener('pointerdown', this._boundPointerEvent);
    this.removeEventListener('pointermove', this._boundPointerEvent);
    this.removeEventListener('pointerup', this._boundPointerEvent);
    this.removeEventListener('click', this._boundPointerEvent);
    this.removeEventListener('dblclick', this._boundPointerEvent);
    this.removeEventListener('contextmenu', this._boundPointerEvent);
  }

  protected override updated(changed: Map<string, unknown>) {
    if (changed.has('renderMode')) {
      if (this.renderMode === 'continuous') {
        this._scheduleRender('animation-frame');
      } else if (this._pendingRenderReason === 'animation-frame') {
        if (this._rafHandle) {
          cancelAnimationFrame(this._rafHandle);
          this._rafHandle = 0;
        }

        this._pendingRenderReason = undefined;
      } else if (this.renderMode === 'viewport-change') {
        this._scheduleRender('viewport-change');
      }
    }

    if (changed.has('autoResizeCanvas')) {
      this._syncCanvasBackingStore();
    }

    if (changed.has('imageRendering')) {
      this.style.setProperty(
        '--rc-virtual-canvas-image-rendering',
        this.imageRendering,
      );
    }
  }

  private _scheduleRender(reason: RCVirtualCanvasRenderReason) {
    if (this.renderMode === 'manual' && reason !== 'manual') {
      return;
    }

    if (
      this.renderMode === 'viewport-change'
      && reason === 'animation-frame'
    ) {
      return;
    }

    this._pendingRenderReason = reason;

    if (!this.isConnected || this._rafHandle) {
      return;
    }

    this._rafHandle = window.requestAnimationFrame(this._boundUpdate);
  }

  private _syncCanvasBackingStore() {
    if (!this.autoResizeCanvas || this._$canvas == null) {
      return;
    }

    const width = Math.max(0, Math.round(this._viewRect.width));
    const height = Math.max(0, Math.round(this._viewRect.height));

    if (this._$canvas.width !== width) {
      this._$canvas.width = width;
    }

    if (this._$canvas.height !== height) {
      this._$canvas.height = height;
    }
  }

  private _getCanvasClientRect() {
    if (this._$canvas == null) {
      return this.getBoundingClientRect();
    }

    return this._$canvas.getBoundingClientRect();
  }

  private _getMeasuredCanvasWidth(fallbackWidth: number) {
    if (!this.autoResizeCanvas && this._$canvas && this._$canvas.width > 0) {
      return this._$canvas.width;
    }

    return fallbackWidth;
  }

  private _getMeasuredCanvasHeight(fallbackHeight: number) {
    if (!this.autoResizeCanvas && this._$canvas && this._$canvas.height > 0) {
      return this._$canvas.height;
    }

    return fallbackHeight;
  }

  private _getViewportScaleX(canvasRect: DOMRect) {
    return canvasRect.width > 0
      ? this._viewRect.width / canvasRect.width
      : 1;
  }

  private _getViewportScaleY(canvasRect: DOMRect) {
    return canvasRect.height > 0
      ? this._viewRect.height / canvasRect.height
      : 1;
  }

  render() {
    return html`
      <div
        id="root"
        part="scroller"
        @scroll=${this._onScroll}
        @pointerdown=${this._onPointerEvent}
        @pointermove=${this._onPointerEvent}
        @pointerup=${this._onPointerEvent}
        @click=${this._onPointerEvent}
        @dblclick=${this._onPointerEvent}
        @contextmenu=${this._onPointerEvent}
      >
        <div id="overlay" part="overlay">
          <slot name="overlay"></slot>
        </div>
        <div
          id="placeholder"
          style=${styleMap({
            width: `${this.contentWidth}px`,
            height: `${this.contentHeight}px`,
          })}
        ></div>
      </div>

      <slot @slotchange=${this._onSlotChange}></slot>
    `;
  }
}

export default RCVirtualCanvas;
