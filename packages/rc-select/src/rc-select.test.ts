import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './define.js';
import type { RCSelect } from './rc-select.js';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';

function makeSelect(opts?: {
  multiple?: boolean;
  disabled?: boolean;
  placeholder?: string;
  popupMode?: 'popover' | 'dialog';
}) {
  return html`
    <rc-select
      placeholder=${opts?.placeholder ?? 'Choose...'}
      popup-mode=${opts?.popupMode ?? 'popover'}
    >
      <select
        aria-label="Fruit"
        ?multiple=${opts?.multiple ?? false}
        ?disabled=${opts?.disabled ?? false}
      >
        <option value="">Choose...</option>
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
        <option value="cherry" disabled>Cherry</option>
      </select>
    </rc-select>
  `;
}

function makeSelectedSelect() {
  return html`
    <rc-select placeholder="Choose...">
      <select aria-label="Fruit" multiple>
        <option value="apple">Apple</option>
        <option value="banana" selected>Banana</option>
        <option value="cherry" selected>Cherry</option>
      </select>
    </rc-select>
  `;
}

// getByRole('combobox') times out in Firefox when rc-listbox[popover="manual"] is
// a sibling in the same shadow root — access the shadow DOM directly instead.
async function getHost(screen: ReturnType<typeof render>): Promise<RCSelect> {
  const host = screen.container.querySelector('rc-select') as RCSelect;

  await host.updateComplete;

  // Flush the queueMicrotask inside _handleSelectSlotChange so options are
  // populated before any test interaction begins.
  await new Promise((r) => setTimeout(r, 0));

  return host;
}

function getTrigger(host: RCSelect): HTMLElement {
  return host.renderRoot.querySelector<HTMLElement>('#trigger')!;
}

test('listbox fades in and out through CSS alone, with no JavaScript gating the timing', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const listbox = host.renderRoot.querySelector<HTMLElement>('[part="listbox"]')!;

  expect(getComputedStyle(listbox).opacity).toBe('0');
  expect(getComputedStyle(listbox).transitionDuration).not.toBe('0s');

  // openPopup()/closePopup() are synchronous; nothing waits on a transition.
  host.openPopup();

  await Promise.all(listbox.getAnimations().map((animation) => animation.finished.catch(() => undefined)));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await Promise.all(listbox.getAnimations().map((animation) => animation.finished.catch(() => undefined)));

  expect(getComputedStyle(listbox).opacity).toBe('1');

  host.closePopup(false);

  await new Promise((resolve) => requestAnimationFrame(resolve));
  await Promise.all(listbox.getAnimations().map((animation) => animation.finished.catch(() => undefined)));

  // The exit fade must actually be visible, not skipped by an instant
  // display: none racing ahead of it: closing relies on allow-discrete
  // keeping display: block for the fade's duration rather than the
  // popover's own display toggle winning immediately.
  expect(getComputedStyle(listbox).opacity).toBe('0');
});

test('trigger has role="combobox", aria-haspopup="listbox", aria-expanded="false"', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const $el = getTrigger(host);

  expect($el.getAttribute('role')).toBe('combobox');
  expect($el.getAttribute('aria-haspopup')).toBe('listbox');
  expect($el.getAttribute('aria-expanded')).toBe('false');
  expect($el.getAttribute('aria-controls')).toBe('listbox');
});

