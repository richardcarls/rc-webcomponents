import type { ReactiveController, ReactiveControllerHost } from 'lit';

import { RafScheduler } from './RafScheduler.js';
import { getVisualViewportBounds } from './visualViewport.js';

export type AnchorPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export interface AnchorOptions {
  /** The anchor (trigger) element. Accepts an element reference or getter. */
  anchor: Element | (() => Element | null);
  /** The floating element to position. Accepts an element reference or getter. */
  floating: Element | (() => Element | null);
  /** Preferred placement relative to the anchor. Defaults to `'bottom-start'`. */
  placement?: AnchorPlacement;
  /** Gap between anchor and floating in px. Defaults to `4`. */
  offset?: number;
  /** Flip to opposite side when clipped by viewport. Defaults to `true`. */
  flip?: boolean;
  disabled?: boolean;
  /**
   * The LitElement shadow host. When provided, positioning CSS is injected into
   * the shadow root's adoptedStyleSheets so it reaches shadow-DOM floating elements,
   * including those promoted to the popover top layer. The polyfill is invoked
   * with roots: [shadowHost] to scope its traversal to this shadow root.
   */
  shadowHost?: HTMLElement | (() => HTMLElement | null);
}

// ---- CSS placement helpers -----------------------------------------------

function placementCSS(placement: AnchorPlacement, offset: number): string {
  const o = `${offset}px`;

  switch (placement) {
    case 'top':
      return `position-area: top; margin-bottom: ${o};`;
    case 'top-start':
      return `bottom: anchor(top); top: auto; left: anchor(left); right: auto; margin-bottom: ${o};`;
    case 'top-end':
      return `bottom: anchor(top); top: auto; left: auto; right: anchor(right); margin-bottom: ${o};`;
    case 'bottom':
      return `position-area: bottom; margin-top: ${o};`;
    case 'bottom-start':
      return `top: anchor(bottom); bottom: auto; left: anchor(left); right: auto; margin-top: ${o};`;
    case 'bottom-end':
      return `top: anchor(bottom); bottom: auto; left: auto; right: anchor(right); margin-top: ${o};`;
    case 'left':
      return `position-area: left; margin-right: ${o};`;
    case 'left-start':
      return `top: anchor(top); bottom: auto; right: anchor(left); left: auto; margin-right: ${o};`;
    case 'left-end':
      return `top: auto; bottom: anchor(bottom); right: anchor(left); left: auto; margin-right: ${o};`;
    case 'right':
      return `position-area: right; margin-left: ${o};`;
    case 'right-start':
      return `top: anchor(top); bottom: auto; left: anchor(right); right: auto; margin-left: ${o};`;
    case 'right-end':
      return `top: auto; bottom: anchor(bottom); left: anchor(right); right: auto; margin-left: ${o};`;
  }
}

const FLIP_PLACEMENT: Record<AnchorPlacement, AnchorPlacement> = {
  top: 'bottom',
  'top-start': 'bottom-start',
  'top-end': 'bottom-end',
  bottom: 'top',
  'bottom-start': 'top-start',
  'bottom-end': 'top-end',
  left: 'right',
  'left-start': 'right-start',
  'left-end': 'right-end',
  right: 'left',
  'right-start': 'left-start',
  'right-end': 'left-end',
};

// Inline-axis flip: start ↔ end (handles horizontal viewport overflow)
const INLINE_FLIP_PLACEMENT: Record<AnchorPlacement, AnchorPlacement> = {
  top: 'top',
  'top-start': 'top-end',
  'top-end': 'top-start',
  bottom: 'bottom',
  'bottom-start': 'bottom-end',
  'bottom-end': 'bottom-start',
  left: 'left',
  'left-start': 'left-end',
  'left-end': 'left-start',
  right: 'right',
  'right-start': 'right-end',
  'right-end': 'right-start',
};

// ---- Native detection -------------------------------------------------------

