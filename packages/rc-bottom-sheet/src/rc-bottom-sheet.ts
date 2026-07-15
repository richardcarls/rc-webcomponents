import { property } from 'lit/decorators.js';

import { RCDialog } from '@rcarls/rc-dialog';
import type { ResizeDirection, ResizeLifecycleDetail, ResizeOrigin } from '@rcarls/rc-common';

declare global {
  interface HTMLElementTagNameMap {
    'rc-bottom-sheet': RCBottomSheet;
  }
}

/**
 * Modal bottom-sheet wrapper for a native `<dialog>`, built on `rc-dialog`.
 *
 * The direct child `<dialog>` remains the semantic dialog surface and owns
 * content, labels, and form behavior. `rc-bottom-sheet` supplies the same
 * open/close lifecycle, focus restoration, cancel/request-close events, and
 * light-dismiss affordance as `rc-dialog`, while themes provide the docked
 * bottom-sheet presentation.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-bottom-sheet rc-bottom-sheet docs}
 * @see {@link https://m3.material.io/components/bottom-sheets/overview Material Design bottom sheets}
 *
 * @slot - Place a `<dialog>` element with your sheet content here.
 * @slot [data-rc-bottom-sheet-handle] - Optional light-DOM resize handle.
 *
 * @fires rc-dialog-open - Inherited from `rc-dialog`; fired when the sheet opens.
 * @fires rc-dialog-toggle - Inherited from `rc-dialog`; fired when user/native interaction changes open state.
 * @fires rc-dialog-request-close - Inherited from `rc-dialog`; cancelable close request.
 * @fires rc-dialog-cancel - Inherited from `rc-dialog`; backward-compatible cancel alias.
 * @fires rc-dialog-close - Inherited from `rc-dialog`; fired after the sheet closes.
 *
 * @cssprop [--rc-bottom-sheet-bg=Canvas] - Sheet surface background.
 * @cssprop [--rc-bottom-sheet-color=CanvasText] - Sheet text color.
 * @cssprop [--rc-bottom-sheet-radius=1rem 1rem 0 0] - Sheet corner radius.
 * @cssprop [--rc-bottom-sheet-shadow=none] - Sheet elevation shadow.
 * @cssprop [--rc-bottom-sheet-max-inline-size=40rem] - Maximum sheet width.
 * @cssprop [--rc-bottom-sheet-max-block-size=70dvh] - Maximum sheet height.
 * @cssprop [--rc-bottom-sheet-padding=0 1rem 1rem] - Sheet padding.
 * @cssprop [--rc-bottom-sheet-scrim=var(--rc-dialog-scrim)] - Modal backdrop color.
 */
export class RCBottomSheet extends RCDialog {
  private static readonly swipeDismissThreshold = 96;

  /**
   * Bottom sheets light-dismiss by default.
   *
   * Set `light-dismiss="false"` as a property from JavaScript when a sheet must
   * be closed only by explicit actions.
   */
  @property({ type: Boolean, attribute: 'light-dismiss' })
  override lightDismiss = true;

  /** Bottom sheets resize vertically from the top edge by default. */
  @property({ type: String, reflect: true })
  override resize: ResizeDirection = 'vertical';

  /** Top-origin resizing keeps the sheet docked to the viewport bottom. */
  @property({ type: String, attribute: 'resize-origin' })
  override resizeOrigin: ResizeOrigin = 'top';

  /** Default optional handle selector. Falls back to top-edge resize when absent. */
  @property({ type: String, attribute: 'resize-handle' })
  override resizeHandle = '[data-rc-bottom-sheet-handle]';

  /** Whitespace-separated CSS height lengths to snap to after resize. */
  @property({ type: String, attribute: 'snap-points' })
  snapPoints = '';

  /** Downward resize/swipe releases past the threshold request close by default. */
  @property({ type: Boolean, attribute: 'swipe-dismiss' })
  swipeDismiss = true;

  protected override _onResizeEnd(detail: ResizeLifecycleDetail): void {
    if (detail.inputType === 'pointer' && this.swipeDismiss && this._shouldSwipeDismiss(detail)) {
      this.requestClose();

      return;
    }

    this._snapToNearestPoint();
  }

  private _shouldSwipeDismiss(detail: ResizeLifecycleDetail): boolean {
    return (
      detail.edge.includes('n') &&
      detail.startHeight - detail.height >= RCBottomSheet.swipeDismissThreshold
    );
  }

  private _snapToNearestPoint(): void {
    const $dialog = this._$dialog;

    if (!$dialog || !this.snapPoints.trim()) {
      return;
    }

    const points = this.snapPoints
      .trim()
      .split(/\s+/)
      .map((point) => this._resolveSnapPoint(point))
      .filter((point): point is number => Number.isFinite(point) && point > 0);

    if (points.length === 0) {
      return;
    }

    const rect = $dialog.getBoundingClientRect();
    const height = rect.height;
    const bottom = rect.bottom;
    const nearest = points.reduce((best, point) =>
      Math.abs(point - height) < Math.abs(best - height) ? point : best,
    );

    $dialog.style.height = `${nearest}px`;
    $dialog.style.top = `${bottom - nearest}px`;
  }

  private _resolveSnapPoint(point: string): number {
    const numeric = Number.parseFloat(point);

    if (!Number.isFinite(numeric)) {
      return Number.NaN;
    }

    if (point.endsWith('%')) {
      return window.innerHeight * (numeric / 100);
    }

    if (point.endsWith('px') || String(numeric) === point) {
      return numeric;
    }

    const probe = document.createElement('div');

    Object.assign(probe.style, {
      position: 'fixed',
      visibility: 'hidden',
      pointerEvents: 'none',
      blockSize: point,
      inlineSize: '0',
      inset: '0 auto auto 0',
    });

    document.body.append(probe);

    const height = probe.getBoundingClientRect().height;

    probe.remove();

    return height;
  }
}

export default RCBottomSheet;
