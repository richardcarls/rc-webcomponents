import { afterEach, expect, test } from 'vitest';

import './bridge.css';

afterEach(() => {
  document.body.replaceChildren();
});

function renderScope(): HTMLElement {
  const scope = document.createElement('div');
  scope.className = 'rc-theme-substrate';
  document.body.append(scope);
  return scope;
}

test('bridge maps Substrate tokens to the RC token contract', () => {
  const scope = renderScope();
  scope.style.setProperty('--substrate-primary', 'rgb(210, 92, 0)');
  scope.style.setProperty('--substrate-surface', 'rgb(250, 249, 246)');
  scope.style.setProperty('--substrate-radius-md', '6px');

  const styles = getComputedStyle(scope);

  expect(styles.getPropertyValue('--rc-accent').trim()).toBe('rgb(210, 92, 0)');
  expect(styles.getPropertyValue('--rc-surface').trim()).toBe('rgb(250, 249, 246)');
  expect(styles.getPropertyValue('--rc-control-radius').trim()).toBe('6px');
  expect(styles.getPropertyValue('--rc-border')).not.toBe('');
  expect(styles.getPropertyValue('--rc-motion-duration').trim()).toBe('160ms');
});

test('bridge defines shared popup and slider component tokens', () => {
  const scope = renderScope();
  const listbox = document.createElement('rc-listbox');
  const slider = document.createElement('rc-slider');

  scope.append(listbox, slider);

  expect(getComputedStyle(listbox).getPropertyValue('--rc-listbox-option-min-block-size')).toBe(
    '2.25rem',
  );
  expect(getComputedStyle(slider).getPropertyValue('--rc-slider-track-size')).toBe('0.375rem');
  expect(getComputedStyle(slider).getPropertyValue('--rc-thumb-radius')).toBe('0.5625rem');
});
