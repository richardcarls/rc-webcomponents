import { afterEach, expect, test } from 'vitest';

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

test('maps open menu surfaces without choosing a consumer button variant', () => {
  const scope = renderMaterialScope();
  const menuButton = document.createElement('rc-menu-button');
  const menu = document.createElement('rc-menu');

  menuButton.setAttribute('open', '');
  menuButton.append(menu);
  scope.append(menuButton);

  expect(getComputedStyle(menu).getPropertyValue('--rc-menu-background')).not.toBe('');
  expect(getComputedStyle(menuButton).getPropertyValue('--rc-menu-button-trigger-background')).toBe('');
});

test('includes a forced-colors bridge', () => {
  const includesForcedColors = (rules: CSSRuleList): boolean =>
    [...rules].some((rule) => {
      if (rule instanceof CSSMediaRule && rule.conditionText.includes('forced-colors: active')) {
        return true;
      }
      return 'cssRules' in rule && includesForcedColors((rule as CSSGroupingRule).cssRules);
    });
  const hasForcedColorsRule = [...document.styleSheets].some((sheet) => includesForcedColors(sheet.cssRules));

  expect(hasForcedColorsRule).toBe(true);
});

test('maps the supported core component set', () => {
  const scope = renderMaterialScope();
  const expectations = new Map<string, string>([
    ['rc-select', '--rc-select-radius'],
    ['rc-combobox', '--rc-combobox-radius'],
    ['rc-slider', '--rc-slider-progress-background'],
    ['rc-range-slider', '--rc-range-slider-accent'],
    ['rc-search-bar', '--rc-search-bar-bg'],
    ['rc-app-bar', '--rc-app-bar-bg'],
    ['rc-menu', '--rc-menu-background'],
    ['rc-menu-button', '--rc-menu-button-trigger-radius'],
    ['rc-menubar', '--rc-menubar-background'],
    ['rc-toolbar', '--rc-toolbar-radius'],
  ]);

  for (const [tagName, property] of expectations) {
    const element = document.createElement(tagName);

    scope.append(element);

    expect(getComputedStyle(element).getPropertyValue(property)).not.toBe('');
  }
});
