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
