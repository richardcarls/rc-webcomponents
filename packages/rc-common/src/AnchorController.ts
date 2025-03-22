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
  /** Flip to opposite side when clipped by viewport. Defaults to `true`. Native only. */
  flip?: boolean;
  disabled?: boolean;
}

// ---- CSS placement helpers -----------------------------------------------

/**
 * Returns inline CSS for the floating element's inset properties.
 * Center placements use `position-area` for simplicity; edge-aligned
 * (`-start` / `-end`) variants use explicit `anchor()` function values.
 */
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

// ---- Polyfill ---------------------------------------------------------------

const _nativeSupported = CSS.supports('anchor-name: --a');
let _polyfillPending = false;

async function _loadPolyfill(): Promise<void> {
  if (_nativeSupported || _polyfillPending) return;
  _polyfillPending = true;
  try {
    // Auto-applies once imported; only loads once due to module caching.
    await import('@oddbird/css-anchor-positioning');
  } catch (err) {
    if (import.meta.env?.DEV) {
      console.warn('[AnchorController] Failed to load CSS anchor-positioning polyfill:', err);
    }
  }
}

// ---- Controller -------------------------------------------------------------

let _uid = 0;

/**
 * Positions a floating element relative to an anchor element using CSS
 * Anchor Positioning (native-first, polyfill on unsupported browsers via
 * `@oddbird/css-anchor-positioning`).
 *
 * Positioning is applied by injecting a `<style>` element into `<head>` so
 * that both native browsers and the polyfill (which reads stylesheets) see
 * identical CSS.
 *
 * `flip: true` uses `@position-try` (native browsers only). The polyfill
 * will apply the initial `placement` without flipping.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning
 */
export class AnchorController implements ReactiveController {
  private _opts: AnchorOptions;
  private readonly _uid: string;
  private _styleEl: HTMLStyleElement | null = null;

  constructor(host: ReactiveControllerHost, options: AnchorOptions) {
    this._opts = options;
    this._uid = `rc-anchor-${++_uid}`;

    // Must be last: if host is already connected, addController calls hostConnected() synchronously.
    host.addController(this);
  }

  setOptions(next: Partial<AnchorOptions>): void {
    Object.assign(this._opts, next);
    this._apply();
  }

  /** Re-apply positioning — call when anchor or floating become visible. */
  update(): void {
    this._apply();
  }

  hostConnected(): void {
    this._apply();
    void _loadPolyfill();
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

    // Set anchor-name on trigger element
    (anchor as HTMLElement).style.setProperty('anchor-name', anchorName);

    // Mark floating element for stylesheet selector
    floating.setAttribute('data-rc-anchor', uid);

    // Build @position-try block for flip (native browsers only)
    const flipPlacement = FLIP_PLACEMENT[placement];
    const flipBlock = flip
      ? `@position-try --${uid}-flip { ${placementCSS(flipPlacement, offset)} }`
      : '';
    const positionTry = flip ? `position-try-fallbacks: --${uid}-flip;` : '';

    this._styleEl?.remove();
    this._styleEl = document.createElement('style');
    this._styleEl.setAttribute('data-rc-anchor-style', uid);
    this._styleEl.textContent = `
      ${flipBlock}
      [data-rc-anchor="${uid}"] {
        position: fixed;
        position-anchor: ${anchorName};
        ${placementCSS(placement, offset)}
        ${positionTry}
      }
    `;
    document.head.appendChild(this._styleEl);
  }

  private _cleanup(): void {
    const anchor = this._anchor();
    const floating = this._floating();
    if (anchor) (anchor as HTMLElement).style.removeProperty('anchor-name');
    if (floating) floating.removeAttribute('data-rc-anchor');
    this._styleEl?.remove();
    this._styleEl = null;
  }
}
