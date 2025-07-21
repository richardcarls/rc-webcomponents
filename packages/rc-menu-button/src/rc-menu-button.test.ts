import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { userEvent } from 'vitest/browser';

import './define';

test('RCMenuButton renders with correct ARIA attributes', async () => {
  const screen = render(
    html`
      <rc-menu-button data-testid="host">
        <button slot="trigger" data-testid="trigger">Options</button>
        <rc-menu label="Options" data-testid="menu">
          <button>Cut</button>
          <button>Copy</button>
        </rc-menu>
      </rc-menu-button>
    `,
  );

  const host = screen.getByTestId('host');
  const trigger = screen.getByTestId('trigger');
  const menu = screen.getByTestId('menu');

  await expect.element(host).toBeInTheDocument();
  await expect.element(trigger).toHaveAttribute('aria-haspopup', 'menu');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

  // Menu element should exist
  await expect.element(menu).toBeInTheDocument();
});

test('RCMenuButton opens on Enter key', async () => {
  const toggleSpy = vi.fn();

  const screen = render(
    html`
      <rc-menu-button data-testid="host" @rc-menu-button-toggle=${toggleSpy}>
        <button slot="trigger" data-testid="trigger">Options</button>
        <rc-menu label="Options">
          <button data-testid="item-one">Cut</button>
          <button data-testid="item-two">Copy</button>
        </rc-menu>
      </rc-menu-button>
    `,
  );

  const trigger = screen.getByTestId('trigger');
  const item1 = screen.getByTestId('item-one');

  // Tab to focus trigger (clicking would toggle the menu)
  await userEvent.click(document.body);
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  await userEvent.keyboard('{Enter}');

  // Menu should be open
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

  // First item should have focus
  await expect.element(item1).toHaveFocus();

  // Toggle event fired
  expect(toggleSpy).toHaveBeenCalledTimes(1);
  expect(toggleSpy.mock.calls[0][0].detail.open).toBe(true);
});

test('RCMenuButton opens on Space key', async () => {
  const screen = render(
    html`
      <rc-menu-button data-testid="host">
        <button slot="trigger" data-testid="trigger">Options</button>
        <rc-menu label="Options">
          <button data-testid="item-one">Cut</button>
          <button data-testid="item-two">Copy</button>
        </rc-menu>
      </rc-menu-button>
    `,
  );

  const trigger = screen.getByTestId('trigger');
  const item1 = screen.getByTestId('item-one');

  // Tab to focus trigger
  await userEvent.click(document.body);
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  await userEvent.keyboard(' ');

  // Menu should be open and first item focused
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.element(item1).toHaveFocus();
});

test('RCMenuButton opens on ArrowDown key and focuses first item', async () => {
  const screen = render(
    html`
      <rc-menu-button data-testid="host">
        <button slot="trigger" data-testid="trigger">Options</button>
        <rc-menu label="Options">
          <button data-testid="item-one">Cut</button>
          <button data-testid="item-two">Copy</button>
        </rc-menu>
      </rc-menu-button>
    `,
  );

  const trigger = screen.getByTestId('trigger');
  const item1 = screen.getByTestId('item-one');

  // Tab to focus trigger
  await userEvent.click(document.body);
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  await userEvent.keyboard('{ArrowDown}');

  // Menu should be open and first item focused
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.element(item1).toHaveFocus();
});

test('RCMenuButton opens on ArrowUp key and focuses last item', async () => {
  const screen = render(
    html`
      <rc-menu-button data-testid="host">
        <button slot="trigger" data-testid="trigger">Options</button>
        <rc-menu label="Options">
          <button data-testid="item-one">Cut</button>
          <button data-testid="item-two">Copy</button>
        </rc-menu>
      </rc-menu-button>
    `,
  );

  const trigger = screen.getByTestId('trigger');
  const item2 = screen.getByTestId('item-two');

  // Tab to focus trigger
  await userEvent.click(document.body);
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  await userEvent.keyboard('{ArrowUp}');

  // Menu should be open and last item focused
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.element(item2).toHaveFocus();
});

test('RCMenuButton closes on Escape and returns focus to trigger', async () => {
  const toggleSpy = vi.fn();

  const screen = render(
    html`
      <rc-menu-button data-testid="host" @rc-menu-button-toggle=${toggleSpy}>
        <button slot="trigger" data-testid="trigger">Options</button>
        <rc-menu label="Options">
          <button data-testid="item-one">Cut</button>
        </rc-menu>
      </rc-menu-button>
    `,
  );

  const trigger = screen.getByTestId('trigger');
  const item1 = screen.getByTestId('item-one');

  // Tab to focus trigger, then open menu
  await userEvent.click(document.body);
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');
  await expect.element(item1).toHaveFocus();

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
  const screen = render(
    html`
      <rc-menu-button data-testid="host">
        <button slot="trigger" data-testid="trigger">Options</button>
        <rc-menu label="Options">
          <button data-testid="item-one">Cut</button>
        </rc-menu>
      </rc-menu-button>
    `,
  );

  const trigger = screen.getByTestId('trigger');
  const item1 = screen.getByTestId('item-one');

  // Tab to focus trigger, then open menu
  await userEvent.click(document.body);
  await userEvent.tab();
  await userEvent.keyboard('{Enter}');
  await expect.element(item1).toHaveFocus();

  // Activate item with Enter
  await userEvent.keyboard('{Enter}');

  // Menu should be closed
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');

  // Focus should return to trigger
  await expect.element(trigger).toHaveFocus();
});