// Chrome 125+ only — full correct implementation including shadow DOM + popover top layer.
// Firefox 134+ reports position-try-fallbacks support but lacks anchor-size() and has broken
// shadow DOM anchor rendering; exclude it so the polyfill/fallback runs instead.
const _hasNativeAnchor =
  typeof CSS !== 'undefined' &&
  CSS.supports('position-try-fallbacks: flip-block') &&
  CSS.supports('min-width: anchor-size(width)');

// ---- Polyfill ---------------------------------------------------------------

type PolyfillFn = (opts?: {
  roots?: (Document | HTMLElement)[];
  useAnimationFrame?: boolean;
  [key: string]: unknown;
}) => Promise<unknown>;

let _polyfillFn: PolyfillFn | null = null;
let _polyfillPromise: Promise<PolyfillFn | null> | null = null;

function _loadPolyfill(): Promise<PolyfillFn | null> {
  if (_hasNativeAnchor) {
    return Promise.resolve(null);
  }

  if (!_polyfillPromise) {
    _polyfillPromise = import('@oddbird/css-anchor-positioning/fn')
      .then((mod) => {
        _polyfillFn = mod.default as unknown as PolyfillFn;

        return _polyfillFn;
      })
      .catch(() => null);
  }

  return _polyfillPromise;
}

// ---- Controller -------------------------------------------------------------

let _uid = 0;

/**
 * Positions a floating element relative to an anchor element using CSS
 * Anchor Positioning (native-first, polyfill on unsupported browsers via
 * `@oddbird/css-anchor-positioning`).
 *
 * For shadow DOM components (pass `shadowHost`), positioning CSS is injected
 * into the shadow root's `adoptedStyleSheets` so it reaches floating elements
 * including those promoted to the popover top layer. The polyfill is invoked
 * with `roots: [shadowHost]` to scope its stylesheet traversal correctly.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning
 */
export class AnchorController implements ReactiveController {
  private _opts: AnchorOptions;
  private readonly _uid: string;
  private _styleEl: HTMLStyleElement | null = null;
  private _adoptedSheet: CSSStyleSheet | null = null;
  private _connected = false;
  private readonly _clampScheduler = new RafScheduler();
  private _clampLoopActive = false;
  private _settleFramesRemaining = 0;
  private _stableFrames = 0;
  private _lastNaturalRect = '';
  private _appliedDx = 0;
  private _appliedDy = 0;
  private _geometryAbort: AbortController | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _intersectionObserver: IntersectionObserver | null = null;
  private _mutationObserver: MutationObserver | null = null;
  private _$observedAnchor: Element | null = null;
  private _$observedFloating: Element | null = null;

  private readonly _handleGeometryChange = (): void => {
    this._scheduleClamp();
  };

  constructor(host: ReactiveControllerHost, options: AnchorOptions) {
    this._opts = options;
    this._uid = `rc-anchor-${++_uid}`;
    host.addController(this);
  }

  setOptions(next: Partial<AnchorOptions>): void {
    Object.assign(this._opts, next);
    this._applyAndPolyfill();
  }

  /** Re-apply positioning after the popup becomes visible or the anchor moves. */
  update(): void {
    this._applyAndPolyfill();
  }

  hostConnected(): void {
    this._connected = true;
    this._applyAndPolyfill();
  }

  hostDisconnected(): void {
    this._connected = false;
    this._cleanup();
  }

  private _anchor(): Element | null {
    const { anchor } = this._opts;

    return typeof anchor === 'function' ? anchor() : anchor;
  }

  private _floating(): Element | null {
    const { floating } = this._opts;

    return typeof floating === 'function' ? floating() : floating;
  }

  private _shadowHost(): HTMLElement | null {
    const { shadowHost } = this._opts;

    return typeof shadowHost === 'function' ? shadowHost() : (shadowHost ?? null);
  }

