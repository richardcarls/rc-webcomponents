import { afterEach, expect, test } from 'vitest';

import './defaults.css';

afterEach(() => {
  document.body.replaceChildren();
});

function renderMaterialScope(): HTMLElement {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';
  document.body.append(scope);

  return scope;
}

test('bundled defaults provide light and dark Material system roles', () => {
  const scope = renderMaterialScope();
  const probe = document.createElement('div');

  probe.style.color = 'var(--md-sys-color-primary)';
  scope.append(probe);

  scope.style.colorScheme = 'light';
  expect(getComputedStyle(probe).color).toBe('rgb(103, 80, 164)');

  scope.style.colorScheme = 'dark';
  expect(getComputedStyle(probe).color).toBe('rgb(208, 188, 255)');
});

test('bundled defaults include Material token groups', () => {
  const scope = renderMaterialScope();
  const styles = getComputedStyle(scope);

  expect(styles.getPropertyValue('--md-ref-palette-primary40').trim()).toBe('#6750a4ff');
  expect(styles.getPropertyValue('--md-sys-typescale-body-large-size').trim()).toBe('16px');
  expect(styles.getPropertyValue('--md-sys-shape-corner-extra-small-default-size').trim()).toBe(
    '4px',
  );
  expect(styles.getPropertyValue('--md-sys-motion-duration-200').trim()).toBe('200ms');
  expect(styles.getPropertyValue('--md-sys-state-hover-state-layer-opacity').trim()).toBe(
    '0.07999999821186066',
  );
  expect(styles.getPropertyValue('--md-sys-elevation-level2').trim()).toBe('3px');
});

test('bundled defaults preserve scoped Material shape aliases used by the bridge', () => {
  const scope = renderMaterialScope();
  const probe = document.createElement('div');

  probe.style.borderRadius = 'var(--md-sys-shape-corner-extra-small)';
  scope.append(probe);

  expect(getComputedStyle(probe).borderRadius).toBe('4px');
});