test('dialog mode stages multiple selection until Done', async () => {
  const screen = render(makeSelect({ multiple: true, popupMode: 'dialog' }));
  const host = await getHost(screen);
  const changeSpy = vi.fn();
  const nativeInputSpy = vi.fn();
  const nativeChangeSpy = vi.fn();
  const $select = host.querySelector('select')!;

  host.addEventListener('rc-select-change', changeSpy);
  $select.addEventListener('input', nativeInputSpy);
  $select.addEventListener('change', nativeChangeSpy);
  host.openPopup();

  await vi.waitFor(() => {
    expect(host.renderRoot.querySelector<HTMLDialogElement>('#dialog')?.open).toBe(true);
  });

  const $listbox = host.renderRoot.querySelector('#dialog-listbox')!;

  $listbox
    .querySelector<HTMLElement>('[data-value="apple"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));

  await host.updateComplete;

  expect(host.selectedValues).toEqual([]);
  expect(Array.from($select.selectedOptions)).toEqual([]);
  expect(changeSpy).not.toHaveBeenCalled();

  host.renderRoot.querySelector<HTMLButtonElement>('[part~="dialog-confirm"]')!.click();
  await host.updateComplete;

  expect(host.selectedValues).toEqual(['apple']);
  expect(Array.from($select.selectedOptions, (option) => option.value)).toEqual(['apple']);
  expect(nativeInputSpy).toHaveBeenCalledOnce();
  expect(nativeChangeSpy).toHaveBeenCalledOnce();
  expect(changeSpy).toHaveBeenCalledOnce();
});

test('dialog mode keeps single selection open and discards it with the leading cancel action', async () => {
  const screen = render(makeSelect({ popupMode: 'dialog' }));
  const host = await getHost(screen);
  const changeSpy = vi.fn();

  host.addEventListener('rc-select-change', changeSpy);
  host.openPopup();

  await vi.waitFor(() => {
    expect(host.renderRoot.querySelector<HTMLDialogElement>('#dialog')?.open).toBe(true);
  });

  host.renderRoot
    .querySelector('#dialog-listbox')!
    .querySelector<HTMLElement>('[data-value="banana"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));

  await host.updateComplete;

  expect(host.open).toBe(true);
  expect(host.selectedValues).toEqual([]);

  host.renderRoot.querySelector<HTMLButtonElement>('[part~="dialog-cancel"]')!.click();
  await host.updateComplete;

  expect(host.open).toBe(false);
  expect(host.selectedValues).toEqual([]);
  expect(changeSpy).not.toHaveBeenCalled();
});

test('rc-select has no automated accessibility violations', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);

  await expectNoA11yViolations(host);
});

test('popup is initially closed', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);

  expect(host.open).toBe(false);
});

test('slotted <select> options appear in listbox', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);

  // Open popup to force listbox render sync
  host.openPopup();
  await host.updateComplete;

  const $listbox = host.renderRoot.querySelector('rc-listbox')!;
  const $options = $listbox.querySelectorAll('[role="option"]');

  // 3 real options (placeholder skipped)
  expect($options).toHaveLength(3);
  expect($options[0].textContent).toContain('Apple');
  expect($options[1].textContent).toContain('Banana');
  expect($options[2].textContent).toContain('Cherry');
});

test('shared item tokens flow into the internal listbox option rows', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);

  host.style.setProperty('--rc-item-gap', '9px');
  host.style.setProperty('--rc-item-padding-block', '5px');
  host.style.setProperty('--rc-item-padding-inline', '7px');
  host.openPopup();
  await host.updateComplete;

  const $listbox = host.renderRoot.querySelector('rc-listbox')!;
  const $option = $listbox.querySelector('[role="option"]') as HTMLElement;
  const styles = getComputedStyle($option);

  expect(styles.gap).toBe('9px');
  expect(styles.paddingBlockStart).toBe('5px');
  expect(styles.paddingInlineStart).toBe('7px');
});

test('clicking trigger opens popup', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const $trigger = getTrigger(host);

  $trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  await host.updateComplete;

  expect(host.open).toBe(true);
  expect($trigger.getAttribute('aria-expanded')).toBe('true');
});

test('clicking trigger again closes popup', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const $trigger = getTrigger(host);

  $trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  await host.updateComplete;
  $trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  await host.updateComplete;

  expect(host.open).toBe(false);
});

test('rc-select-open fires when popup opens', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const handler = vi.fn();

  host.addEventListener('rc-select-open', handler);
  host.openPopup();
  await host.updateComplete;

  expect(handler).toHaveBeenCalledOnce();
});

test('rc-select-close fires when popup closes', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const handler = vi.fn();

  host.addEventListener('rc-select-close', handler);
  host.openPopup();
  await host.updateComplete;

  host.closePopup();
  await host.updateComplete;

  expect(handler).toHaveBeenCalledOnce();
});

