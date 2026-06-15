import { afterEach, expect, test } from 'vitest';

import './defaults.css';

afterEach(() => {
  document.body.replaceChildren();
});

test('representative defaults provide light and dark Material system roles', () => {
  const scope = document.createElement('div');
  const probe = document.createElement('div');

  scope.className = 'rc-theme-material';
  probe.style.color = 'var(--md-sys-color-primary)';
  scope.append(probe);
  document.body.append(scope);

  scope.style.colorScheme = 'light';
  expect(getComputedStyle(probe).color).toBe('rgb(103, 80, 164)');

  scope.style.colorScheme = 'dark';
  expect(getComputedStyle(probe).color).toBe('rgb(208, 188, 255)');
});
