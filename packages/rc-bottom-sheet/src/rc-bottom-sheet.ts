import { property } from 'lit/decorators.js';

import { RCDialog } from '@rcarls/rc-dialog';
import {
  findExtremeSnapIndex,
  findNearestSnapIndex,
  pinElementBox,
  type ResizeDirection,
  type ResizeLifecycleDetail,
  type ResizeOrigin,
} from '@rcarls/rc-common';

declare global {
  interface HTMLElementTagNameMap {
    'rc-bottom-sheet': RCBottomSheet;
  }

  interface HTMLElementEventMap {
    'rc-bottom-sheet-snap': CustomEvent<RCBottomSheetSnapDetail>;
  }
}

/** Detail shape for `rc-bottom-sheet-snap`. */
export interface RCBottomSheetSnapDetail {
  /** Index into the resolved `snap-points` list selected as the target. */
  index: number;

  /** Effective target height in pixels, after CSS size constraints. */
  height: number;

  /** Whether the snap came from a drag release or a `snapTo()` call. */
  trigger: 'drag' | 'api';
}

const DEFAULT_SNAP_DURATION_MS = 300;
const DEFAULT_SNAP_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

const LIGHT_DOM_CSS = `
@layer rc-base {
  rc-bottom-sheet > dialog {
    position: var(--rc-bottom-sheet-position, fixed);
    inset-block-start: auto;
    inset-block-end: var(--rc-bottom-sheet-inset-block-end, 0px);
    inset-inline: var(--rc-bottom-sheet-inset-inline, 0px);
    box-sizing: border-box;
    inline-size: 100%;
    max-inline-size: var(--rc-bottom-sheet-max-inline-size, 40rem);
    max-block-size: var(--rc-bottom-sheet-max-block-size, 70dvh);
    margin-block: 0;
    margin-inline: auto;
    overflow: auto;
  }

  rc-bottom-sheet > dialog [data-rc-bottom-sheet-handle] {
    box-sizing: border-box;
    cursor: ns-resize;
    touch-action: none;
    -webkit-tap-highlight-color: transparent;
  }

  rc-bottom-sheet > dialog > [data-rc-bottom-sheet-handle] {
    position: relative;
    display: block;
    inline-size: var(--rc-bottom-sheet-handle-target-inline-size, 100%);
    min-block-size: var(--rc-bottom-sheet-handle-target-block-size, 3rem);
    margin: var(--rc-bottom-sheet-handle-target-margin, 0);
    padding: 0;
    border: 0;
    border-radius: inherit;
    background: transparent;
    appearance: none;
  }

  rc-bottom-sheet > dialog > [data-rc-bottom-sheet-handle]::before {
    content: '';
    position: absolute;
    inset-block-start: 50%;
    inset-inline-start: 50%;
    inline-size: var(--rc-bottom-sheet-handle-inline-size, 2rem);
    block-size: var(--rc-bottom-sheet-handle-block-size, 0.25rem);
    border-radius: var(--rc-bottom-sheet-handle-radius, 999px);
    background: var(--rc-bottom-sheet-handle-color, GrayText);
    translate: -50% -50%;
  }

  rc-bottom-sheet > dialog [data-rc-bottom-sheet-handle]:focus-visible {
    outline: auto;
    outline-offset: -0.25rem;
  }
}
`;

// Floor so a noisy near-zero-distance release can't misread as a decisive
// fling; a real swipe travels at least this far even if it's very quick.
const MIN_SWIPE_DISTANCE = 24;

