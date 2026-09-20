import { afterEach, expect, test } from 'vitest';

import './theme.css';

afterEach(() => {
  document.body.replaceChildren();
});

test('theme quick start loads defaults, bridge, and component styles', () => {
  const scope = document.createElement('div');
  const accordion = document.createElement('rc-accordion');

  scope.className = 'rc-theme-substrate';
  scope.append(accordion);
  document.body.append(scope);

  const scopeStyles = getComputedStyle(scope);
  const accordionStyles = getComputedStyle(accordion);

  expect(scopeStyles.getPropertyValue('--substrate-primary')).not.toBe('');
  expect(scopeStyles.getPropertyValue('--rc-accent')).not.toBe('');
  expect(accordionStyles.display).toBe('grid');
});

test('the compatibility duration token follows the effects default rather than its own literal', () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-substrate';
  document.body.append(scope);

  const styles = getComputedStyle(scope);

  expect(styles.getPropertyValue('--rc-motion-effects-duration-default').trim()).toBe('160ms');
  expect(styles.getPropertyValue('--rc-motion-duration').trim()).toBe('160ms');
});

/*
 * The reduced-motion override moved from the bridge layer into
 * components/modes.css, in the components layer, so that all three themes
 * agree on where it lives. bridge.css and components.css both set
 * --rc-motion-spatial-duration-fast on the same .rc-theme-substrate
 * selector; per cascade layer rules the later-declared layer wins
 * regardless of specificity, which this proves rather than assumes.
 */
test('reduced motion overrides the spatial/effects scale from the components layer', () => {
  const findRule = (rules: CSSRuleList): CSSMediaRule | undefined => {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule && rule.conditionText.includes('prefers-reduced-motion')) {
        return rule;
      }

      if ('cssRules' in rule) {
        const match = findRule((rule as CSSGroupingRule).cssRules);

        if (match) {
          return match;
        }
      }
    }

    return undefined;
  };

  const mediaRules = [...document.styleSheets].flatMap((sheet) => {
    const match = findRule(sheet.cssRules);

    return match ? [match] : [];
  });

  expect(mediaRules.length).toBeGreaterThan(0);

  const declaresZeroDuration = mediaRules.some((mediaRule) =>
    [...mediaRule.cssRules].some(
      (nested): nested is CSSStyleRule =>
        nested instanceof CSSStyleRule &&
        nested.selectorText.includes('.rc-theme-substrate') &&
        nested.style.getPropertyValue('--rc-motion-spatial-duration-fast').trim() === '0ms',
    ),
  );

  expect(declaresZeroDuration).toBe(true);
});

test('reduced motion zeroes spatial duration but only shortens effects duration', () => {
  const findRule = (rules: CSSRuleList): CSSMediaRule | undefined => {
    for (const rule of rules) {
      // Deliberately excludes "no-preference": some components declare
      // their own entrance/exit motion behind that opposite condition, and
      // a broader match could find one of those first instead of this
      // theme's reduced-motion override.
      if (
        rule instanceof CSSMediaRule &&
        rule.conditionText.includes('prefers-reduced-motion: reduce')
      ) {
        return rule;
      }

      if ('cssRules' in rule) {
        const match = findRule((rule as CSSGroupingRule).cssRules);

        if (match) {
          return match;
        }
      }
    }

    return undefined;
  };

  const mediaRules = [...document.styleSheets].flatMap((sheet) => {
    const match = findRule(sheet.cssRules);

    return match ? [match] : [];
  });

  expect(mediaRules.length).toBeGreaterThan(0);

  const declaration = mediaRules
    .flatMap((mediaRule) => [...mediaRule.cssRules])
    .find(
      (rule): rule is CSSStyleRule =>
        rule instanceof CSSStyleRule &&
        rule.selectorText.includes('.rc-theme-substrate') &&
        rule.style.getPropertyValue('--rc-motion-spatial-duration-fast') !== '',
    );

  expect(declaration).toBeDefined();

  for (const token of [
    '--rc-motion-spatial-duration-fast',
    '--rc-motion-spatial-duration-default',
    '--rc-motion-spatial-duration-slow',
  ] as const) {
    expect(declaration?.style.getPropertyValue(token).trim(), token).toBe('0ms');
  }

  const effectsFast = declaration?.style.getPropertyValue('--rc-motion-effects-duration-fast').trim();
  const effectsDefault = declaration?.style
    .getPropertyValue('--rc-motion-effects-duration-default')
    .trim();

  const effectsSlow = declaration?.style.getPropertyValue('--rc-motion-effects-duration-slow').trim();

  for (const value of [effectsFast, effectsDefault, effectsSlow]) {
    expect(value).not.toBe('0ms');
    expect(value).not.toBe('');
  }

  // Shortened relative to Substrate's own full-motion effects scale
  // (100/160/240ms), not merely non-zero.
  expect(Number.parseFloat(effectsFast!)).toBeLessThan(100);
  expect(Number.parseFloat(effectsDefault!)).toBeLessThan(160);
  expect(Number.parseFloat(effectsSlow!)).toBeLessThan(240);
});
