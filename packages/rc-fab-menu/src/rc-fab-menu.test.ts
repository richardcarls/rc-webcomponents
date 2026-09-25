import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import './define.js';
import type { RCFabMenu } from './rc-fab-menu.js';

const isChromium = navigator.userAgent.includes('Chrome');

test.runIf(isChromium)('popup exit fade is not skipped by an instant display change', async () => {
  const screen = render(html`
    <rc-fab-menu data-testid="host">
      <button slot="trigger" type="button" aria-label="Create">
        <span aria-hidden="true">+</span>
      </button>
      <rc-menu label="Create">
        <button data-value="recipe">Recipe</button>
      </rc-menu>
    </rc-fab-menu>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCFabMenu;

  await $host.updateComplete;

  const popup = $host.shadowRoot?.querySelector('#popup') as HTMLElement;

  // A long duration makes the mid-transition state easy to sample
  // deterministically, the way rc-menu-button's identical structure was
  // verified: this popup's own default is 0ms (motion is opt-in for this
  // component), so exercising the fade at all requires overriding it.
  popup.style.setProperty('--rc-fab-menu-popup-duration', '2000ms');

  $host.open = true;
  await new Promise((resolve) => setTimeout(resolve, 2100));

  $host.open = false;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => setTimeout(resolve, 300));

  const midStyles = getComputedStyle(popup);

  expect(midStyles.display).not.toBe('none');
  expect(Number(midStyles.opacity)).toBeGreaterThan(0);
  expect(Number(midStyles.opacity)).toBeLessThan(1);
});

test('popup exit fade retains display and overlay through discrete transitions', async () => {
  const { fabMenuStyles } = await import('./rc-fab-menu.styles.js');
  const css = fabMenuStyles.cssText;
  const motionBlock = css.slice(0, css.indexOf('@media (prefers-reduced-motion: reduce)'));

  expect(motionBlock).toContain('opacity var(--rc-fab-menu-popup-duration');
  expect(motionBlock).toContain('overlay var(--rc-fab-menu-popup-duration');
  expect(motionBlock).toContain('display var(--rc-fab-menu-popup-duration');
  expect(motionBlock).toContain('allow-discrete');
});

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
  expect($host.placement).toBe('block-start-end');
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

test('reduced motion zeros the popup scale but only shortens its opacity/overlay/display fade', async () => {
  // A real media-emulation test would need Playwright's emulateMedia, which
  // this harness does not currently expose to component tests. This
  // test proves the split by construction: scale (spatial)
  // drops to 0s while opacity and the overlay/display pair that tracks it
  // (effects) are shortened rather than zeroed.
  const { fabMenuStyles } = await import('./rc-fab-menu.styles.js');
  const css = fabMenuStyles.cssText;

  expect(css).toContain('@media (prefers-reduced-motion: reduce)');

  const motionBlock = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));

  expect(motionBlock).toContain('scale 0s');
  expect(motionBlock).toContain('opacity 50ms');
  expect(motionBlock).toContain('overlay 50ms allow-discrete');
  expect(motionBlock).toContain('display 50ms allow-discrete');
});

test.each([
  ['horizontal-tb', 'above'],
  ['vertical-rl', 'to the right of'],
])('opens its menu toward the block start in %s (%s the trigger)', async (writingMode) => {
  const screen = render(html`
    <div style="writing-mode: ${writingMode};">
      <rc-fab-menu data-testid="host">
        <button slot="trigger" type="button" aria-label="Create">+</button>
        <rc-menu label="Create">
          <button>Recipe</button>
        </rc-menu>
      </rc-fab-menu>
    </div>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCFabMenu;

  await $host.updateComplete;
  $host.open = true;

  const trigger = $host.querySelector('[slot="trigger"]') as HTMLElement;
  const popup = $host.shadowRoot?.querySelector('#popup') as HTMLElement;

  // Pinned to the block-end corner, so the menu opens back toward the block
  // start: above in horizontal text, to the right in vertical-rl.
  await vi.waitFor(() => {
    const menu = popup.getBoundingClientRect();
    const button = trigger.getBoundingClientRect();

    if (writingMode === 'horizontal-tb') {
      expect(menu.bottom).toBeLessThanOrEqual(button.top);
    } else {
      expect(menu.left).toBeGreaterThanOrEqual(button.right);
    }
  });

  $host.open = false;
});
