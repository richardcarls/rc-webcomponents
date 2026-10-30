import { afterEach, expect, test } from 'vitest';

import './defaults.css';

afterEach(() => {
  document.body.replaceChildren();
});

function renderTailwindScope(): HTMLElement {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-tailwind';
  document.body.append(scope);

  return scope;
}

test('bundled defaults provide scoped Tailwind v4 tokens', () => {
  const scope = renderTailwindScope();
  const styles = getComputedStyle(scope);

  expect(styles.getPropertyValue('--color-cyan-600')).not.toBe('');
  expect(styles.getPropertyValue('--color-slate-50')).not.toBe('');
  expect(styles.getPropertyValue('--radius-md').trim()).toBe('0.375rem');

  expect(styles.getPropertyValue('--tailwind-control-block-size').trim()).toBe(
    'calc(0.25rem * 10)',
  );

  expect(styles.getPropertyValue('--tailwind-motion-duration').trim()).toBe('160ms');
});

test('bundled defaults declare every token the bridge and component styles reference', () => {
  const scope = renderTailwindScope();
  const styles = getComputedStyle(scope);

  // These were referenced but never declared, so the snackbar fell back to
  // system colors and the sheet handle to a literal.
  for (const token of ['--color-slate-900', '--color-white', '--radius-full', '--color-red-600']) {
    expect(styles.getPropertyValue(token).trim(), token).not.toBe('');
  }
});

test('bundled defaults resolve in light and dark color schemes', () => {
  const scope = renderTailwindScope();
  const probe = document.createElement('div');

  probe.style.color = 'var(--color-cyan-600)';
  scope.append(probe);

  scope.style.colorScheme = 'light';

  const lightColor = getComputedStyle(probe).color;

  scope.style.colorScheme = 'dark';

  const darkColor = getComputedStyle(probe).color;

  expect(lightColor).not.toBe('');
  expect(darkColor).not.toBe('');
  expect(darkColor).not.toBe(lightColor);
});