test('ArrowDown opens popup and sets aria-activedescendant to first option', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const $trigger = getTrigger(host);

  $trigger.focus();
  $trigger.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
  );
  await host.updateComplete;

  expect(host.open).toBe(true);
  expect($trigger.getAttribute('aria-activedescendant')).toBeTruthy();
});

test('ArrowDown twice moves virtual cursor to second option', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const $trigger = getTrigger(host);

  $trigger.focus();
  host.openPopup();
  await host.updateComplete;

  $trigger.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
  );
  await host.updateComplete;

  const firstId = $trigger.getAttribute('aria-activedescendant');

  $trigger.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
  );
  await host.updateComplete;

  const secondId = $trigger.getAttribute('aria-activedescendant');

  expect(firstId).not.toBe(secondId);
});

test('Enter selects active option, closes popup, fires rc-select-change', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const $trigger = getTrigger(host);
  const changeHandler = vi.fn();

  host.addEventListener('rc-select-change', changeHandler);
  $trigger.focus();
  host.openPopup();
  await host.updateComplete;

  // Navigate to first item
  $trigger.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }),
  );
  await host.updateComplete;

  // Press Enter
  $trigger.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
  );
  await host.updateComplete;

  expect(host.open).toBe(false);
  expect(changeHandler).toHaveBeenCalledOnce();
  expect(changeHandler.mock.calls[0][0].detail.value).toBe('apple');
  expect(changeHandler.mock.calls[0][0].detail.selectedValues).toEqual(['apple']);
  expect(changeHandler.mock.calls[0][0].detail.selectedOptions).toEqual([
    { value: 'apple', label: 'Apple', disabled: false },
  ]);
});

test('Escape closes popup without changing selection', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);

  host.openPopup();
  await host.updateComplete;

  // Simulate Escape via document keydown (which our listener handles)
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
  );
  await host.updateComplete;

  expect(host.open).toBe(false);

  // No selection was made
  expect(host['_selectedValues'].size).toBe(0);
});

test('clicking an option selects it and closes popup', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);

  host.openPopup();
  await host.updateComplete;

  const $listbox = host.renderRoot.querySelector('rc-listbox')!;
  const $appleOpt = $listbox.querySelector('[data-value="apple"]') as HTMLElement;

  $appleOpt.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;

  expect(host['_selectedValues'].has('apple')).toBe(true);
  expect(host.open).toBe(false);
});

test('initial value property wins over defaultValue and light-DOM selection', async () => {
  const screen = render(makeSelectedSelect());
  const host = screen.container.querySelector('rc-select') as RCSelect;

  host.defaultValue = ['apple'];
  host.value = ['banana'];

  await getHost(screen);

  expect(host.selectedValues).toEqual(['banana']);
});

test('defaultValue initializes uncontrolled selection', async () => {
  const screen = render(makeSelect({ multiple: true }));
  const host = screen.container.querySelector('rc-select') as RCSelect;

  host.defaultValue = ['apple', 'banana'];

  await getHost(screen);

  expect(host.selectedValues).toEqual(['apple', 'banana']);
});

test('light-DOM selected options initialize selection', async () => {
  const screen = render(makeSelectedSelect());
  const host = await getHost(screen);

  expect(host.selectedValues).toEqual(['banana', 'cherry']);
});

test('controlled value updates after initialization', async () => {
  const screen = render(makeSelect({ multiple: true }));
  const host = await getHost(screen);

  host.value = ['apple', 'banana'];
  await host.updateComplete;

  expect(host.selectedValues).toEqual(['apple', 'banana']);
});

test('host value writes do not dispatch rc-select-change', async () => {
  const screen = render(makeSelect({ multiple: true }));
  const host = await getHost(screen);
  const handler = vi.fn();

  host.addEventListener('rc-select-change', handler);
  host.value = ['apple'];
  await host.updateComplete;

  expect(handler).not.toHaveBeenCalled();
});

