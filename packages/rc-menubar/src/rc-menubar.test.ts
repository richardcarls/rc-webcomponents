import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { userEvent } from 'vitest/browser';

import './define';

test('RCMenubar renders with correct ARIA attributes', async () => {
  const screen = render(html`
    <rc-menubar data-testid="menubar" label="Test Menu">
      <rc-menu-button>
        <button slot="trigger" data-testid="trigger-1">File</button>
        <rc-menu label="File">
          <button>New</button>
        </rc-menu>
      </rc-menu-button>
      <rc-menu-button>
        <button slot="trigger" data-testid="trigger-2">Edit</button>
        <rc-menu label="Edit">
          <button>Undo</button>
        </rc-menu>
      </rc-menu-button>
    </rc-menubar>
  `);

  const menubar = screen.getByTestId('menubar');
  const root = menubar.getByRole('menubar');

  await expect.element(menubar).toBeInTheDocument();
  await expect.element(root).toHaveAttribute('aria-label', 'Test Menu');
  await expect.element(root).toHaveAttribute('aria-orientation', 'horizontal');
});

test('RCMenubar sets roving tabindex on triggers', async () => {
  const screen = render(html`
    <rc-menubar data-testid="menubar" label="Test Menu">
      <rc-menu-button>
        <button slot="trigger" data-testid="trigger-1">File</button>
        <rc-menu label="File">
          <button>New</button>
        </rc-menu>
      </rc-menu-button>
      <rc-menu-button>
        <button slot="trigger" data-testid="trigger-2">Edit</button>
        <rc-menu label="Edit">
          <button>Undo</button>
        </rc-menu>
      </rc-menu-button>
    </rc-menubar>
  `);

  const trigger1 = screen.getByTestId('trigger-1');
  const trigger2 = screen.getByTestId('trigger-2');

  // First trigger should have tabindex 0, others -1
  await expect.element(trigger1).toHaveAttribute('tabindex', '0');
  await expect.element(trigger2).toHaveAttribute('tabindex', '-1');
});

test('RCMenubar navigates with arrow keys', async () => {
  const screen = render(html`
    <rc-menubar data-testid="menubar" label="Test Menu">
      <rc-menu-button>
        <button slot="trigger" data-testid="trigger-1">File</button>
        <rc-menu label="File">
          <button>New</button>
        </rc-menu>
      </rc-menu-button>
      <rc-menu-button>
        <button slot="trigger" data-testid="trigger-2">Edit</button>
        <rc-menu label="Edit">
          <button>Undo</button>
        </rc-menu>
      </rc-menu-button>
      <rc-menu-button>
        <button slot="trigger" data-testid="trigger-3">View</button>
        <rc-menu label="View">
          <button>Zoom</button>
        </rc-menu>
      </rc-menu-button>
    </rc-menubar>
  `);

  const trigger1 = screen.getByTestId('trigger-1');
  const trigger2 = screen.getByTestId('trigger-2');
  const trigger3 = screen.getByTestId('trigger-3');

  // Focus first trigger
  await userEvent.click(document.body);
  await userEvent.tab({ shift: true });
  await expect.element(trigger1).toHaveFocus();

  // Arrow right to second
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(trigger2).toHaveFocus();
  await expect.element(trigger2).toHaveAttribute('tabindex', '0');
  await expect.element(trigger1).toHaveAttribute('tabindex', '-1');

  // Arrow right to third
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(trigger3).toHaveFocus();

  // Arrow right wraps to first
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(trigger1).toHaveFocus();

  // Arrow left wraps to last
  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(trigger3).toHaveFocus();
});

test('RCMenubar navigates with Home/End keys', async () => {
  const screen = render(html`
    <rc-menubar data-testid="menubar" label="Test Menu">
      <rc-menu-button>
        <button slot="trigger" data-testid="trigger-1">File</button>
        <rc-menu label="File">
          <button>New</button>
        </rc-menu>
      </rc-menu-button>
      <rc-menu-button>
        <button slot="trigger" data-testid="trigger-2">Edit</button>
        <rc-menu label="Edit">
          <button>Undo</button>
        </rc-menu>
      </rc-menu-button>
      <rc-menu-button>
        <button slot="trigger" data-testid="trigger-3">View</button>
        <rc-menu label="View">
          <button>Zoom</button>
        </rc-menu>
      </rc-menu-button>
    </rc-menubar>
  `);

  const trigger1 = screen.getByTestId('trigger-1');
  const trigger3 = screen.getByTestId('trigger-3');

  // Focus first trigger
  await userEvent.click(document.body);
  await userEvent.tab({ shift: true });
  await expect.element(trigger1).toHaveFocus();

  // End key goes to last
  await userEvent.keyboard('{End}');
  await expect.element(trigger3).toHaveFocus();

  // Home key goes to first
  await userEvent.keyboard('{Home}');
  await expect.element(trigger1).toHaveFocus();
});

