import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import {
  keyNavigation,
  type KeyboardNavigationAction,
  type KeyNavigationOptions,
} from './KeyboardNavigationDirective.js';

function renderTarget(
  role: string,
  callback: (action: KeyboardNavigationAction) => void,
  options?: KeyNavigationOptions,
  orientation?: 'horizontal' | 'vertical',
): HTMLElement {
  const screen = render(html`
    <div
      role=${role}
      aria-orientation=${ifDefined(orientation)}
      tabindex="0"
      ${keyNavigation(callback, options)}
    ></div>
  `);

  return screen.container.querySelector<HTMLElement>('[role]')!;
}

function press($target: HTMLElement, key: string, shiftKey = false): void {
  $target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      shiftKey,
      bubbles: true,
      cancelable: true,
      composed: true,
    }),
  );
}

test('keyNavigation derives the navigation axis from menu, toolbar, and menubar roles', () => {
  const menuCB = vi.fn();
  const $menu = renderTarget('menu', menuCB);

  press($menu, 'ArrowDown');
  press($menu, 'ArrowUp');

  expect(menuCB.mock.calls).toEqual([['next'], ['prev']]);

  for (const role of ['toolbar', 'menubar']) {
    const callback = vi.fn();
    const $target = renderTarget(role, callback);

    press($target, 'ArrowRight');
    press($target, 'ArrowLeft');

    expect(callback.mock.calls).toEqual([['next'], ['prev']]);
  }
});

test('keyNavigation derives separator axes and honors an explicit override', () => {
  const defaultCB = vi.fn();
  const $defaultSeparator = renderTarget('separator', defaultCB);

  press($defaultSeparator, 'ArrowDown');
  expect(defaultCB).toHaveBeenCalledWith('next');

  const verticalCB = vi.fn();
  const $verticalSeparator = renderTarget('separator', verticalCB, undefined, 'vertical');

  press($verticalSeparator, 'ArrowRight');
  expect(verticalCB).toHaveBeenCalledWith('next');

  const overrideCB = vi.fn();
  const $overriddenMenu = renderTarget('menu', overrideCB, { navigationAxis: 'horizontal' });

  press($overriddenMenu, 'ArrowRight');
  expect(overrideCB).toHaveBeenCalledWith('next');
});

test('keyNavigation maps shifted arrows to large-step actions on both axes', () => {
  const horizontalCB = vi.fn();
  const $toolbar = renderTarget('toolbar', horizontalCB);

  press($toolbar, 'ArrowRight', true);
  press($toolbar, 'ArrowLeft', true);

  expect(horizontalCB.mock.calls).toEqual([['next-large'], ['prev-large']]);

  const verticalCB = vi.fn();
  const $menu = renderTarget('menu', verticalCB);

  press($menu, 'ArrowDown', true);
  press($menu, 'ArrowUp', true);

  expect(verticalCB.mock.calls).toEqual([['next-large'], ['prev-large']]);
});

test('keyNavigation maps Home and End to range endpoints', () => {
  const callback = vi.fn();
  const $menu = renderTarget('menu', callback);

  press($menu, 'Home');
  press($menu, 'End');

  expect(callback.mock.calls).toEqual([['start'], ['end']]);
});

test('keyNavigation gates Escape behind handleEscape', () => {
  const defaultCB = vi.fn();
  const $defaultMenu = renderTarget('menu', defaultCB);

  press($defaultMenu, 'Escape');
  expect(defaultCB).not.toHaveBeenCalled();

  const enabledCB = vi.fn();
  const $enabledMenu = renderTarget('menu', enabledCB, { handleEscape: true });

  press($enabledMenu, 'Escape');
  expect(enabledCB).toHaveBeenCalledWith('escape');
});

test('keyNavigation maps activation keys according to handleActivate', () => {
  const defaultCB = vi.fn();
  const $defaultMenu = renderTarget('menu', defaultCB);

  press($defaultMenu, 'Enter');
  press($defaultMenu, ' ');

  expect(defaultCB.mock.calls).toEqual([['toggle']]);

  const enabledCB = vi.fn();
  const $enabledMenu = renderTarget('menu', enabledCB, { handleActivate: true });

  press($enabledMenu, 'Enter');
  press($enabledMenu, ' ');

  expect(enabledCB.mock.calls).toEqual([['activate'], ['activate']]);
});

test('keyNavigation suppresses navigation actions when handleNavAxis is false', () => {
  const callback = vi.fn();
  const $menu = renderTarget('menu', callback, { handleNavAxis: false });

  for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) {
    press($menu, key);
  }

  expect(callback).not.toHaveBeenCalled();
});

test('keyNavigation maps the perpendicular open axis in both orientations', () => {
  const verticalCB = vi.fn();
  const $menu = renderTarget('menu', verticalCB, {
    handleNavAxis: false,
    handleOpenAxis: true,
  });

  press($menu, 'ArrowRight');
  press($menu, 'ArrowLeft');

  expect(verticalCB.mock.calls).toEqual([['open-to-first'], ['open-to-last']]);

  const horizontalCB = vi.fn();
  const $toolbar = renderTarget('toolbar', horizontalCB, {
    handleNavAxis: false,
    handleOpenAxis: true,
  });

  press($toolbar, 'ArrowDown');
  press($toolbar, 'ArrowUp');

  expect(horizontalCB.mock.calls).toEqual([['open-to-first'], ['open-to-last']]);
});