/**
 * Modal bottom-sheet wrapper for a native `<dialog>`, built on `rc-dialog`.
 *
 * The direct child `<dialog>` remains the semantic dialog surface and owns
 * content, labels, and form behavior. `rc-bottom-sheet` supplies the same
 * open/close lifecycle, focus restoration, cancel/request-close events, and
 * light-dismiss affordance as `rc-dialog`. The component docks the sheet to
 * the viewport block-end by default, while themes provide its visual surface.
 *
 * Dragging the resize handle past a decisive velocity in either direction
 * (a "swipe" or "fling," distinct from a slow deliberate drag) snaps
 * straight to the extreme `snap-points` entry in that direction — swipe up
 * to fully expand, swipe down to fully collapse — regardless of how close
 * the release position was to some other point. Below that velocity, the
 * sheet settles to whichever declared snap point is nearest the release
 * height. All settling, whether from a drag or from `snapTo()`, animates
 * over `--rc-bottom-sheet-snap-duration`, follows
 * `--rc-bottom-sheet-snap-easing`, and is skipped for
 * `prefers-reduced-motion: reduce`.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-bottom-sheet rc-bottom-sheet docs}
 * @see {@link https://m3.material.io/components/bottom-sheets/overview Material Design bottom sheets}
 *
 * @slot - Place a `<dialog>` element with the sheet content and optional
 *   `[data-rc-bottom-sheet-handle]` resize handle here.
 *
 * @fires rc-dialog-open - Inherited from `rc-dialog`; fired when the sheet opens.
 * @fires rc-dialog-toggle - Inherited from `rc-dialog`; fired when user/native interaction changes open state.
 * @fires rc-dialog-request-close - Inherited from `rc-dialog`; cancelable close request.
 * @fires rc-dialog-cancel - Inherited from `rc-dialog`; backward-compatible cancel alias.
 * @fires rc-dialog-close - Inherited from `rc-dialog`; fired after the sheet closes.
 * @fires rc-bottom-sheet-snap - Fires when a drag release or `snapTo()` call
 *   selects a snap target. `detail: { index, height, trigger }`
 *
 * @attr light-dismiss - When present, a click on the backdrop area calls `requestClose()`.
 *   Present by default; inherited from `rc-dialog`.
 * @attr resize - Enables edge resizing, mirroring the CSS `resize` property values.
 *   Defaults to `vertical`; inherited from `rc-dialog`.
 * @attr resize-origin - Origin for resize edge hit-testing or explicit handles. Defaults to
 *   `top`; inherited from `rc-dialog`.
 * @attr resize-handle - CSS selector, scoped to the inner `<dialog>`, for explicit resize
 *   handles. Defaults to `[data-rc-bottom-sheet-handle]`; inherited from `rc-dialog`.
 * @attr snap-points - Whitespace-separated CSS heights, in ascending order, addressable by
 *   `snapTo()` and settled to on drag release.
 * @attr swipe-dismiss - Whether a decisive downward swipe of at least 96 pixels requests close.
 * @attr swipe-velocity - Minimum release velocity, in pixels per second, that counts as a
 *   decisive swipe rather than a slow deliberate drag.
 *
 * @cssprop [--rc-bottom-sheet-bg=Canvas] - Sheet surface background.
 * @cssprop [--rc-bottom-sheet-color=CanvasText] - Sheet text color.
 * @cssprop [--rc-bottom-sheet-radius=1rem 1rem 0 0] - Sheet corner radius.
 * @cssprop [--rc-bottom-sheet-shadow=none] - Sheet elevation shadow.
 * @cssprop [--rc-bottom-sheet-position=fixed] - Positioning scheme. Use `absolute` with `show()` to dock a non-modal sheet to a positioned ancestor.
 * @cssprop [--rc-bottom-sheet-inset-block-end=0px] - Distance from the positioning container's block-end edge.
 * @cssprop [--rc-bottom-sheet-inset-inline=0px] - Inline-axis inset used with automatic margins.
 * @cssprop [--rc-bottom-sheet-max-inline-size=40rem] - Maximum sheet width.
 * @cssprop [--rc-bottom-sheet-max-block-size=70dvh] - Maximum sheet height.
 * @cssprop [--rc-bottom-sheet-padding=0 1rem 1rem] - Sheet padding.
 * @cssprop [--rc-bottom-sheet-scrim=var(--rc-dialog-scrim)] - Modal backdrop color.
 * @cssprop [--rc-bottom-sheet-handle-color=GrayText] - Resize handle color.
 * @cssprop [--rc-bottom-sheet-handle-inline-size=2rem] - Resize handle width.
 * @cssprop [--rc-bottom-sheet-handle-block-size=0.25rem] - Resize handle height.
 * @cssprop [--rc-bottom-sheet-handle-radius=999px] - Resize handle corner radius.
 * @cssprop [--rc-bottom-sheet-handle-target-inline-size=100%] - Pointer target width for a direct-child handle.
 * @cssprop [--rc-bottom-sheet-handle-target-block-size=3rem] - Pointer target height for a direct-child handle.
 * @cssprop [--rc-bottom-sheet-handle-target-margin=0] - Margin around a direct-child handle target.
 * @cssprop [--rc-bottom-sheet-snap-duration=300ms] - Duration of the settle animation
 *   after a drag release or `snapTo()` call.
 * @cssprop [--rc-bottom-sheet-snap-easing=cubic-bezier(0.4, 0, 0.2, 1)] - Easing
 *   for the settle animation after a drag release or `snapTo()` call.
 */
