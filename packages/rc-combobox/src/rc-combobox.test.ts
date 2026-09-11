import { html } from 'lit';

import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import './define.js';
import type { RCCombobox } from './rc-combobox.js';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';

function makeCombobox(opts?: { multiple?: boolean; allowCreate?: boolean; placeholder?: string }) {
  return html`
    <rc-combobox
      ?multiple=${opts?.multiple ?? false}
      ?allow-create=${opts?.allowCreate ?? false}
      placeholder=${opts?.placeholder ?? 'Search...'}
    >
      <select aria-label="Fruit" ?multiple=${opts?.multiple ?? false}>
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
        <option value="cherry" disabled>Cherry</option>
      </select>
    </rc-combobox>
  `;
}

// getByRole('combobox') times out in Firefox when rc-listbox[popover="manual"] is
// a sibling in the same shadow root, access the shadow DOM directly instead.
async function getHost(screen: ReturnType<typeof render>): Promise<RCCombobox> {
  const $host = screen.container.querySelector('rc-combobox') as RCCombobox;

  await $host.updateComplete;

  await vi.waitFor(() => {
    expect($host.renderRoot.querySelectorAll('rc-listbox [role="option"]')).toHaveLength(3);
  });

  return $host;
}

test('input has role="combobox", aria-haspopup="listbox", aria-autocomplete="list"', async () => {
  const screen = render(makeCombobox());
  const $host = await getHost(screen);
  const $input = $host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;

  expect($input.tagName).toBe('INPUT');
  expect($input.getAttribute('role')).toBe('combobox');
  expect($input.getAttribute('aria-haspopup')).toBe('listbox');
  expect($input.getAttribute('aria-autocomplete')).toBe('list');
  expect($input.getAttribute('aria-controls')).toBe('listbox');
  expect($input.getAttribute('aria-expanded')).toBe('false');
});

test('rc-combobox has no automated accessibility violations', async () => {
  const screen = render(makeCombobox());
  const $host = await getHost(screen);

  await expectNoA11yViolations($host);

  $host.openPopup();
  await $host.updateComplete;
  await expectNoA11yViolations($host);
});

test('options appear in listbox from slotted <select>', async () => {
  const screen = render(makeCombobox());
  const $host = await getHost(screen);

  $host.openPopup();
  await $host.updateComplete;

  const $listbox = $host.renderRoot.querySelector('rc-listbox')!;
  const $opts = $listbox.querySelectorAll('[role="option"]');

  expect($opts).toHaveLength(3);
});

test('shared item tokens flow into the internal listbox option rows', async () => {
  const screen = render(makeCombobox());
  const $host = await getHost(screen);

  $host.style.setProperty('--rc-item-gap', '9px');
  $host.style.setProperty('--rc-item-padding-block', '5px');
  $host.style.setProperty('--rc-item-padding-inline', '7px');
  $host.openPopup();
  await $host.updateComplete;

  const $listbox = $host.renderRoot.querySelector('rc-listbox')!;
  const $option = $listbox.querySelector('[role="option"]') as HTMLElement;
  const styles = getComputedStyle($option);

  expect(styles.gap).toBe('9px');
  expect(styles.paddingBlockStart).toBe('5px');
  expect(styles.paddingInlineStart).toBe('7px');
});

test('typing opens the popup and filters listbox options', async () => {
  const screen = render(makeCombobox());
  const $host = await getHost(screen);
  const $input = $host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;

  $input.value = 'ban';
  $input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await $host.updateComplete;

  const $listbox = $host.renderRoot.querySelector('rc-listbox')!;
  const $apple = $listbox.querySelector<HTMLElement>('[data-value="apple"]')!;
  const $banana = $listbox.querySelector<HTMLElement>('[data-value="banana"]')!;

  expect($host.open).toBe(true);
  expect($apple.hidden).toBe(true);
  expect($banana.hidden).toBe(false);
});

