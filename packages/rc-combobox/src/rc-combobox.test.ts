import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './define';
import type { RCCombobox } from './rc-combobox';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

function makeCombobox(opts?: {
  multiple?: boolean;
  allowCreate?: boolean;
  placeholder?: string;
}) {
  return html`
    <rc-combobox
      ?multiple=${opts?.multiple ?? false}
      ?allowcreate=${opts?.allowCreate ?? false}
      placeholder=${opts?.placeholder ?? 'Search...'}
    >
      <select
        slot="select"
        aria-label="Fruit"
        ?multiple=${opts?.multiple ?? false}
      >
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
        <option value="cherry" disabled>Cherry</option>
      </select>
    </rc-combobox>
  `;
}

// getByRole('combobox') times out in Firefox when rc-listbox[popover="manual"] is
// a sibling in the same shadow root — access the shadow DOM directly instead.
async function getHost(screen: ReturnType<typeof render>): Promise<RCCombobox> {
  const host = screen.container.querySelector('rc-combobox') as RCCombobox;
  await host.updateComplete;
  // Flush the queueMicrotask inside _handleSelectSlotChange so options are
  // populated before any test interaction begins.
  await new Promise((r) => setTimeout(r, 0));
  return host;
}

// ── Structure & ARIA ──────────────────────────────────────────────────────────

test('input has role="combobox", aria-haspopup="listbox", aria-autocomplete="list"', async () => {
  const screen = render(makeCombobox());
  const host = await getHost(screen);
  const input = host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;
  expect(input.tagName).toBe('INPUT');
  expect(input.getAttribute('role')).toBe('combobox');
  expect(input.getAttribute('aria-haspopup')).toBe('listbox');
  expect(input.getAttribute('aria-autocomplete')).toBe('list');
  expect(input.getAttribute('aria-controls')).toBe('listbox');
  expect(input.getAttribute('aria-expanded')).toBe('false');
});

test('rc-combobox has no automated accessibility violations', async () => {
  const screen = render(makeCombobox());
  const host = await getHost(screen);

  await expectNoA11yViolations(host);
});

test('options appear in listbox from slotted <select>', async () => {
  const screen = render(makeCombobox());
  const host = await getHost(screen);
  host.openPopup();
  await host.updateComplete;
  const listbox = host.renderRoot.querySelector('rc-listbox')!;
  const opts = listbox.querySelectorAll('[role="option"]');
  expect(opts).toHaveLength(3);
});

// ── Filtering ─────────────────────────────────────────────────────────────────

test('typing filters listbox options', async () => {
  const screen = render(makeCombobox());
  const host = await getHost(screen);
  const input = host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;
  input.value = 'ban';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await host.updateComplete;

  const listbox = host.renderRoot.querySelector('rc-listbox')!;
  const apple = listbox.querySelector<HTMLElement>('[data-value="apple"]')!;
  const banana = listbox.querySelector<HTMLElement>('[data-value="banana"]')!;
  expect(apple.hidden).toBe(true);
  expect(banana.hidden).toBe(false);
});

test('typing opens popup', async () => {
  const screen = render(makeCombobox());
  const host = await getHost(screen);
  const input = host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;
  input.value = 'a';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await host.updateComplete;
  expect(host.open).toBe(true);
});

// ── Keyboard navigation ───────────────────────────────────────────────────────

test('ArrowDown opens popup and navigates to first option', async () => {
  const screen = render(makeCombobox());
  const host = await getHost(screen);
  const input = host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;
  input.focus();
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(host.open).toBe(true);
  expect(input.getAttribute('aria-activedescendant')).toBeTruthy();
});

test('Enter selects active option, closes popup, sets input value', async () => {
  const screen = render(makeCombobox());
  const host = await getHost(screen);
  const input = host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;
  const changeHandler = vi.fn();
  host.addEventListener('rc-select-change', changeHandler);
  input.focus(); // open popup via real focus so hidePopover() restores focus correctly
  await host.updateComplete;
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
  await host.updateComplete;
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(changeHandler).toHaveBeenCalledOnce();
  expect(host.open).toBe(false);
  expect(input.value).toBe('Apple');
});

test('Escape clears filter and closes popup', async () => {
  const screen = render(makeCombobox());
  const host = await getHost(screen);
  const input = host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;
  input.value = 'ban';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await host.updateComplete;
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(host.open).toBe(false);
  expect(input.value).toBe('');
});

// ── Allow-create ──────────────────────────────────────────────────────────────

test('allowcreate: "Create X" appears for unmatched input', async () => {
  const screen = render(makeCombobox({ allowCreate: true }));
  const host = await getHost(screen);
  const input = host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;
  input.value = 'mango';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await host.updateComplete;

  const createOpt = host.renderRoot.querySelector('[data-value="__create__"]');
  expect(createOpt).not.toBeNull();
  expect(createOpt!.textContent).toContain('mango');
});

