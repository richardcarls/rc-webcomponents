import { afterEach, expect, test } from 'vitest';

/*
 * Both layers, matching how theme.css actually bundles them for a consumer.
 * Without defaults.css, a var() onto a --substrate-* token with a
 * deliberately different literal fallback (see the directional easing test
 * below) would silently assert against the fallback instead of the real
 * theme value.
 */
import './defaults.css';
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
  expect(styles.getPropertyValue('--rc-button-radius').trim()).toBe('6px');
  expect(styles.getPropertyValue('--rc-card-bg')).not.toBe('');
  expect(styles.getPropertyValue('--rc-list-item-min-block-size').trim()).toBe('2.25rem');
  expect(styles.getPropertyValue('--rc-border')).not.toBe('');
  expect(styles.getPropertyValue('--rc-motion-duration').trim()).toBe('160ms');
});

test('maps directional easing so entering and exiting are not the same curve', () => {
  const scope = renderScope();
  const probe = document.createElement('div');

  scope.append(probe);

  const resolvedTimingFunction = (token: string): string => {
    probe.style.transitionTimingFunction = `var(${token})`;

    return getComputedStyle(probe).transitionTimingFunction;
  };

  const effectsEnter = resolvedTimingFunction('--rc-motion-effects-easing-enter');
  const effectsExit = resolvedTimingFunction('--rc-motion-effects-easing-exit');
  const spatialEnter = resolvedTimingFunction('--rc-motion-spatial-easing-enter');
  const spatialExit = resolvedTimingFunction('--rc-motion-spatial-easing-exit');

  for (const value of [effectsEnter, effectsExit, spatialEnter, spatialExit]) {
    expect(value).not.toBe('');
  }

  expect(effectsEnter).not.toBe(effectsExit);
  expect(spatialEnter).not.toBe(spatialExit);

  // Spatial enter aliases the theme's own curve, not its fallback.
  expect(spatialEnter).toBe('cubic-bezier(0.2, 0, 0, 1)');
});

test('bridge maps the error color rather than leaving it to a system color', () => {
  const scope = renderScope();

  scope.style.setProperty('--substrate-error', 'rgb(172, 1, 26)');

  const styles = getComputedStyle(scope);

  expect(styles.getPropertyValue('--rc-field-error-color').trim()).toBe('rgb(172, 1, 26)');

  // Mark is the background of highlighted text and renders as pure yellow,
  // which is unreadable as a foreground on a light field.
  expect(styles.getPropertyValue('--rc-field-error-color')).not.toContain('Mark');
});

test('the scrim mixes against a theme token rather than a system color', () => {
  const scope = renderScope();

  scope.style.setProperty('--substrate-inverse-surface', 'rgb(10, 11, 12)');

  const scrim = getComputedStyle(scope).getPropertyValue('--rc-dialog-scrim');

  // A mix against a bare system color has no value outside a browser, so it
  // cannot reach the token export at all.
  expect(scrim).not.toMatch(/\bCanvasText\b/);
  expect(scrim).toContain('10, 11, 12');
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
