import { LitElement, html } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import virtualCanvasStyles from './rc-virtual-canvas.styles';

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
 * Immutable snapshot of the visible window into virtual content for one render frame.
 *
 * `x` and `y` are scroll offsets in CSS pixels; `width` and `height` are the canvas
 * backing-store dimensions in device pixels (DPR-accurate when `autoResizeCanvas` is `true`).
 */
export type RCVirtualCanvasViewRect = Readonly<{
  /** Scroll offset x in content space (CSS px) */
  x: number;

  /** Scroll offset y in content space (CSS px) */
  y: number;

  /** Visible width in device pixels */
  width: number;

  /** Visible height in device pixels */
  height: number;
}>;

/** Controls when `rc-virtual-canvas-render` events are dispatched */
export type RCVirtualCanvasRenderMode = 'continuous' | 'viewport-change' | 'manual';

/** Identifies what triggered a render event */
export type RCVirtualCanvasRenderReason = 'animation-frame' | 'viewport-change' | 'manual';

/** Content-space coordinate pair returned by coordinate-conversion methods */
export type RCVirtualCanvasPoint = Readonly<{
  /** Content space x coordinate in CSS pixels */
  x: number;

  /** Content space y coordinate in CSS pixels */
  y: number;
}>;

/**
 * Detail shape for `rc-virtual-canvas-pointer` events.
 *
 * Carries the source event's coordinates in both browser-client and content space,
 * along with all modifier key state.
 */
export type RCVirtualCanvasPointerInit = {
  /** DOM event type (e.g. `'pointerdown'`, `'click'`) */
  type: string;

  /** Browser client x coordinate from the source event */
  clientX: number;

  /** Browser client y coordinate from the source event */
  clientY: number;

  /** Content x coordinate mapped through the current backing-store scale */
  contentX: number;

  /** Content y coordinate mapped through the current backing-store scale */
  contentY: number;

  /** Frozen viewport snapshot at the moment the pointer event fired */
  viewRect: RCVirtualCanvasViewRect;

  /** Mouse button index from the source event */
  button: number;

  /** Active button bitmask from the source event */
  buttons: number;

  /** Whether the Alt key was held */
  altKey: boolean;

  /** Whether the Ctrl key was held */
  ctrlKey: boolean;

  /** Whether the Shift key was held */
  shiftKey: boolean;

  /** Whether the Meta key was held */
  metaKey: boolean;

  /** The original DOM event that produced this detail */
  sourceEvent: PointerEvent | MouseEvent;
};

/** CSS `image-rendering` value applied to the slotted canvas */
export type RCVirtualCanvasImageRendering = 'auto' | 'crisp-edges' | 'pixelated';

