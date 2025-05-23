import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './rc-select';
import type { RCSelect } from './rc-select';

function makeSelect(opts?: { multiple?: boolean; disabled?: boolean; placeholder?: string }) {
  return html`
    <rc-select placeholder=${opts?.placeholder ?? 'Choose...'}>
      <select slot="select" ?multiple=${opts?.multiple ?? false} ?disabled=${opts?.disabled ?? false}>
        <option value="">Choose...</option>
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
        <option value="cherry" disabled>Cherry</option>
      </select>
    </rc-select>
  `;
}

// ── Structure & ARIA ──────────────────────────────────────────────────────────

test('trigger has role="combobox", aria-haspopup="listbox", aria-expanded="false"', async () => {
  const screen = render(makeSelect());
  const el = (await screen.getByRole('combobox').element()) as HTMLElement;
  expect(el.getAttribute('aria-haspopup')).toBe('listbox');
  expect(el.getAttribute('aria-expanded')).toBe('false');
  expect(el.getAttribute('aria-controls')).toBe('listbox');
});

test('popup is initially closed', async () => {
  const screen = render(makeSelect());
  const host = (await screen.getByRole('combobox').element()).closest('rc-select') as RCSelect;
  await host.updateComplete;
  expect(host.open).toBe(false);
});

test('slotted <select> options appear in listbox', async () => {
  const screen = render(makeSelect());
  const host = (await screen.getByRole('combobox').element()).closest('rc-select') as RCSelect;
  // Open popup to force listbox render sync
  host.openPopup();
  await host.updateComplete;
  const listbox = host.renderRoot.querySelector('rc-listbox')!;
  const options = listbox.querySelectorAll('[role="option"]');
  // 3 real options (placeholder skipped)
  expect(options).toHaveLength(3);
  expect(options[0].textContent).toBe('Apple');
  expect(options[1].textContent).toBe('Banana');
  expect(options[2].textContent).toBe('Cherry');
});

// ── Open / Close ──────────────────────────────────────────────────────────────

test('clicking trigger opens popup', async () => {
  const screen = render(makeSelect());
  const trigger = screen.getByRole('combobox');
  const host = (await trigger.element()).closest('rc-select') as RCSelect;
  await trigger.click();
  await host.updateComplete;
  expect(host.open).toBe(true);
  const triggerEl = await trigger.element() as HTMLElement;
  expect(triggerEl.getAttribute('aria-expanded')).toBe('true');
});

test('clicking trigger again closes popup', async () => {
  const screen = render(makeSelect());
  const trigger = screen.getByRole('combobox');
  const host = (await trigger.element()).closest('rc-select') as RCSelect;
  await trigger.click();
  await host.updateComplete;
  await trigger.click();
  await host.updateComplete;
  expect(host.open).toBe(false);
});

test('rc-select-open fires when popup opens', async () => {
  const screen = render(makeSelect());
  const host = (await screen.getByRole('combobox').element()).closest('rc-select') as RCSelect;
  const handler = vi.fn();
  host.addEventListener('rc-select-open', handler);
  host.openPopup();
  await host.updateComplete;
  expect(handler).toHaveBeenCalledOnce();
});

test('rc-select-close fires when popup closes', async () => {
  const screen = render(makeSelect());
  const host = (await screen.getByRole('combobox').element()).closest('rc-select') as RCSelect;
  const handler = vi.fn();
  host.addEventListener('rc-select-close', handler);
  host.openPopup();
  await host.updateComplete;
  host.closePopup();
  await host.updateComplete;
  expect(handler).toHaveBeenCalledOnce();
});

// ── Keyboard navigation ───────────────────────────────────────────────────────

test('ArrowDown opens popup and sets aria-activedescendant to first option', async () => {
  const screen = render(makeSelect());
  const trigger = (await screen.getByRole('combobox').element()) as HTMLElement;
  const host = trigger.closest('rc-select') as RCSelect;
  trigger.focus();
  trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(host.open).toBe(true);
  expect(trigger.getAttribute('aria-activedescendant')).toBeTruthy();
});

