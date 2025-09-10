import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

import './define.js';
import type { RCTransferList } from './rc-transfer-list.js';

test('rc-transfer-list populates panels from select[multiple] option state', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host">
      <select multiple>
        <option value="a">Alpha</option>
        <option value="b" selected>Bravo</option>
        <option value="c">Charlie</option>
      </select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;
  await host.updateComplete;

  expect(host.available.map((o) => o.value)).toEqual(['a', 'c']);
  expect(host.selected.map((o) => o.value)).toEqual(['b']);
});

test('rc-transfer-list adds highlighted available options', async () => {
  const changeSpy = vi.fn();
  const screen = render(html`
    <rc-transfer-list data-testid="host" @rc-transfer-list-change=${changeSpy}>
      <select multiple></select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;

  host.available = [{ value: 'factory', label: 'Factory' }];
  await host.updateComplete;

  host.querySelector('rc-listbox')?.setSelectedValues(['factory']);
  host.addSelected();

  expect(host.selected.map((o) => o.label)).toEqual(['Factory']);
  expect(changeSpy).toHaveBeenCalledOnce();
});

test('rc-transfer-list removes highlighted selected options', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host">
      <select multiple></select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;

  host.selected = [{ value: 'factory', label: 'Factory' }];
  await host.updateComplete;

  host.querySelectorAll('rc-listbox')[1]?.setSelectedValues(['factory']);
  host.removeSelected();

  expect(host.selected).toEqual([]);
});

test('rc-transfer-list moves highlighted selected options', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host">
      <select multiple></select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;

  host.selected = [
    { value: 'factory', label: 'Factory' },
    { value: 'mine', label: 'Mine' },
  ];
  await host.updateComplete;

  host.querySelectorAll('rc-listbox')[1]?.setSelectedValues(['mine']);
  host.moveSelected(-1);

  expect(host.selected.map((o) => o.label)).toEqual(['Mine', 'Factory']);
});

test('rc-transfer-list addSelected syncs selection back to select[multiple]', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host">
      <select multiple>
        <option value="a">Alpha</option>
        <option value="b">Bravo</option>
      </select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;
  await host.updateComplete;

  host.querySelector('rc-listbox')?.setSelectedValues(['a']);
  host.addSelected();

  const select = host.querySelector('select') as HTMLSelectElement;
  expect(select.options[0].selected).toBe(true);
  expect(host.selected.map((o) => o.value)).toEqual(['a']);
});

test('rc-transfer-list Alt+ArrowRight transfers highlighted item', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host">
      <select multiple>
        <option value="x">Xavier</option>
      </select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;
  await host.updateComplete;

  host.querySelector('rc-listbox')?.setSelectedValues(['x']);
  host.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true }));
  await host.updateComplete;

  expect(host.selected.map((o) => o.value)).toEqual(['x']);
  const select = host.querySelector('select') as HTMLSelectElement;
  expect(select.options[0].selected).toBe(true);
});

test('rc-transfer-list has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host">
      <select multiple></select>
    </rc-transfer-list>
  `);
  await expectNoA11yViolations(screen.getByTestId('host').element());
});