test('ArrowDown opens to the first option and Enter selects it', async () => {
  const screen = render(makeCombobox());
  const $host = await getHost(screen);
  const $input = $host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;
  const changeHandler = vi.fn();

  $host.addEventListener('rc-select-change', changeHandler);

  // Open popup via real focus so hidePopover() restores focus correctly
  $input.focus();
  await $host.updateComplete;

  $input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
  );
  await $host.updateComplete;

  expect($host.open).toBe(true);
  expect($input.getAttribute('aria-activedescendant')).toBeTruthy();

  $input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
  );
  await $host.updateComplete;

  expect(changeHandler).toHaveBeenCalledOnce();
  expect($host.open).toBe(false);
  expect($input.value).toBe('Apple');
  expect(changeHandler.mock.calls[0][0].detail.selectedValues).toEqual(['apple']);
  expect(changeHandler.mock.calls[0][0].detail.selectedOptions).toEqual([
    { value: 'apple', label: 'Apple', disabled: false },
  ]);
});

test('Escape clears filter and closes popup', async () => {
  const screen = render(makeCombobox());
  const $host = await getHost(screen);
  const $input = $host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;

  $input.value = 'ban';
  $input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await $host.updateComplete;

  $input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
  );
  await $host.updateComplete;

  expect($host.open).toBe(false);
  expect($input.value).toBe('');
});

test('allowcreate: unmatched input dispatches and creates public native/listbox state', async () => {
  const screen = render(makeCombobox({ allowCreate: true }));
  const $host = await getHost(screen);
  const $input = $host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;
  const $nativeSelect = $host.querySelector('select')!;
  const createHandler = vi.fn();

  $host.addEventListener('rc-combobox-create', createHandler);

  $input.value = 'mango';
  $input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await $host.updateComplete;

  const $createOption = $host.renderRoot.querySelector<HTMLElement>('[data-action="create"]')!;

  expect($createOption.textContent).toContain('mango');

  $createOption.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await $host.updateComplete;

  expect(createHandler).toHaveBeenCalledOnce();
  expect(createHandler.mock.calls[0][0].detail.text).toBe('mango');
  expect($host.selectedValues).toEqual(['mango']);
  expect(Array.from($nativeSelect.options, (option) => option.value)).toContain('mango');

  $host.openPopup();
  await $host.updateComplete;

  const values = Array.from(
    $host.renderRoot.querySelector('rc-listbox')!.querySelectorAll('[role="option"]'),
    (option) => option.getAttribute('data-value'),
  );

  expect(values).toContain('mango');
});

test('allowcreate: "Create X" does not appear for exact match', async () => {
  const screen = render(makeCombobox({ allowCreate: true }));
  const $host = await getHost(screen);
  const $input = $host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;

  $input.value = 'Apple';
  $input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await $host.updateComplete;

  const $createOpt = $host.renderRoot.querySelector('[data-action="create"]');

  expect($createOpt).toBeNull();
});

test('allowcreate: preventDefault on rc-combobox-create cancels insertion', async () => {
  const screen = render(makeCombobox({ allowCreate: true }));
  const $host = await getHost(screen);

  $host.addEventListener('rc-combobox-create', (e: Event) => e.preventDefault());

  const $input = $host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;

  $input.value = 'mango';
  $input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await $host.updateComplete;

  const $createEl = $host.renderRoot.querySelector<HTMLElement>('[data-action="create"]')!;

  $createEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await $host.updateComplete;

  expect($host.selectedValues).not.toContain('mango');
  expect(
    Array.from($host.querySelector('select')!.options, (option) => option.value),
  ).not.toContain('mango');
});

