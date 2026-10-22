import type { ReactiveController, ReactiveControllerHost } from 'lit';

import { cssZoom } from './cssZoom.js';
import {
  type AnchorPlacement,
  type PhysicalAnchorPlacement,
  resolveAnchorPlacement,
} from './anchorPlacement.js';
import { resolveFlow } from './flow.js';
import { observeLocale } from './observeLocale.js';
import { RafScheduler } from './RafScheduler.js';
import { getVisualViewportBounds } from './visualViewport.js';

export type { AnchorPlacement };

export interface AnchorOptions {
  /** The anchor (trigger) element. Accepts an element reference or getter. */
  anchor: Element | (() => Element | null);
  /** The floating element to position. Accepts an element reference or getter. */
  floating: Element | (() => Element | null);
  /** Preferred placement relative to the anchor. Defaults to `'block-end-start'`. */
  placement?: AnchorPlacement;
  /** Gap between anchor and floating in px. Defaults to `4`. */
  offset?: number;
  /** Flip to opposite side when clipped by viewport. Defaults to `true`. */
  flip?: boolean;
  /** Whether positioning is inactive. Accepts a boolean or a getter for live popup state. */
  disabled?: boolean | (() => boolean);
  /**
   * The LitElement shadow host. When provided, positioning CSS is injected into
   * the shadow root's adoptedStyleSheets so it reaches shadow-DOM floating elements,
   * including those promoted to the popover top layer.
   */
  shadowHost?: HTMLElement | (() => HTMLElement | null);
}

// ---- CSS placement helpers -----------------------------------------------

