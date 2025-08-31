import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

import './define.js';
import type { RCTransferList } from './rc-transfer-list.js';

test('rc-transfer-list adds selected available options', async () => {
  const changeSpy = vi.fn();
  const screen = render(html`<rc-transfer-list data-testid="host" @rc-transfer-list-change=${changeSpy}></rc-transfer-list>`);
  const host = screen.getByTestId('host').element() as RCTransferList;

  host.available = [{ value: 'factory', label: 'Factory' }];
  await host.updateComplete;

  host.querySelector('rc-listbox')?.setSelectedValues(['factory']);
  host.addSelected();

  expect(host.selected.map((option) => option.label)).toEqual(['Factory']);
  expect(changeSpy).toHaveBeenCalledOnce();
});

test('rc-transfer-list removes selected options', async () => {
  const screen = render(html`<rc-transfer-list data-testid="host"></rc-transfer-list>`);
  const host = screen.getByTestId('host').element() as RCTransferList;

  host.selected = [{ value: 'factory-1', label: 'Factory' }];
  await host.updateComplete;

  host.querySelectorAll('rc-listbox')[1]?.setSelectedValues(['factory-1']);
  host.removeSelected();

  expect(host.selected).toEqual([]);
});

test('rc-transfer-list moves selected options', async () => {
  const screen = render(html`<rc-transfer-list data-testid="host"></rc-transfer-list>`);
  const host = screen.getByTestId('host').element() as RCTransferList;

  host.selected = [
    { value: 'factory-1', label: 'Factory' },
    { value: 'mine-1', label: 'Mine' },
  ];
  await host.updateComplete;

  host.querySelectorAll('rc-listbox')[1]?.setSelectedValues(['mine-1']);
  host.moveSelected(-1);

  expect(host.selected.map((option) => option.label)).toEqual(['Mine', 'Factory']);
});

test('rc-transfer-list has no automated accessibility violations', async () => {
  const screen = render(html`<rc-transfer-list data-testid="host"></rc-transfer-list>`);
  await expectNoA11yViolations(screen.getByTestId('host').element());
});
