import { test, expect } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './define';
import { userEvent } from 'vitest/browser';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

// TODO: see https://github.com/jakelazaroff/roving-tabindex/blob/main/roving-tabindex.js

test('RCToolbar is an accessible toolbar', async () => {
  const screen = render(
    html`
      <rc-toolbar data-testid="host">
        <button data-testid="item-one">One</button>
        <span data-testid="span">Ignore Me</span>
        <button data-testid="item-two">Two</button>
        <a href="#" data-testid="item-three">Three</a>
        <button data-testid="item-four" disabled>Four</button>
        <div role="button" tabindex="0" data-testid="item-five">Five</div>
      </rc-toolbar>
    `
  );

  const host = screen.getByTestId('host');
  const root = screen.getByRole('toolbar');
  const item1 = screen.getByText('One');
  const item2 = screen.getByText('Two');
  const item3 = screen.getByText('Three');
  // const _ignored = screen.getByText('Ignore Me');
  // const _disabled = screen.getByText('Four');
  const item5 = screen.getByText('Five');

  // Initial render
  await expect.element(host).toBeInTheDocument();
  await expect.element(root).toBeInstanceOf(HTMLDivElement);
  await expect.element(root).toHaveAccessibleName('Toolbar');
  await expect.element(root).toHaveAttribute('aria-orientation', 'horizontal');
  await expect
    .element(root)
    .toHaveAttribute('data-interaction-mode', 'keyboard');

  // Tab into component
  // TODO: Why Shift+Tab after focusing body?
  await userEvent.click(document.body);
  await userEvent.tab({ shift: true });

  await expect.element(item1).toHaveFocus();
  await expect.element(root).toHaveStyle({ outline: 'auto' }); // focus-within style on keyboard focus

  // Forward arrow navigation
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(item2).toHaveFocus(); // Skip non-focusable elements

  await userEvent.keyboard('{ArrowRight}');
  await expect.element(item3).toHaveFocus(); // Includes anchor links

  await userEvent.keyboard('{ArrowRight}');
  await expect.element(item5).toHaveFocus(); // Skip disabled elements

  await userEvent.keyboard('{ArrowRight}');
  await expect.element(item1).toHaveFocus(); // Wraps to beginning

  // Backward arrow navigation
  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(item5).toHaveFocus(); // Wrap to end

  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(item3).toHaveFocus();

  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(item2).toHaveFocus();

  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(item1).toHaveFocus();

  // Home and End keys
  await userEvent.keyboard('{End}');
  await expect.element(item5).toHaveFocus();

  await userEvent.keyboard('{Home}');
  await expect.element(item1).toHaveFocus();

  // Mouse interaction hides focus-within
  await item2.click();
  await expect.element(root).not.toHaveStyle({ outline: 'auto' });

  // Test Vertical navigation
  await host.element().setAttribute('orientation', 'vertical');
  await expect.element(root).toHaveAttribute('aria-orientation', 'vertical');
  await userEvent.keyboard('{Home}');
  await expect.element(item1).toHaveFocus();

  // Forward arrow navigation
  await userEvent.keyboard('{ArrowDown}');
  await expect.element(item2).toHaveFocus(); // Skip non-focusable elements

  await userEvent.keyboard('{ArrowDown}');
  await expect.element(item3).toHaveFocus(); // Includes anchor links

  await userEvent.keyboard('{ArrowDown}');
  await expect.element(item5).toHaveFocus(); // Skip disabled elements

  await userEvent.keyboard('{ArrowDown}');
  await expect.element(item1).toHaveFocus(); // Wraps to beginning

  // Backward arrow navigation
  await userEvent.keyboard('{ArrowUp}');
  await expect.element(item5).toHaveFocus(); // Wrap to end

  await userEvent.keyboard('{ArrowUp}');
  await expect.element(item3).toHaveFocus();

  await userEvent.keyboard('{ArrowUp}');
  await expect.element(item2).toHaveFocus();

  await userEvent.keyboard('{ArrowUp}');
  await expect.element(item1).toHaveFocus();

  // TODO: Test with bidi
});

test('RCToolbar has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-toolbar data-testid="host" label="Formatting">
      <button>Bold</button>
      <button>Italic</button>
      <button>Underline</button>
    </rc-toolbar>
  `);

  const host = await screen.getByTestId('host').element();

  await expectNoA11yViolations(host);
});