export class RCBottomSheet extends RCDialog {
  private static readonly swipeDismissThreshold = 96;
  private static readonly _styledRoots = new Set<Document | ShadowRoot>();

  private static _ensureBaseStyles(root: Document | ShadowRoot): void {
    if (RCBottomSheet._styledRoots.has(root)) {
      return;
    }

    RCBottomSheet._styledRoots.add(root);

    const $style = document.createElement('style');

    $style.setAttribute('data-rc-light-dom-base', 'rc-bottom-sheet');
    $style.textContent = LIGHT_DOM_CSS;

    if (root instanceof Document) {
      root.head.append($style);
    } else {
      root.append($style);
    }
  }

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

  /**
   * Whitespace-separated CSS heights in ascending order.
   *
   * Each height becomes an addressable snap target. Slow releases choose the
   * nearest target, while decisive swipes choose the first or last target.
   */
  @property({ type: String, attribute: 'snap-points' })
  snapPoints = '';

  /**
   * Whether a downward pointer resize of at least 96 pixels requests close.
   *
   * When false, a decisive downward swipe settles at the first snap point.
   */
  @property({ type: Boolean, attribute: 'swipe-dismiss' })
  swipeDismiss = true;

  /**
   * Minimum release velocity, in pixels per second, that counts as a decisive
   * swipe rather than a slow deliberate drag. A swipe jumps straight to the
   * extreme `snap-points` entry in its direction; below this, the release
   * settles to the nearest point instead.
   */
  @property({ type: Number, attribute: 'swipe-velocity' })
  swipeVelocity = 500;

  private readonly _reducedMotion =
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  private _activeSnapAnimation: Animation | null = null;

  override connectedCallback(): void {
    super.connectedCallback();
    RCBottomSheet._ensureBaseStyles(this.getRootNode() as Document | ShadowRoot);
  }

  /**
   * Snaps to a declared target by zero-based index.
   *
   * Finite fractional indices are truncated and out-of-range indices clamp to
   * the nearest endpoint. Non-finite indices and calls without valid snap
   * points have no effect.
   *
   * @param index - zero-based index into `snapPoints`
   * @param behavior - whether to animate the movement
   *
   * @example
   * const sheet = document.querySelector('rc-bottom-sheet');
   * sheet.snapTo(1);
   */
  snapTo(index: number, behavior: 'animated' | 'instant' = 'animated'): void {
    if (!Number.isFinite(index)) {
      return;
    }

    this._snapToIndex(Math.trunc(index), behavior, 'api');
  }

  protected override _onResizeEnd(detail: ResizeLifecycleDetail): void {
    if (detail.inputType === 'pointer' && this.swipeDismiss && this._shouldSwipeDismiss(detail)) {
      this.requestClose();

      return;
    }

    const points = this._resolvedSnapPoints();
    const velocity = detail.edge.includes('n') ? -detail.velocityY : detail.velocityY;
    const distance = Math.abs(detail.height - detail.startHeight);

    if (
      detail.inputType === 'pointer' &&
      points.length > 0 &&
      distance >= MIN_SWIPE_DISTANCE &&
      Math.abs(velocity) >= this.swipeVelocity
    ) {
      // Decisive fling: jump to the extreme point in the swipe direction,
      // regardless of proximity to some other point. Height grows as the
      // sheet is dragged upward, so a positive velocity is a swipe up.
      const targetIndex = findExtremeSnapIndex(points, velocity > 0 ? 1 : -1);

      this._snapToIndex(targetIndex, 'animated', 'drag');

      return;
    }

    this._snapToNearestPoint('drag');
  }

  private _shouldSwipeDismiss(detail: ResizeLifecycleDetail): boolean {
    return (
      detail.edge.includes('n') &&
      detail.startHeight - detail.height >= RCBottomSheet.swipeDismissThreshold
    );
  }

