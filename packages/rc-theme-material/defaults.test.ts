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

test('bundled surface roles resolve to the Material light and dark tone tiers', () => {
  const scope = renderMaterialScope();
  const roles = [
    ['background', 'rgb(253, 248, 253)', 'rgb(20, 19, 23)'],
    ['surface', 'rgb(253, 248, 253)', 'rgb(20, 19, 23)'],
    ['surface-dim', 'rgb(222, 216, 222)', 'rgb(20, 19, 23)'],
    ['surface-bright', 'rgb(253, 248, 253)', 'rgb(59, 56, 61)'],
    ['surface-container-lowest', 'rgb(255, 255, 255)', 'rgb(15, 14, 17)'],
    ['surface-container-low', 'rgb(248, 242, 248)', 'rgb(28, 27, 31)'],
    ['surface-container', 'rgb(242, 236, 242)', 'rgb(33, 31, 35)'],
    ['surface-container-high', 'rgb(236, 230, 236)', 'rgb(43, 41, 46)'],
    ['surface-container-highest', 'rgb(230, 225, 229)', 'rgb(54, 52, 56)'],
  ] as const;

  for (const [role, light, dark] of roles) {
    const probe = document.createElement('div');

    probe.style.color = `var(--md-sys-color-${role})`;
    scope.append(probe);

    scope.style.colorScheme = 'light';
    expect(getComputedStyle(probe).color, `${role} light`).toBe(light);

    scope.style.colorScheme = 'dark';
    expect(getComputedStyle(probe).color, `${role} dark`).toBe(dark);
  }
});

test('bundled neutral palette defines every tone used by surface roles', () => {
  const scope = renderMaterialScope();
  const styles = getComputedStyle(scope);
  const tones = new Map([
    ['4', '#0f0e11ff'],
    ['6', '#141317ff'],
    ['12', '#211f23ff'],
    ['17', '#2b292eff'],
    ['22', '#363438ff'],
    ['24', '#3b383dff'],
    ['87', '#ded8deff'],
    ['92', '#ece6ecff'],
    ['94', '#f2ecf2ff'],
    ['96', '#f8f2f8ff'],
    ['98', '#fdf8fdff'],
    ['100', '#ffffffff'],
  ]);

  for (const [tone, expected] of tones) {
    expect(styles.getPropertyValue(`--md-ref-palette-neutral${tone}`).trim()).toBe(expected);
  }
});

test('forced-colors defaults collapse surface tiers to system colors', () => {
  const findRule = (rules: CSSRuleList): CSSStyleRule | undefined => {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule && rule.conditionText.includes('forced-colors: active')) {
        return [...rule.cssRules].find(
          (nested): nested is CSSStyleRule =>
            nested instanceof CSSStyleRule && nested.selectorText.includes('.rc-theme-material'),
        );
      }

      if ('cssRules' in rule) {
        const match = findRule((rule as CSSGroupingRule).cssRules);

        if (match) {
          return match;
        }
      }
    }

    return undefined;
  };

  const rule = [...document.styleSheets]
    .map((sheet) => findRule(sheet.cssRules))
    .find((candidate) => candidate !== undefined);

  expect(rule).toBeDefined();
  expect(rule?.style.getPropertyValue('--md-sys-color-surface')).toBe('Canvas');
  expect(rule?.style.getPropertyValue('--md-sys-color-surface-container')).toBe('Canvas');
  expect(rule?.style.getPropertyValue('--md-sys-color-surface-container-highest')).toBe('Field');
  expect(rule?.style.getPropertyValue('--md-sys-color-outline')).toBe('ButtonBorder');
  expect(rule?.style.getPropertyValue('--md-sys-elevation-level5')).toBe('0px');
});

test('bundled defaults preserve scoped Material shape aliases used by the bridge', () => {
  const scope = renderMaterialScope();
  const probe = document.createElement('div');

  probe.style.borderRadius = 'var(--md-sys-shape-corner-extra-small)';
  scope.append(probe);

  expect(getComputedStyle(probe).borderRadius).toBe('4px');
});

/*
 * The seven named easing curves and sixteen named duration bands are
 * repo-authored composites over material-tokens' vendored control points and
 * raw millisecond primitives (see the comment in defaults.css). Resolving
 * each through a real `transition-timing-function`/`transition-duration`
 * forces the browser to actually substitute and serialize the var() chain,
 * rather than trusting a textual read of the custom property. A primitive
 * dropped or renamed by a future re-vendor breaks one of these instead of
 * silently leaving the alias empty.
 */
const MATERIAL_MOTION_EASINGS: Record<string, string> = {
  '--md-sys-motion-easing-standard': 'cubic-bezier(0.2, 0, 0, 1)',
  '--md-sys-motion-easing-standard-decelerate': 'cubic-bezier(0, 0, 0, 1)',
  '--md-sys-motion-easing-standard-accelerate': 'cubic-bezier(0.3, 0, 1, 1)',
  '--md-sys-motion-easing-emphasized': 'cubic-bezier(0.2, 0, 0, 1)',
  '--md-sys-motion-easing-emphasized-decelerate': 'cubic-bezier(0.05, 0.7, 0.1, 1)',
  '--md-sys-motion-easing-emphasized-accelerate': 'cubic-bezier(0.3, 0, 0.8, 0.15)',
  '--md-sys-motion-easing-linear': 'cubic-bezier(0, 0, 1, 1)',
};

const MATERIAL_MOTION_DURATIONS: Record<string, string> = {
  '--md-sys-motion-duration-short1': '0.05s',
  '--md-sys-motion-duration-short2': '0.1s',
  '--md-sys-motion-duration-short3': '0.15s',
  '--md-sys-motion-duration-short4': '0.2s',
  '--md-sys-motion-duration-medium1': '0.25s',
  '--md-sys-motion-duration-medium2': '0.3s',
  '--md-sys-motion-duration-medium3': '0.35s',
  '--md-sys-motion-duration-medium4': '0.4s',
  '--md-sys-motion-duration-long1': '0.45s',
  '--md-sys-motion-duration-long2': '0.5s',
  '--md-sys-motion-duration-long3': '0.55s',
  '--md-sys-motion-duration-long4': '0.6s',
  '--md-sys-motion-duration-extra-long1': '0.7s',
  '--md-sys-motion-duration-extra-long2': '0.8s',
  '--md-sys-motion-duration-extra-long3': '0.9s',
  '--md-sys-motion-duration-extra-long4': '1s',
};

test('bundled defaults compose all seven named Material motion easings', () => {
  const scope = renderMaterialScope();

  for (const [token, expected] of Object.entries(MATERIAL_MOTION_EASINGS)) {
    const probe = document.createElement('div');

    probe.style.transitionTimingFunction = `var(${token})`;
    scope.append(probe);

    expect(getComputedStyle(probe).transitionTimingFunction, token).toBe(expected);
  }
});

test('bundled defaults compose all sixteen named Material motion duration bands', () => {
  const scope = renderMaterialScope();

  for (const [token, expected] of Object.entries(MATERIAL_MOTION_DURATIONS)) {
    const probe = document.createElement('div');

    probe.style.transitionDuration = `var(${token})`;
    scope.append(probe);

    expect(getComputedStyle(probe).transitionDuration, token).toBe(expected);
  }
});