test('allowcreate: "Create X" does not appear for exact match', async () => {
  const screen = render(makeCombobox({ allowCreate: true }));
  const host = await getHost(screen);
  const input = host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;
  input.value = 'Apple';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await host.updateComplete;

  const createOpt = host.renderRoot.querySelector('[data-value="__create__"]');
  expect(createOpt).toBeNull();
});

test('allowcreate: activating create fires rc-combobox-create event', async () => {
  const screen = render(makeCombobox({ allowCreate: true }));
  const host = await getHost(screen);
  const createHandler = vi.fn();
  host.addEventListener('rc-combobox-create', createHandler);

  const input = host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;
  input.value = 'mango';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await host.updateComplete;

  const createEl = host.renderRoot.querySelector<HTMLElement>('[data-value="__create__"]')!;
  createEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));

  expect(createHandler).toHaveBeenCalledOnce();
  expect(createHandler.mock.calls[0][0].detail.text).toBe('mango');
});

test('allowcreate: preventDefault on rc-combobox-create cancels insertion', async () => {
  const screen = render(makeCombobox({ allowCreate: true }));
  const host = await getHost(screen);
  host.addEventListener('rc-combobox-create', (e: Event) => e.preventDefault());

  const input = host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;
  input.value = 'mango';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await host.updateComplete;

  const createEl = host.renderRoot.querySelector<HTMLElement>('[data-value="__create__"]')!;
  createEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;

  // Option should NOT have been added
  expect(host['_selectedValues'].has('mango')).toBe(false);
});

test('allowcreate: new option appears in listbox after creation', async () => {
  const screen = render(makeCombobox({ allowCreate: true }));
  const host = await getHost(screen);

  const input = host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;
  input.value = 'mango';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await host.updateComplete;

  const createEl = host.renderRoot.querySelector<HTMLElement>('[data-value="__create__"]')!;
  createEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;

  // Open again to verify option was added
  host.openPopup();
  await host.updateComplete;
  const opts = host.renderRoot.querySelector('rc-listbox')!.querySelectorAll('[role="option"]');
  const values = Array.from(opts).map((o) => o.getAttribute('data-value'));
  expect(values).toContain('mango');
});

test('allowcreate: new option also added to native <select>', async () => {
  const screen = render(makeCombobox({ allowCreate: true }));
  const host = await getHost(screen);
  const nativeSel = host.querySelector('select')!;

  const input = host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;
  input.value = 'mango';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await host.updateComplete;

  host.renderRoot.querySelector<HTMLElement>('[data-value="__create__"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;

  const nativeValues = Array.from(nativeSel.options).map((o) => o.value);
  expect(nativeValues).toContain('mango');
});

// ── Multi-select ──────────────────────────────────────────────────────────────

test('multiple: popup stays open after selecting an option', async () => {
  const screen = render(makeCombobox({ multiple: true }));
  const host = await getHost(screen);
  host.openPopup();
  await host.updateComplete;
  host.renderRoot.querySelector('rc-listbox')!
    .querySelector<HTMLElement>('[data-value="apple"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(host.open).toBe(true);
});

test('multiple: chips render for selected values', async () => {
  const screen = render(makeCombobox({ multiple: true }));
  const host = await getHost(screen);
  expect(host.multiple).toBe(true);
  host.openPopup();
  await host.updateComplete;
  host.renderRoot.querySelector('rc-listbox')!
    .querySelector<HTMLElement>('[data-value="apple"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect((host as any)._selectedValues.has('apple')).toBe(true);
  const chips = host.renderRoot.querySelectorAll('[part~="chip"]');
  expect(chips).toHaveLength(1);
  expect(chips[0].textContent).toContain('Apple');
});

test('multiple: input clears after each selection', async () => {
  const screen = render(makeCombobox({ multiple: true }));
  const host = await getHost(screen);
  const input = host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;
  input.value = 'app';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await host.updateComplete;
  host.renderRoot.querySelector('rc-listbox')!
    .querySelector<HTMLElement>('[data-value="apple"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(input.value).toBe('');
});

test('multiple: rc-select-change detail.value is an array', async () => {
  const screen = render(makeCombobox({ multiple: true }));
  const host = await getHost(screen);
  const handler = vi.fn();
  host.addEventListener('rc-select-change', handler);
  host.openPopup();
  await host.updateComplete;
  host.renderRoot.querySelector('rc-listbox')!
    .querySelector<HTMLElement>('[data-value="apple"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(Array.isArray(handler.mock.calls[0][0].detail.value)).toBe(true);
});

// ── Toggle button ─────────────────────────────────────────────────────────────

test('toggle button click opens popup', async () => {
  const screen = render(makeCombobox());
  const host = await getHost(screen);
  const toggle = host.renderRoot.querySelector<HTMLButtonElement>('#toggle')!;
  toggle.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(host.open).toBe(true);
});

test('toggle button click closes popup when open', async () => {
  const screen = render(makeCombobox());
  const host = await getHost(screen);
  host.openPopup();
  await host.updateComplete;
  const toggle = host.renderRoot.querySelector<HTMLButtonElement>('#toggle')!;
  toggle.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  await host.updateComplete;
  expect(host.open).toBe(false);
});
