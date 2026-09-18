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
