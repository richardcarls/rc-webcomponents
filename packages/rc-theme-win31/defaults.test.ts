import { afterEach, expect, test } from 'vitest';

import './defaults.css';

const stylesheets = import.meta.glob(['./bridge.css', './components/*.css'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

afterEach(() => {
  document.body.replaceChildren();
});

function renderScope(): HTMLElement {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-win31';
  document.body.append(scope);

  return scope;
}

test('bundled defaults provide scoped Windows 3.1 tokens', () => {
  const styles = getComputedStyle(renderScope());

  expect(styles.getPropertyValue('--win31-color-surface').trim()).toBe('#c0c0c0');
  expect(styles.getPropertyValue('--win31-color-selection').trim()).toBe('#000080');
  expect(styles.getPropertyValue('--win31-radius').trim()).toBe('0');
  expect(styles.getPropertyValue('--win31-font-family')).not.toBe('');
  expect(styles.getPropertyValue('--win31-dither-track')).toContain('data:image/svg+xml');
});

test('metrics resolve to the pixel sizes derived from the MS Sans Serif 8pt cell', () => {
  const scope = renderScope();
  const probe = document.createElement('div');

  scope.append(probe);

  // A dialog unit is 1.5px horizontally and 1.625px vertically at a 6 by 13
  // cell, which puts the standard 50 by 14 DLU push button at 75 by 23px.
  for (const [token, expected] of [
    ['--win31-control-height', '22px'],
    ['--win31-title-height', '24px'],
    ['--win31-menu-height', '27px'],
    ['--win31-toolbar-height', '31px'],
    ['--win31-listbox-row-height', '17px'],
    ['--win31-scrollbar-size', '16px'],
    ['--win31-check-size', '13px'],
    ['--win31-font-size', '13px'],
    ['--win31-menu-font-size', '16px'],
  ] as const) {
    probe.style.setProperty('block-size', `var(${token})`);
    expect(getComputedStyle(probe).blockSize, token).toBe(expected);
  }
});

test('one unit token scales every metric without changing a ratio', () => {
  const scope = renderScope();
  const probe = document.createElement('div');

  scope.style.setProperty('--win31-unit', '2px');
  scope.append(probe);

  for (const [token, expected] of [
    ['--win31-control-height', '44px'],
    ['--win31-listbox-row-height', '34px'],
    ['--win31-scrollbar-size', '32px'],
    ['--win31-font-size', '26px'],
  ] as const) {
    probe.style.setProperty('block-size', `var(${token})`);
    expect(getComputedStyle(probe).blockSize, token).toBe(expected);
  }
});

test('bundled defaults declare every token the bridge and component styles reference', () => {
  const styles = getComputedStyle(renderScope());
  const referenced = new Set<string>();

  for (const css of Object.values(stylesheets)) {
    for (const match of css.matchAll(/var\(\s*(--win31-[a-z0-9-]+)/g)) {
      referenced.add(match[1]!);
    }
  }

  // The sweep is the point: a token added to a component stylesheet and never
  // declared here fails without anyone remembering to list it.
  expect(referenced.size).toBeGreaterThan(20);

  for (const token of [...referenced].sort()) {
    expect(
      styles.getPropertyValue(token).trim(),
      `${token} is referenced but never declared`,
    ).not.toBe('');
  }
});
