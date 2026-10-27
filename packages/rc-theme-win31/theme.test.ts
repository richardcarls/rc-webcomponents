import { afterEach, expect, test } from 'vitest';

import './theme.css';

afterEach(() => {
  document.body.replaceChildren();
});

test('theme quick start loads defaults, bridge, and component styles', () => {
  const scope = document.createElement('div');
  const listbox = document.createElement('rc-listbox');

  scope.className = 'rc-theme-win31';
  scope.append(listbox);
  document.body.append(scope);

  const scopeStyles = getComputedStyle(scope);
  const listboxStyles = getComputedStyle(listbox);

  expect(scopeStyles.getPropertyValue('--win31-color-surface')).not.toBe('');
  expect(scopeStyles.getPropertyValue('--rc-accent')).not.toBe('');
  expect(listboxStyles.display).toBe('block');
  expect(listboxStyles.borderRadius).toBe('0px');
});