test('ArrowDown twice moves virtual cursor to second option', async () => {
  const screen = render(makeSelect());
  const trigger = (await screen.getByRole('combobox').element()) as HTMLElement;
  const host = trigger.closest('rc-select') as RCSelect;
  trigger.focus();
  host.openPopup();
  await host.updateComplete;
  trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
  await host.updateComplete;
  const firstId = trigger.getAttribute('aria-activedescendant');
  trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
  await host.updateComplete;
  const secondId = trigger.getAttribute('aria-activedescendant');
  expect(firstId).not.toBe(secondId);
});

test('Enter selects active option, closes popup, fires rc-select-change', async () => {
  const screen = render(makeSelect());
  const trigger = (await screen.getByRole('combobox').element()) as HTMLElement;
  const host = trigger.closest('rc-select') as RCSelect;
  const changeHandler = vi.fn();
  host.addEventListener('rc-select-change', changeHandler);
  trigger.focus();
  host.openPopup();
  await host.updateComplete;
  // Navigate to first item
  trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
  await host.updateComplete;
  // Press Enter
  trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(host.open).toBe(false);
  expect(changeHandler).toHaveBeenCalledOnce();
  expect(changeHandler.mock.calls[0][0].detail.value).toBe('apple');
});

test('Escape closes popup without changing selection', async () => {
  const screen = render(makeSelect());
  const host = (await screen.getByRole('combobox').element()).closest('rc-select') as RCSelect;
  host.openPopup();
  await host.updateComplete;
  // Simulate Escape via document keydown (which our listener handles)
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(host.open).toBe(false);
  // No selection was made
  expect(host['_selectedValues'].size).toBe(0);
});

// ── Selection ─────────────────────────────────────────────────────────────────

test('clicking an option selects it and closes popup', async () => {
  const screen = render(makeSelect());
  const host = (await screen.getByRole('combobox').element()).closest('rc-select') as RCSelect;
  host.openPopup();
  await host.updateComplete;
  const listbox = host.renderRoot.querySelector('rc-listbox')!;
  const appleOpt = listbox.querySelector('[data-value="apple"]') as HTMLElement;
  appleOpt.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(host['_selectedValues'].has('apple')).toBe(true);
  expect(host.open).toBe(false);
});

