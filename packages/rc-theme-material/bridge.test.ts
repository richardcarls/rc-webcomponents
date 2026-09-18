import { afterEach, expect, test } from 'vitest';

/*
 * Both layers, matching how theme.css actually bundles them for a consumer.
 * bridge.css's own literal fallbacks (for an app supplying its own Material
 * environment) mean most of this file's assertions would pass even without
 * defaults.css, since many fallbacks happen to equal the real vendored
 * value — that coincidence stops holding once a bridge mapping's fallback
 * is deliberately different from its target (see the directional easing
 * test below), which is exactly when this import starts to matter.
 */
import './defaults.css';
import './bridge.css';

afterEach(() => {
  document.body.replaceChildren();
});

function renderMaterialScope(): HTMLElement {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';
  document.body.append(scope);

  return scope;
}

test('bridge consumes application Material system tokens without defining them', () => {
  const scope = document.createElement('div');

  document.body.append(scope);

  const styles = getComputedStyle(scope);

  expect(styles.getPropertyValue('--md-sys-color-primary')).toBe('');
  expect(styles.getPropertyValue('--rc-accent')).toBe('');
});

test('system token overrides resolve through shared RC tokens', () => {
  const scope = renderMaterialScope();

  scope.style.setProperty('--md-sys-color-primary', 'rgb(1, 2, 3)');

  expect(getComputedStyle(scope).getPropertyValue('--rc-accent')).toBe('rgb(1, 2, 3)');

  const probe = document.createElement('div');

  probe.style.color = 'var(--rc-accent)';
  scope.append(probe);

  expect(getComputedStyle(probe).color).toBe('rgb(1, 2, 3)');
});

test('button text sits on the button fill rather than on a system color', () => {
  const scope = renderMaterialScope();

  scope.style.setProperty('--md-sys-color-on-primary', 'rgb(7, 8, 9)');

  const styles = getComputedStyle(scope);

  // rc-select, rc-combobox, and rc-menu-button read --rc-button-text directly
  // for text drawn over --rc-button-bg, so it has to follow the same on-color
  // as --rc-button-color rather than falling through to ButtonText.
  expect(styles.getPropertyValue('--rc-button-text').trim()).toBe('rgb(7, 8, 9)');
  expect(styles.getPropertyValue('--rc-button-color').trim()).toBe('rgb(7, 8, 9)');
});

test('component tokens override Material system tokens', () => {
  const scope = renderMaterialScope();
  const slider = document.createElement('rc-slider');

  scope.style.setProperty('--md-sys-color-primary', 'rgb(1, 2, 3)');
  slider.style.setProperty('--md-slider-active-track-color', 'rgb(4, 5, 6)');
  scope.append(slider);

  const probe = document.createElement('div');

  probe.style.color = 'var(--rc-slider-progress-background)';
  slider.append(probe);

  expect(getComputedStyle(probe).color).toBe('rgb(4, 5, 6)');
});

test('maps disabled, focus, hover, and active state contracts', () => {
  const scope = renderMaterialScope();
  const slider = document.createElement('rc-range-slider');

  scope.append(slider);

  const styles = getComputedStyle(slider);

  expect(styles.getPropertyValue('--rc-disabled-opacity')).not.toBe('');
  expect(styles.getPropertyValue('--rc-focus-ring')).not.toBe('');
  expect(styles.getPropertyValue('--rc-range-slider-thumb-hover-background')).not.toBe('');
  expect(styles.getPropertyValue('--rc-range-slider-thumb-active-background')).not.toBe('');
});

test('maps theme-neutral effects and spatial motion pairs', () => {
  const scope = renderMaterialScope();
  const styles = getComputedStyle(scope);

  expect(styles.getPropertyValue('--rc-motion-effects-duration-fast').trim()).toBe('150ms');
  expect(styles.getPropertyValue('--rc-motion-effects-duration-default').trim()).toBe('200ms');
  expect(styles.getPropertyValue('--rc-motion-effects-duration-slow').trim()).toBe('300ms');
  expect(styles.getPropertyValue('--rc-motion-effects-easing-default').trim()).not.toBe('');
  // Compressed from the spec's 350/500/700ms; see bridge.css for why.
  expect(styles.getPropertyValue('--rc-motion-spatial-duration-fast').trim()).toBe('300ms');
  expect(styles.getPropertyValue('--rc-motion-spatial-duration-default').trim()).toBe('400ms');
  expect(styles.getPropertyValue('--rc-motion-spatial-duration-slow').trim()).toBe('500ms');
  expect(styles.getPropertyValue('--rc-motion-spatial-easing-default').trim()).not.toBe('');
});

test('directional easing pairs decelerate-shaped curves with entering and accelerate-shaped with exiting', () => {
  const scope = renderMaterialScope();
  const probe = document.createElement('div');

  scope.append(probe);

  const resolvedTimingFunction = (token: string): string => {
    probe.style.transitionTimingFunction = `var(${token})`;

    return getComputedStyle(probe).transitionTimingFunction;
  };

  expect(resolvedTimingFunction('--rc-motion-effects-easing-enter')).toBe('cubic-bezier(0, 0, 0, 1)');
  expect(resolvedTimingFunction('--rc-motion-effects-easing-exit')).toBe('cubic-bezier(0.3, 0, 1, 1)');

  expect(resolvedTimingFunction('--rc-motion-spatial-easing-enter')).toBe(
    'cubic-bezier(0.05, 0.7, 0.1, 1)',
  );

  expect(resolvedTimingFunction('--rc-motion-spatial-easing-exit')).toBe(
    'cubic-bezier(0.3, 0, 0.8, 0.15)',
  );
});

