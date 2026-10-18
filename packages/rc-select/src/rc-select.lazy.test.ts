import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './define.js';
import type { RCSelect } from './rc-select.js';

// Kept in its own file so the custom element registry starts without
// rc-dialog or rc-chip-group, which other select tests register.

test('a popover single select registers neither the dialog nor the chips', async () => {
  const screen = render(html`
    <rc-select data-testid="host">
      <select aria-label="Fruit">
        <option value="apple">Apple</option>
        <option value="pear">Pear</option>
      </select>
    </rc-select>
  `);
  const host = (await screen.getByTestId('host').element()) as RCSelect;

  await host.updateComplete;
  host.openPopup();
  await host.updateComplete;

  expect(customElements.get('rc-dialog')).toBeUndefined();
  expect(customElements.get('rc-chip-group')).toBeUndefined();

  host.closePopup();
});

test('multiple and dialog popup mode register their elements on first use', async () => {
  const screen = render(html`
    <rc-select data-testid="host" multiple popup-mode="dialog">
      <select aria-label="Fruit" multiple>
        <option value="apple" selected>Apple</option>
        <option value="pear">Pear</option>
      </select>
    </rc-select>
  `);
  const host = (await screen.getByTestId('host').element()) as RCSelect;

  await host.updateComplete;

  await vi.waitFor(() => {
    expect(customElements.get('rc-chip-group')).toBeDefined();
    expect(customElements.get('rc-dialog')).toBeDefined();
  });

  host.openPopup();

  await vi.waitFor(() => {
    expect(host.shadowRoot?.querySelector('dialog')?.open).toBe(true);
  });

  host.closePopup();
});