  private _applyAndPolyfill(): void {
    if (!this._connected || !this._apply()) {
      return;
    }

    if (_hasNativeAnchor) {
      this._startWatchingGeometry();
      this._scheduleClamp();
    } else {
      void this._applyPolyfillOrFallback().then(() => {
        if (this._connected && !this._opts.disabled) {
          this._startWatchingGeometry();
          this._scheduleClamp();
        }
      });
    }
  }

  /**
   * Checks viewport overflow during a bounded post-open settling window.
   * Observers and viewport events restart the window when geometry changes,
   * avoiding permanent layout polling while a popup is idle.
   */
  private _scheduleClamp(): void {
    if (!this._connected || this._opts.disabled) {
      return;
    }

    if (!this._clampLoopActive) {
      this._clampLoopActive = true;
    }

    this._settleFramesRemaining = 10;
    this._stableFrames = 0;
    this._lastNaturalRect = '';
    this._clampScheduler.schedule(() => this._runClampTick());
  }

  private _runClampTick(): void {
    if (!this._connected || this._opts.disabled) {
      this._stopClampLoop();

      return;
    }

    const $floating = this._floating() as HTMLElement | null;

    if (!$floating) {
      this._stopClampLoop();

      return;
    }

    const rect = $floating.getBoundingClientRect();
    const isVisible = rect.width > 0 || rect.height > 0;

    if (!isVisible) {
      this._stopClampLoop();
      this._stopWatchingGeometry();

      return;
    }

    const naturalRect = [
      rect.left - this._appliedDx,
      rect.top - this._appliedDy,
      rect.width,
      rect.height,
    ]
      .map((value) => Math.round(value * 4) / 4)
      .join(':');

    this._stableFrames = naturalRect === this._lastNaturalRect ? this._stableFrames + 1 : 0;
    this._lastNaturalRect = naturalRect;
    this._settleFramesRemaining -= 1;

    this._clampToViewport(rect);

    if (this._stableFrames >= 3 || this._settleFramesRemaining <= 0) {
      this._stopClampLoop();

      return;
    }

    this._clampScheduler.schedule(() => this._runClampTick());
  }

  private _stopClampLoop(): void {
    this._clampScheduler.cancel();
    this._clampLoopActive = false;
    this._settleFramesRemaining = 0;
    this._stableFrames = 0;
    this._lastNaturalRect = '';
  }

  private _startWatchingGeometry(): void {
    const $anchor = this._anchor();
    const $floating = this._floating();

    if (!$anchor || !$floating) {
      this._stopWatchingGeometry();

      return;
    }

    if (
      this._geometryAbort &&
      this._$observedAnchor === $anchor &&
      this._$observedFloating === $floating
    ) {
      return;
    }

    this._stopWatchingGeometry();
    this._$observedAnchor = $anchor;
    this._$observedFloating = $floating;
    this._geometryAbort = new AbortController();

    const $window = $floating.ownerDocument.defaultView;
    const options = { passive: true, signal: this._geometryAbort.signal };

    $floating.ownerDocument.addEventListener('scroll', this._handleGeometryChange, {
      ...options,
      capture: true,
    });

    $window?.addEventListener('resize', this._handleGeometryChange, options);
    $window?.visualViewport?.addEventListener('resize', this._handleGeometryChange, options);
    $window?.visualViewport?.addEventListener('scroll', this._handleGeometryChange, options);

    if (typeof ResizeObserver === 'function') {
      this._resizeObserver = new ResizeObserver(this._handleGeometryChange);
      this._resizeObserver.observe($anchor);
      this._resizeObserver.observe($floating);
    }

    if (typeof IntersectionObserver === 'function') {
      this._intersectionObserver = new IntersectionObserver(this._handleGeometryChange, {
        threshold: [0, 1],
      });

      this._intersectionObserver.observe($floating);
    }

    if (typeof MutationObserver === 'function') {
      this._mutationObserver = new MutationObserver(this._handleGeometryChange);

      this._mutationObserver.observe($anchor, {
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden', 'open'],
      });

      this._mutationObserver.observe($floating, {
        attributes: true,
        attributeFilter: ['class', 'style', 'hidden', 'open'],
      });
    }
  }

