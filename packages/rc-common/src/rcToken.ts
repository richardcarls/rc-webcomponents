import { unsafeCSS, type CSSResult } from 'lit';

import { RC_TOKEN_FALLBACKS, type RCTokenName } from './tokenFallbacks.js';

export { RC_TOKEN_FALLBACKS, type RCTokenName } from './tokenFallbacks.js';

/**
 * CSS-wide keywords a component may use in place of a shared token's default
 * when it defers to native or inherited styling, such as `revert` for a
 * native button background.
 */
export type RCTokenDeferral = 'inherit' | 'initial' | 'revert' | 'revert-layer' | 'unset';

/**
 * Reads a shared RC token with the contract's default as its fallback, so a
 * component renders the same with or without the optional `base.css`. Use it
 * in place of a hand-written `var(--rc-*, …)` in component styles.
 *
 * @param name - the shared token to read
 * @param deferTo - a CSS-wide keyword to use instead of the contract default
 *   when the component defers to native or inherited styling
 *
 * @example
 * ```ts
 * static styles = css`
 *   :host {
 *     min-block-size: var(--rc-example-block-size, ${rcToken('--rc-control-block-size')});
 *     font-family: ${rcToken('--rc-font-family', 'inherit')};
 *   }
 * `;
 * ```
 */
export function rcToken(name: RCTokenName, deferTo?: RCTokenDeferral): CSSResult {
  const fallback: string | null = deferTo ?? RC_TOKEN_FALLBACKS[name];

  return unsafeCSS(fallback === null ? `var(${name})` : `var(${name}, ${fallback})`);
}