/** Detail shape for `rc-virtual-canvas-render` events */
export type RCVirtualCanvasRenderInit = {
  /** High-resolution timestamp from `requestAnimationFrame` */
  time: DOMHighResTimeStamp;

  /** What triggered this render */
  reason: RCVirtualCanvasRenderReason;

  /** Frozen snapshot of the viewport for this frame */
  viewRect: RCVirtualCanvasViewRect;

  /** Frozen snapshot of the full content bounds for this frame */
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

/**
 * A scrollable virtual canvas component.
 *
 * @slot - The HTMLCanvasElement
 * @slot overlay - Optional viewport-positioned content rendered inside the
 * scroll container above the canvas.
 *
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
  private readonly _boundUpdate = (time: DOMHighResTimeStamp) => this._update(time);

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

  /** Shadow DOM scroll container that owns pointer interaction and native scrolling */
  @query('#root', true)
  protected _$root!: HTMLDivElement;

  /** Absolutely-positioned div that establishes the virtual scroll range */
  @query('#placeholder', true)
  protected _$placeholder!: HTMLDivElement;

  /** Currently-tracked slotted canvas element; `null` when no canvas is slotted */
  @state()
  protected _$canvas: HTMLCanvasElement | null = null;

  /** Mutable current-frame viewport geometry; call `getViewRect()` for a frozen snapshot */
  @state()
  protected _viewRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  /** Mutable content bounds; updated when `contentWidth` or `contentHeight` change */
  @state()
  protected _contentRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  /** Watches the slotted canvas for DPR-accurate dimension changes */
  protected _resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const devicePixelBoxSize = Array.isArray(entry.devicePixelContentBoxSize)
        ? entry.devicePixelContentBoxSize[0]
        : entry.devicePixelContentBoxSize;

      this._viewRect.width = this._getMeasuredCanvasWidth(
        devicePixelBoxSize?.inlineSize ??
          Math.round(entry.contentRect.width * window.devicePixelRatio),
      );

      this._viewRect.height = this._getMeasuredCanvasHeight(
        devicePixelBoxSize?.blockSize ??
          Math.round(entry.contentRect.height * window.devicePixelRatio),
      );

      this._syncCanvasBackingStore();
      this._scheduleRender('viewport-change');
    }
  });

  /** Reads scroll position from the root container and schedules a render */
  protected _onScroll() {
    this._viewRect.x = this._$root.scrollLeft;
    this._viewRect.y = this._$root.scrollTop;

    this._scheduleRender('viewport-change');
  }

  /** Replaces canvas tracking and re-registers the resize observer when slot content changes */
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

  /**
   * Returns a frozen snapshot of the current viewport rectangle.
   *
   * Safe to keep between frames — the returned object will not be mutated
   * by future scroll or resize work.
   */
  getViewRect() {
    return createRectSnapshot(this._viewRect);
  }

  /**
   * Scrolls so the content coordinate is at the viewport origin.
   *
   * @param x - Content x coordinate in CSS pixels
   * @param y - Content y coordinate in CSS pixels
   * @param options - Native scroll options passed to scrollTo
   */
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

  /**
   * Scrolls so the content coordinate is centered in the viewport.
   *
   * @param x - Content x coordinate in CSS pixels
   * @param y - Content y coordinate in CSS pixels
   * @param options - Native scroll options passed to scrollTo
   */
  centerOnContent(x: number, y: number, options: ScrollOptions = {}) {
    this.scrollToContent(
      x - this._$root.clientWidth * 0.5,
      y - this._$root.clientHeight * 0.5,
      options,
    );
  }

  /**
   * Converts browser client coordinates to content coordinates using the current
   * backing-store scale.
   *
   * @param clientX - Browser client x coordinate (e.g. from a pointer event)
   * @param clientY - Browser client y coordinate
   *
   * @example
   * vc.addEventListener('pointerdown', (e) => {
   *   const { x, y } = vc.clientToContent(e.clientX, e.clientY);
   *   placeMarkerAt(x, y);
   * });
   */
  clientToContent(clientX: number, clientY: number) {
    const canvasRect = this._getCanvasClientRect();
    const scaleX = this._getViewportScaleX(canvasRect);
    const scaleY = this._getViewportScaleY(canvasRect);

    return Object.freeze({
      x: this._viewRect.x + (clientX - canvasRect.left) * scaleX,
      y: this._viewRect.y + (clientY - canvasRect.top) * scaleY,
    });
  }

  /**
   * Converts content coordinates back to browser client coordinates.
   *
   * @param x - Content x coordinate in CSS pixels
   * @param y - Content y coordinate in CSS pixels
   *
   * @example
   * const { x, y } = vc.contentToClient(contentX, contentY);
   * tooltip.style.left = `${x}px`;
   * tooltip.style.top = `${y}px`;
   */
  contentToClient(x: number, y: number) {
    const canvasRect = this._getCanvasClientRect();
    const scaleX = this._getViewportScaleX(canvasRect);
    const scaleY = this._getViewportScaleY(canvasRect);

    return Object.freeze({
      x: canvasRect.left + (x - this._viewRect.x) / scaleX,
      y: canvasRect.top + (y - this._viewRect.y) / scaleY,
    });
  }

  /**
   * Queues a render event on the next animation frame.
   *
   * Required when `renderMode` is `'manual'`. In other modes the component
   * schedules renders automatically; calling this with reason `'animation-frame'`
   * is a no-op when `renderMode` is `'viewport-change'`.
   *
   * @param reason - Render reason reported in the event detail
   */
  requestRender(reason: RCVirtualCanvasRenderReason = 'manual') {
    this._scheduleRender(reason);
  }

  /**
   * Ratio of canvas backing-store pixels to CSS pixels along the x-axis.
   *
   * Equals `devicePixelRatio` when `autoResizeCanvas` is `true`. Use as the x-scale
   * factor in `ctx.scale()` to draw at CSS pixel resolution.
   *
   * @example
   * vc.addEventListener('rc-virtual-canvas-render', ({ detail: { viewRect } }) => {
   *   ctx.save();
   *   ctx.scale(vc.canvasScaleX, vc.canvasScaleY);
   *   drawScene(ctx, viewRect);
   *   ctx.restore();
   * });
   */
  get canvasScaleX(): number {
    const canvasRect = this._getCanvasClientRect();

    return this._getViewportScaleX(canvasRect);
  }

  /**
   * Ratio of canvas backing-store pixels to CSS pixels along the y-axis.
   *
   * Equals `devicePixelRatio` when `autoResizeCanvas` is `true`. Use as the y-scale
   * factor in `ctx.scale()` to draw at CSS pixel resolution.
   */
  get canvasScaleY(): number {
    const canvasRect = this._getCanvasClientRect();

    return this._getViewportScaleY(canvasRect);
  }

  /** Maps pointer and mouse events to content coordinates and dispatches `rc-virtual-canvas-pointer` */
  protected _onPointerEvent(event: PointerEvent | MouseEvent) {
    if (this._handledPointerEvents.has(event)) {
      return;
    }

    if (this._isOverlayEvent(event)) {
      return;
    }

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
    return event
      .composedPath()
      .some((node) => node instanceof HTMLSlotElement && node.name === 'overlay');
  }

  /**
   * RAF callback. Dispatches `rc-virtual-canvas-render` and re-schedules in continuous mode.
   *
   * @param time - High-resolution timestamp from `requestAnimationFrame`
   */
  protected _update(time: DOMHighResTimeStamp) {
    this._rafHandle = 0;

    if (!this.isConnected || this._$canvas == null) {
      return;
    }

    const reason =
      this._pendingRenderReason ??
      (this.renderMode === 'continuous' ? 'animation-frame' : 'manual');

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

  /** Registers pointer event listeners and starts rendering in continuous mode */
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

  /** Cancels any pending animation frame, disconnects the resize observer, and removes pointer listeners */
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

  /** Reacts to `renderMode`, `autoResizeCanvas`, and `imageRendering` property changes */
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
      this.style.setProperty('--rc-virtual-canvas-image-rendering', this.imageRendering);
    }
  }

  private _scheduleRender(reason: RCVirtualCanvasRenderReason) {
    if (this.renderMode === 'manual' && reason !== 'manual') {
      return;
    }

    if (this.renderMode === 'viewport-change' && reason === 'animation-frame') {
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
    return canvasRect.width > 0 ? this._viewRect.width / canvasRect.width : 1;
  }

  private _getViewportScaleY(canvasRect: DOMRect) {
    return canvasRect.height > 0 ? this._viewRect.height / canvasRect.height : 1;
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