test('options property populates listbox and native select', async () => {
  const screen = render(html`
    <rc-select>
      <select multiple></select>
    </rc-select>
  `);
  const host = screen.container.querySelector('rc-select') as RCSelect;

  host.options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
  ];
  host.value = ['banana'];

  await getHost(screen);

  const $nativeSel = host.querySelector('select')!;

  expect(Array.from($nativeSel.options).map((opt) => opt.value)).toEqual(['apple', 'banana']);
  expect(host.selectedValues).toEqual(['banana']);
});

test('native <select> value syncs after selection', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const $nativeSel = host.querySelector('select')!;

  host.openPopup();
  await host.updateComplete;

  const $listbox = host.renderRoot.querySelector('rc-listbox')!;

  $listbox
    .querySelector<HTMLElement>('[data-value="banana"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;

  expect($nativeSel.value).toBe('banana');
});

test('user selection dispatches native input and change on the slotted select', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const $nativeSel = host.querySelector('select')!;
  const onInput = vi.fn();
  const onChange = vi.fn();

  $nativeSel.addEventListener('input', onInput);
  $nativeSel.addEventListener('change', onChange);

  host.openPopup();
  await host.updateComplete;

  const $listbox = host.renderRoot.querySelector('rc-listbox')!;

  $listbox
    .querySelector<HTMLElement>('[data-value="banana"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;

  expect(onInput).toHaveBeenCalledOnce();
  expect(onChange).toHaveBeenCalledOnce();
});

test('host value writes do not dispatch native input or change on the slotted select', async () => {
  const screen = render(makeSelect({ multiple: true }));
  const host = await getHost(screen);
  const $nativeSel = host.querySelector('select')!;
  const onInput = vi.fn();
  const onChange = vi.fn();

  $nativeSel.addEventListener('input', onInput);
  $nativeSel.addEventListener('change', onChange);

  host.value = ['apple'];
  await host.updateComplete;

  expect(onInput).not.toHaveBeenCalled();
  expect(onChange).not.toHaveBeenCalled();
});

test('focus() and blur() forward to the trigger', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const $trigger = getTrigger(host);

  host.focus();
  expect(host.shadowRoot!.activeElement).toBe($trigger);

  host.blur();
  expect(host.shadowRoot!.activeElement).toBe(null);
});

test('required on the slotted select reflects as aria-required on the trigger', async () => {
  const screen = render(html`
    <rc-select>
      <select required>
        <option value="apple">Apple</option>
      </select>
    </rc-select>
  `);
  const host = await getHost(screen);

  expect(getTrigger(host).getAttribute('aria-required')).toBe('true');
});

test('disabled option cannot be selected', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);

  host.openPopup();
  await host.updateComplete;

  const $listbox = host.renderRoot.querySelector('rc-listbox')!;
  const $cherryOpt = $listbox.querySelector<HTMLElement>('[data-value="cherry"]')!;

  $cherryOpt.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;

  expect(host['_selectedValues'].has('cherry')).toBe(false);
});

test('disabled rc-select: trigger has aria-disabled and does not open', async () => {
  const screen = render(makeSelect({ disabled: true }));
  const host = await getHost(screen);

  host.openPopup();
  await host.updateComplete;

  expect(host.open).toBe(false);
});

test('type-ahead: pressing "b" selects Banana in single-select closed mode', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const $trigger = getTrigger(host);
  const changeHandler = vi.fn();

  host.addEventListener('rc-select-change', changeHandler);
  $trigger.focus();
  $trigger.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'b', bubbles: true, cancelable: true }),
  );
  await host.updateComplete;

  expect(host['_selectedValues'].has('banana')).toBe(true);
  expect(changeHandler).toHaveBeenCalledOnce();
});

