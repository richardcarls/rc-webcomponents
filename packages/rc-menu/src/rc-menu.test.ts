import { expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-lit';

import { html } from 'lit';

import './define';
import type { RCMenu } from './rc-menu';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

test('RCMenu is an accessible menu', async () => {
  const screen = render(html`
    <rc-menu label="Test Menu" data-testid="host">
      <button data-testid="item-one">Cut</button>
      <span data-testid="span">Ignore Me</span>
      <button data-testid="item-two">Copy</button>
      <a href="#" data-testid="item-three">Paste</a>
      <button data-testid="item-four" disabled>Delete</button>
      <div role="button" tabindex="0" data-testid="item-five">Select All</div>
    </rc-menu>
  `);

  const host = screen.getByTestId('host');
  const item1 = screen.getByText('Cut');
  const item2 = screen.getByText('Copy');
  const item5 = screen.getByText('Select All');

  const menu = host.element() as RCMenu;
  await menu.updateComplete;

  // role="menu" and accessible name are on the host element
  const root = screen.getByRole('menu');
  await expect.element(root).toHaveAccessibleName('Test Menu');

  // Host is the focus container; tabindex="0" lets it receive keyboard focus
  await expect.element(root).toHaveAttribute('tabindex', '0');

  // Items have role="menuitem" and tabindex="-1" (no item receives roving focus)
  await expect.element(item1).toHaveAttribute('role', 'menuitem');
  await expect.element(item2).toHaveAttribute('role', 'menuitem');
  await expect.element(item1).toHaveAttribute('tabindex', '-1');
  await expect.element(item2).toHaveAttribute('tabindex', '-1');

  // Focus the menu host and move the virtual cursor to the first item
  menu.focusFirst();
  await expect.element(root).toHaveFocus();
  await expect.element(item1).toHaveAttribute('data-active');

  // ArrowDown moves the virtual cursor; DOM focus stays on the host
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(item2).toHaveAttribute('data-active');
  await expect.element(root).toHaveFocus();

  await userEvent.keyboard('{ArrowDown}');
  await expect.element(screen.getByText('Paste')).toHaveAttribute('data-active');

  await userEvent.keyboard('{ArrowDown}');
  await expect.element(item5).toHaveAttribute('data-active'); // skips disabled item4

  await userEvent.keyboard('{ArrowDown}');
  await expect.element(item1).toHaveAttribute('data-active'); // wraps to first

  // ArrowUp navigation
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(item5).toHaveAttribute('data-active'); // wraps to last

  await userEvent.keyboard('{ArrowUp}');
  await expect.element(screen.getByText('Paste')).toHaveAttribute('data-active');

  await userEvent.keyboard('{ArrowUp}');
  await expect.element(item2).toHaveAttribute('data-active');

  await userEvent.keyboard('{ArrowUp}');
  await expect.element(item1).toHaveAttribute('data-active');

  // Home and End keys
  await userEvent.keyboard('{End}');
  await expect.element(item5).toHaveAttribute('data-active');

  await userEvent.keyboard('{Home}');
  await expect.element(item1).toHaveAttribute('data-active');

  // Pointer click clears the keyboard cursor (no :focus-visible outline)
  await item2.click();
  await expect.element(root).not.toHaveStyle({ outline: 'auto' });
});

test('RCMenu injects flat light-DOM item styles and menu affordances', async () => {
  const screen = render(html`
    <rc-menu label="Edit" data-testid="host">
      <button type="button" data-testid="plain">Plain</button>
      <button type="button" role="menuitemcheckbox" aria-checked="true" data-testid="checked">
        Checked
      </button>
      <button type="button" role="menuitemradio" aria-checked="true" data-testid="radio">
        Radio
      </button>
      <button type="button" aria-haspopup="menu" data-testid="submenu">More</button>
      <button type="button" disabled data-testid="disabled">Unavailable</button>
      <hr />
    </rc-menu>
  `);

  const menu = screen.getByTestId('host').element() as RCMenu;
  await menu.updateComplete;

  const style = document.head.querySelector('style[data-rc-light-dom-base="rc-menu"]');
  const plain = screen.getByTestId('plain').element() as HTMLElement;
  const checked = screen.getByTestId('checked').element() as HTMLElement;
  const radio = screen.getByTestId('radio').element() as HTMLElement;
  const submenu = screen.getByTestId('submenu').element() as HTMLElement;
  const disabled = screen.getByTestId('disabled').element() as HTMLElement;
  const plainStyles = getComputedStyle(plain);
  const disabledStyles = getComputedStyle(disabled);

  expect(style).not.toBeNull();
  expect(style?.textContent).toContain('@layer rc-base');
  expect(plainStyles.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(plainStyles.borderBlockStartStyle).toBe('none');
  expect(plainStyles.appearance).toBe('none');
  expect(disabledStyles.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(disabledStyles.borderBlockStartStyle).toBe('none');
  expect(disabledStyles.appearance).toBe('none');
  expect(getComputedStyle(checked, '::before').content).not.toBe('none');
  expect(getComputedStyle(radio, '::before').content).not.toBe('none');
  expect(getComputedStyle(submenu, '::after').content).not.toBe('none');
});

test('RCMenu dispatches rc-menu-activate on Enter and Space', async () => {
  const activateSpy = vi.fn();

  const screen = render(html`
    <rc-menu label="Test Menu" data-testid="host" @rc-menu-activate=${activateSpy}>
      <button data-testid="item-one">Cut</button>
      <button data-testid="item-two">Copy</button>
    </rc-menu>
  `);

  const host = screen.getByTestId('host');
  const item1 = screen.getByText('Cut');
  const item2 = screen.getByText('Copy');
  const menu = host.element() as RCMenu;

  await menu.updateComplete;

  // Position virtual cursor on first item via programmatic focus
  menu.focusFirst();
  await expect.element(item1).toHaveAttribute('data-active');

  // Enter activates the active item
  await userEvent.keyboard('{Enter}');

  expect(activateSpy).toHaveBeenCalledTimes(1);
  expect(activateSpy.mock.calls[0][0].detail.item).toBe(item1.element());

  // Navigate to item2 and activate with Space
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(item2).toHaveAttribute('data-active');

  await userEvent.keyboard(' ');

  expect(activateSpy).toHaveBeenCalledTimes(2);
  expect(activateSpy.mock.calls[1][0].detail.item).toBe(item2.element());
});

test('RCMenu dispatches rc-menu-activate on pointer click', async () => {
  const activateSpy = vi.fn();

  const screen = render(html`
    <rc-menu label="Test Menu" data-testid="host" @rc-menu-activate=${activateSpy}>
      <button data-testid="item-one">Cut</button>
      <button data-testid="item-two">Copy</button>
    </rc-menu>
  `);

  const item1 = screen.getByText('Cut');

  await item1.click();

  expect(activateSpy).toHaveBeenCalledTimes(1);
  expect(activateSpy.mock.calls[0][0].detail.item).toBe(item1.element());
});

test('RCMenu toggles checkbox menu item checked state on activation', async () => {
  const activateSpy = vi.fn();

  const screen = render(html`
    <rc-menu label="View" data-testid="host" @rc-menu-activate=${activateSpy}>
      <button type="button" role="menuitemcheckbox" value="notes" data-testid="notes">
        Notes
      </button>
    </rc-menu>
  `);

  const menu = screen.getByTestId('host').element() as RCMenu;
  const notes = screen.getByTestId('notes').element() as HTMLElement;

  await menu.updateComplete;

  expect(notes.getAttribute('aria-checked')).toBe('false');
  expect(getComputedStyle(notes, '::before').content).toBe('""');

  await screen.getByTestId('notes').click();

  expect(notes.getAttribute('aria-checked')).toBe('true');
  expect(getComputedStyle(notes, '::before').content).toBe('"✓"');
  expect(activateSpy).toHaveBeenLastCalledWith(
    expect.objectContaining({
      detail: expect.objectContaining({
        checked: 'true',
        item: notes,
        value: 'notes',
      }),
    }),
  );

  await screen.getByTestId('notes').click();

  expect(notes.getAttribute('aria-checked')).toBe('false');
  expect(getComputedStyle(notes, '::before').content).toBe('""');
  expect(activateSpy).toHaveBeenLastCalledWith(
    expect.objectContaining({
      detail: expect.objectContaining({
        checked: 'false',
      }),
    }),
  );
});

test('RCMenu checks one radio menu item per group on activation', async () => {
  const activateSpy = vi.fn();

  const screen = render(html`
    <rc-menu label="Sort" data-testid="host" @rc-menu-activate=${activateSpy}>
      <div role="group" aria-label="Sort order">
        <button type="button" role="menuitemradio" aria-checked="true" value="recent" data-testid="recent">
          Recent
        </button>
        <button type="button" role="menuitemradio" aria-checked="false" value="name" data-testid="name">
          Name
        </button>
      </div>
      <div role="group" aria-label="Density">
        <button type="button" role="menuitemradio" aria-checked="true" value="comfortable" data-testid="comfortable">
          Comfortable
        </button>
      </div>
    </rc-menu>
  `);

  const menu = screen.getByTestId('host').element() as RCMenu;
  const recent = screen.getByTestId('recent').element() as HTMLElement;
  const name = screen.getByTestId('name').element() as HTMLElement;
  const comfortable = screen.getByTestId('comfortable').element() as HTMLElement;

  await menu.updateComplete;

  await screen.getByTestId('name').click();

  expect(recent.getAttribute('aria-checked')).toBe('false');
  expect(name.getAttribute('aria-checked')).toBe('true');
  expect(comfortable.getAttribute('aria-checked')).toBe('true');
  expect(getComputedStyle(recent, '::before').content).toBe('""');
  expect(getComputedStyle(name, '::before').content).toBe('"•"');
  expect(activateSpy).toHaveBeenLastCalledWith(
    expect.objectContaining({
      detail: expect.objectContaining({
        checked: 'true',
        item: name,
        value: 'name',
      }),
    }),
  );
});

test('RCMenu updates checkbox state when activated by keyboard', async () => {
  const screen = render(html`
    <rc-menu label="View" data-testid="host">
      <button type="button" role="menuitemcheckbox" aria-checked="false" data-testid="notes">
        Notes
      </button>
    </rc-menu>
  `);

  const menu = screen.getByTestId('host').element() as RCMenu;
  const notes = screen.getByTestId('notes').element() as HTMLElement;

  await menu.updateComplete;

  menu.focusFirst();
  await userEvent.keyboard(' ');

  expect(notes.getAttribute('aria-checked')).toBe('true');
  expect(getComputedStyle(notes, '::before').content).toBe('"✓"');
});

test('RCMenu dispatches rc-menu-close on Escape', async () => {
  const closeSpy = vi.fn();

  const screen = render(html`
    <rc-menu label="Test Menu" data-testid="host" @rc-menu-close=${closeSpy}>
      <button data-testid="item-one">Cut</button>
      <button data-testid="item-two">Copy</button>
    </rc-menu>
  `);

  const host = screen.getByTestId('host');
  const item1 = screen.getByText('Cut');
  const menu = host.element() as RCMenu;

  await menu.updateComplete;

  menu.focusFirst();
  await expect.element(item1).toHaveAttribute('data-active');

  await userEvent.keyboard('{Escape}');

  expect(closeSpy).toHaveBeenCalledTimes(1);
});

test('RCMenu exposes focus methods', async () => {
  const screen = render(html`
    <rc-menu label="Test Menu" data-testid="host">
      <button data-testid="item-one">Cut</button>
      <button data-testid="item-two">Copy</button>
      <button data-testid="item-three">Paste</button>
    </rc-menu>
  `);

  const host = screen.getByTestId('host');
  const item1 = screen.getByText('Cut');
  const item2 = screen.getByText('Copy');
  const item3 = screen.getByText('Paste');

  const menu = host.element() as RCMenu;
  await menu.updateComplete;

  menu.focusFirst();
  await expect.element(host).toHaveFocus();
  await expect.element(item1).toHaveAttribute('data-active');

  menu.focusLast();
  await expect.element(host).toHaveFocus();
  await expect.element(item3).toHaveAttribute('data-active');

  menu.focusItemAt(1);
  await expect.element(host).toHaveFocus();
  await expect.element(item2).toHaveAttribute('data-active');
});

test('RCMenu has no accessibility violations when active', async () => {
  const screen = render(html`
    <rc-menu label="Test Menu" data-testid="host">
      <button>Cut</button>
      <button>Copy</button>
    </rc-menu>
  `);

  const host = screen.getByTestId('host');
  const menu = host.element() as RCMenu;

  await menu.updateComplete;
  menu.focusFirst();

  await expectNoA11yViolations(host.element());
});