  private _stopWatchingGeometry(): void {
    this._geometryAbort?.abort();
    this._geometryAbort = null;
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    this._intersectionObserver?.disconnect();
    this._intersectionObserver = null;
    this._mutationObserver?.disconnect();
    this._mutationObserver = null;
    this._$observedAnchor = null;
    this._$observedFloating = null;
  }

  /**
   * Nudges the floating element back on-screen via `translate` if whatever
   * positioned it (native or otherwise) still left it overflowing the
   * viewport. `translate` is used rather than adjusting `left`/`top`/etc.
   * directly because it's a pure visual offset on top of the existing
   * positioning, independent of which mechanism produced it — no need to
   * know or reconstruct the underlying `left`/`right`/`position-anchor`
   * values to correct them. It's safe to apply even to a popover-promoted
   * element with its own further-nested anchor-positioned descendants (e.g.
   * a submenu): top-layer promotion means a nested popover isn't contained
   * by this element's box for `position: fixed` purposes, so translating
   * this one doesn't drag a nested popup along or break its own anchoring.
   *
   * `getBoundingClientRect()` reflects whatever `translate` the previous
   * update applied, and computing the new correction directly
   * off that rect would see the already-corrected (on-screen) position,
   * clear the correction as unnecessary, then reapply it next frame once
   * the underlying overflow reappears — an every-frame flicker confirmed
   * by a real click landing on a mid-flicker frame in the browser test
   * suite. `_appliedDx`/`_appliedDy` track the offset this method itself
   * last applied so it can subtract it back out and compute against the
   * element's natural, uncorrected position each time.
   */
  private _clampToViewport(measuredRect?: DOMRect): void {
    const floating = this._floating() as HTMLElement | null;

    if (!floating) {
      return;
    }

    const margin = 4;
    const rect = measuredRect ?? floating.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) {
      return; // not actually visible/open
    }

    const $window = floating.ownerDocument.defaultView;

    if (!$window) {
      return;
    }

    const viewport = getVisualViewportBounds($window);

    // Undo the previous tick's correction to get the natural rect.
    const left = rect.left - this._appliedDx;
    const right = rect.right - this._appliedDx;
    const top = rect.top - this._appliedDy;
    const bottom = rect.bottom - this._appliedDy;

    let dx = 0;
    let dy = 0;

    if (right > viewport.right - margin) {
      dx = viewport.right - margin - right;
    }

    if (left + dx < viewport.left + margin) {
      dx = viewport.left + margin - left;
    }

    if (bottom > viewport.bottom - margin) {
      dy = viewport.bottom - margin - bottom;
    }

    if (top + dy < viewport.top + margin) {
      dy = viewport.top + margin - top;
    }

    this._appliedDx = dx;
    this._appliedDy = dy;

    const translate = dx || dy ? `${dx}px ${dy}px` : '';
    const viewportInlineSize = `${Math.max(0, viewport.width - margin * 2)}px`;
    const viewportBlockSize = `${Math.max(0, viewport.height - margin * 2)}px`;

    if (floating.style.translate !== translate) {
      floating.style.translate = translate;
    }

    if (
      floating.style.getPropertyValue('--rc-anchor-viewport-inline-size') !== viewportInlineSize
    ) {
      floating.style.setProperty('--rc-anchor-viewport-inline-size', viewportInlineSize);
    }

