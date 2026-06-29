import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type AnchorPlacement =
  | 'top' | 'top-start' | 'top-end'
  | 'bottom' | 'bottom-start' | 'bottom-end'
  | 'left' | 'left-start' | 'left-end'
  | 'right' | 'right-start' | 'right-end';

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
  'top': 'bottom',         'top-start': 'bottom-start',   'top-end': 'bottom-end',
  'bottom': 'top',         'bottom-start': 'top-start',   'bottom-end': 'top-end',
  'left': 'right',         'left-start': 'right-start',   'left-end': 'right-end',
  'right': 'left',         'right-start': 'left-start',   'right-end': 'left-end',
};

// Inline-axis flip: start ↔ end (handles horizontal viewport overflow)
const INLINE_FLIP_PLACEMENT: Record<AnchorPlacement, AnchorPlacement> = {
  'top': 'top',            'top-start': 'top-end',         'top-end': 'top-start',
  'bottom': 'bottom',      'bottom-start': 'bottom-end',   'bottom-end': 'bottom-start',
  'left': 'left',          'left-start': 'left-end',       'left-end': 'left-start',
  'right': 'right',        'right-start': 'right-end',     'right-end': 'right-start',
};

// ---- Native detection -------------------------------------------------------

// Chrome 125+ only — full correct implementation including shadow DOM + popover top layer.
// Firefox 134+ reports position-try-fallbacks support but lacks anchor-size() and has broken
// shadow DOM anchor rendering; exclude it so the polyfill/fallback runs instead.
const _hasNativeAnchor =
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
  if (_hasNativeAnchor) return Promise.resolve(null);
  if (!_polyfillPromise) {
    _polyfillPromise = import('@oddbird/css-anchor-positioning/fn')
      .then((mod) => { _polyfillFn = mod.default as unknown as PolyfillFn; return _polyfillFn; })
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

  constructor(host: ReactiveControllerHost, options: AnchorOptions) {
    this._opts = options;
    this._uid = `rc-anchor-${++_uid}`;
    host.addController(this);
  }

  setOptions(next: Partial<AnchorOptions>): void {
    Object.assign(this._opts, next);
    this._applyAndPolyfill();
  }

  /** Re-apply positioning — call when the popup opens or the anchor moves. */
  update(): void {
    this._applyAndPolyfill();
  }

  hostConnected(): void {
    this._applyAndPolyfill();
  }

  hostDisconnected(): void {
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
    this._apply();
    if (!_hasNativeAnchor) {
      void this._applyPolyfillOrFallback();
    }
  }

  private async _applyPolyfillOrFallback(): Promise<void> {
    const fn = await _loadPolyfill();
    const host = this._shadowHost();
    if (fn) {
      await fn({ roots: host ? [host] : undefined, useAnimationFrame: false });
    } else {
      this._positionFallback();
    }
  }

  private _apply(): void {
    if (this._opts.disabled) { this._cleanup(); return; }

    const anchor = this._anchor();
    const floating = this._floating();
    if (!anchor || !floating) return;

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
      this._styleEl = document.createElement('style');
      this._styleEl.setAttribute('data-rc-anchor-style', this._uid);
      this._styleEl.textContent = css;
      document.head.appendChild(this._styleEl);
    }
  }

  private _positionFallback(): void {
    const anchor = this._anchor() as HTMLElement | null;
    const floating = this._floating() as HTMLElement | null;
    if (!anchor || !floating) return;
    const placement = this._opts.placement ?? 'bottom-start';
    const offset = this._opts.offset ?? 4;
    const rect = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    floating.style.position = 'fixed';
    floating.style.boxSizing = 'border-box';
    floating.style.minWidth = `${rect.width}px`;

    // Vertical: flip above when not enough space below
    const isBottom = placement.startsWith('bottom') || placement === 'bottom';
    const spaceBelow = vh - rect.bottom;
    const flipToAbove = isBottom && spaceBelow < 120 && rect.top > spaceBelow;
    if (flipToAbove) {
      floating.style.top = '';
      floating.style.bottom = `${vh - rect.top + offset}px`;
    } else {
      floating.style.bottom = '';
      floating.style.top = `${rect.bottom + offset}px`;
    }

    // Horizontal: for -end placements anchor right edge; otherwise anchor left.
    // In both cases clamp to viewport so the popup never clips off either edge.
    const isEndPlacement = placement.endsWith('-end');
    const popupWidth = floating.offsetWidth || parseFloat(getComputedStyle(floating).minWidth) || 0;
    let left = isEndPlacement ? rect.right - popupWidth : rect.left;
    if (left + popupWidth > vw - 4) left = rect.right - popupWidth; // try right-aligning
    left = Math.max(4, Math.min(left, vw - popupWidth - 4));        // clamp to viewport
    floating.style.left = `${left}px`;
  }

  private _cleanup(): void {
    const anchor = this._anchor();
    const floating = this._floating();
    if (anchor) (anchor as HTMLElement).style.removeProperty('anchor-name');
    if (floating) floating.removeAttribute('data-rc-anchor');
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