test('RCMenubar opens menu with Down arrow', async () => {
  const screen = render(html`
    <rc-menubar data-testid="menubar" label="Test Menu">
      <rc-menu-button data-testid="menu-button-1">
        <button slot="trigger" data-testid="trigger-1">File</button>
        <rc-menu label="File">
          <button data-testid="item-1">New</button>
        </rc-menu>
      </rc-menu-button>
    </rc-menubar>
  `);

  const trigger1 = screen.getByTestId('trigger-1');
  const item1 = screen.getByTestId('item-1');

  // Focus trigger
  await userEvent.click(document.body);
  await userEvent.tab({ shift: true });
  await expect.element(trigger1).toHaveFocus();

  // Down arrow opens menu
  await userEvent.keyboard('{ArrowDown}');

  // First menu item should have focus
  await expect.element(item1).toHaveFocus();
  await expect.element(trigger1).toHaveAttribute('aria-expanded', 'true');
});

test('RCMenubar cascade behavior - arrow navigation opens adjacent menus', async () => {
  const screen = render(html`
    <rc-menubar data-testid="menubar" label="Test Menu">
      <rc-menu-button data-testid="menu-button-1">
        <button slot="trigger" data-testid="trigger-1">File</button>
        <rc-menu label="File">
          <button data-testid="item-1-1">New</button>
        </rc-menu>
      </rc-menu-button>
      <rc-menu-button data-testid="menu-button-2">
        <button slot="trigger" data-testid="trigger-2">Edit</button>
        <rc-menu label="Edit">
          <button data-testid="item-2-1">Undo</button>
        </rc-menu>
      </rc-menu-button>
    </rc-menubar>
  `);

  const trigger1 = screen.getByTestId('trigger-1');
  const trigger2 = screen.getByTestId('trigger-2');
  const item21 = screen.getByTestId('item-2-1');

  // Focus first trigger and open menu
  await userEvent.click(document.body);
  await userEvent.tab({ shift: true });
  await expect.element(trigger1).toHaveFocus();
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(trigger1).toHaveAttribute('aria-expanded', 'true');

  // Press Escape to close menu and return focus to trigger
  await userEvent.keyboard('{Escape}');
  await expect.element(trigger1).toHaveAttribute('aria-expanded', 'false');

  // Re-open menu and navigate to next
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(trigger1).toHaveAttribute('aria-expanded', 'true');

  // Arrow right should close first menu and open second
  await userEvent.keyboard('{ArrowRight}');

  // First menu should be closed, second should be open
  await expect.element(trigger1).toHaveAttribute('aria-expanded', 'false');
  await expect.element(trigger2).toHaveAttribute('aria-expanded', 'true');

  // Focus should be in the second menu
  await expect.element(item21).toHaveFocus();
});

test('RCMenubar closes menu on Escape', async () => {
  const screen = render(html`
    <rc-menubar data-testid="menubar" label="Test Menu">
      <rc-menu-button data-testid="menu-button-1">
        <button slot="trigger" data-testid="trigger-1">File</button>
        <rc-menu label="File">
          <button data-testid="item-1">New</button>
        </rc-menu>
      </rc-menu-button>
    </rc-menubar>
  `);

  const trigger1 = screen.getByTestId('trigger-1');

  // Focus trigger and open menu
  await userEvent.click(document.body);
  await userEvent.tab({ shift: true });
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(trigger1).toHaveAttribute('aria-expanded', 'true');

  // Close with Escape
  await userEvent.keyboard('{Escape}');
  await expect.element(trigger1).toHaveAttribute('aria-expanded', 'false');
});

test('RCMenubar fires toggle events', async () => {
  const toggleSpy = vi.fn();

  render(html`
    <rc-menubar
      data-testid="menubar"
      label="Test Menu"
      @rc-menu-button-toggle=${toggleSpy}
    >
      <rc-menu-button data-testid="menu-button-1">
        <button slot="trigger" data-testid="trigger-1">File</button>
        <rc-menu label="File">
          <button data-testid="item-1">New</button>
        </rc-menu>
      </rc-menu-button>
    </rc-menubar>
  `);

  // Focus and open menu
  await userEvent.click(document.body);
  await userEvent.tab({ shift: true });
  await userEvent.keyboard('{ArrowDown}');

  expect(toggleSpy).toHaveBeenCalledTimes(1);
  expect(toggleSpy.mock.calls[0][0].detail.open).toBe(true);

  // Close menu
  await userEvent.keyboard('{Escape}');

  expect(toggleSpy).toHaveBeenCalledTimes(2);
  expect(toggleSpy.mock.calls[1][0].detail.open).toBe(false);
});

