import { afterEach, expect, test } from 'vitest';

import './defaults.css';

afterEach(() => {
  document.body.replaceChildren();
});

function renderSubstrateScope(): HTMLElement {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-substrate';
  document.body.append(scope);

  return scope;
}

test('bundled defaults provide scoped Substrate tokens', () => {
  const scope = renderSubstrateScope();
  const styles = getComputedStyle(scope);

  expect(styles.getPropertyValue('--substrate-primary')).not.toBe('');
  expect(styles.getPropertyValue('--substrate-surface')).not.toBe('');
  expect(styles.getPropertyValue('--substrate-radius-md').trim()).toBe('0.5rem');
  expect(styles.getPropertyValue('--substrate-control-block-size').trim()).toBe('2.5rem');
  expect(styles.getPropertyValue('--substrate-motion-duration').trim()).toBe('160ms');
});

test('bundled defaults resolve in light and dark color schemes', () => {
  const scope = renderSubstrateScope();
  const probe = document.createElement('div');

  probe.style.color = 'var(--substrate-primary)';
  scope.append(probe);

  scope.style.colorScheme = 'light';
  const lightColor = getComputedStyle(probe).color;

  scope.style.colorScheme = 'dark';
  const darkColor = getComputedStyle(probe).color;

  expect(lightColor).not.toBe('');
  expect(darkColor).not.toBe('');
  expect(darkColor).not.toBe(lightColor);
});