    if (floating.style.getPropertyValue('--rc-anchor-viewport-block-size') !== viewportBlockSize) {
      floating.style.setProperty('--rc-anchor-viewport-block-size', viewportBlockSize);
    }
  }

  private async _applyPolyfillOrFallback(): Promise<void> {
    const fn = await _loadPolyfill();

    if (!this._connected || this._opts.disabled) {
      return;
    }

    const host = this._shadowHost();

    if (fn) {
      await fn({ roots: host ? [host] : undefined, useAnimationFrame: false });
    } else {
      this._positionFallback();
    }
  }

  private _apply(): boolean {
    if (this._opts.disabled) {
      this._cleanup();

      return false;
    }

    const anchor = this._anchor();
    const floating = this._floating();

    if (!anchor || !floating) {
      this._stopClampLoop();

      return false;
    }

    const placement = this._opts.placement ?? 'bottom-start';
    const offset = this._opts.offset ?? 4;
    const flip = this._opts.flip ?? true;
    const anchorName = `--${this._uid}`;
    const uid = this._uid;

    (anchor as HTMLElement).style.setProperty('anchor-name', anchorName);
    floating.setAttribute('data-rc-anchor', uid);

    const flipPlacement = FLIP_PLACEMENT[placement];
    const inlineFlipPlacement = INLINE_FLIP_PLACEMENT[placement];
    const bothFlipPlacement = FLIP_PLACEMENT[inlineFlipPlacement];
    const flipBlock = flip
      ? `
        @position-try --${uid}-end  { ${placementCSS(inlineFlipPlacement, offset)} }
        @position-try --${uid}-flip { ${placementCSS(flipPlacement, offset)} }
        @position-try --${uid}-both { ${placementCSS(bothFlipPlacement, offset)} }
      `
      : '';
    // Try inline flip first (fixes horizontal overflow on narrow viewports),
    // then block flip (fixes vertical overflow), then both together.
    const positionTry = flip
      ? `position-try-fallbacks: --${uid}-end, --${uid}-flip, --${uid}-both;`
      : '';

    const css = `
      ${flipBlock}
      [data-rc-anchor="${uid}"] {
        position: fixed;
        position-anchor: ${anchorName};
        box-sizing: border-box;
        min-width: anchor-size(width);
        ${placementCSS(placement, offset)}
        ${positionTry}
      }
    `;

    this._injectStyles(css);

    return true;
  }

  private _injectStyles(css: string): void {
    const host = this._shadowHost();

    if (host?.shadowRoot) {
      if (!this._adoptedSheet) {
        this._adoptedSheet = new CSSStyleSheet();

        host.shadowRoot.adoptedStyleSheets = [
          ...host.shadowRoot.adoptedStyleSheets,
          this._adoptedSheet,
        ];
      }

      this._adoptedSheet.replaceSync(css);
    } else {
      this._styleEl?.remove();

      const $document = this._floating()?.ownerDocument ?? this._anchor()?.ownerDocument;

      if (!$document) {
        return;
      }

      this._styleEl = $document.createElement('style');
      this._styleEl.setAttribute('data-rc-anchor-style', this._uid);
      this._styleEl.textContent = css;
      $document.head.appendChild(this._styleEl);
    }
  }

  /**
   * Hand-rolled positioning for browsers where neither native anchor
   * positioning nor the polyfill is usable. Handles all four placement
   * sides (not just top/bottom — a side flyout like a cascading submenu
   * needs its primary axis to be horizontal, offsetting by the anchor's
   * own width/height rather than always stacking below it), with the
   * `-start`/`-end` suffix controlling cross-axis alignment and an
   * unsuffixed placement centering on the cross axis.
   */
  private _positionFallback(): void {
    const anchor = this._anchor() as HTMLElement | null;
    const floating = this._floating() as HTMLElement | null;

    if (!anchor || !floating) {
      return;
    }

    const placement = this._opts.placement ?? 'bottom-start';
    const offset = this._opts.offset ?? 4;
    const flip = this._opts.flip ?? true;
    const margin = 4;
    const rect = anchor.getBoundingClientRect();
    const $window = anchor.ownerDocument.defaultView;

    if (!$window) {
      return;
    }

    const viewport = getVisualViewportBounds($window);
    const vw = $window.innerWidth;
    const vh = $window.innerHeight;

    floating.style.position = 'fixed';
    floating.style.boxSizing = 'border-box';
    floating.style.minWidth = `${rect.width}px`;
    floating.style.top = '';
    floating.style.bottom = '';
    floating.style.left = '';
    floating.style.right = '';

    const popupWidth = floating.offsetWidth || rect.width;
    const popupHeight = floating.offsetHeight || 0;
    const side = placement.split('-')[0] as 'top' | 'bottom' | 'left' | 'right';
    const align: 'start' | 'end' | 'center' = placement.endsWith('-start')
      ? 'start'
      : placement.endsWith('-end')
        ? 'end'
        : 'center';

    let resolvedSide: typeof side = side;

    if (side === 'top' || side === 'bottom') {
      const spaceBelow = viewport.bottom - rect.bottom;
      const spaceAbove = rect.top - viewport.top;

      if (flip) {
        if (side === 'bottom' && spaceBelow < popupHeight + offset && spaceAbove > spaceBelow) {
          resolvedSide = 'top';
        } else if (side === 'top' && spaceAbove < popupHeight + offset && spaceBelow > spaceAbove) {
          resolvedSide = 'bottom';
        }
      }

      if (resolvedSide === 'top') {
        floating.style.bottom = `${vh - rect.top + offset}px`;
      } else {
        floating.style.top = `${rect.bottom + offset}px`;
      }

      let left =
        align === 'end'
          ? rect.right - popupWidth
          : align === 'start'
            ? rect.left
            : rect.left + rect.width / 2 - popupWidth / 2;

      left = Math.max(viewport.left + margin, Math.min(left, viewport.right - popupWidth - margin));

      floating.style.left = `${left}px`;
    } else {
      const spaceRight = viewport.right - rect.right;
      const spaceLeft = rect.left - viewport.left;

      if (flip) {
        if (side === 'right' && spaceRight < popupWidth + offset && spaceLeft > spaceRight) {
          resolvedSide = 'left';
        } else if (side === 'left' && spaceLeft < popupWidth + offset && spaceRight > spaceLeft) {
          resolvedSide = 'right';
        }
      }

      if (resolvedSide === 'left') {
        floating.style.right = `${vw - rect.left + offset}px`;
      } else {
        floating.style.left = `${rect.right + offset}px`;
      }

      let top =
        align === 'end'
          ? rect.bottom - popupHeight
          : align === 'start'
            ? rect.top
            : rect.top + rect.height / 2 - popupHeight / 2;

      top = Math.max(viewport.top + margin, Math.min(top, viewport.bottom - popupHeight - margin));

      floating.style.top = `${top}px`;
    }
  }

  private _cleanup(): void {
    this._stopClampLoop();
    this._stopWatchingGeometry();
    this._appliedDx = 0;
    this._appliedDy = 0;

    const anchor = this._anchor();
    const floating = this._floating();

    if (anchor) {
      (anchor as HTMLElement).style.removeProperty('anchor-name');
    }

    if (floating) {
      floating.removeAttribute('data-rc-anchor');
      // Clear any overflow-clamp nudge so a reopened popup doesn't inherit
      // a stale offset computed for its previous position/viewport size.
      (floating as HTMLElement).style.translate = '';
      (floating as HTMLElement).style.removeProperty('--rc-anchor-viewport-inline-size');
      (floating as HTMLElement).style.removeProperty('--rc-anchor-viewport-block-size');
    }

    this._styleEl?.remove();
    this._styleEl = null;

    const host = this._shadowHost();

    if (host?.shadowRoot && this._adoptedSheet) {
      host.shadowRoot.adoptedStyleSheets = host.shadowRoot.adoptedStyleSheets.filter(
        (s) => s !== this._adoptedSheet,
      );

      this._adoptedSheet = null;
    }
  }
}