test('RCMenubar vertical: opens menu with ArrowRight', async () => {
  const screen = render(html`
    <rc-menubar data-testid="menubar" label="Test Menu" orientation="vertical">
      <rc-menu-button data-testid="menu-button-1">
        <button slot="trigger" data-testid="trigger-1">File</button>
        <rc-menu label="File">
          <button data-testid="item-1">New</button>
        </rc-menu>
      </rc-menu-button>
    </rc-menubar>
  `);

  const trigger1 = screen.getByTestId('trigger-1');
  const item1 = screen.getByTestId('item-1');

  // Focus trigger
  await userEvent.click(document.body);
  await userEvent.tab({ shift: true });
  await expect.element(trigger1).toHaveFocus();

  // ArrowRight opens menu in vertical orientation
  await userEvent.keyboard('{ArrowRight}');

  await expect.element(trigger1).toHaveAttribute('aria-expanded', 'true');
  await expect.element(item1).toHaveFocus();
});

test('RCMenubar vertical: close menu and navigate to next with ArrowDown', async () => {
  const screen = render(html`
    <rc-menubar data-testid="menubar" label="Test Menu" orientation="vertical">
      <rc-menu-button data-testid="menu-button-1">
        <button slot="trigger" data-testid="trigger-1">File</button>
        <rc-menu label="File">
          <button data-testid="item-1-1">New</button>
        </rc-menu>
      </rc-menu-button>
      <rc-menu-button data-testid="menu-button-2">
        <button slot="trigger" data-testid="trigger-2">Edit</button>
        <rc-menu label="Edit">
          <button data-testid="item-2-1">Undo</button>
        </rc-menu>
      </rc-menu-button>
    </rc-menubar>
  `);

  const trigger1 = screen.getByTestId('trigger-1');
  const trigger2 = screen.getByTestId('trigger-2');
  const item21 = screen.getByTestId('item-2-1');

  // Focus first trigger and open menu with ArrowRight
  await userEvent.click(document.body);
  await userEvent.tab({ shift: true });
  await expect.element(trigger1).toHaveFocus();
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(trigger1).toHaveAttribute('aria-expanded', 'true');

  // Close menu with Escape, returning focus to trigger
  await userEvent.keyboard('{Escape}');
  await expect.element(trigger1).toHaveAttribute('aria-expanded', 'false');
  await expect.element(trigger1).toHaveFocus();

  // ArrowDown navigates to next trigger
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(trigger2).toHaveFocus();

  // ArrowRight opens the second menu
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(trigger2).toHaveAttribute('aria-expanded', 'true');
  await expect.element(item21).toHaveFocus();
});

test('RCMenubar vertical: menu-button inherits orientation from menubar', async () => {
  const screen = render(html`
    <rc-menubar data-testid="menubar" label="Test Menu" orientation="vertical">
      <rc-menu-button data-testid="menu-button-1">
        <button slot="trigger" data-testid="trigger-1">File</button>
        <rc-menu label="File">
          <button data-testid="item-1">New</button>
        </rc-menu>
      </rc-menu-button>
    </rc-menubar>
  `);

  const trigger1 = screen.getByTestId('trigger-1');

  // Focus trigger
  await userEvent.click(document.body);
  await userEvent.tab({ shift: true });
  await expect.element(trigger1).toHaveFocus();

  // ArrowDown should NOT open menu (it's the navigation key in vertical menubar)
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(trigger1).toHaveAttribute('aria-expanded', 'false');

  // ArrowRight should open menu (inherited vertical orientation from menubar)
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(trigger1).toHaveAttribute('aria-expanded', 'true');
});

test('RCMenubar vertical orientation uses Up/Down for navigation', async () => {
  const screen = render(html`
    <rc-menubar data-testid="menubar" label="Test Menu" orientation="vertical">
      <rc-menu-button>
        <button slot="trigger" data-testid="trigger-1">Option 1</button>
        <rc-menu label="Option 1">
          <button>Sub 1</button>
        </rc-menu>
      </rc-menu-button>
      <rc-menu-button>
        <button slot="trigger" data-testid="trigger-2">Option 2</button>
        <rc-menu label="Option 2">
          <button>Sub 2</button>
        </rc-menu>
      </rc-menu-button>
    </rc-menubar>
  `);

  const menubar = screen.getByTestId('menubar');
  const root = menubar.getByRole('menubar');
  const trigger1 = screen.getByTestId('trigger-1');
  const trigger2 = screen.getByTestId('trigger-2');

  await expect.element(root).toHaveAttribute('aria-orientation', 'vertical');

  // Focus first trigger
  await userEvent.click(document.body);
  await userEvent.tab({ shift: true });
  await expect.element(trigger1).toHaveFocus();

  // Down arrow navigates to next in vertical orientation
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(trigger2).toHaveFocus();

  // Up arrow navigates to previous
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(trigger1).toHaveFocus();
});