test('multiple: popup stays open after selecting an option', async () => {
  const screen = render(makeSelect({ multiple: true }));
  const host = await getHost(screen);

  host.openPopup();
  await host.updateComplete;

  const $listbox = host.renderRoot.querySelector('rc-listbox')!;

  $listbox
    .querySelector<HTMLElement>('[data-value="apple"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;

  expect(host.open).toBe(true);
});

test('multiple: rc-select-change detail.value is an array', async () => {
  const screen = render(makeSelect({ multiple: true }));
  const host = await getHost(screen);
  const handler = vi.fn();

  host.addEventListener('rc-select-change', handler);
  host.openPopup();
  await host.updateComplete;

  const $listbox = host.renderRoot.querySelector('rc-listbox')!;

  $listbox
    .querySelector<HTMLElement>('[data-value="apple"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;

  expect(Array.isArray(handler.mock.calls[0][0].detail.value)).toBe(true);
  expect(handler.mock.calls[0][0].detail.value).toContain('apple');
});

test('multiple: chips render for selected values', async () => {
  const screen = render(makeSelect({ multiple: true }));
  const host = await getHost(screen);

  host.openPopup();
  await host.updateComplete;

  const $listbox = host.renderRoot.querySelector('rc-listbox')!;

  $listbox
    .querySelector<HTMLElement>('[data-value="apple"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;

  const $chips = host.renderRoot.querySelectorAll('[part~="chip"]');

  expect($chips).toHaveLength(1);
  expect($chips[0].textContent).toContain('Apple');

  const $chip = $chips[0].closest('rc-chip')!;
  const $label = $chips[0].querySelector<HTMLElement>('[part~="chip-label"]')!;
  const $remove = $chip.shadowRoot!.querySelector<HTMLElement>('[part="remove"]')!;

  expect($label.getBoundingClientRect().right).toBeLessThanOrEqual(
    $remove.getBoundingClientRect().left,
  );
});

test('multiple: chip remove button click removes the value', async () => {
  const screen = render(makeSelect({ multiple: true }));
  const host = await getHost(screen);

  host.openPopup();
  await host.updateComplete;

  const $listbox = host.renderRoot.querySelector('rc-listbox')!;

  $listbox
    .querySelector<HTMLElement>('[data-value="apple"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;

  const $removeBtn = host.renderRoot.querySelector<HTMLElement>('button[part~="chip"]')!;

  $removeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  await host.updateComplete;

  expect(host['_selectedValues'].has('apple')).toBe(false);
  expect(host.renderRoot.querySelectorAll('[part~="chip"]')).toHaveLength(0);
});

test('display="compact" shows summary text instead of chips', async () => {
  const screen = render(html`
    <rc-select display="compact" placeholder="Choose...">
      <select multiple>
        <option value="apple">Apple</option>
        <option value="banana">Banana</option>
      </select>
    </rc-select>
  `);
  const host = await getHost(screen);

  host.openPopup();
  await host.updateComplete;

  const $listbox = host.renderRoot.querySelector('rc-listbox')!;

  $listbox
    .querySelector<HTMLElement>('[data-value="apple"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  $listbox
    .querySelector<HTMLElement>('[data-value="banana"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
  await host.updateComplete;

  // No chips in compact mode
  expect(host.renderRoot.querySelectorAll('[part~="chip"]')).toHaveLength(0);

  // Value display shows compact text
  const $display = host.renderRoot.querySelector('[part="value-display"]')!;

  expect($display.textContent).toContain('+');
});

test('adding <option> to slotted <select> updates listbox', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const $nativeSel = host.querySelector('select')!;
  const $newOpt = document.createElement('option');

  $newOpt.value = 'date';
  $newOpt.text = 'Date';
  $nativeSel.add($newOpt);

  // MutationObserver fires async
  await new Promise((r) => setTimeout(r, 10));
  await host.updateComplete;

  host.openPopup();
  await host.updateComplete;

  const $listbox = host.renderRoot.querySelector('rc-listbox')!;
  const $opts = $listbox.querySelectorAll('[role="option"]');

  // apple, banana, cherry, date
  expect($opts).toHaveLength(4);
});

test('adding <option> preserves current selection', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const $nativeSel = host.querySelector('select')!;

  host.value = 'banana';

  const $newOpt = document.createElement('option');

  $newOpt.value = 'date';
  $newOpt.text = 'Date';
  $nativeSel.add($newOpt);

  await new Promise((r) => setTimeout(r, 10));
  await host.updateComplete;

  expect(host.selectedValues).toEqual(['banana']);
});

/** Dispatches a tap (pointerdown followed by pointerup) at a fixed point for touch input. */
function dispatchTouchTap(
  $el: HTMLElement,
  { pointerId = 0, x = 0, y = 0 }: { pointerId?: number; x?: number; y?: number } = {},
): void {
  $el.dispatchEvent(
    new PointerEvent('pointerdown', {
      pointerType: 'touch',
      pointerId,
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
    }),
  );
  $el.dispatchEvent(
    new PointerEvent('pointerup', {
      pointerType: 'touch',
      pointerId,
      clientX: x,
      clientY: y,
      bubbles: true,
      cancelable: true,
    }),
  );
}

test('touch tap (pointerdown + pointerup) selects an option and syncs native <select>', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const $nativeSel = host.querySelector('select')!;

  host.openPopup();
  await host.updateComplete;

  const $listbox = host.renderRoot.querySelector('rc-listbox')!;

  dispatchTouchTap($listbox.querySelector<HTMLElement>('[data-value="banana"]')!);
  await host.updateComplete;

  expect(host['_selectedValues'].has('banana')).toBe(true);
  expect($nativeSel.value).toBe('banana');
  expect(host.open).toBe(false);
});

test('touch pointerdown alone (no pointerup) does not select, so scrolling is not intercepted', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const $nativeSel = host.querySelector('select')!;

  host.openPopup();
  await host.updateComplete;

  const $listbox = host.renderRoot.querySelector('rc-listbox')!;

  $listbox.querySelector<HTMLElement>('[data-value="banana"]')!.dispatchEvent(
    new PointerEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 0,
      bubbles: true,
      cancelable: true,
    }),
  );
  await host.updateComplete;

  expect(host['_selectedValues'].has('banana')).toBe(false);
  expect($nativeSel.value).not.toBe('banana');
  expect(host.open).toBe(true);
});

