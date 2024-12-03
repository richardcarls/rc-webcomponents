import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './rc-menu';
import { userEvent } from 'vitest/browser';

test('RCMenu is an accessible menu', async () => {
  const screen = render(
    html`
      <rc-menu label="Test Menu" data-testid="host">
        <button data-testid="item-one">Cut</button>
        <span data-testid="span">Ignore Me</span>
        <button data-testid="item-two">Copy</button>
        <a href="#" data-testid="item-three">Paste</a>
        <button data-testid="item-four" disabled>Delete</button>
        <div role="button" tabindex="0" data-testid="item-five">Select All</div>
      </rc-menu>
    `,
  );

  const host = screen.getByTestId('host');
  const root = screen.getByRole('menu');
  const item1 = screen.getByText('Cut');
  const item2 = screen.getByText('Copy');
  const item3 = screen.getByText('Paste');
  const item5 = screen.getByText('Select All');

  // Initial render
  await expect.element(host).toBeInTheDocument();
  await expect.element(root).toBeInstanceOf(HTMLDivElement);
  await expect.element(root).toHaveAccessibleName('Test Menu');
  await expect.element(root).toHaveAttribute('tabindex', '-1');
  await expect
    .element(root)
    .toHaveAttribute('data-interaction-mode', 'keyboard');

  // Items should have menuitem role
  await expect.element(item1).toHaveAttribute('role', 'menuitem');
  await expect.element(item2).toHaveAttribute('role', 'menuitem');

  // First item should have tabindex 0, others -1
  await expect.element(item1).toHaveAttribute('tabindex', '0');
  await expect.element(item2).toHaveAttribute('tabindex', '-1');

  // Tab into the first item
  await userEvent.click(document.body);
  await userEvent.tab({ shift: true });

  await expect.element(item1).toHaveFocus();

  // Down arrow navigation (menu is vertical by default)
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(item2).toHaveFocus(); // Skip non-focusable elements

  await userEvent.keyboard('{ArrowDown}');
  await expect.element(item3).toHaveFocus(); // Includes anchor links

  await userEvent.keyboard('{ArrowDown}');
  await expect.element(item5).toHaveFocus(); // Skip disabled elements

  await userEvent.keyboard('{ArrowDown}');
  await expect.element(item1).toHaveFocus(); // Wraps to beginning

  // Up arrow navigation
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(item5).toHaveFocus(); // Wrap to end

  await userEvent.keyboard('{ArrowUp}');
  await expect.element(item3).toHaveFocus();

  await userEvent.keyboard('{ArrowUp}');
  await expect.element(item2).toHaveFocus();

  await userEvent.keyboard('{ArrowUp}');
  await expect.element(item1).toHaveFocus();

  // Home and End keys
  await userEvent.keyboard('{End}');
  await expect.element(item5).toHaveFocus();

  await userEvent.keyboard('{Home}');
  await expect.element(item1).toHaveFocus();

  // Mouse interaction hides focus-within outline
  await item2.click();
  await expect.element(root).not.toHaveStyle({ outline: 'auto' });
});

test('RCMenu dispatches rc-menu-activate on Enter', async () => {
  const activateSpy = vi.fn();

  const screen = render(
    html`
      <rc-menu
        label="Test Menu"
        data-testid="host"
        @rc-menu-activate=${activateSpy}
      >
        <button data-testid="item-one">Cut</button>
        <button data-testid="item-two">Copy</button>
      </rc-menu>
    `,
  );

  const item1 = screen.getByText('Cut');
  const item2 = screen.getByText('Copy');

  // Focus first item
  await item1.click();
  await expect.element(item1).toHaveFocus();

  // Press Enter
  await userEvent.keyboard('{Enter}');

  expect(activateSpy).toHaveBeenCalledTimes(1);
  expect(activateSpy.mock.calls[0][0].detail.item).toBe(
    await item1.element(),
  );

  // Navigate to next item and activate with Space
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(item2).toHaveFocus();

  await userEvent.keyboard(' ');

  expect(activateSpy).toHaveBeenCalledTimes(2);
  expect(activateSpy.mock.calls[1][0].detail.item).toBe(
    await item2.element(),
  );
});

test('RCMenu dispatches rc-menu-close on Escape', async () => {
  const closeSpy = vi.fn();

  const screen = render(
    html`
      <rc-menu label="Test Menu" data-testid="host" @rc-menu-close=${closeSpy}>
        <button data-testid="item-one">Cut</button>
        <button data-testid="item-two">Copy</button>
      </rc-menu>
    `,
  );

  const item1 = screen.getByText('Cut');

  // Focus first item
  await item1.click();
  await expect.element(item1).toHaveFocus();

  // Press Escape
  await userEvent.keyboard('{Escape}');

  expect(closeSpy).toHaveBeenCalledTimes(1);
});

test('RCMenu exposes focus methods', async () => {
  const screen = render(
    html`
      <rc-menu label="Test Menu" data-testid="host">
        <button data-testid="item-one">Cut</button>
        <button data-testid="item-two">Copy</button>
        <button data-testid="item-three">Paste</button>
      </rc-menu>
    `,
  );

  const host = screen.getByTestId('host');
  const item1 = screen.getByText('Cut');
  const item2 = screen.getByText('Copy');
  const item3 = screen.getByText('Paste');

  const menu = await host.element() as any;

  // Wait for component to be ready
  await menu.updateComplete;

  // focusFirst
  menu.focusFirst();
  await expect.element(item1).toHaveFocus();

  // focusLast
  menu.focusLast();
  await expect.element(item3).toHaveFocus();

  // focusItemAt
  menu.focusItemAt(1);
  await expect.element(item2).toHaveFocus();
});
