import { afterEach, expect, test } from 'vitest';

import './theme.css';

afterEach(() => {
  document.body.replaceChildren();
});

test('theme quick start loads defaults, bridge, and component styles', () => {
  const scope = document.createElement('div');
  const accordion = document.createElement('rc-accordion');

  scope.className = 'rc-theme-material';
  scope.append(accordion);
  document.body.append(scope);

  const scopeStyles = getComputedStyle(scope);
  const accordionStyles = getComputedStyle(accordion);

  expect(scopeStyles.getPropertyValue('--md-sys-color-primary')).not.toBe('');
  expect(scopeStyles.getPropertyValue('--rc-accent')).not.toBe('');
  expect(accordionStyles.display).toBe('grid');
});

/*
 * Reduced motion removes spatial movement but keeps effects motion,
 * shortened, rather than zeroing everything: a color or opacity change
 * doesn't trigger the vestibular harm the preference guards against. This
 * walks the actual parsed CSSOM for the @media (prefers-reduced-motion:
 * reduce) rule rather than emulating the media feature (not available in
 * this harness), so it proves the declared values rather than assuming them.
 */
test('reduced motion zeroes spatial duration but only shortens effects duration', () => {
  const findRule = (rules: CSSRuleList): CSSMediaRule | undefined => {
    for (const rule of rules) {
      // Deliberately excludes "no-preference": rc-dialog and other
      // components declare their own entrance/exit motion behind that
      // opposite condition, and a broader match here would find one of
      // those first instead of this theme's reduced-motion override.
      if (rule instanceof CSSMediaRule && rule.conditionText.includes('prefers-reduced-motion: reduce')) {
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
        rule.selectorText.includes('.rc-theme-material') &&
        rule.style.getPropertyValue('--rc-motion-spatial-duration-fast') !== '',
    );

  expect(declaration).toBeDefined();
  expect(declaration?.style.getPropertyValue('--rc-motion-spatial-duration-fast').trim()).toBe('0ms');

  expect(declaration?.style.getPropertyValue('--rc-motion-spatial-duration-default').trim()).toBe(
    '0ms',
  );

  expect(declaration?.style.getPropertyValue('--rc-motion-spatial-duration-slow').trim()).toBe('0ms');

  const effectsFast = declaration?.style.getPropertyValue('--rc-motion-effects-duration-fast').trim();
  const effectsDefault = declaration?.style
    .getPropertyValue('--rc-motion-effects-duration-default')
    .trim();
  const effectsSlow = declaration?.style.getPropertyValue('--rc-motion-effects-duration-slow').trim();

  for (const value of [effectsFast, effectsDefault, effectsSlow]) {
    expect(value).not.toBe('0ms');
    expect(value).not.toBe('');
  }

  // Shortened relative to the theme's own full-motion effects scale
  // (150/200/300ms), not merely non-zero.
  expect(Number.parseFloat(effectsFast!)).toBeLessThan(150);
  expect(Number.parseFloat(effectsDefault!)).toBeLessThan(200);
  expect(Number.parseFloat(effectsSlow!)).toBeLessThan(300);
});
