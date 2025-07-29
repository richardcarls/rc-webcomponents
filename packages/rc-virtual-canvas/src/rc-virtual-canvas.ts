import { LitElement, html } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import virtualCanvasStyles from './rc-virtual-canvas.styles';

export type RCVirtualCanvasRenderInit = {
  time: DOMHighResTimeStamp;
  viewRect: { x: number; y: number; width: number; height: number };
  contentRect: { x: number; y: number; width: number; height: number };
};

declare global {
  interface HTMLElementTagNameMap {
    'rc-virtual-canvas': RCVirtualCanvas;
  }
}

/**
 * An accessible virtual scrollable canvas component.
 *
 * @slot - The HTMLCanvasElement
 */
export class RCVirtualCanvas extends LitElement {
  static styles = [virtualCanvasStyles];

  private _rafHandle: number = 0;

  // Stored bound reference so the same closure is used for scheduling and
  // cancellation — `bind()` returns a new function every call.
  private readonly _boundUpdate = (time: DOMHighResTimeStamp) =>
    this._update(time);

  /** Pixel width of the virtual content */
  @property({ type: Number })
  set contentWidth(val: number) {
    this._contentWidth = val;

    this._contentRect.width = this._contentWidth;
  }
  get contentWidth() {
    return this._contentWidth;
  }
  protected _contentWidth: number = 0;

  /** Pixel height of the virtual content */
  @property({ type: Number })
  set contentHeight(val: number) {
    this._contentHeight = val;

    this._contentRect.height = this._contentHeight;
  }
  get contentHeight() {
    return this._contentHeight;
  }
  protected _contentHeight: number = 0;

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

        this._viewRect.width =
          devicePixelBoxSize?.inlineSize ?? entry.contentRect.width;
        this._viewRect.height =
          devicePixelBoxSize?.blockSize ?? entry.contentRect.height;
      }
    },
  );

  protected _onScroll() {
    this._viewRect.x = this._$root.scrollLeft;
    this._viewRect.y = this._$root.scrollTop;
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
        width: this._$canvas.clientWidth,
        height: this._$canvas.clientHeight,
      };

      this._resizeObserver.observe(this._$canvas, {
        box: 'device-pixel-content-box',
      });
    }
  }

  protected _update(time: DOMHighResTimeStamp) {
    if (!this.isConnected || this._$canvas == null) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent<RCVirtualCanvasRenderInit>('rc-virtual-canvas-render', {
        bubbles: true,
        composed: true,
        detail: {
          time,
          viewRect: this._viewRect,
          contentRect: this._contentRect,
        },
      }),
    );

    this._rafHandle = window.requestAnimationFrame(this._boundUpdate);
  }

  override connectedCallback() {
    super.connectedCallback();

    if (this._rafHandle) cancelAnimationFrame(this._rafHandle);

    this._rafHandle = window.requestAnimationFrame(this._boundUpdate);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    cancelAnimationFrame(this._rafHandle);
    this._rafHandle = 0;
    this._resizeObserver.disconnect();
  }

  render() {
    return html`
      <div id="root" @scroll=${this._onScroll}>
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
