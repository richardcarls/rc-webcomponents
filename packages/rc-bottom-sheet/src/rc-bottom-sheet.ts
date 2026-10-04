import { property } from 'lit/decorators.js';

import { RCDialog } from '@rcarls/rc-dialog';
import {
  findExtremeSnapIndex,
  findNearestSnapIndex,
  parseCssTime,
  type ResizeDirection,
  type ResizeLifecycleDetail,
  type ResizeOrigin,
} from '@rcarls/rc-common';

declare global {
  interface HTMLElementTagNameMap {
    'rc-bottom-sheet': RCBottomSheet;
  }

  interface HTMLElementEventMap {
    'rc-bottom-sheet-resize-start': CustomEvent<RCBottomSheetResizeStartDetail>;
    'rc-bottom-sheet-snap': CustomEvent<RCBottomSheetSnapDetail>;
  }
}

/** Detail shape for `rc-bottom-sheet-resize-start`. */
export interface RCBottomSheetResizeStartDetail {
  /** Rendered sheet height when the resize gesture begins. */
  height: number;

  /** Input mechanism initiating the resize. */
  inputType: 'pointer' | 'keyboard';
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

/**
 * Splits a `snap-points` value on whitespace outside parentheses, so a
 * `calc()` or `var()` entry with inner spaces stays one snap point.
 */
function splitSnapPoints(value: string): string[] {
  const points: string[] = [];
  let depth = 0;
  let current = '';

  for (const character of value.trim()) {
    if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth = Math.max(0, depth - 1);
    }

    if (depth === 0 && /\s/.test(character)) {
      if (current) {
        points.push(current);
        current = '';
      }
    } else {
      current += character;
    }
  }

  if (current) {
    points.push(current);
  }

