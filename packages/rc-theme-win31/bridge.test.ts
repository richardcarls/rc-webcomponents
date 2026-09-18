import { afterEach, expect, test } from 'vitest';

/*
 * The bridge is loaded over the defaults, which is the contract: every
 * --rc-* value here is a var() onto a --win31-* token with no literal
 * fallback, so that a theme value lives in exactly one place and cannot drift
 * between the token layer and thirty-nine component stylesheets. A consumer
 * either imports defaults.css or supplies the --win31-* set themselves.
 */
/*
 * base.css is optional and loaded here specifically to prove win31's own
 * claim: an app that loads base.css alongside this theme (on the documented
 * container class, not <html> — see the styling guide) must not inherit
 * base's real 180/300/450ms spatial motion for any of the thirteen shared
 * tokens or the four directional ones. Without base.css in this file, a
 * theme token this bridge forgot to declare would silently pass by falling
 * back to its own literal instead of proving base's value is overridden.
 */
import '../rc-webcomponents/themes/base.css';
import './defaults.css';
import './bridge.css';

afterEach(() => {
  document.body.replaceChildren();
});

function renderScope(): HTMLElement {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-win31';
  document.body.append(scope);

  return scope;
}

test('bridge maps Windows 3.1 tokens to the RC token contract', () => {
  const scope = renderScope();

  scope.style.setProperty('--win31-color-surface', 'rgb(192, 192, 192)');
  scope.style.setProperty('--win31-color-selection', 'rgb(0, 0, 128)');
  scope.style.setProperty('--win31-color-field', 'rgb(255, 255, 255)');

  const styles = getComputedStyle(scope);

  expect(styles.getPropertyValue('--rc-surface').trim()).toBe('rgb(192, 192, 192)');
  expect(styles.getPropertyValue('--rc-accent').trim()).toBe('rgb(0, 0, 128)');
  expect(styles.getPropertyValue('--rc-highlight').trim()).toBe('rgb(0, 0, 128)');
  expect(styles.getPropertyValue('--rc-field').trim()).toBe('rgb(255, 255, 255)');
  expect(styles.getPropertyValue('--rc-border')).not.toBe('');
  expect(styles.getPropertyValue('--rc-button-bg').trim()).toBe('rgb(192, 192, 192)');
});

test('disabled is a color rather than an opacity', () => {
  const styles = getComputedStyle(renderScope());

  // Windows 3.1 had no alpha channel, so it embossed disabled text instead of
  // fading the control. Leaving --rc-disabled-opacity at 1 is what lets the
  // component stylesheets draw that emboss.
  expect(styles.getPropertyValue('--rc-disabled-opacity').trim()).toBe('1');
  expect(styles.getPropertyValue('--rc-text-disabled')).not.toBe('');
});

test('the theme is motionless, square, and unelevated', () => {
  const styles = getComputedStyle(renderScope());

  expect(styles.getPropertyValue('--rc-motion-duration').trim()).toBe('0ms');
  expect(styles.getPropertyValue('--rc-shadow').trim()).toBe('none');

  for (const token of [
    '--rc-radius-sm',
    '--rc-radius-md',
    '--rc-control-radius',
    '--rc-button-radius',
    '--rc-card-radius',
    '--rc-chip-radius',
    '--rc-thumb-radius',
  ] as const) {
    expect(styles.getPropertyValue(token).trim(), token).toBe('0');
  }

  for (const token of [
    '--rc-motion-effects-easing-enter',
    '--rc-motion-effects-easing-exit',
    '--rc-motion-spatial-easing-enter',
    '--rc-motion-spatial-easing-exit',
  ] as const) {
    expect(styles.getPropertyValue(token).trim(), token).toBe('step-end');
  }
});

/*
 * base.css is optional, so an app can load it and this theme together. Every
 * shared motion token must resolve to zero from this theme, not from
 * base.css's own real 180/300/450ms defaults falling through — this is
 * exactly the scenario docs/docs/guide/motion.mdx's "both scales are zero"
 * claim depends on. Verified on the documented container class; the styling
 * guide notes the theme class does not override base.css's :root when
 * placed directly on <html>, which is a base.css layering limitation no
 * theme package can fix by declaring more tokens.
 */
test('base.css cannot reintroduce real motion durations anywhere in the shared scale', () => {
  const styles = getComputedStyle(renderScope());

  for (const token of [
    '--rc-motion-effects-duration-fast',
    '--rc-motion-effects-duration-default',
    '--rc-motion-effects-duration-slow',
    '--rc-motion-spatial-duration-fast',
    '--rc-motion-spatial-duration-default',
    '--rc-motion-spatial-duration-slow',
  ] as const) {
    expect(styles.getPropertyValue(token).trim(), token).toBe('0ms');
  }
});

test('the component-scoped radius tokens are square too', () => {
  const scope = renderScope();
  const select = document.createElement('rc-select');

  scope.append(select);

  const styles = getComputedStyle(select);

  // These are set on the element rather than the scope, so they have to be
  // read from one.
  for (const token of [
    '--rc-select-radius',
    '--rc-select-listbox-radius',
    '--rc-select-chip-radius',
    '--rc-combobox-radius',
    '--rc-combobox-listbox-radius',
  ] as const) {
    expect(styles.getPropertyValue(token).trim(), token).toBe('0');
  }
});

test('push buttons carry no state layer, because 3.1 had no hover feedback', () => {
  const styles = getComputedStyle(renderScope());

  for (const token of [
    '--rc-button-hover-state-layer-opacity',
    '--rc-button-focus-state-layer-opacity',
    '--rc-button-pressed-state-layer-opacity',
    '--rc-card-hover-state-layer-opacity',
    '--rc-card-pressed-state-layer-opacity',
  ] as const) {
    expect(styles.getPropertyValue(token).trim(), token).toBe('0');
  }
});

test('menus highlight under the pointer and list rows do not', () => {
  const scope = renderScope();
  const listbox = document.createElement('rc-listbox');
  const menu = document.createElement('rc-menu');

  scope.append(listbox, menu);

  // The single most common way to accidentally build a Windows 98 theme is to
  // give list rows a hover wash. Menus are the one control that had one.
  expect(getComputedStyle(listbox).getPropertyValue('--rc-listbox-hover-bg').trim()).toBe(
    'transparent',
  );

  expect(getComputedStyle(menu).getPropertyValue('--rc-listbox-hover-bg').trim()).not.toBe(
    'transparent',
  );
});

test('the modal scrim is transparent', () => {
  const styles = getComputedStyle(renderScope());

  // 3.1 dimmed nothing behind a modal; the window frame carried the separation.
  expect(styles.getPropertyValue('--rc-dialog-scrim').trim()).toBe('transparent');
});

test('bridge covers the same RC contract surface as the other packaged themes', async () => {
  const [win31, substrate] = await Promise.all([
    import('./bridge.css?raw').then((module) => module.default as string),
    import('../rc-theme-substrate/bridge.css?raw').then((module) => module.default as string),
  ]);

  const tokensOf = (css: string): Set<string> =>
    new Set((css.match(/^\s*(--rc-[a-z0-9-]+):/gm) ?? []).map((line) => line.trim().slice(0, -1)));

  const missing = [...tokensOf(substrate)].filter((token) => !tokensOf(win31).has(token)).sort();

  expect(missing, `win31 bridge does not set: ${missing.join(', ')}`).toEqual([]);
});