  private _snapToNearestPoint(trigger: 'drag' | 'api' = 'api'): void {
    const $dialog = this._$dialog;
    const points = this._resolvedSnapPoints();

    if (!$dialog || points.length === 0) {
      return;
    }

    const height = $dialog.getBoundingClientRect().height;
    const nearestIndex = findNearestSnapIndex(points, height);

    this._snapToIndex(nearestIndex, 'animated', trigger);
  }

  private _snapToIndex(
    index: number,
    behavior: 'animated' | 'instant',
    trigger: 'drag' | 'api',
  ): void {
    const $dialog = this._$dialog;
    const points = this._resolvedSnapPoints();

    if (!$dialog || points.length === 0) {
      return;
    }

    // Pinning (border-box, explicit left/top/width/height) is normally
    // established by the first drag gesture; snapTo() must do the same so a
    // sheet that has never been dragged still measures and sets height
    // consistently.
    const rect = pinElementBox($dialog);
    const clampedIndex = Math.max(0, Math.min(index, points.length - 1));
    const requestedHeight = points[clampedIndex];

    // An in-flight animation wins over inline geometry in the cascade. Pin
    // its current visual box before cancelling so the constrained target can
    // be measured without jumping back to the prior snap point.
    this._activeSnapAnimation?.cancel();
    this._activeSnapAnimation = null;

    $dialog.style.height = `${requestedHeight}px`;

    const targetHeight = $dialog.getBoundingClientRect().height;

    // Restore the current visual box before applying or animating the target.
    // CSS min/max block-size can make targetHeight differ from the authored
    // snap point; anchoring from the effective height keeps the block-end edge
    // fixed in either case.
    $dialog.style.top = `${rect.top}px`;
    $dialog.style.height = `${rect.height}px`;

    const targetTop = rect.bottom - targetHeight;

    this._applySnap($dialog, targetTop, targetHeight, behavior);

    this.dispatchEvent(
      new CustomEvent<RCBottomSheetSnapDetail>('rc-bottom-sheet-snap', {
        bubbles: true,
        composed: true,
        detail: { index: clampedIndex, height: targetHeight, trigger },
      }),
    );
  }

  private _applySnap(
    $dialog: HTMLDialogElement,
    top: number,
    height: number,
    behavior: 'animated' | 'instant',
  ): void {
    // Measure before cancelling any in-flight animation. `_snapToIndex()`
    // normally pins and cancels first, while this ordering also keeps direct
    // calls robust if applying a snap is refactored later.
    const fromRect = $dialog.getBoundingClientRect();

    this._activeSnapAnimation?.cancel();
    this._activeSnapAnimation = null;

    if (behavior === 'instant' || this._reducedMotion?.matches) {
      $dialog.style.top = `${top}px`;
      $dialog.style.height = `${height}px`;

      return;
    }

    if (fromRect.top === top && fromRect.height === height) {
      return;
    }

    const animation = $dialog.animate(
      [
        { top: `${fromRect.top}px`, height: `${fromRect.height}px` },
        { top: `${top}px`, height: `${height}px` },
      ],
      {
        duration: this._snapDuration($dialog),
        easing: this._snapEasing($dialog),
        fill: 'forwards',
      },
    );

    this._activeSnapAnimation = animation;

    animation.finished
      .then(() => animation.commitStyles())
      .catch(() => {
        // Interrupted by a newer gesture or snapTo() call, which owns applying
        // its own final styles.
      })
      .finally(() => {
        animation.cancel();

        if (this._activeSnapAnimation === animation) {
          this._activeSnapAnimation = null;
        }
      });
  }

  private _snapDuration($dialog: HTMLDialogElement): number {
    const raw = getComputedStyle($dialog)
      .getPropertyValue('--rc-bottom-sheet-snap-duration')
      .trim();
    const parsed = Number.parseFloat(raw);

    return Number.isFinite(parsed) ? parsed : DEFAULT_SNAP_DURATION_MS;
  }

  private _snapEasing($dialog: HTMLDialogElement): string {
    return (
      getComputedStyle($dialog).getPropertyValue('--rc-bottom-sheet-snap-easing').trim() ||
      DEFAULT_SNAP_EASING
    );
  }

  private _resolvedSnapPoints(): number[] {
    if (!this.snapPoints.trim()) {
      return [];
    }

    return this.snapPoints
      .trim()
      .split(/\s+/)
      .map((point) => this._resolveSnapPoint(point))
      .filter((point): point is number => Number.isFinite(point) && point > 0);
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