test('multiple: selection stays open, renders chips, clears input, and emits array detail', async () => {
  const screen = render(makeCombobox({ multiple: true }));
  const $host = await getHost(screen);
  const $input = $host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;
  const handler = vi.fn();

  $host.addEventListener('rc-select-change', handler);

  $input.value = 'app';
  $input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await $host.updateComplete;

  $host.renderRoot
    .querySelector('rc-listbox')!
    .querySelector<HTMLElement>('[data-value="apple"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await $host.updateComplete;

  expect($host.open).toBe(true);
  expect($host.multiple).toBe(true);
  expect($host.selectedValues).toEqual(['apple']);
  expect($input.value).toBe('');

  const $chips = $host.renderRoot.querySelectorAll('[part~="chip"]');

  expect($chips).toHaveLength(1);
  expect($chips[0].textContent).toContain('Apple');
  expect(Array.isArray(handler.mock.calls[0][0].detail.value)).toBe(true);
  expect(handler.mock.calls[0][0].detail.selectedValues).toEqual(['apple']);
});

test('multiple: chips render from value property', async () => {
  const screen = render(makeCombobox({ multiple: true }));
  const $host = screen.container.querySelector('rc-combobox') as RCCombobox;

  $host.value = ['apple', 'banana'];

  await getHost(screen);

  const $chips = $host.renderRoot.querySelectorAll('[part~="chip"]');

  expect($host.selectedValues).toEqual(['apple', 'banana']);
  expect($chips).toHaveLength(2);
});

test('--rc-combobox-toggle-size controls the toggle button inline size', async () => {
  const screen = render(makeCombobox());
  const $host = await getHost(screen);

  $host.style.setProperty('--rc-combobox-toggle-size', '37px');
  await $host.updateComplete;

  const $toggle = $host.renderRoot.querySelector<HTMLButtonElement>('#toggle')!;

  expect(getComputedStyle($toggle).inlineSize).toBe('37px');
});

test('toggle button click opens and closes the popup', async () => {
  const screen = render(makeCombobox());
  const $host = await getHost(screen);
  const $toggle = $host.renderRoot.querySelector<HTMLButtonElement>('#toggle')!;

  $toggle.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  await $host.updateComplete;

  expect($host.open).toBe(true);

  $toggle.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  await $host.updateComplete;

  expect($host.open).toBe(false);
});

test('touch tap (pointerdown + pointerup) selects active option, closes popup, sets input value', async () => {
  const screen = render(makeCombobox());
  const $host = await getHost(screen);
  const $input = $host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;

  $host.openPopup();
  await $host.updateComplete;

  const $listbox = $host.renderRoot.querySelector('rc-listbox')!;
  const $option = $listbox.querySelector<HTMLElement>('[data-value="apple"]')!;

  $option.dispatchEvent(
    new PointerEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 0,
      bubbles: true,
      cancelable: true,
    }),
  );
  $option.dispatchEvent(
    new PointerEvent('pointerup', {
      pointerType: 'touch',
      pointerId: 0,
      bubbles: true,
      cancelable: true,
    }),
  );
  await $host.updateComplete;

  expect($host.open).toBe(false);
  expect($input.value).toBe('Apple');
  expect($host.selectedValues).toEqual(['apple']);
});

test('touch pointerdown alone (no pointerup) does not select, so scrolling is not intercepted', async () => {
  const screen = render(makeCombobox());
  const $host = await getHost(screen);
  const $input = $host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;

  $host.openPopup();
  await $host.updateComplete;

  const $listbox = $host.renderRoot.querySelector('rc-listbox')!;

  $listbox.querySelector<HTMLElement>('[data-value="apple"]')!.dispatchEvent(
    new PointerEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 0,
      bubbles: true,
      cancelable: true,
    }),
  );
  await $host.updateComplete;

  expect($host.open).toBe(true);
  expect($input.value).not.toBe('Apple');
  expect($host.selectedValues).toEqual([]);
});

test('composition input events (mobile IME) still filter the listbox', async () => {
  const screen = render(makeCombobox());
  const $host = await getHost(screen);
  const $input = $host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;

  // Simulate an intermediate composition update from a mobile IME keyboard
  // (e.g. Gboard predictive text) — _handleInput doesn't special-case
  // isComposing, so composition and committed input are handled identically.
  $input.value = 'ba';
  $input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true, data: 'ba' }));
  await $host.updateComplete;

  const $listbox = $host.renderRoot.querySelector('rc-listbox')!;
  const $apple = $listbox.querySelector<HTMLElement>('[data-value="apple"]')!;
  const $banana = $listbox.querySelector<HTMLElement>('[data-value="banana"]')!;

  expect($apple.hidden).toBe(true);
  expect($banana.hidden).toBe(false);
});

test('autofill-style input event (inputType: insertReplacementText) is handled without error', async () => {
  const screen = render(makeCombobox());
  const $host = await getHost(screen);
  const $input = $host.renderRoot.querySelector<HTMLInputElement>('#trigger')!;

  // Mobile autofill/contact-suggestion services can replace the whole field
  // value in one InputEvent instead of a typed sequence.
  $input.value = '123 Autofilled Ave';
  $input.dispatchEvent(
    new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText' }),
  );
  await $host.updateComplete;

  const $listbox = $host.renderRoot.querySelector('rc-listbox')!;
  const $options = Array.from($listbox.querySelectorAll<HTMLElement>('[role="option"]'));

  expect($host.open).toBe(true);
  expect($options.every(($opt) => $opt.hidden)).toBe(true);
});