function placementCSS(placement: PhysicalAnchorPlacement, offset: number): string {
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

const FLIP_PLACEMENT: Record<PhysicalAnchorPlacement, PhysicalAnchorPlacement> = {
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
const INLINE_FLIP_PLACEMENT: Record<PhysicalAnchorPlacement, PhysicalAnchorPlacement> = {
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
// shadow DOM anchor rendering; exclude it so the script fallback runs instead.
const _hasNativeAnchor =
  typeof CSS !== 'undefined' &&
  CSS.supports('position-try-fallbacks: flip-block') &&
  CSS.supports('min-width: anchor-size(width)');

// ---- Controller -------------------------------------------------------------

let _uid = 0;

/**
 * Positions a floating element relative to an anchor element using CSS
 * Anchor Positioning where the browser supports it fully, and script
 * positioning with the same placement and flip rules elsewhere. The script
 * fallback re-runs when the page scrolls or the viewport, anchor, or
 * floating element resizes.
 *
 * For shadow DOM components (pass `shadowHost`), positioning CSS is injected
 * into the shadow root's `adoptedStyleSheets` so it reaches floating elements
 * including those promoted to the popover top layer.
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
  private _appliedTranslateXCssPx = 0;
  private _appliedTranslateYCssPx = 0;
  private _geometryAbort: AbortController | null = null;
  private _resizeObserver: ResizeObserver | null = null;
  private _intersectionObserver: IntersectionObserver | null = null;
  private _mutationObserver: MutationObserver | null = null;
  private _unobserveLocale: (() => void) | null = null;
  private _$observedAnchor: Element | null = null;
  private _$observedFloating: Element | null = null;

  private readonly _handleGeometryChange = (): void => {
    this._scheduleClamp();
  };

  // Scroll, resize, and intersection changes move the anchor, which the
  // script fallback must follow. Attribute mutations only re-clamp, since the
  // fallback's own inline style writes would otherwise feed back into it.
  private readonly _handlePositionChange = (): void => {
    if (!this._usesNativeAnchor() && this._connected && !this._disabled()) {
      this._positionFallback();
    }

    this._scheduleClamp();
  };

  private readonly _handleDirectionChange = (): void => {
    this._applyAndPosition();
  };

  constructor(host: ReactiveControllerHost, options: AnchorOptions) {
    this._opts = options;
    this._uid = `rc-anchor-${++_uid}`;
    host.addController(this);
  }

  setOptions(next: Partial<AnchorOptions>): void {
    Object.assign(this._opts, next);
    this._applyAndPosition();
  }

  /** Re-apply positioning after the popup becomes visible or the anchor moves. */
  update(): void {
    this._applyAndPosition();
  }

  hostConnected(): void {
    this._connected = true;
    this._unobserveLocale ??= observeLocale(this._handleDirectionChange);
    this._applyAndPosition();
  }

  hostDisconnected(): void {
    this._connected = false;
    this._unobserveLocale?.();
    this._unobserveLocale = null;
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

  private _disabled(): boolean {
    const { disabled } = this._opts;

    return typeof disabled === 'function' ? disabled() : (disabled ?? false);
  }

  // A method rather than a direct read of the module constant, so tests can
  // run the script fallback in engines with native support.
  private _usesNativeAnchor(): boolean {
    return _hasNativeAnchor;
  }

  private _applyAndPosition(): void {
    if (!this._connected || !this._apply()) {
      return;
    }

    if (!this._usesNativeAnchor()) {
      this._positionFallback();
    }

    this._startWatchingGeometry();
    this._scheduleClamp();
  }

  /**
   * Checks viewport overflow during a bounded post-open settling window.
   * Observers and viewport events restart the window when geometry changes,
   * avoiding permanent layout polling while a popup is idle.
   */
  private _scheduleClamp(): void {
    if (!this._connected || this._disabled()) {
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
    if (!this._connected || this._disabled()) {
      this._stopClampLoop();

      return;
    }

    const $floating = this._floating() as HTMLElement | null;

    if (!$floating) {
      this._stopClampLoop();

      return;
    }

    const rect = $floating.getBoundingClientRect();
    const floatingZoom = cssZoom($floating);
    const isVisible = rect.width > 0 || rect.height > 0;

    if (!isVisible) {
      this._stopClampLoop();
      this._stopWatchingGeometry();

      return;
    }

    const naturalRect = [
      rect.left - this._appliedTranslateXCssPx * floatingZoom,
      rect.top - this._appliedTranslateYCssPx * floatingZoom,
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

    $floating.ownerDocument.addEventListener('scroll', this._handlePositionChange, {
      ...options,
      capture: true,
    });

    $window?.addEventListener('resize', this._handlePositionChange, options);
    $window?.visualViewport?.addEventListener('resize', this._handlePositionChange, options);
    $window?.visualViewport?.addEventListener('scroll', this._handlePositionChange, options);

    if (typeof ResizeObserver === 'function') {
      this._resizeObserver = new ResizeObserver(this._handlePositionChange);
      this._resizeObserver.observe($anchor);
      this._resizeObserver.observe($floating);
    }

    if (typeof IntersectionObserver === 'function') {
      this._intersectionObserver = new IntersectionObserver(this._handlePositionChange, {
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
   * suite. `_appliedTranslateXCssPx`/`_appliedTranslateYCssPx` track the offset this method itself
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
    const floatingZoom = cssZoom(floating);

    // Undo the previous tick's correction to get the natural rect.
    const appliedXViewportPx = this._appliedTranslateXCssPx * floatingZoom;
    const appliedYViewportPx = this._appliedTranslateYCssPx * floatingZoom;
    const left = rect.left - appliedXViewportPx;
    const right = rect.right - appliedXViewportPx;
    const top = rect.top - appliedYViewportPx;
    const bottom = rect.bottom - appliedYViewportPx;

    let dxViewportPx = 0;
    let dyViewportPx = 0;

    if (right > viewport.right - margin) {
      dxViewportPx = viewport.right - margin - right;
    }

    if (left + dxViewportPx < viewport.left + margin) {
      dxViewportPx = viewport.left + margin - left;
    }

    if (bottom > viewport.bottom - margin) {
      dyViewportPx = viewport.bottom - margin - bottom;
    }

    if (top + dyViewportPx < viewport.top + margin) {
      dyViewportPx = viewport.top + margin - top;
    }

    this._appliedTranslateXCssPx = dxViewportPx / floatingZoom;
    this._appliedTranslateYCssPx = dyViewportPx / floatingZoom;

    const translate =
      dxViewportPx || dyViewportPx
        ? `${this._appliedTranslateXCssPx}px ${this._appliedTranslateYCssPx}px`
        : '';
    const viewportInlineSize = `${Math.max(0, viewport.width - margin * 2) / floatingZoom}px`;
    const viewportBlockSize = `${Math.max(0, viewport.height - margin * 2) / floatingZoom}px`;

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

  /**
   * The configured placement resolved against the anchor's writing mode and
   * direction. Read at every apply, since a `dir` change fires no event.
   */
  private _physicalPlacement(anchor: Element): PhysicalAnchorPlacement {
    return resolveAnchorPlacement(this._opts.placement ?? 'block-end-start', resolveFlow(anchor));
  }

  private _apply(): boolean {
    if (this._disabled()) {
      this._cleanup();

      return false;
    }

    const anchor = this._anchor();
    const floating = this._floating();

    if (!anchor || !floating) {
      this._stopClampLoop();

      return false;
    }

    const placement = this._physicalPlacement(anchor);
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
   * Hand-rolled positioning for browsers without full native anchor
   * positioning. Handles all four placement
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

    const placement = this._physicalPlacement(anchor);
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
    const floatingZoom = cssZoom(floating);
    const offsetViewportPx = offset * floatingZoom;

    floating.style.position = 'fixed';
    floating.style.boxSizing = 'border-box';
    floating.style.minWidth = `${rect.width / floatingZoom}px`;
    floating.style.top = '';
    floating.style.bottom = '';
    floating.style.left = '';
    floating.style.right = '';

    const popupWidthViewportPx = (floating.offsetWidth || rect.width / floatingZoom) * floatingZoom;
    const popupHeightViewportPx = floating.offsetHeight * floatingZoom;
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
        if (
          side === 'bottom' &&
          spaceBelow < popupHeightViewportPx + offsetViewportPx &&
          spaceAbove > spaceBelow
        ) {
          resolvedSide = 'top';
        } else if (
          side === 'top' &&
          spaceAbove < popupHeightViewportPx + offsetViewportPx &&
          spaceBelow > spaceAbove
        ) {
          resolvedSide = 'bottom';
        }
      }

      if (resolvedSide === 'top') {
        floating.style.bottom = `${(vh - rect.top + offsetViewportPx) / floatingZoom}px`;
      } else {
        floating.style.top = `${(rect.bottom + offsetViewportPx) / floatingZoom}px`;
      }

      let leftViewportPx =
        align === 'end'
          ? rect.right - popupWidthViewportPx
          : align === 'start'
            ? rect.left
            : rect.left + rect.width / 2 - popupWidthViewportPx / 2;

      leftViewportPx = Math.max(
        viewport.left + margin,
        Math.min(leftViewportPx, viewport.right - popupWidthViewportPx - margin),
      );

      floating.style.left = `${leftViewportPx / floatingZoom}px`;
    } else {
      const spaceRight = viewport.right - rect.right;
      const spaceLeft = rect.left - viewport.left;

      if (flip) {
        if (
          side === 'right' &&
          spaceRight < popupWidthViewportPx + offsetViewportPx &&
          spaceLeft > spaceRight
        ) {
          resolvedSide = 'left';
        } else if (
          side === 'left' &&
          spaceLeft < popupWidthViewportPx + offsetViewportPx &&
          spaceRight > spaceLeft
        ) {
          resolvedSide = 'right';
        }
      }

      if (resolvedSide === 'left') {
        floating.style.right = `${(vw - rect.left + offsetViewportPx) / floatingZoom}px`;
      } else {
        floating.style.left = `${(rect.right + offsetViewportPx) / floatingZoom}px`;
      }

      let topViewportPx =
        align === 'end'
          ? rect.bottom - popupHeightViewportPx
          : align === 'start'
            ? rect.top
            : rect.top + rect.height / 2 - popupHeightViewportPx / 2;

      topViewportPx = Math.max(
        viewport.top + margin,
        Math.min(topViewportPx, viewport.bottom - popupHeightViewportPx - margin),
      );

      floating.style.top = `${topViewportPx / floatingZoom}px`;
    }
  }

  private _cleanup(): void {
    this._stopClampLoop();
    this._stopWatchingGeometry();
    this._appliedTranslateXCssPx = 0;
    this._appliedTranslateYCssPx = 0;

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