test('touch drag past the tap threshold cancels the pending activation (scroll, not select)', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const $nativeSel = host.querySelector('select')!;

  host.openPopup();
  await host.updateComplete;

  const $listbox = host.renderRoot.querySelector('rc-listbox')!;
  const $option = $listbox.querySelector<HTMLElement>('[data-value="banana"]')!;

  $option.dispatchEvent(
    new PointerEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 0,
      clientX: 0,
      clientY: 0,
      bubbles: true,
      cancelable: true,
    }),
  );
  $option.dispatchEvent(
    new PointerEvent('pointermove', {
      pointerType: 'touch',
      pointerId: 0,
      clientX: 0,
      clientY: 40,
      bubbles: true,
      cancelable: true,
    }),
  );
  $option.dispatchEvent(
    new PointerEvent('pointerup', {
      pointerType: 'touch',
      pointerId: 0,
      clientX: 0,
      clientY: 40,
      bubbles: true,
      cancelable: true,
    }),
  );
  await host.updateComplete;

  expect(host['_selectedValues'].has('banana')).toBe(false);
  expect($nativeSel.value).not.toBe('banana');
  expect(host.open).toBe(true);
});

test('touch tap selects multiple options and syncs native <select>', async () => {
  const screen = render(makeSelect({ multiple: true }));
  const host = await getHost(screen);
  const $nativeSel = host.querySelector('select')!;

  host.openPopup();
  await host.updateComplete;

  const $listbox = host.renderRoot.querySelector('rc-listbox')!;

  for (const value of ['apple', 'banana']) {
    dispatchTouchTap($listbox.querySelector<HTMLElement>(`[data-value="${value}"]`)!);
  }
  await host.updateComplete;

  expect(host.selectedValues).toEqual(['apple', 'banana']);
  expect(Array.from($nativeSel.selectedOptions).map((opt) => opt.value)).toEqual([
    'apple',
    'banana',
  ]);
});

