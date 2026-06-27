import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { userEvent, type Locator } from 'vitest/browser';

import './define';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

async function expectActiveMenuItem(item: Locator) {
  const itemElement = item.element();
  const menu = itemElement.closest('rc-menu');

  expect(menu).toBeTruthy();
  await expect.element(menu as HTMLElement).toHaveFocus();
  await expect.element(item).toHaveAttribute('data-active');
}

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

  const host = await screen.getByTestId('host').element();

  await expectNoA11yViolations(host);
});

test('RCMenuButton opens on Enter key', async () => {
  const toggleSpy = vi.fn();

  const screen = render(html`
    <rc-menu-button data-testid="host" @rc-menu-button-toggle=${toggleSpy}>
      <button slot="trigger" data-testid="trigger">Options</button>
      <rc-menu label="Options">
        <button data-testid="item-one">Cut</button>
        <button data-testid="item-two">Copy</button>
      </rc-menu>
    </rc-menu-button>
  `);

  const trigger = screen.getByTestId('trigger');
  const item1 = screen.getByTestId('item-one');

  // Tab to focus trigger (clicking would toggle the menu)
  await userEvent.click(document.body);
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  await userEvent.keyboard('{Enter}');

  // Menu should be open
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

  await expectActiveMenuItem(item1);

  // Toggle event fired
  expect(toggleSpy).toHaveBeenCalledTimes(1);
  expect(toggleSpy.mock.calls[0][0].detail.open).toBe(true);
});

test('RCMenuButton opens on Space key', async () => {
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

  // Tab to focus trigger
  await userEvent.click(document.body);
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  await userEvent.keyboard(' ');

  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expectActiveMenuItem(item1);
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

  // Tab to focus trigger
  await userEvent.click(document.body);
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  await userEvent.keyboard('{ArrowDown}');

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

  // Tab to focus trigger
  await userEvent.click(document.body);
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  await userEvent.keyboard('{ArrowUp}');

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

  // Tab to focus trigger, then open menu
  await userEvent.click(document.body);
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');
  await expectActiveMenuItem(item1);

  // Press Escape
  await userEvent.keyboard('{Escape}');

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

  // Tab to focus trigger, then open menu
  await userEvent.click(document.body);
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');
  await expectActiveMenuItem(item1);

  // Activate item with Enter
  await userEvent.keyboard('{Enter}');

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

  const host = screen.getByTestId('host').element() as any;
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

  const menuButton = (await host.element()) as any;
  await menuButton.updateComplete;

  // openMenu() method
  menuButton.openMenu();
  await menuButton.updateComplete;

  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expectActiveMenuItem(item1);

  // closeMenu() method
  menuButton.closeMenu();
  await menuButton.updateComplete;

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

  // Tab to focus trigger
  await userEvent.click(document.body);
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  await userEvent.keyboard('{ArrowRight}');

  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expectActiveMenuItem(item1);
});

test('RCMenuButton vertical: opens on ArrowLeft and focuses last item', async () => {
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
  const item2 = screen.getByTestId('item-two');

  // Tab to focus trigger
  await userEvent.click(document.body);
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  await userEvent.keyboard('{ArrowLeft}');

  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expectActiveMenuItem(item2);
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

  // Tab to focus trigger
  await userEvent.click(document.body);
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  // ArrowDown should not open menu in vertical orientation
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

  // ArrowUp should not open menu in vertical orientation
  await userEvent.keyboard('{ArrowUp}');
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

  // Tab to focus trigger
  await userEvent.click(document.body);
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  // ArrowRight should open menu (inherited vertical orientation)
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expectActiveMenuItem(item1);
});

test('RCMenuButton reflects open attribute', async () => {
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

  // Initially no open attribute
  await expect.element(host).not.toHaveAttribute('open');

  // Open menu
  await trigger.click();

  // Should have open attribute
  await expect.element(host).toHaveAttribute('open');

  // Close menu
  await trigger.click();

  // Should not have open attribute
  await expect.element(host).not.toHaveAttribute('open');
});
