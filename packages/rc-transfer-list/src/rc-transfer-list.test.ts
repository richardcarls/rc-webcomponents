import { html } from 'lit';
import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

import './define.js';

import type { RCTransferList } from './rc-transfer-list.js';

function shadow(host: RCTransferList): ShadowRoot {
  return host.renderRoot as ShadowRoot;
}

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

test('rc-transfer-list renders owned UI in shadow DOM', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host">
      <select multiple>
        <option value="a">Alpha</option>
      </select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;
  await host.updateComplete;

  expect(host.shadowRoot).toBe(host.renderRoot);
  expect(shadow(host).querySelector('[part="root"]')).toBeTruthy();
  expect(shadow(host).querySelector('rc-listbox')).toBeTruthy();
  expect(host.querySelector('rc-listbox')).toBeNull();
});

test('rc-transfer-list keeps the native select connected and hidden after upgrade', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host">
      <select multiple name="planets">
        <option value="a">Alpha</option>
      </select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;
  await host.updateComplete;

  const $select = host.querySelector('select') as HTMLSelectElement;

  expect($select.isConnected).toBe(true);
  expect($select.parentElement).toBe(host);
  expect($select.name).toBe('planets');
  expect($select.style.display).toBe('none');
  expect($select.getAttribute('aria-hidden')).toBe('true');
  expect($select.tabIndex).toBe(-1);
  expect(shadow(host).querySelector('slot')).toBeTruthy();
});

test('rc-transfer-list compact reflects and uses the compact action layout', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host" compact>
      <select multiple>
        <option value="a">Alpha</option>
      </select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;
  await host.updateComplete;

  const $actions = shadow(host).querySelector('#actions') as HTMLElement;

  expect(host.compact).toBe(true);
  expect(host.hasAttribute('compact')).toBe(true);
  expect($actions.getAttribute('orientation')).toBe('horizontal');
  expect(getComputedStyle($actions).transform).toBe('none');
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

  shadow(host).querySelector('rc-listbox')?.setSelectedValues(['factory']);
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

  shadow(host).querySelectorAll('rc-listbox')[1]?.setSelectedValues(['factory']);
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

  shadow(host).querySelectorAll('rc-listbox')[1]?.setSelectedValues(['mine']);
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

  const availablePanel = shadow(host).querySelector('[part~="available-panel"]');
  const selectedPanel = shadow(host).querySelector('[part~="selected-panel"]');

  expect(availablePanel?.hasAttribute('data-empty')).toBe(false);
  expect(selectedPanel?.hasAttribute('data-empty')).toBe(true);

  shadow(host).querySelector('rc-listbox')?.dispatchEvent(
    new CustomEvent('rc-listbox-change', {
      bubbles: true,
      composed: true,
      detail: { value: ['factory'] },
    }),
  );
  await host.updateComplete;

  expect(availablePanel?.hasAttribute('data-has-selection')).toBe(true);
});

test('rc-transfer-list visibly highlights selected listbox options by default', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host">
      <select multiple>
        <option value="factory">Factory</option>
      </select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;
  await host.updateComplete;

  shadow(host).querySelector('rc-listbox')?.setSelectedValues(['factory']);
  await host.updateComplete;

  const $option = shadow(host).querySelector('[role="option"][aria-selected="true"]') as HTMLElement;
  const style = getComputedStyle($option);

  expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(style.backgroundColor).not.toBe('transparent');
});

test('rc-transfer-list centers action buttons against listbox height', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host">
      <select multiple>
        <option value="factory">Factory</option>
        <option value="mine">Mine</option>
      </select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;
  await host.updateComplete;

  const $actions = shadow(host).querySelector('[part~="actions"]') as HTMLElement;
  const $listbox = shadow(host).querySelector('rc-listbox') as HTMLElement;

  const actionsRect = $actions.getBoundingClientRect();
  const listboxRect = $listbox.getBoundingClientRect();
  const actionsCenter = actionsRect.top + actionsRect.height / 2;
  const listboxCenter = listboxRect.top + listboxRect.height / 2;

  expect(actionsCenter).toBeCloseTo(listboxCenter, 0);
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

  shadow(host).querySelectorAll('rc-listbox')[1]?.dispatchEvent(
    new CustomEvent('rc-listbox-change', {
      bubbles: true,
      composed: true,
      detail: { value: ['mine'] },
    }),
  );
  await host.updateComplete;

  const root = shadow(host).querySelector('[part="root"]');
  const selectedPanel = shadow(host).querySelector('[part~="selected-panel"]');

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

  shadow(host).querySelector('rc-listbox')?.setSelectedValues(['a']);
  host.addSelected();

  const select = host.querySelector('select') as HTMLSelectElement;

  expect(select.options[0].selected).toBe(true);
  expect(host.selected.map((o) => o.value)).toEqual(['a']);
});

test('rc-transfer-list rebinds when the native select child is replaced', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host">
      <select multiple>
        <option value="a">Alpha</option>
      </select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;
  await host.updateComplete;

  const $nextSelect = document.createElement('select');
  $nextSelect.multiple = true;
  $nextSelect.add(new Option('Bravo', 'b', false, true));

  host.querySelector('select')?.replaceWith($nextSelect);

  await vi.waitFor(() => expect(host.selected.map((o) => o.value)).toEqual(['b']));
});

test('rc-transfer-list restores the native select when disconnected', async () => {
  const screen = render(html`
    <rc-transfer-list data-testid="host">
      <select multiple>
        <option value="a">Alpha</option>
      </select>
    </rc-transfer-list>
  `);
  const host = screen.getByTestId('host').element() as RCTransferList;
  await host.updateComplete;

  const $select = host.querySelector('select') as HTMLSelectElement;

  expect($select.style.display).toBe('none');
  expect($select.getAttribute('aria-hidden')).toBe('true');
  expect($select.tabIndex).toBe(-1);

  host.remove();

  expect($select.style.display).toBe('');
  expect($select.hasAttribute('aria-hidden')).toBe(false);
  expect($select.hasAttribute('tabindex')).toBe(false);
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

  const $listbox = shadow(host).querySelector('rc-listbox') as HTMLElement & {
    setSelectedValues(values: string[]): void;
  };
  $listbox.setSelectedValues(['x']);
  $listbox.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowRight', altKey: true, bubbles: true }),
  );
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