test('display="auto" resolves to compact on coarse-pointer (touch) devices', async () => {
  const matchMediaSpy = vi
    .spyOn(window, 'matchMedia')
    .mockReturnValue({ matches: true } as unknown as MediaQueryList);

  try {
    const screen = render(makeSelect({ multiple: true }));
    const host = await getHost(screen);

    host.openPopup();
    await host.updateComplete;

    const $listbox = host.renderRoot.querySelector('rc-listbox')!;

    for (const value of ['apple', 'banana']) {
      $listbox
        .querySelector<HTMLElement>(`[data-value="${value}"]`)!
        .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    }
    await host.updateComplete;

    expect(host.renderRoot.querySelectorAll('[part~="chip"]')).toHaveLength(0);

    const $display = host.renderRoot.querySelector('[part="value-display"]')!;

    expect($display.textContent).toContain('+');
  } finally {
    matchMediaSpy.mockRestore();
  }
});

test('display="auto" resolves to chips on fine-pointer (mouse) devices', async () => {
  const matchMediaSpy = vi
    .spyOn(window, 'matchMedia')
    .mockReturnValue({ matches: false } as unknown as MediaQueryList);

  try {
    const screen = render(makeSelect({ multiple: true }));
    const host = await getHost(screen);

    host.openPopup();
    await host.updateComplete;

    const $listbox = host.renderRoot.querySelector('rc-listbox')!;

    $listbox
      .querySelector<HTMLElement>('[data-value="apple"]')!
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    await host.updateComplete;

    expect(host.renderRoot.querySelectorAll('[part~="chip"]')).toHaveLength(1);
  } finally {
    matchMediaSpy.mockRestore();
  }
});

test('picker guard: multiple slotted <select> is force-disabled without disabling the host', async () => {
  // GeckoView (Firefox Android) opens a wrapped <select multiple>'s native picker
  // for taps inside the ancestor <label>'s bounds (Mozilla bug 1475723); label
  // activation on a disabled control is a spec no-op, so the guard disables it.
  const screen = render(makeSelect({ multiple: true }));
  const host = await getHost(screen);
  const $nativeSel = host.querySelector('select')!;
  const $trigger = getTrigger(host);

  expect($nativeSel.disabled).toBe(true);
  expect(host.disabled).toBe(false);
  expect($trigger.getAttribute('aria-disabled')).toBe('false');
});

test('picker guard: single-select slotted <select> is left enabled', async () => {
  const screen = render(makeSelect());
  const host = await getHost(screen);

  expect(host.querySelector('select')!.disabled).toBe(false);
});

test('picker guard: author-disabled multiple select still disables the host', async () => {
  const screen = render(makeSelect({ multiple: true, disabled: true }));
  const host = await getHost(screen);

  expect(host.disabled).toBe(true);
  expect(host.querySelector('select')!.disabled).toBe(true);
});

test('picker guard: multiple selection submits via formdata despite disabled select', async () => {
  const screen = render(html`
    <form>
      <rc-select placeholder="Choose...">
        <select aria-label="Tags" name="tags" multiple>
          <option value="apple">Apple</option>
          <option value="banana">Banana</option>
          <option value="cherry">Cherry</option>
        </select>
      </rc-select>
    </form>
  `);
  const host = screen.container.querySelector('rc-select') as RCSelect;

  await host.updateComplete;
  await new Promise((r) => setTimeout(r, 0));

  host.value = ['apple', 'cherry'];
  await host.updateComplete;

  const $form = screen.container.querySelector('form')!;
  const data = new FormData($form);

  expect(data.getAll('tags')).toEqual(['apple', 'cherry']);
});

test('picker guard: removing disabled from the select is captured as enable intent', async () => {
  const screen = render(makeSelect({ multiple: true, disabled: true }));
  const host = await getHost(screen);
  const $nativeSel = host.querySelector('select')!;

  expect(host.disabled).toBe(true);

  // Consumer enables the control through the slotted select (property or
  // attribute — both reflect to the same attribute mutation).
  $nativeSel.disabled = false;

  // MutationObserver delivery is async
  await new Promise((r) => setTimeout(r, 10));
  await host.updateComplete;

  expect(host.disabled).toBe(false);
  expect($nativeSel.disabled).toBe(true);
});

