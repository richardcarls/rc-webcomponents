import { css } from 'lit';
import { expect, test } from 'vitest';

import { cssText } from './cssText.js';
import { RC_TOKEN_FALLBACKS, rcToken } from './rcToken.js';

test('rcToken falls back to the contract default', () => {
  expect(rcToken('--rc-control-block-size').cssText).toBe('var(--rc-control-block-size, 2.25em)');
});

test('rcToken expands referenced tokens so each carries its own fallback', () => {
  expect(rcToken('--rc-popup-background').cssText).toBe(
    'var(--rc-popup-background, var(--rc-surface, Canvas))',
  );
});

test('rcToken leaves an unset token without a fallback', () => {
  expect(RC_TOKEN_FALLBACKS['--rc-font-family']).toBeNull();
  expect(rcToken('--rc-font-family').cssText).toBe('var(--rc-font-family)');
});

test('rcToken can defer to a CSS-wide keyword instead of the default', () => {
  expect(rcToken('--rc-button-bg', 'revert').cssText).toBe('var(--rc-button-bg, revert)');
});

test('rcToken interpolates into Lit css and plain CSS strings', () => {
  const token = rcToken('--rc-control-gap');

  const styles = css`
    a {
      gap: ${token};
    }
  `;

  expect(styles.cssText.replace(/\s+/g, ' ').trim()).toBe(
    'a { gap: var(--rc-control-gap, 0.25em); }',
  );

  expect(cssText`a { gap: ${token}; }`).toBe('a { gap: var(--rc-control-gap, 0.25em); }');
});
