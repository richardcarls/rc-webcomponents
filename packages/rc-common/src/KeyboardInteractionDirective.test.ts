import { test, expect } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { userEvent } from 'vitest/browser';

import { keyInteraction } from './KeyboardInteractionDirective';


// ─── Focus via keyboard (Tab-in) ─────────────────────────────────────────────

test('keyInteraction: Tab-in sets data-interaction-mode=keyboard', async () => {
  const screen = render(html`
    <div>
      <button>Before</button>
      <div data-testid="target" tabindex="0" ${keyInteraction()}></div>
    </div>
  `);

  // Focus the button first, then Tab to the div
  (await screen.getByRole('button').element()).focus();
  await userEvent.keyboard('{Tab}');

  await expect.element(screen.getByTestId('target')).toHaveAttribute('data-interaction-mode', 'keyboard');
});

// ─── Pointer focus removes attribute ─────────────────────────────────────────

test('keyInteraction: pointerdown removes data-interaction-mode', async () => {
  const screen = render(
    html`<div data-testid="el" tabindex="0" data-interaction-mode="keyboard" ${keyInteraction()}></div>`
  );
  const el = screen.getByTestId('el');
  const node = await el.element();

  node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, composed: true }));

  await expect.element(el).not.toHaveAttribute('data-interaction-mode');
});

// ─── Any keydown restores keyboard mode ──────────────────────────────────────

test('keyInteraction: any keydown after pointerdown restores keyboard mode', async () => {
  const screen = render(
    html`<div data-testid="el" tabindex="0" ${keyInteraction()}></div>`
  );
  const el = screen.getByTestId('el');
  const node = await el.element();

  // Click removes keyboard mode
  node.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, composed: true }));
  await expect.element(el).not.toHaveAttribute('data-interaction-mode');

  // Any subsequent keydown restores it
  node.focus();
  await userEvent.keyboard('{ArrowDown}');

  await expect.element(el).toHaveAttribute('data-interaction-mode', 'keyboard');
});

// ─── attributeTarget option ───────────────────────────────────────────────────

test('keyInteraction: attributeTarget directs attribute to a specified element', async () => {
  const target = document.createElement('div');
  document.body.appendChild(target);

  try {
    const screen = render(
      html`<div data-testid="inner" tabindex="0" ${keyInteraction({ attributeTarget: target })}></div>`
    );
    const inner = screen.getByTestId('inner');
    const node = await inner.element();

    // Dispatch focusin without preceding pointerdown → keyboard mode
    node.dispatchEvent(new FocusEvent('focusin', { bubbles: true, composed: true }));

    expect(target.getAttribute('data-interaction-mode')).toBe('keyboard');
    expect(node.hasAttribute('data-interaction-mode')).toBe(false);
  } finally {
    target.remove();
  }
});