test('RCMenuButton toggles on trigger click', async () => {
  const screen = render(
    html`
      <rc-menu-button data-testid="host">
        <button slot="trigger" data-testid="trigger">Options</button>
        <rc-menu label="Options">
          <button>Cut</button>
        </rc-menu>
      </rc-menu-button>
    `,
  );

  const trigger = screen.getByTestId('trigger');

  // Click to open
  await trigger.click();
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');

  // Click again to close
  await trigger.click();
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
});

test('RCMenuButton closes on outside click', async () => {
  const screen = render(
    html`
      <div>
        <rc-menu-button data-testid="host">
          <button slot="trigger" data-testid="trigger">Options</button>
          <rc-menu label="Options">
            <button>Cut</button>
          </rc-menu>
        </rc-menu-button>
        <button data-testid="outside">Outside</button>
      </div>
    `,
  );

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
  const screen = render(
    html`
      <rc-menu-button data-testid="host">
        <button slot="trigger" data-testid="trigger">Options</button>
        <rc-menu label="Options">
          <button data-testid="item-one">Cut</button>
        </rc-menu>
      </rc-menu-button>
    `,
  );

  const host = screen.getByTestId('host');
  const trigger = screen.getByTestId('trigger');
  const item1 = screen.getByTestId('item-one');

  const menuButton = (await host.element()) as any;
  await menuButton.updateComplete;

  // openMenu() method
  menuButton.openMenu();
  await menuButton.updateComplete;

  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.element(item1).toHaveFocus();

  // closeMenu() method
  menuButton.closeMenu();
  await menuButton.updateComplete;

  await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect.element(trigger).toHaveFocus();
});

test('RCMenuButton vertical: opens on ArrowRight and focuses first item', async () => {
  const screen = render(
    html`
      <rc-menu-button data-testid="host" orientation="vertical">
        <button slot="trigger" data-testid="trigger">Options</button>
        <rc-menu label="Options">
          <button data-testid="item-one">Cut</button>
          <button data-testid="item-two">Copy</button>
        </rc-menu>
      </rc-menu-button>
    `,
  );

  const trigger = screen.getByTestId('trigger');
  const item1 = screen.getByTestId('item-one');

  // Tab to focus trigger
  await userEvent.click(document.body);
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  await userEvent.keyboard('{ArrowRight}');

  // Menu should be open and first item focused
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.element(item1).toHaveFocus();
});

test('RCMenuButton vertical: opens on ArrowLeft and focuses last item', async () => {
  const screen = render(
    html`
      <rc-menu-button data-testid="host" orientation="vertical">
        <button slot="trigger" data-testid="trigger">Options</button>
        <rc-menu label="Options">
          <button data-testid="item-one">Cut</button>
          <button data-testid="item-two">Copy</button>
        </rc-menu>
      </rc-menu-button>
    `,
  );

  const trigger = screen.getByTestId('trigger');
  const item2 = screen.getByTestId('item-two');

  // Tab to focus trigger
  await userEvent.click(document.body);
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  await userEvent.keyboard('{ArrowLeft}');

  // Menu should be open and last item focused
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.element(item2).toHaveFocus();
});

test('RCMenuButton vertical: ArrowDown/ArrowUp do not open menu', async () => {
  const screen = render(
    html`
      <rc-menu-button data-testid="host" orientation="vertical">
        <button slot="trigger" data-testid="trigger">Options</button>
        <rc-menu label="Options">
          <button data-testid="item-one">Cut</button>
        </rc-menu>
      </rc-menu-button>
    `,
  );

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
  const screen = render(
    html`
      <div role="menubar" aria-orientation="vertical">
        <rc-menu-button data-testid="host">
          <button slot="trigger" data-testid="trigger">Options</button>
          <rc-menu label="Options">
            <button data-testid="item-one">Cut</button>
          </rc-menu>
        </rc-menu-button>
      </div>
    `,
  );

  const trigger = screen.getByTestId('trigger');
  const item1 = screen.getByTestId('item-one');

  // Tab to focus trigger
  await userEvent.click(document.body);
  await userEvent.tab();
  await expect.element(trigger).toHaveFocus();

  // ArrowRight should open menu (inherited vertical orientation)
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect.element(item1).toHaveFocus();
});

test('RCMenuButton reflects open attribute', async () => {
  const screen = render(
    html`
      <rc-menu-button data-testid="host">
        <button slot="trigger" data-testid="trigger">Options</button>
        <rc-menu label="Options">
          <button>Cut</button>
        </rc-menu>
      </rc-menu-button>
    `,
  );

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