test('maps listbox selection to the selected container color role', () => {
  const scope = renderMaterialScope();
  const listbox = document.createElement('rc-listbox');

  scope.style.setProperty('--md-sys-color-primary', 'rgb(1, 2, 3)');
  scope.style.setProperty('--md-sys-color-on-primary', 'rgb(4, 5, 6)');
  scope.style.setProperty('--md-sys-color-secondary-container', 'rgb(7, 8, 9)');
  scope.style.setProperty('--md-sys-color-on-secondary-container', 'rgb(10, 11, 12)');
  scope.append(listbox);

  const styles = getComputedStyle(listbox);

  expect(styles.getPropertyValue('--rc-listbox-selected-bg')).toBe('rgb(7, 8, 9)');
  expect(styles.getPropertyValue('--rc-listbox-selected-color')).toBe('rgb(10, 11, 12)');
});

test('maps open menu surfaces without choosing a consumer button variant', () => {
  const scope = renderMaterialScope();
  const menuButton = document.createElement('rc-menu-button');
  const menu = document.createElement('rc-menu');

  menuButton.setAttribute('open', '');
  menuButton.append(menu);
  scope.append(menuButton);

  expect(getComputedStyle(menu).getPropertyValue('--rc-menu-background')).not.toBe('');
  expect(getComputedStyle(menu).getPropertyValue('--rc-menu-item-min-block-size')).toBe('3rem');
  expect(getComputedStyle(menu).getPropertyValue('--rc-menu-item-padding-block')).toBe('0');
  expect(getComputedStyle(menu).getPropertyValue('--rc-menu-hover-bg')).not.toBe('');

  expect(getComputedStyle(menuButton).getPropertyValue('--rc-menu-button-trigger-background')).toBe(
    'transparent',
  );

  expect(
    getComputedStyle(menuButton).getPropertyValue('--rc-menu-button-trigger-open-background'),
  ).not.toBe('');

  expect(
    getComputedStyle(menuButton).getPropertyValue('--rc-menu-button-indicator-color'),
  ).not.toBe('');
});

test('maps menubar item tokens through menu-button triggers', () => {
  const scope = renderMaterialScope();
  const menubar = document.createElement('rc-menubar');

  scope.append(menubar);

  const styles = getComputedStyle(menubar);

  expect(styles.getPropertyValue('--rc-menubar-item-block-size')).toBe('2.5rem');
  expect(styles.getPropertyValue('--rc-menubar-item-padding-inline')).toBe('1rem');
  expect(styles.getPropertyValue('--rc-menubar-item-background')).toBe('transparent');
  expect(styles.getPropertyValue('--rc-menubar-item-open-background')).not.toBe('');
});

test('includes a forced-colors bridge', () => {
  const includesForcedColors = (rules: CSSRuleList): boolean =>
    [...rules].some((rule) => {
      if (rule instanceof CSSMediaRule && rule.conditionText.includes('forced-colors: active')) {
        return true;
      }

      return 'cssRules' in rule && includesForcedColors((rule as CSSGroupingRule).cssRules);
    });
  const hasForcedColorsRule = [...document.styleSheets].some((sheet) =>
    includesForcedColors(sheet.cssRules),
  );

  expect(hasForcedColorsRule).toBe(true);
});

test('maps the supported core component set', () => {
  const scope = renderMaterialScope();
  const expectations = new Map<string, string>([
    ['rc-select', '--rc-select-radius'],
    ['rc-button', '--rc-button-bg'],
    ['rc-card', '--rc-card-bg'],
    ['rc-chip', '--rc-chip-block-size'],
    ['div', '--rc-list-item-min-block-size'],
    ['rc-combobox', '--rc-combobox-radius'],
    ['rc-slider', '--rc-slider-progress-background'],
    ['rc-progress', '--rc-progress-fill-background'],
    ['rc-range-slider', '--rc-range-slider-accent'],
    ['rc-search-bar', '--rc-search-bar-bg'],
    ['rc-bottom-sheet', '--rc-bottom-sheet-bg'],
    ['rc-app-bar', '--rc-app-bar-bg'],
    ['rc-menu', '--rc-menu-background'],
    ['rc-menu-button', '--rc-menu-button-trigger-radius'],
    ['rc-menubar', '--rc-menubar-background'],
    ['rc-toolbar', '--rc-toolbar-radius'],
    ['rc-segmented-button', '--rc-segmented-button-segment-min-block-size'],
    ['rc-switch', '--rc-switch-track-inline-size'],
    ['rc-snackbar', '--rc-snackbar-bg'],
  ]);

  for (const [tagName, property] of expectations) {
    const element = document.createElement(tagName);

    scope.append(element);

    expect(getComputedStyle(element).getPropertyValue(property)).not.toBe('');
  }
});
