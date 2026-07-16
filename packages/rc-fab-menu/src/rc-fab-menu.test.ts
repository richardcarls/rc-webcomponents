import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';
import './define';
import type { RCFabMenu } from './rc-fab-menu';

test('native trigger and rc-menu remain connected with author content intact', async () => {
  const screen = render(html`
    <rc-fab-menu data-testid="host">
      <button slot="trigger" id="create" type="button" aria-label="Create">
        <span aria-hidden="true">+</span>
      </button>
      <rc-menu label="Create">
        <button data-value="recipe">Recipe</button>
      </rc-menu>
    </rc-fab-menu>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCFabMenu;

  await $host.updateComplete;

  const $trigger = $host.querySelector('button[slot="trigger"]') as HTMLButtonElement | null;
  const $menu = $host.querySelector('rc-menu');

  expect($trigger?.isConnected).toBe(true);
  expect($trigger?.id).toBe('create');
  expect($trigger?.type).toBe('button');
  expect($menu?.isConnected).toBe(true);
});

test('trigger receives menu-button ARIA state', async () => {
  const screen = render(html`
    <rc-fab-menu data-testid="host">
      <button slot="trigger" data-testid="trigger" type="button" aria-label="Create"></button>
      <rc-menu label="Create">
        <button>Recipe</button>
      </rc-menu>
    </rc-fab-menu>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCFabMenu;
  const $trigger = await screen.getByTestId('trigger').element();

  await $host.updateComplete;

  expect($trigger.getAttribute('aria-haspopup')).toBe('menu');
  expect($trigger.getAttribute('aria-expanded')).toBe('false');
});

test('opens with keyboard and dispatches rc-fab-menu-toggle', async () => {
  const toggleSpy = vi.fn();
  const screen = render(html`
    <rc-fab-menu data-testid="host" @rc-fab-menu-toggle=${toggleSpy}>
      <button slot="trigger" data-testid="trigger" type="button" aria-label="Create"></button>
      <rc-menu label="Create">
        <button data-testid="item-one">Recipe</button>
        <button data-testid="item-two">Collection</button>
      </rc-menu>
    </rc-fab-menu>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCFabMenu;
  const trigger = screen.getByTestId('trigger');
  const itemOne = screen.getByTestId('item-one');

  await $host.updateComplete;
  await userEvent.click(document.body);
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  await userEvent.keyboard('{Enter}');

  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.element(itemOne).toHaveAttribute('data-active');
  expect(toggleSpy).toHaveBeenCalledTimes(1);
  expect(toggleSpy.mock.calls[0]?.[0].detail.open).toBe(true);
});

test('closes on Escape and returns focus to the trigger', async () => {
  const screen = render(html`
    <rc-fab-menu data-testid="host">
      <button slot="trigger" data-testid="trigger" type="button" aria-label="Create"></button>
      <rc-menu label="Create">
        <button data-testid="item-one">Recipe</button>
      </rc-menu>
    </rc-fab-menu>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCFabMenu;
  const trigger = screen.getByTestId('trigger');

  await $host.updateComplete;
  await userEvent.click(document.body);
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');
  await userEvent.keyboard('{Escape}');

  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect.element(trigger).toHaveFocus();
});

test('default placement opens the menu above the floating action button', async () => {
  const screen = render(html`
    <rc-fab-menu data-testid="host">
      <button slot="trigger" type="button" aria-label="Create"></button>
      <rc-menu label="Create">
        <button>Recipe</button>
      </rc-menu>
    </rc-fab-menu>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCFabMenu;

  await $host.updateComplete;

  expect($host.position).toBe('bottom-end');
  expect($host.placement).toBe('top-end');
});

test('has no automated accessibility violations while closed and open', async () => {
  const screen = render(html`
    <rc-fab-menu data-testid="host">
      <button slot="trigger" data-testid="trigger" type="button" aria-label="Create">
        <span aria-hidden="true">+</span>
      </button>
      <rc-menu label="Create">
        <button>Recipe</button>
        <button>Collection</button>
      </rc-menu>
    </rc-fab-menu>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCFabMenu;

  await $host.updateComplete;
  await expectNoA11yViolations($host);

  $host.openMenu();
  await $host.updateComplete;

  await expectNoA11yViolations($host);

  $host.closeMenu();
});
