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
  await vi.waitFor(() => expect(changeSpy).toHaveBeenCalledOnce());
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

test('rc-transfer-list reflects empty and selection states', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host">
      <select multiple>
        <option value="factory">Factory</option>
      </select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;
  await host.updateComplete;

  const availablePanel = host.querySelector('[part~="available-panel"]');
  const selectedPanel = host.querySelector('[part~="selected-panel"]');
  expect(availablePanel?.hasAttribute('data-empty')).toBe(false);
  expect(selectedPanel?.hasAttribute('data-empty')).toBe(true);

  host.querySelector('rc-listbox')?.dispatchEvent(new CustomEvent('rc-listbox-change', {
    bubbles: true,
    composed: true,
    detail: { value: ['factory'] },
  }));
  await host.updateComplete;

  expect(availablePanel?.hasAttribute('data-has-selection')).toBe(true);
});

test('rc-transfer-list reflects reorder capability states', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host">
      <select multiple></select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;

  host.selected = [
    { value: 'factory', label: 'Factory' },
    { value: 'mine', label: 'Mine' },
    { value: 'terraforming', label: 'Terraforming' },
  ];
  await host.updateComplete;

  host.querySelectorAll('rc-listbox')[1]?.dispatchEvent(new CustomEvent('rc-listbox-change', {
    bubbles: true,
    composed: true,
    detail: { value: ['mine'] },
  }));
  await host.updateComplete;

  const root = host.querySelector('[part="root"]');
  const selectedPanel = host.querySelector('[part~="selected-panel"]');
  expect(root?.hasAttribute('data-can-move-up')).toBe(true);
  expect(root?.hasAttribute('data-can-move-down')).toBe(true);
  expect(selectedPanel?.hasAttribute('data-has-selection')).toBe(true);
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

test('rc-transfer-list defaultSelected populates right panel before user interaction', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host">
      <select multiple>
        <option value="a">Alpha</option>
        <option value="b">Bravo</option>
        <option value="c">Charlie</option>
      </select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;
  host.defaultSelected = [{ value: 'b', label: 'Bravo' }];
  await host.updateComplete;

  expect(host.selected.map((o) => o.value)).toEqual(['b']);
  expect(host.available.map((o) => o.value)).toContain('a');
  expect(host.available.map((o) => o.value)).toContain('c');
});

test('rc-transfer-list explicit selected setter overrides defaultSelected', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host">
      <select multiple>
        <option value="a">Alpha</option>
        <option value="b">Bravo</option>
      </select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;
  host.defaultSelected = [{ value: 'a', label: 'Alpha' }];
  host.selected = [{ value: 'b', label: 'Bravo' }];
  await host.updateComplete;

  expect(host.selected.map((o) => o.value)).toEqual(['b']);
});

test('rc-transfer-list defaultSelected does not fire rc-transfer-list-change', async () => {
  const changeSpy = vi.fn();
  const screen = render(html`
    <rc-transfer-list data-testid="host" @rc-transfer-list-change=${changeSpy}>
      <select multiple>
        <option value="a">Alpha</option>
      </select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;
  host.defaultSelected = [{ value: 'a', label: 'Alpha' }];
  await host.updateComplete;

  expect(changeSpy).not.toHaveBeenCalled();
});

test('rc-transfer-list defaultSelected set before connect is applied on connect', async () => {
  const el = document.createElement('rc-transfer-list') as RCTransferList;
  el.defaultSelected = [{ value: 'x', label: 'X' }];

  const sel = document.createElement('select');
  sel.setAttribute('multiple', '');
  const opt = document.createElement('option');
  opt.value = 'x';
  opt.text = 'X';
  sel.add(opt);
  el.appendChild(sel);

  document.body.appendChild(el);
  await el.updateComplete;

  expect(el.selected.map((o) => o.value)).toEqual(['x']);
  document.body.removeChild(el);
});