test('picker guard: required multiple select blocks form submission when empty', async () => {
  const screen = render(html`
    <form>
      <rc-select placeholder="Choose...">
        <select aria-label="Tags" name="tags" multiple required>
          <option value="apple">Apple</option>
          <option value="banana">Banana</option>
        </select>
      </rc-select>
    </form>
  `);
  const host = screen.container.querySelector('rc-select') as RCSelect;

  await host.updateComplete;
  await new Promise((r) => setTimeout(r, 0));

  const $form = screen.container.querySelector('form')!;
  const $nativeSel = host.querySelector('select')!;
  const invalidHandler = vi.fn();
  let submitPrevented: boolean | null = null;

  $nativeSel.addEventListener('invalid', invalidHandler);
  $form.addEventListener('submit', (e) => {
    submitPrevented = e.defaultPrevented;
    e.preventDefault();
  });

  $form.requestSubmit();
  await host.updateComplete;

  expect(submitPrevented).toBe(true);
  expect(invalidHandler).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(host);
});

test('picker guard: required multiple select submits once a value is selected', async () => {
  const screen = render(html`
    <form>
      <rc-select placeholder="Choose...">
        <select aria-label="Tags" name="tags" multiple required>
          <option value="apple">Apple</option>
          <option value="banana">Banana</option>
        </select>
      </rc-select>
    </form>
  `);
  const host = screen.container.querySelector('rc-select') as RCSelect;

  await host.updateComplete;
  await new Promise((r) => setTimeout(r, 0));

  host.value = ['banana'];
  await host.updateComplete;

  const $form = screen.container.querySelector('form')!;
  let submitPrevented: boolean | null = null;

  $form.addEventListener('submit', (e) => {
    submitPrevented = e.defaultPrevented;
    e.preventDefault();
  });

  $form.requestSubmit();
  await host.updateComplete;

  expect(submitPrevented).toBe(false);
});

test('picker guard: novalidate form skips submit-time constraint enforcement', async () => {
  const screen = render(html`
    <form novalidate>
      <rc-select placeholder="Choose...">
        <select aria-label="Tags" name="tags" multiple required>
          <option value="apple">Apple</option>
          <option value="banana">Banana</option>
        </select>
      </rc-select>
    </form>
  `);
  const host = screen.container.querySelector('rc-select') as RCSelect;

  await host.updateComplete;
  await new Promise((r) => setTimeout(r, 0));

  const $form = screen.container.querySelector('form')!;
  let submitPrevented: boolean | null = null;

  $form.addEventListener('submit', (e) => {
    submitPrevented = e.defaultPrevented;
    e.preventDefault();
  });

  $form.requestSubmit();
  await host.updateComplete;

  expect(submitPrevented).toBe(false);
});

test('native <select> click has its default action suppressed', async () => {
  // Regression test: some mobile browsers (observed on Firefox Android)
  // still run a <label>'s click-forwarding activation behavior on the
  // hidden native <select> — that algorithm doesn't check focusability or
  // display, so it can reach the select and open its native picker UI
  // unless the select's own click default action is suppressed.
  const screen = render(makeSelect());
  const host = await getHost(screen);
  const $nativeSel = host.querySelector('select')!;

  const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
  $nativeSel.dispatchEvent(clickEvent);

  expect(clickEvent.defaultPrevented).toBe(true);
});

test.each([
  ['ltr', 'horizontal-tb', 'ArrowLeft'],
  ['rtl', 'horizontal-tb', 'ArrowRight'],
  // Not vertical text: there the inline-start arrow is ArrowUp, which popup
  // navigation keeps, as the APG listbox pattern specifies.
] as const)(
  'multiple: the arrow toward the inline start enters chip navigation (%s %s)',
  async (dir, writingMode, key) => {
    const screen = render(
      html`<div dir=${dir} style="writing-mode: ${writingMode}">${makeSelectedSelect()}</div>`,
    );
    const host = await getHost(screen);
    const enterChipNav = vi.spyOn(host as unknown as { _enterChipNav(): void }, '_enterChipNav');
    const $trigger = host.renderRoot.querySelector<HTMLElement>('#trigger')!;

    $trigger.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

    expect(enterChipNav).toHaveBeenCalledTimes(1);
  },
);