  return points;
}

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
    inset-block-start: var(--rc-bottom-sheet-handle-offset, 50%);
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

  /*
   * Opacity only, deliberately not a slide transform: several tests (and a
   * consumer's own layout code) read getBoundingClientRect() immediately
   * after show()/showModal(), before any entrance transition would have
   * settled. A translate-based slide shifts that measured box for as long
   * as it's animating, the same conflict rc-dialog's scale had with its own
   * resize feature. showModal()/show()/close() stay synchronous either way;
   * nothing here is gated on the transition finishing.
   */
  @media (prefers-reduced-motion: no-preference) {
    rc-bottom-sheet > dialog[open] {
      opacity: 1;
      transition:
        opacity var(--rc-motion-effects-duration-default, 200ms)
          var(--rc-motion-effects-easing-enter, ease-out),
        overlay var(--rc-motion-effects-duration-default, 200ms) allow-discrete,
        display var(--rc-motion-effects-duration-default, 200ms) allow-discrete;
    }

    rc-bottom-sheet > dialog:not([open]) {
      opacity: 0;
      transition:
        opacity var(--rc-motion-effects-duration-default, 200ms)
          var(--rc-motion-effects-easing-exit, ease-in),
        overlay var(--rc-motion-effects-duration-default, 200ms) allow-discrete,
        display var(--rc-motion-effects-duration-default, 200ms) allow-discrete;
    }

    @starting-style {
      rc-bottom-sheet > dialog[open] {
        opacity: 0;
      }
    }

    rc-bottom-sheet > dialog[open]::backdrop {
      opacity: 1;
      transition: opacity var(--rc-motion-effects-duration-default, 200ms)
        var(--rc-motion-effects-easing-enter, ease-out);
    }

    rc-bottom-sheet > dialog:not([open])::backdrop {
      opacity: 0;
      transition: opacity var(--rc-motion-effects-duration-default, 200ms)
        var(--rc-motion-effects-easing-exit, ease-in);
    }

    @starting-style {
      rc-bottom-sheet > dialog[open]::backdrop {
        opacity: 0;
      }
    }
  }
}
`;

// Floor so a noisy near-zero-distance release can't misread as a decisive
// fling; a real swipe travels at least this far even if it's very quick.
const MIN_SWIPE_DISTANCE = 24;

// Space kept below a field the sheet grows to reveal above a keyboard.
const FOCUS_REVEAL_MARGIN = 16;

// Inline geometry a drag gesture (`pinElementBox`) or an earlier pin may
// leave behind. A docked sheet hands all of it back to its stylesheet.
const DOCK_RELEASED_PROPERTIES = [
  'inset',
  'top',
  'right',
  'bottom',
  'left',
  'inset-block-start',
  'inset-block-end',
  'inset-inline-start',
  'inset-inline-end',
  'width',
  'margin',
  'translate',
] as const;

/**
 * Docks the sheet to its block-end edge and pins only its rendered height.
 *
 * A bottom sheet's position belongs to CSS (`inset-block-end` and the
 * inline insets), so it stays docked when the viewport, a software keyboard,
 * or a moving containing block changes the space around it. Only the height
 * is frozen inline, as the one value snapping controls. Inline edges that a
 * drag gesture pinned are released here: `top` measured against a containing
 * block that later moves, or a leftover `bottom: auto`, would otherwise strand
 * the sheet away from its edge, and a pinned `left`/`width` would override
 * the inline-axis confinement a host page sets through custom properties.
 */
function dockBlockBox(target: HTMLElement): DOMRect {
  const rect = target.getBoundingClientRect();

  for (const property of DOCK_RELEASED_PROPERTIES) {
    target.style.removeProperty(property);
  }

  target.style.marginBlock = '0';
  target.style.boxSizing = 'border-box';
  target.style.height = `${rect.height}px`;

  return rect;
}

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
 * Opening and closing themselves fade the surface and its backdrop through
 * CSS alone (`@starting-style` plus a discrete `display`/`overlay`
 * transition), using the shared `--rc-motion-effects-*` tokens.
 * `showModal()`/`show()`/`close()` stay synchronous; nothing waits on the
 * transition finishing. The entrance animates opacity only, not a slide
 * transform, because several call sites (and this component's own drag/snap
 * math) read `getBoundingClientRect()` right after opening, which reports
 * the transformed box for as long as a transform-based entrance is still
 * running.
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
 * @fires rc-bottom-sheet-resize-start - Fires when an interactive resize begins.
 *   `detail: { height, inputType }`
 * @fires rc-bottom-sheet-snap - Fires after a drag release or `snapTo()` call
 *   settles at its snap target. `detail: { index, height, trigger }`
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
 *   `snapTo()` and settled to on drag release. Accepts `calc()` and `var()`, resolved in the
 *   sheet's context when each snap applies; percentages are of the viewport height.
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
 * @cssprop [--rc-bottom-sheet-handle-offset=50%] - Block-start position of the handle indicator's
 *   center within its target. Set a length to pin it above a title inside the handle.
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
   * Any CSS length works, including `calc()` and `var()`, and is resolved in
   * the sheet's own context when a snap is applied, so a custom property the
   * page animates (for example from a scroll timeline) is read at its current
   * value. Percentages are of the viewport height.
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

  // Snap-point heights are resolved from the *current* viewport at the
  // moment a snap is applied (dvh units, or a probe-element measurement for
  // other CSS units) and then frozen as an inline height — nothing re-derives
  // them afterward. A window resize (maximize/restore, or a software keyboard
  // under `interactive-widget=resizes-content`) otherwise leaves the sheet at
  // a stale height. Track the last-applied index so a resize can re-run the
  // same snap against fresh geometry; the sheet's docked position needs no
  // re-derivation.
  private _lastSnapIndex: number | null = null;
  // True while the sheet is grown past its snap height (and CSS maximum) to
  // keep a focused field visible above a software keyboard.
  private _extendedForFocus = false;
  private readonly _onWindowResize = (): void => {
    if (!this.open || this._lastSnapIndex === null) {
      return;
    }

    this._extendedForFocus = false;
    this._$dialog?.style.removeProperty('max-block-size');
    this._snapToIndex(this._lastSnapIndex, 'instant', 'api');
    this._revealFocusedField();
  };

  private readonly _onFocusIn = (): void => {
    this._revealFocusedField();
  };

  private readonly _onFocusOut = (event: FocusEvent): void => {
    const $dialog = this._$dialog;

    if (
      !this._extendedForFocus ||
      !$dialog ||
      (event.relatedTarget instanceof Node && $dialog.contains(event.relatedTarget))
    ) {
      return;
    }

    this._extendedForFocus = false;
    $dialog.style.removeProperty('max-block-size');

    if (this._lastSnapIndex !== null) {
      this._snapToIndex(this._lastSnapIndex, 'animated', 'api');
    }
  };

  override connectedCallback(): void {
    super.connectedCallback();
    RCBottomSheet._ensureBaseStyles(this.getRootNode() as Document | ShadowRoot);
    window.addEventListener('resize', this._onWindowResize);
    this.addEventListener('focusin', this._onFocusIn);
    this.addEventListener('focusout', this._onFocusOut);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('resize', this._onWindowResize);
    this.removeEventListener('focusin', this._onFocusIn);
    this.removeEventListener('focusout', this._onFocusOut);
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

  protected override _onResizeStart(detail: ResizeLifecycleDetail): void {
    // A gesture interrupts a running snap. The resize controller has already
    // pinned the animated box inline, so dropping the animation's forwards
    // fill keeps the sheet where it is instead of letting the snap settle
    // over the gesture.
    this._activeSnapAnimation?.cancel();
    this._activeSnapAnimation = null;

    this.dispatchEvent(
      new CustomEvent<RCBottomSheetResizeStartDetail>('rc-bottom-sheet-resize-start', {
        bubbles: true,
        composed: true,
        detail: { height: detail.height, inputType: detail.inputType },
      }),
    );
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

      this._snapToIndex(targetIndex, 'animated', 'drag', points);

      return;
    }

    this._snapToNearestPoint('drag', points);
  }

  private _shouldSwipeDismiss(detail: ResizeLifecycleDetail): boolean {
    return (
      detail.edge.includes('n') &&
      detail.startHeight - detail.height >= RCBottomSheet.swipeDismissThreshold
    );
  }

  private _snapToNearestPoint(
    trigger: 'drag' | 'api' = 'api',
    points = this._resolvedSnapPoints(),
  ): void {
    const $dialog = this._$dialog;

    if (!$dialog || points.length === 0) {
      return;
    }

    const height = $dialog.getBoundingClientRect().height;
    const nearestIndex = findNearestSnapIndex(points, height);

    this._snapToIndex(nearestIndex, 'animated', trigger, points);
  }

  private _snapToIndex(
    index: number,
    behavior: 'animated' | 'instant',
    trigger: 'drag' | 'api',
    points = this._resolvedSnapPoints(),
  ): void {
    const $dialog = this._$dialog;

    if (!$dialog || points.length === 0) {
      return;
    }

    // Dock before measuring: a drag gesture leaves its own edge pins inline,
    // and an earlier snap leaves an explicit height to animate from.
    const rect = dockBlockBox($dialog);
    const clampedIndex = Math.max(0, Math.min(index, points.length - 1));
    const requestedHeight = points[clampedIndex];

    this._lastSnapIndex = clampedIndex;

    // An in-flight animation wins over inline geometry in the cascade. Pin
    // its current visual box before cancelling so the constrained target can
    // be measured without jumping back to the prior snap point.
    this._activeSnapAnimation?.cancel();
    this._activeSnapAnimation = null;

    $dialog.style.height = `${requestedHeight}px`;

    // CSS min/max block-size can make the effective height differ from the
    // authored snap point; snap events report what actually renders.
    const targetHeight = $dialog.getBoundingClientRect().height;

    $dialog.style.height = `${rect.height}px`;

    this._applySnap($dialog, targetHeight, behavior, () => {
      this.dispatchEvent(
        new CustomEvent<RCBottomSheetSnapDetail>('rc-bottom-sheet-snap', {
          bubbles: true,
          composed: true,
          detail: { index: clampedIndex, height: targetHeight, trigger },
        }),
      );
    });
  }

  private _applySnap(
    $dialog: HTMLDialogElement,
    height: number,
    behavior: 'animated' | 'instant',
    onSettled: () => void,
  ): void {
    // Measure before cancelling any in-flight animation. `_snapToIndex()`
    // normally docks and cancels first, while this ordering also keeps direct
    // calls robust if applying a snap is refactored later.
    const fromHeight = $dialog.getBoundingClientRect().height;

    this._activeSnapAnimation?.cancel();
    this._activeSnapAnimation = null;

    if (behavior === 'instant' || this._reducedMotion?.matches || fromHeight === height) {
      $dialog.style.height = `${height}px`;

      onSettled();

      return;
    }

    // The sheet is docked at its block-end edge, so animating its height
    // alone moves the visible top edge.
    const animation = $dialog.animate(
      [{ height: `${fromHeight}px` }, { height: `${height}px` }],
      {
        duration: this._snapDuration($dialog),
        easing: this._snapEasing($dialog),
        fill: 'forwards',
      },
    );

    this._activeSnapAnimation = animation;

    animation.finished.then(
      () => {
        // A newer gesture or snapTo() call owns the final geometry and event.
        if (this._activeSnapAnimation !== animation) {
          animation.cancel();

          return;
        }

        // Persist the known target explicitly before removing the animation's
        // forwards fill. Unlike commitStyles(), this remains safe if a test or
        // consumer detaches the dialog as the finished promise resolves.
        $dialog.style.height = `${height}px`;
        animation.cancel();
        this._activeSnapAnimation = null;

        onSettled();
      },
      () => {
        // Interrupted by a newer gesture or snapTo() call, which owns applying
        // its own final styles and reporting its settled snap point.
        animation.cancel();

        if (this._activeSnapAnimation === animation) {
          this._activeSnapAnimation = null;
        }
      },
    );
  }

  /**
   * Keeps a focused field inside the sheet visible, as Android and Material
   * sheets do above a software keyboard: scroll it into view within the
   * sheet's own scroll containers, then grow the sheet past its snap height
   * and CSS maximum (up to the space above its docked edge) only when
   * scrolling cannot reveal it.
   */
  private _revealFocusedField(): void {
    const $dialog = this._$dialog;
    const $focused = document.activeElement;

    if (!this.open || !$dialog || !($focused instanceof HTMLElement) || !$dialog.contains($focused)) {
      return;
    }

    for (
      let $scroller = $focused.parentElement;
      $scroller && $dialog.contains($scroller);
      $scroller = $scroller.parentElement
    ) {
      if (
        $scroller.scrollHeight <= $scroller.clientHeight ||
        !/auto|scroll/.test(getComputedStyle($scroller).overflowY)
      ) {
        continue;
      }

      const box = $scroller.getBoundingClientRect();
      const field = $focused.getBoundingClientRect();

      if (field.bottom > box.bottom) {
        $scroller.scrollTop += Math.min(field.bottom - box.bottom, field.top - box.top);
      } else if (field.top < box.top) {
        $scroller.scrollTop -= box.top - field.top;
      }
    }

    const sheet = $dialog.getBoundingClientRect();
    const field = $focused.getBoundingClientRect();

    if (field.bottom <= sheet.bottom) {
      return;
    }

    // Growing the docked sheet lifts its content with its top edge, so the
    // field needs the sheet to be as tall as the field's offset from the
    // sheet's top, plus breathing room, bounded by the space above the
    // docked edge.
    const height = Math.min(field.bottom - sheet.top + FOCUS_REVEAL_MARGIN, sheet.bottom);

    this._activeSnapAnimation?.cancel();
    this._activeSnapAnimation = null;
    this._extendedForFocus = true;
    dockBlockBox($dialog);
    $dialog.style.maxBlockSize = 'none';
    $dialog.style.height = `${height}px`;
  }

  private _snapDuration($dialog: HTMLDialogElement): number {
    const raw = getComputedStyle($dialog).getPropertyValue('--rc-bottom-sheet-snap-duration');

    // Themes may resolve motion tokens in seconds (`.3s`); Web Animations
    // durations are milliseconds.
    return parseCssTime(raw) ?? DEFAULT_SNAP_DURATION_MS;
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

    const resolved: number[] = [];
    const measured: Array<{ index: number; point: string; probe: HTMLElement }> = [];

    for (const point of splitSnapPoints(this.snapPoints)) {
      const numeric = Number.parseFloat(point);

      if (Number.isFinite(numeric) && point.endsWith('%')) {
        resolved.push(window.innerHeight * (numeric / 100));
      } else if (Number.isFinite(numeric) && (point.endsWith('px') || String(numeric) === point)) {
        resolved.push(numeric);
      } else {
        const probe = document.createElement('div');

        resolved.push(Number.NaN);
        measured.push({ index: resolved.length - 1, point, probe });
      }
    }

    if (measured.length > 0) {
      this._measureSnapPoints(measured, resolved);
    }

    return resolved.filter((point) => Number.isFinite(point) && point > 0);
  }

  private _measureSnapPoints(
    entries: Array<{ index: number; point: string; probe: HTMLElement }>,
    resolved: number[],
  ): void {
    const context = document.createElement('div');

    const important = (element: HTMLElement, property: string, value: string): void => {
      element.style.setProperty(property, value, 'important');
    };

    // Give percentage expressions an explicit viewport-height containing
    // block. This keeps `calc(50% - ...)` equivalent to a plain `50%` even
    // when a transformed ancestor establishes the fixed containing block.
    important(context, 'all', 'initial');
    important(context, 'position', 'fixed');
    important(context, 'display', 'block');
    important(context, 'visibility', 'hidden');
    important(context, 'pointer-events', 'none');
    important(context, 'overflow', 'hidden');
    important(context, 'box-sizing', 'border-box');
    important(context, 'width', '0');
    important(context, 'height', `${window.innerHeight}px`);
    important(context, 'margin', '0');
    important(context, 'padding', '0');
    important(context, 'border', '0');
    important(context, 'font', 'inherit');
    important(context, 'writing-mode', 'horizontal-tb');
    important(context, 'inset', '0 auto auto 0');

    for (const { point, probe } of entries) {
      important(probe, 'all', 'initial');
      important(probe, 'position', 'absolute');
      important(probe, 'display', 'block');
      important(probe, 'box-sizing', 'border-box');
      important(probe, 'width', '0');
      important(probe, 'height', point);
      important(probe, 'min-height', '0');
      important(probe, 'max-height', 'none');
      important(probe, 'margin', '0');
      important(probe, 'padding', '0');
      important(probe, 'border', '0');
      important(probe, 'font', 'inherit');
      important(probe, 'writing-mode', 'horizontal-tb');
      important(probe, 'inset', '0 auto auto 0');
      context.append(probe);
    }

    this.append(context);

    try {
      // All probes are attached before the first style/layout read. Reading
      // computed physical height avoids transforms and writing mode changing
      // the CSS-pixel value that will be assigned to dialog.style.height.
      for (const { index, probe } of entries) {
        resolved[index] = Number.parseFloat(getComputedStyle(probe).height);
      }
    } finally {
      context.remove();
    }
  }
}

export default RCBottomSheet;