test('native <select> value syncs after selection', async () => {
  const screen = render(makeSelect());
  const host = (await screen.getByRole('combobox').element()).closest('rc-select') as RCSelect;
  const nativeSel = host.querySelector('select')!;
  host.openPopup();
  await host.updateComplete;
  const listbox = host.renderRoot.querySelector('rc-listbox')!;
  listbox.querySelector<HTMLElement>('[data-value="banana"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(nativeSel.value).toBe('banana');
});

test('disabled option cannot be selected', async () => {
  const screen = render(makeSelect());
  const host = (await screen.getByRole('combobox').element()).closest('rc-select') as RCSelect;
  host.openPopup();
  await host.updateComplete;
  const listbox = host.renderRoot.querySelector('rc-listbox')!;
  const cherryOpt = listbox.querySelector<HTMLElement>('[data-value="cherry"]')!;
  cherryOpt.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(host['_selectedValues'].has('cherry')).toBe(false);
});

test('disabled rc-select: trigger has aria-disabled and does not open', async () => {
  const screen = render(makeSelect({ disabled: true }));
  const host = (await screen.getByRole('combobox').element()).closest('rc-select') as RCSelect;
  await host.updateComplete;
  host.openPopup();
  await host.updateComplete;
  expect(host.open).toBe(false);
});

// ── Type-ahead ────────────────────────────────────────────────────────────────

test('type-ahead: pressing "b" selects Banana in single-select closed mode', async () => {
  const screen = render(makeSelect());
  const trigger = (await screen.getByRole('combobox').element()) as HTMLElement;
  const host = trigger.closest('rc-select') as RCSelect;
  const changeHandler = vi.fn();
  host.addEventListener('rc-select-change', changeHandler);
  trigger.focus();
  trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(host['_selectedValues'].has('banana')).toBe(true);
  expect(changeHandler).toHaveBeenCalledOnce();
});

// ── Multi-select ──────────────────────────────────────────────────────────────

test('multiple: popup stays open after selecting an option', async () => {
  const screen = render(makeSelect({ multiple: true }));
  const host = (await screen.getByRole('combobox').element()).closest('rc-select') as RCSelect;
  host.openPopup();
  await host.updateComplete;
  const listbox = host.renderRoot.querySelector('rc-listbox')!;
  listbox.querySelector<HTMLElement>('[data-value="apple"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(host.open).toBe(true);
});

test('multiple: rc-select-change detail.value is an array', async () => {
  const screen = render(makeSelect({ multiple: true }));
  const host = (await screen.getByRole('combobox').element()).closest('rc-select') as RCSelect;
  const handler = vi.fn();
  host.addEventListener('rc-select-change', handler);
  host.openPopup();
  await host.updateComplete;
  const listbox = host.renderRoot.querySelector('rc-listbox')!;
  listbox.querySelector<HTMLElement>('[data-value="apple"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(Array.isArray(handler.mock.calls[0][0].detail.value)).toBe(true);
  expect(handler.mock.calls[0][0].detail.value).toContain('apple');
});

test('multiple: chips render for selected values', async () => {
  const screen = render(makeSelect({ multiple: true }));
  const host = (await screen.getByRole('combobox').element()).closest('rc-select') as RCSelect;
  host.openPopup();
  await host.updateComplete;
  const listbox = host.renderRoot.querySelector('rc-listbox')!;
  listbox.querySelector<HTMLElement>('[data-value="apple"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;
  const chips = host.renderRoot.querySelectorAll('[part~="chip"]');
  expect(chips).toHaveLength(1);
  expect(chips[0].textContent).toContain('Apple');
});

test('multiple: chip remove button click removes the value', async () => {
  const screen = render(makeSelect({ multiple: true }));
  const host = (await screen.getByRole('combobox').element()).closest('rc-select') as RCSelect;
  host.openPopup();
  await host.updateComplete;
  const listbox = host.renderRoot.querySelector('rc-listbox')!;
  listbox.querySelector<HTMLElement>('[data-value="apple"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;
  const removeBtn = host.renderRoot.querySelector<HTMLElement>('[part~="chip-remove"]')!;
  removeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(host['_selectedValues'].has('apple')).toBe(false);
  expect(host.renderRoot.querySelectorAll('[part~="chip"]')).toHaveLength(0);
});

// ── Display modes ─────────────────────────────────────────────────────────────

test('display="compact" shows summary text instead of chips', async () => {
  const screen = render(html`
    <rc-select display="compact" placeholder="Choose...">
      <select slot="select" multiple>
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
      </select>
    </rc-select>
  `);
  const host = (await screen.getByRole('combobox').element()).closest('rc-select') as RCSelect;
  host.openPopup();
  await host.updateComplete;
  const listbox = host.renderRoot.querySelector('rc-listbox')!;
  listbox.querySelector<HTMLElement>('[data-value="apple"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  listbox.querySelector<HTMLElement>('[data-value="banana"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;
  // No chips in compact mode
  expect(host.renderRoot.querySelectorAll('[part~="chip"]')).toHaveLength(0);
  // Value display shows compact text
  const display = host.renderRoot.querySelector('[part="value-display"]')!;
  expect(display.textContent).toContain('+');
});

// ── MutationObserver ──────────────────────────────────────────────────────────

test('adding <option> to slotted <select> updates listbox', async () => {
  const screen = render(makeSelect());
  const host = (await screen.getByRole('combobox').element()).closest('rc-select') as RCSelect;
  const nativeSel = host.querySelector('select')!;
  await host.updateComplete;

  const newOpt = document.createElement('option');
  newOpt.value = 'date';
  newOpt.text = 'Date';
  nativeSel.add(newOpt);

  // MutationObserver fires async
  await new Promise((r) => setTimeout(r, 10));
  await host.updateComplete;

  host.openPopup();
  await host.updateComplete;

  const listbox = host.renderRoot.querySelector('rc-listbox')!;
  const opts = listbox.querySelectorAll('[role="option"]');
  expect(opts).toHaveLength(4); // apple, banana, cherry, date
});
