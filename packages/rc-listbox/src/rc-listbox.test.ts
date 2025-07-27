import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './define';
import type { RCListbox } from './rc-listbox';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

const OPTIONS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
];

test('renders options from options property', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const el = (await screen.getByRole('listbox').element()) as RCListbox;
  el.options = OPTIONS;
  await el.updateComplete;

  const options = el.querySelectorAll('[role="option"]');
  expect(options).toHaveLength(3);
  expect(options[0].querySelector('[part="option-label"]')?.textContent).toBe('Apple');
  expect(options[1].querySelector('[part="option-label"]')?.textContent).toBe('Banana');
  expect(options[2].querySelector('[part="option-label"]')?.textContent).toBe('Cherry');
});

test('has role=listbox on host element', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  await expect.element(screen.getByRole('listbox')).toBeInTheDocument();
});

test('has no automated accessibility violations', async () => {
  const screen = render(html`<rc-listbox aria-label="Fruit"></rc-listbox>`);
  const el = (await screen.getByRole('listbox').element()) as RCListbox;
  el.options = OPTIONS;
  await el.updateComplete;

  await expectNoA11yViolations(el);
});

test('aria-selected reflects setSelectedValues', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const el = (await screen.getByRole('listbox').element()) as RCListbox;
  el.options = OPTIONS;
  el.setSelectedValues(['apple']);
  await el.updateComplete;

  const opts = el.querySelectorAll('[role="option"]');
  expect(opts[0].getAttribute('aria-selected')).toBe('true');
  expect(opts[1].getAttribute('aria-selected')).toBe('false');
});

test('toggleOption selects in single mode and fires rc-listbox-change', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const el = (await screen.getByRole('listbox').element()) as RCListbox;
  el.options = OPTIONS;
  await el.updateComplete;

  const handler = vi.fn();
  el.addEventListener('rc-listbox-change', handler);
  el.toggleOption('banana');
  await el.updateComplete;

  expect(el.selectedValues).toEqual(['banana']);
  expect(handler).toHaveBeenCalledOnce();
  expect(handler.mock.calls[0][0].detail).toEqual({ value: 'banana', selected: true });
});

test('toggleOption deselects in single mode', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const el = (await screen.getByRole('listbox').element()) as RCListbox;
  el.options = OPTIONS;
  el.setSelectedValues(['banana']);
  await el.updateComplete;

  el.toggleOption('banana');
  await el.updateComplete;
  expect(el.selectedValues).toEqual([]);
});

test('multiple mode: toggleOption toggles without clearing others', async () => {
  const screen = render(html`<rc-listbox multiple></rc-listbox>`);
  const el = (await screen.getByRole('listbox').element()) as RCListbox;
  el.options = OPTIONS;
  el.setSelectedValues(['apple']);
  await el.updateComplete;

  el.toggleOption('banana');
  await el.updateComplete;
  expect(el.selectedValues).toContain('apple');
  expect(el.selectedValues).toContain('banana');
});

test('multiple: aria-multiselectable="true" on host', async () => {
  const screen = render(html`<rc-listbox multiple></rc-listbox>`);
  const el = await screen.getByRole('listbox').element();
  await (el as RCListbox).updateComplete;
  expect(el.getAttribute('aria-multiselectable')).toBe('true');
});

test('filterOptions hides non-matching options', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const el = (await screen.getByRole('listbox').element()) as RCListbox;
  el.options = OPTIONS;
  el.filterOptions('ba');
  await el.updateComplete;

  const opts = el.querySelectorAll('[role="option"]');
  expect((opts[0] as HTMLElement).hidden).toBe(true);
  expect((opts[1] as HTMLElement).hidden).toBe(false);
});

test('clearFilter shows all options', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const el = (await screen.getByRole('listbox').element()) as RCListbox;
  el.options = OPTIONS;
  el.filterOptions('xy');
  await el.updateComplete;
  el.clearFilter();
  await el.updateComplete;

  const opts = el.querySelectorAll('[role="option"]');
  expect((opts[0] as HTMLElement).hidden).toBe(false);
  expect((opts[1] as HTMLElement).hidden).toBe(false);
});

test('navigableItems excludes hidden and disabled options', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const el = (await screen.getByRole('listbox').element()) as RCListbox;
  el.options = OPTIONS;
  el.filterOptions('ba'); // hides Apple, Cherry (disabled anyway)
  await el.updateComplete;

  const nav = el.navigableItems;
  expect(nav).toHaveLength(1);
  expect(nav[0].getAttribute('data-value')).toBe('banana');
});

test('disabled option: aria-disabled="true", excluded from navigableItems', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const el = (await screen.getByRole('listbox').element()) as RCListbox;
  el.options = OPTIONS;
  await el.updateComplete;

  const opts = el.querySelectorAll('[role="option"]');
  expect(opts[2].getAttribute('aria-disabled')).toBe('true');
  expect(el.navigableItems.map((e) => e.getAttribute('data-value'))).not.toContain('cherry');
});

test('appendOption adds new option to end of list', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const el = (await screen.getByRole('listbox').element()) as RCListbox;
  el.options = [{ value: 'a', label: 'A' }];
  await el.updateComplete;

  el.appendOption({ value: 'b', label: 'B' });
  await el.updateComplete;

  const opts = el.querySelectorAll('[role="option"]');
  expect(opts).toHaveLength(2);
  expect(opts[1].querySelector('[part="option-label"]')?.textContent).toBe('B');
});

test('setCreateOption shows Create option in navigableItems', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const el = (await screen.getByRole('listbox').element()) as RCListbox;
  el.options = [{ value: 'a', label: 'A' }];
  el.setCreateOption('NewThing');
  await el.updateComplete;

  const createOpt = el.querySelector('[data-value="__create__"]');
  expect(createOpt).not.toBeNull();
  expect(createOpt!.textContent).toContain('NewThing');
  expect(el.navigableItems).toContain(createOpt);
});

test('setCreateOption(null) hides Create option', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const el = (await screen.getByRole('listbox').element()) as RCListbox;
  el.options = [{ value: 'a', label: 'A' }];
  el.setCreateOption('NewThing');
  await el.updateComplete;
  el.setCreateOption(null);
  await el.updateComplete;

  expect(el.querySelector('[data-value="__create__"]')).toBeNull();
});

test('Create option fires rc-listbox-change with value __create__', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const el = (await screen.getByRole('listbox').element()) as RCListbox;
  el.options = [];
  el.setCreateOption('Foo');
  await el.updateComplete;

  const handler = vi.fn();
  el.addEventListener('rc-listbox-change', handler);

  const createEl = el.querySelector<HTMLElement>('[data-value="__create__"]')!;
  createEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));

  expect(handler).toHaveBeenCalledOnce();
  expect(handler.mock.calls[0][0].detail.value).toBe('__create__');
});
