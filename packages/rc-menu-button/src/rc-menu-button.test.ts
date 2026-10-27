import { afterEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import type { Locator } from 'vitest/browser';

import type { RCMenu } from '@rcarls/rc-menu';
import './define.js';
import type { RCMenuButton } from './rc-menu-button.js';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';

function pressKey($target: HTMLElement, key: string): void {
  $target.dispatchEvent(
    new KeyboardEvent('keydown', {
      key,
      bubbles: true,
      cancelable: true,
      composed: true,
    }),
  );
}

async function prepareKeyboardInteraction(
  screen: ReturnType<typeof render>,
  itemCount: number,
): Promise<{ $host: RCMenuButton; $menu: RCMenu; $trigger: HTMLElement }> {
  const $host = screen.container.querySelector('rc-menu-button') as RCMenuButton;
  const $menu = $host.querySelector(':scope > rc-menu') as RCMenu;
  const $trigger = $host.querySelector(':scope > [slot="trigger"]') as HTMLElement;

  await Promise.all([$host.updateComplete, $menu.updateComplete]);
  await vi.waitFor(() => expect($menu.items).toHaveLength(itemCount));

  $trigger.focus();
  expect($trigger).toHaveFocus();

  return { $host, $menu, $trigger };
}

afterEach(async () => {
  const $openHosts = Array.from(document.querySelectorAll<RCMenuButton>('rc-menu-button')).filter(
    ($host) => $host.open,
  );

  for (const $host of $openHosts) {
    $host.open = false;
  }

  await Promise.all($openHosts.map(($host) => $host.updateComplete));
});

async function expectActiveMenuItem(item: Locator) {
  const $item = item.element();
  const $menu = $item.closest('rc-menu');

  expect($menu).toBeTruthy();
  await expect.element($menu as HTMLElement).toHaveFocus();
  await expect.element(item).toHaveAttribute('data-active');
}

test('popup fades in and out through CSS alone, with no JavaScript gating the timing', async () => {
  const screen = render(html`
    <rc-menu-button data-testid="host">
      <button slot="trigger">Options</button>
      <rc-menu label="Options">
        <button>Cut</button>
        <button>Copy</button>
      </rc-menu>
    </rc-menu-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCMenuButton;

  await host.updateComplete;

  const popup = host.shadowRoot?.querySelector('#popup') as HTMLElement;

  expect(getComputedStyle(popup).opacity).toBe('0');
  expect(getComputedStyle(popup).transitionDuration).not.toBe('0s');

  // Host writes to open are silent and synchronous; nothing waits on a transition.
  host.open = true;

  await new Promise((resolve) => requestAnimationFrame(resolve));
  await Promise.all(
    popup.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
  );

  // WebKit can resolve an Animation.finished promise just before computed
  // style exposes the transition's resting value.
  await vi.waitFor(() => expect(getComputedStyle(popup).opacity).toBe('1'));

  host.open = false;

  await new Promise((resolve) => requestAnimationFrame(resolve));
  await Promise.all(
    popup.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
  );

  // The exit fade must actually be visible, not skipped by an instant
  // display: none racing ahead of it: closing relies on allow-discrete
  // keeping display visible for the fade's duration rather than the
  // popover's own native display toggle winning immediately.
  expect(getComputedStyle(popup).opacity).toBe('0');
});

test('RCMenuButton renders with correct ARIA attributes', async () => {
  const screen = render(html`
    <rc-menu-button data-testid="host">
      <button slot="trigger" data-testid="trigger">Options</button>
      <rc-menu label="Options" data-testid="menu">
        <button>Cut</button>
        <button>Copy</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const host = screen.getByTestId('host');
  const trigger = screen.getByTestId('trigger');
  const menu = screen.getByTestId('menu');

  await expect.element(host).toBeInTheDocument();
  await expect.element(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

  // Menu element should exist
  await expect.element(menu).toBeInTheDocument();
});

test('RCMenuButton renders an author-supplied indicator inside the trigger bounds', async () => {
  const screen = render(html`
    <rc-menu-button data-testid="host" orientation="vertical">
      <button slot="trigger" data-testid="trigger">Scale recipe</button>
      <span slot="indicator" aria-hidden="true" data-testid="indicator">→</span>
      <rc-menu label="Scale recipe">
        <button>Double</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const host = screen.getByTestId('host').element() as RCMenuButton;
  const trigger = screen.getByTestId('trigger').element() as HTMLButtonElement;
  const indicator = screen.getByTestId('indicator').element() as HTMLElement;

  await host.updateComplete;

  expect(host).toHaveAttribute('has-indicator');
  expect(host.shadowRoot?.querySelector('slot[name="indicator"]')).not.toBeNull();
  expect(getComputedStyle(indicator).pointerEvents).toBe('none');

  expect(parseFloat(getComputedStyle(trigger).paddingInlineEnd)).toBeGreaterThan(
    parseFloat(getComputedStyle(trigger).paddingInlineStart),
  );
});

test('RCMenuButton vertical trigger spans a flex-stretched menu row', async () => {
  const screen = render(html`
    <div style="display: flex; flex-direction: column; inline-size: 200px">
      <rc-menu-button data-testid="host" orientation="vertical">
        <button slot="trigger" data-testid="trigger">View</button>
        <span slot="indicator" aria-hidden="true">→</span>
        <rc-menu label="View">
          <button>Grid</button>
        </rc-menu>
      </rc-menu-button>
    </div>
  `);
  const host = screen.getByTestId('host').element() as RCMenuButton;
  const trigger = screen.getByTestId('trigger').element() as HTMLButtonElement;

  await host.updateComplete;

  const root = host.shadowRoot?.querySelector<HTMLElement>('#root');
  const triggerWrap = host.shadowRoot?.querySelector<HTMLElement>('#trigger-wrap');
  const hostWidth = host.getBoundingClientRect().width;

  expect(hostWidth).toBeCloseTo(200);
  expect(root!.getBoundingClientRect().width).toBeCloseTo(hostWidth);
  expect(triggerWrap!.getBoundingClientRect().width).toBeCloseTo(hostWidth);
  expect(trigger.getBoundingClientRect().width).toBeCloseTo(hostWidth);
});

test('RCMenuButton has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-menu-button data-testid="host">
      <button slot="trigger">Options</button>
      <rc-menu label="Options">
        <button>Cut</button>
        <button>Copy</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const host = (await screen.getByTestId('host').element()) as RCMenuButton;

  await expectNoA11yViolations(host);

  host.openMenu();
  await host.updateComplete;
  await expectNoA11yViolations(host);
});

test('RCMenuButton opens on ArrowDown key and focuses first item', async () => {
  const screen = render(html`
    <rc-menu-button data-testid="host">
      <button slot="trigger" data-testid="trigger">Options</button>
      <rc-menu label="Options">
        <button data-testid="item-one">Cut</button>
        <button data-testid="item-two">Copy</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const trigger = screen.getByTestId('trigger');
  const item1 = screen.getByTestId('item-one');
  const { $host, $trigger } = await prepareKeyboardInteraction(screen, 2);

  await expect.element(trigger).toHaveFocus();

  pressKey($trigger, 'ArrowDown');
  await $host.updateComplete;

  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expectActiveMenuItem(item1);
});

test('RCMenuButton opens on ArrowUp key and focuses last item', async () => {
  const screen = render(html`
    <rc-menu-button data-testid="host">
      <button slot="trigger" data-testid="trigger">Options</button>
      <rc-menu label="Options">
        <button data-testid="item-one">Cut</button>
        <button data-testid="item-two">Copy</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const trigger = screen.getByTestId('trigger');
  const item2 = screen.getByTestId('item-two');
  const { $host, $trigger } = await prepareKeyboardInteraction(screen, 2);

  await expect.element(trigger).toHaveFocus();

  pressKey($trigger, 'ArrowUp');
  await $host.updateComplete;

  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expectActiveMenuItem(item2);
});

test('RCMenuButton closes on Escape and returns focus to trigger', async () => {
  const toggleSpy = vi.fn();

  const screen = render(html`
    <rc-menu-button data-testid="host" @rc-menu-button-toggle=${toggleSpy}>
      <button slot="trigger" data-testid="trigger">Options</button>
      <rc-menu label="Options">
        <button data-testid="item-one">Cut</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const trigger = screen.getByTestId('trigger');
  const item1 = screen.getByTestId('item-one');
  const { $host, $menu, $trigger } = await prepareKeyboardInteraction(screen, 1);

  pressKey($trigger, 'Enter');
  await $host.updateComplete;
  await expectActiveMenuItem(item1);

  pressKey($menu, 'Escape');
  await $host.updateComplete;

  // Menu should be closed
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

  // Focus should return to trigger
  await expect.element(trigger).toHaveFocus();

  // Toggle events: open + close
  expect(toggleSpy).toHaveBeenCalledTimes(2);
  expect(toggleSpy.mock.calls[1][0].detail.open).toBe(false);
});

test('RCMenuButton closes on menu item activation', async () => {
  const screen = render(html`
    <rc-menu-button data-testid="host">
      <button slot="trigger" data-testid="trigger">Options</button>
      <rc-menu label="Options">
        <button data-testid="item-one">Cut</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const trigger = screen.getByTestId('trigger');
  const item1 = screen.getByTestId('item-one');
  const { $host, $menu, $trigger } = await prepareKeyboardInteraction(screen, 1);

  pressKey($trigger, 'Enter');
  await $host.updateComplete;
  await expectActiveMenuItem(item1);

  pressKey($menu, 'Enter');
  await $host.updateComplete;

  // Menu should be closed
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

  // Focus should return to trigger
  await expect.element(trigger).toHaveFocus();
});

test('RCMenuButton toggles on trigger click', async () => {
  const screen = render(html`
    <rc-menu-button data-testid="host">
      <button slot="trigger" data-testid="trigger">Options</button>
      <rc-menu label="Options">
        <button>Cut</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const trigger = screen.getByTestId('trigger');

  // Click to open
  await trigger.click();
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

  // Click again to close
  await trigger.click();
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('RCMenuButton maps trigger styling variables to the slotted trigger', async () => {
  const screen = render(html`
    <rc-menu-button
      data-testid="host"
      style="
          --rc-menu-button-trigger-background: rgb(1, 2, 3);
          --rc-menu-button-trigger-color: rgb(4, 5, 6);
          --rc-menu-button-trigger-open-background: rgb(7, 8, 9);
          --rc-menu-button-trigger-open-color: rgb(10, 11, 12);
          --rc-menu-button-trigger-padding-inline: 2rem;
          --rc-menu-button-trigger-gap: 1rem;
        "
    >
      <button slot="trigger" data-testid="trigger">
        <span>Options</span>
        <span aria-hidden="true">+</span>
      </button>
      <rc-menu label="Options">
        <button>Cut</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const host = screen.getByTestId('host').element() as RCMenuButton;
  const trigger = screen.getByTestId('trigger').element() as HTMLElement;

  await host.updateComplete;

  let styles = getComputedStyle(trigger);

  expect(styles.display).toBe('inline-flex');
  expect(styles.backgroundColor).toBe('rgb(1, 2, 3)');
  expect(styles.color).toBe('rgb(4, 5, 6)');
  expect(styles.paddingInlineStart).toBe('32px');
  expect(styles.gap).toBe('16px');

  await screen.getByTestId('trigger').click();

  styles = getComputedStyle(trigger);

  expect(trigger.getAttribute('aria-expanded')).toBe('true');
  expect(styles.backgroundColor).toBe('rgb(7, 8, 9)');
  expect(styles.color).toBe('rgb(10, 11, 12)');
});

test('keeps a 32px visible icon-only trigger inside a 48px interactive wrapper', async () => {
  const screen = render(html`
    <rc-menu-button
      data-testid="host"
      icon-only
      style="--rc-menu-button-trigger-block-size: 32px; --rc-menu-button-icon-size: 32px;"
    >
      <button slot="trigger" data-testid="trigger" aria-label="More actions">+</button>
      <rc-menu label="More actions">
        <button>Cut</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const host = screen.getByTestId('host').element() as RCMenuButton;
  const trigger = screen.getByTestId('trigger').element() as HTMLElement;

  await host.updateComplete;

  const triggerWrap = host.shadowRoot?.querySelector('#trigger-wrap') as HTMLElement;
  const wrapRect = triggerWrap.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();

  expect(wrapRect.height).toBeCloseTo(48);
  expect(wrapRect.width).toBeCloseTo(48);
  expect(triggerRect.height).toBeCloseTo(32);
  expect(triggerRect.width).toBeCloseTo(32);

  const targetX = wrapRect.left + 2;
  const targetY = wrapRect.top + wrapRect.height / 2;

  expect(targetX).toBeLessThan(triggerRect.left);
  expect(document.elementFromPoint(targetX, targetY)).toBe(trigger);
});

test('does not grow a visible icon-only trigger that already meets the touch target', async () => {
  const screen = render(html`
    <rc-menu-button
      data-testid="host"
      icon-only
      style="--rc-menu-button-trigger-block-size: 56px; --rc-menu-button-icon-size: 56px;"
    >
      <button slot="trigger" aria-label="More actions">+</button>
      <rc-menu label="More actions">
        <button>Cut</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const host = screen.getByTestId('host').element() as RCMenuButton;

  await host.updateComplete;

  const triggerWrap = host.shadowRoot?.querySelector('#trigger-wrap') as HTMLElement;
  const wrapRect = triggerWrap.getBoundingClientRect();

  expect(wrapRect.height).toBeCloseTo(56);
  expect(wrapRect.width).toBeCloseTo(56);
});

test('--rc-menu-button-touch-target-overlap-inline-end shifts a 32px icon-only trigger flush with a flex-end container edge', async () => {
  const screen = render(html`
    <div data-testid="row" style="display:flex; justify-content:flex-end; width:200px;">
      <rc-menu-button
        data-testid="host"
        icon-only
        style="
          --rc-menu-button-trigger-block-size: 32px;
          --rc-menu-button-icon-size: 32px;
          --rc-menu-button-touch-target-overlap-inline-end: 8px;
        "
      >
        <button slot="trigger" data-testid="trigger" aria-label="More actions">+</button>
        <rc-menu label="More actions">
          <button>Cut</button>
        </rc-menu>
      </rc-menu-button>
    </div>
  `);

  const host = screen.getByTestId('host').element() as RCMenuButton;
  const row = screen.getByTestId('row').element() as HTMLElement;
  const trigger = screen.getByTestId('trigger').element() as HTMLElement;

  await host.updateComplete;

  const triggerWrap = host.shadowRoot?.querySelector('#trigger-wrap') as HTMLElement;

  expect(getComputedStyle(triggerWrap).marginInlineEnd).toBe('-8px');
  expect(getComputedStyle(triggerWrap).marginInlineStart).toBe('0px');

  const rowRect = row.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();

  // The 8px the touch target would otherwise reserve past the visible
  // trigger is given back, so the visible trigger lands flush with the
  // row's own trailing edge instead of 8px short of it.
  expect(triggerRect.right).toBeCloseTo(rowRect.right);

  // A point just past the visible trigger -- outside the row's own
  // boundary, in the space it just reclaimed -- still resolves to the
  // trigger: the light-DOM hit-slop pseudo-element is anchored to the
  // trigger itself and unaffected by the wrapper's margin, so the actual
  // clickable region keeps its full accessible size regardless.
  const targetX = triggerRect.right + 2;
  const targetY = triggerRect.top + triggerRect.height / 2;

  expect(targetX).toBeGreaterThan(rowRect.right);
  expect(document.elementFromPoint(targetX, targetY)).toBe(trigger);
});

test('RCMenuButton closes on outside click', async () => {
  const screen = render(html`
    <div>
      <rc-menu-button data-testid="host">
        <button slot="trigger" data-testid="trigger">Options</button>
        <rc-menu label="Options">
          <button>Cut</button>
        </rc-menu>
      </rc-menu-button>
      <button data-testid="outside">Outside</button>
    </div>
  `);

  const trigger = screen.getByTestId('trigger');
  const outside = screen.getByTestId('outside');

  // Open menu
  await trigger.click();
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

  // Click outside
  await outside.click();

  // Menu should be closed
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

  // Focus should NOT return to trigger (clicked elsewhere)
  await expect.element(outside).toHaveFocus();
});

test('RCMenuButton exposes open/close methods', async () => {
  const screen = render(html`
    <rc-menu-button data-testid="host">
      <button slot="trigger" data-testid="trigger">Options</button>
      <rc-menu label="Options">
        <button data-testid="item-one">Cut</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const host = screen.getByTestId('host');
  const trigger = screen.getByTestId('trigger');
  const item1 = screen.getByTestId('item-one');

  const menuButton = (await host.element()) as RCMenuButton;

  await menuButton.updateComplete;
  await expect.element(host).not.toHaveAttribute('open');

  // openMenu() method
  menuButton.openMenu();
  await menuButton.updateComplete;

  await expect.element(host).toHaveAttribute('open');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expectActiveMenuItem(item1);

  // closeMenu() method
  menuButton.closeMenu();
  await menuButton.updateComplete;

  await expect.element(host).not.toHaveAttribute('open');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect.element(trigger).toHaveFocus();
});

test('RCMenuButton vertical: opens on ArrowRight and focuses first item', async () => {
  const screen = render(html`
    <rc-menu-button data-testid="host" orientation="vertical">
      <button slot="trigger" data-testid="trigger">Options</button>
      <rc-menu label="Options">
        <button data-testid="item-one">Cut</button>
        <button data-testid="item-two">Copy</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const trigger = screen.getByTestId('trigger');
  const item1 = screen.getByTestId('item-one');
  const { $host, $trigger } = await prepareKeyboardInteraction(screen, 2);

  await expect.element(trigger).toHaveFocus();

  pressKey($trigger, 'ArrowRight');
  await $host.updateComplete;

  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expectActiveMenuItem(item1);
});

test('RCMenuButton vertical: ArrowDown/ArrowUp do not open menu', async () => {
  const screen = render(html`
    <rc-menu-button data-testid="host" orientation="vertical">
      <button slot="trigger" data-testid="trigger">Options</button>
      <rc-menu label="Options">
        <button data-testid="item-one">Cut</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const trigger = screen.getByTestId('trigger');
  const { $host, $trigger } = await prepareKeyboardInteraction(screen, 1);

  await expect.element(trigger).toHaveFocus();

  // ArrowDown should not open menu in vertical orientation
  pressKey($trigger, 'ArrowDown');
  await $host.updateComplete;
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

  // ArrowUp should not open menu in vertical orientation
  pressKey($trigger, 'ArrowUp');
  await $host.updateComplete;
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('RCMenuButton inherits orientation from parent with role="menubar"', async () => {
  const screen = render(html`
    <div role="menubar" aria-orientation="vertical">
      <rc-menu-button data-testid="host">
        <button slot="trigger" data-testid="trigger">Options</button>
        <rc-menu label="Options">
          <button data-testid="item-one">Cut</button>
        </rc-menu>
      </rc-menu-button>
    </div>
  `);

  const trigger = screen.getByTestId('trigger');
  const item1 = screen.getByTestId('item-one');
  const { $host, $trigger } = await prepareKeyboardInteraction(screen, 1);

  await expect.element(trigger).toHaveFocus();

  // ArrowRight should open menu (inherited vertical orientation)
  pressKey($trigger, 'ArrowRight');
  await $host.updateComplete;
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expectActiveMenuItem(item1);
});

test('RCMenuButton ignores default-open after an explicit controlled open=false write', async () => {
  const screen = render(html`
    <rc-menu-button data-testid="host">
      <button slot="trigger" data-testid="trigger">Options</button>
      <rc-menu label="Options">
        <button>Cut</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const host = screen.getByTestId('host');
  const trigger = screen.getByTestId('trigger');

  const menuButton = (await host.element()) as RCMenuButton;

  await menuButton.updateComplete;

  // A controlled write of open=false (e.g. a React-style explicit boolean
  // prop) must lock in controlled mode even though it matches the default.
  menuButton.open = false;

  // An uncontrolled default arriving afterward must not override the
  // controlled write.
  menuButton.defaultOpen = true;

  await menuButton.updateComplete;

  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  expect(menuButton.open).toBe(false);
});

test('RCMenuButton releases controlled open state back to default-open', async () => {
  const toggleSpy = vi.fn();
  const screen = render(html`
    <rc-menu-button
      data-testid="host"
      default-open
      @rc-menu-button-toggle=${toggleSpy as EventListener}
    >
      <button slot="trigger" data-testid="trigger">Options</button>
      <rc-menu label="Options">
        <button>Cut</button>
      </rc-menu>
    </rc-menu-button>
  `);
  const host = screen.getByTestId('host');
  const trigger = screen.getByTestId('trigger');
  const menuButton = (await host.element()) as RCMenuButton;

  await menuButton.updateComplete;
  menuButton.open = false;
  await menuButton.updateComplete;
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

  menuButton.open = undefined;
  await menuButton.updateComplete;

  expect(menuButton.open).toBe(true);
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  expect(toggleSpy).not.toHaveBeenCalled();
});

test("RCMenuButton toggles the popup element's :popover-open state with `open`", async () => {
  const screen = render(html`
    <rc-menu-button data-testid="host">
      <button slot="trigger" data-testid="trigger">Options</button>
      <rc-menu label="Options">
        <button>Cut</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const host = screen.getByTestId('host');
  const trigger = screen.getByTestId('trigger');

  const menuButton = (await host.element()) as RCMenuButton;
  const popup = menuButton.shadowRoot?.querySelector('#popup') as HTMLElement;

  expect(popup.matches(':popover-open')).toBe(false);

  await trigger.click();
  await menuButton.updateComplete;

  expect(popup.matches(':popover-open')).toBe(true);

  await trigger.click();
  await menuButton.updateComplete;

  expect(popup.matches(':popover-open')).toBe(false);
});

test('RCMenuButton positions the popup after it becomes visible', async () => {
  const screen = render(html`
    <rc-menu-button data-testid="host">
      <button slot="trigger">Options</button>
      <rc-menu label="Options">
        <button>Cut</button>
      </rc-menu>
    </rc-menu-button>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCMenuButton;
  const $popup = $host.shadowRoot?.querySelector('#popup') as HTMLElement;
  const anchorController = ($host as unknown as { _anchorCtrl: { update: () => void } })
    ._anchorCtrl;
  const updateSpy = vi.spyOn(anchorController, 'update').mockImplementation(() => {
    expect($popup.matches(':popover-open')).toBe(true);
  });

  $host.openMenu();
  await $host.updateComplete;

  expect(updateSpy).toHaveBeenCalledOnce();
});

test('RCMenuButton popup escapes an ancestor with overflow: hidden', async () => {
  const screen = render(html`
    <div
      data-testid="clip-wrapper"
      style="overflow: hidden; height: 40px; z-index: 0; position: relative;"
    >
      <rc-menu-button data-testid="host">
        <button slot="trigger" data-testid="trigger">Options</button>
        <rc-menu label="Options">
          <button>Cut</button>
          <button>Copy</button>
        </rc-menu>
      </rc-menu-button>
    </div>
  `);

  const host = screen.getByTestId('host');
  const trigger = screen.getByTestId('trigger');
  const wrapper = screen.getByTestId('clip-wrapper').element() as HTMLElement;

  const menuButton = (await host.element()) as RCMenuButton;

  await trigger.click();
  await menuButton.updateComplete;

  const popup = menuButton.shadowRoot?.querySelector('#popup') as HTMLElement;

  expect(popup.matches(':popover-open')).toBe(true);

  const wrapperRect = wrapper.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();

  // The popup is promoted to the top layer, so its painted bounds extend
  // below the clipping wrapper's bottom edge instead of being clipped to it.
  expect(popupRect.bottom).toBeGreaterThan(wrapperRect.bottom);
});

test('RCMenuButton supports two simultaneously-open nested instances', async () => {
  // A nested rc-menu-button is itself a focusable child of the outer rc-menu,
  // so the outer's own click-delegation (rc-menu's `_onClick`) would treat any
  // click inside the nested instance as activating the nested instance's own
  // `role="menuitem"`, closing the outer menu. Consumers nesting rc-menu-button
  // as a cascading submenu trigger stop propagation on the nested trigger's
  // click for this reason; mirrored here so this test exercises the same
  // shape of markup a real submenu cascade uses.
  const screen = render(html`
    <rc-menu-button data-testid="outer-host">
      <button slot="trigger" data-testid="outer-trigger">Outer</button>
      <rc-menu label="Outer">
        <rc-menu-button data-testid="inner-host" @click=${(e: MouseEvent) => e.stopPropagation()}>
          <button slot="trigger" data-testid="inner-trigger">Inner</button>
          <rc-menu label="Inner">
            <button data-testid="inner-item">Inner item</button>
          </rc-menu>
        </rc-menu-button>
      </rc-menu>
    </rc-menu-button>
  `);

  const outerHost = screen.getByTestId('outer-host');
  const outerTrigger = screen.getByTestId('outer-trigger');
  const innerHost = screen.getByTestId('inner-host');
  const innerTrigger = screen.getByTestId('inner-trigger');
  const innerItem = screen.getByTestId('inner-item');

  const outerMenuButton = (await outerHost.element()) as RCMenuButton;
  const innerMenuButton = (await innerHost.element()) as RCMenuButton;

  // Open the outer menu, exposing the inner trigger.
  await outerTrigger.click();
  await outerMenuButton.updateComplete;

  await expect.element(outerTrigger).toHaveAttribute('aria-expanded', 'true');

  // Open the nested submenu while the outer stays open.
  await innerTrigger.click();
  await innerMenuButton.updateComplete;

  const outerPopup = outerMenuButton.shadowRoot?.querySelector('#popup') as HTMLElement;
  const innerPopup = innerMenuButton.shadowRoot?.querySelector('#popup') as HTMLElement;

  // Both instances report an open top-layer popup simultaneously.
  expect(outerPopup.matches(':popover-open')).toBe(true);
  expect(innerPopup.matches(':popover-open')).toBe(true);

  // The inner popup stays interactable while both are open: the click
  // actually reaches the innermost item rather than being blocked or
  // obscured by top-layer paint/stacking order. Activation then cascades
  // rc-menu-activate through every ancestor popup's listener, closing the
  // whole chain — the same established cascade-collapse behavior as a
  // single-level menu.
  await innerItem.click();

  await expect.element(innerTrigger).toHaveAttribute('aria-expanded', 'false');
  await expect.element(outerTrigger).toHaveAttribute('aria-expanded', 'false');
  expect(innerPopup.matches(':popover-open')).toBe(false);
  expect(outerPopup.matches(':popover-open')).toBe(false);
});

test.each([
  ['vertical-rl', 'ltr', 'horizontal', 'ArrowLeft'],
  ['horizontal-tb', 'rtl', 'vertical', 'ArrowLeft'],
  ['vertical-rl', 'rtl', 'vertical', 'ArrowUp'],
])(
  'RCMenuButton opens with the documented key in %s %s (%s layout)',
  async (writingMode, dir, orientation, key) => {
    const screen = render(html`
      <div dir=${dir} style="writing-mode: ${writingMode};">
        <rc-menu-button data-testid="host" orientation=${orientation}>
          <button slot="trigger" data-testid="trigger">Options</button>
          <rc-menu label="Options">
            <button data-testid="item-one">Cut</button>
            <button data-testid="item-two">Copy</button>
          </rc-menu>
        </rc-menu-button>
      </div>
    `);

    const trigger = screen.getByTestId('trigger');
    const item1 = screen.getByTestId('item-one');
    const { $host, $trigger } = await prepareKeyboardInteraction(screen, 2);

    pressKey($trigger, key);
    await $host.updateComplete;

    await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
    await expectActiveMenuItem(item1);
  },
);

test.each([
  // A menubar row in vertical text renders vertically and says so.
  ['vertical-rl', 'vertical', 'ArrowLeft', 'ArrowDown'],
  // A vertical menubar in horizontal text: the reading is already a layout.
  ['horizontal-tb', 'vertical', 'ArrowRight', 'ArrowDown'],
])(
  'RCMenuButton reads a plain menubar aria-orientation as rendered in %s (%s)',
  async (writingMode, ariaOrientation, opens, ignored) => {
    const screen = render(html`
      <div style="writing-mode: ${writingMode};">
        <div role="menubar" aria-orientation=${ariaOrientation}>
          <rc-menu-button data-testid="host">
            <button slot="trigger" role="menuitem" data-testid="trigger">Options</button>
            <rc-menu label="Options">
              <button data-testid="item-one">Cut</button>
              <button data-testid="item-two">Copy</button>
            </rc-menu>
          </rc-menu-button>
        </div>
      </div>
    `);

    const trigger = screen.getByTestId('trigger');
    const item1 = screen.getByTestId('item-one');
    const { $host, $trigger } = await prepareKeyboardInteraction(screen, 2);

    pressKey($trigger, ignored);
    await $host.updateComplete;

    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

    pressKey($trigger, opens);
    await $host.updateComplete;

    await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
    await expectActiveMenuItem(item1);
  },
);

test('RCMenuButton opens its popup at the block end in vertical text', async () => {
  const screen = render(html`
    <div style="writing-mode: vertical-rl; position: fixed; left: 250px; top: 20px;">
      <rc-menu-button data-testid="host">
        <button slot="trigger">Options</button>
        <rc-menu label="Options">
          <button>Cut</button>
          <button>Copy</button>
        </rc-menu>
      </rc-menu-button>
    </div>
  `);
  const host = (await screen.getByTestId('host').element()) as RCMenuButton;

  await host.updateComplete;
  host.open = true;

  const root = host.shadowRoot?.querySelector('#root') as HTMLElement;
  const popup = host.shadowRoot?.querySelector('#popup') as HTMLElement;

  // The block end is on the left in vertical-rl: beside the trigger, not below it.
  await vi.waitFor(() => {
    expect(popup.getBoundingClientRect().right).toBeLessThanOrEqual(
      root.getBoundingClientRect().left,
    );
    expect(popup.getBoundingClientRect().top).toBeCloseTo(root.getBoundingClientRect().top, 0);
  });
});
