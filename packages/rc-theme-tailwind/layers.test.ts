import { afterEach, expect, test } from 'vitest';

import './layers.css';

afterEach(() => {
  document.body.replaceChildren();
  document.querySelector('style[data-layers-test]')?.remove();
});

/*
 * Rules arrive in the order an app stylesheet would load them: this theme's
 * layers first, then Tailwind's. Without layers.css declaring the order up
 * front, `base` would sort last and win.
 */
const css = `
  @layer rc-base { .probe { margin-inline-start: 1px; } }
  @layer rc-theme-tailwind.components { .probe { padding-inline-start: 2px; } }
  @layer theme, base, components, utilities;
  @layer base { .probe { margin-inline-start: 0; padding-inline-start: 0; border-inline-start: 0 solid; } }
  @layer utilities { .probe { border-inline-start: 3px solid; } }
  @layer rc-theme-tailwind.components { .probe { border-inline-start: 4px solid; } }
`;

test('rc layers outrank Tailwind base and lose to Tailwind utilities', () => {
  const $style = document.createElement('style');

  $style.dataset.layersTest = '';
  $style.textContent = css;
  document.head.append($style);

  const $probe = document.createElement('div');

  $probe.className = 'probe';
  document.body.append($probe);

  const styles = getComputedStyle($probe);

  expect(styles.marginInlineStart).toBe('1px');
  expect(styles.paddingInlineStart).toBe('2px');
  expect(styles.borderInlineStartWidth).toBe('3px');
});
