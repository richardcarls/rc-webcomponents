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

test('renders <li role="option"> elements from options property', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = OPTIONS;

  const $options = $listbox.querySelectorAll('li[role="option"]');

  expect($options).toHaveLength(3);
  expect($options[0].textContent?.trim()).toBe('Apple');
  expect($options[1].textContent?.trim()).toBe('Banana');
  expect($options[2].textContent?.trim()).toBe('Cherry');
});

test('has role=listbox on host element', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  await expect.element(screen.getByRole('listbox')).toBeInTheDocument();
});

test('injects light-DOM base styles in the rc-base cascade layer', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  await $listbox.updateComplete;

  const $style = document.head.querySelector('style[data-rc-light-dom-base="rc-listbox"]');

  expect($style).not.toBeNull();
  expect($style?.textContent).toContain('@layer rc-base');
});

test('options are wrapped in a <ul role="presentation">', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = OPTIONS;

  const $ul = $listbox.querySelector(':scope > ul');
  expect($ul).not.toBeNull();
  expect($ul?.getAttribute('role')).toBe('presentation');
});

test('has no automated accessibility violations', async () => {
  const screen = render(html`<rc-listbox aria-label="Fruit"></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = OPTIONS;
  await $listbox.updateComplete;

  await expectNoA11yViolations($listbox);
});

test('bootstraps from pre-rendered <ul>/<li> children', async () => {
  const screen = render(html`
    <rc-listbox aria-label="Fruit">
      <ul>
        <li value="apple">Apple</li>
        <li value="banana">Banana</li>
      </ul>
    </rc-listbox>
  `);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;
  await $listbox.updateComplete;

  const $opts = $listbox.querySelectorAll('li[role="option"]');

  expect($opts).toHaveLength(2);
  expect($opts[0].getAttribute('data-value')).toBe('apple');
  expect($opts[1].getAttribute('data-value')).toBe('banana');
});

test('options setter replaces pre-rendered DOM', async () => {
  const screen = render(html`
    <rc-listbox aria-label="Fruit">
      <ul>
        <li value="apple">Apple</li>
      </ul>
    </rc-listbox>
  `);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;
  await $listbox.updateComplete;

  $listbox.options = [{ value: 'cherry', label: 'Cherry' }];

  const $opts = $listbox.querySelectorAll('li[role="option"]');

  expect($opts).toHaveLength(1);
  expect($opts[0].getAttribute('data-value')).toBe('cherry');
  expect($opts[0].textContent?.trim()).toBe('Cherry');
});

test('aria-selected reflects setSelectedValues', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = OPTIONS;
  $listbox.setSelectedValues(['apple']);

  const $opts = $listbox.querySelectorAll('li[role="option"]');

  expect($opts[0].getAttribute('aria-selected')).toBe('true');
  expect($opts[1].getAttribute('aria-selected')).toBe('false');
});

test('selected option colors use CSS custom properties', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.style.setProperty('--rc-listbox-selected-bg', 'rgb(1, 2, 3)');
  $listbox.style.setProperty('--rc-listbox-selected-color', 'rgb(4, 5, 6)');
  $listbox.options = OPTIONS;
  $listbox.setSelectedValues(['apple']);

  const $option = $listbox.querySelector('li[role="option"][aria-selected="true"]');

  expect($option).not.toBeNull();
  expect(getComputedStyle($option!).backgroundColor).toBe('rgb(1, 2, 3)');
  expect(getComputedStyle($option!).color).toBe('rgb(4, 5, 6)');
});

test('option row sizing uses CSS custom properties', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.style.setProperty('--rc-listbox-option-gap', '9px');
  $listbox.style.setProperty('--rc-listbox-option-min-block-size', '44px');
  $listbox.style.setProperty('--rc-listbox-option-padding-block', '5px');
  $listbox.style.setProperty('--rc-listbox-option-padding-inline', '7px');
  $listbox.options = OPTIONS;

  const $option = $listbox.querySelector('li[role="option"]') as HTMLElement;
  const styles = getComputedStyle($option);

  expect(styles.gap).toBe('9px');
  expect(styles.minBlockSize).toBe('44px');
  expect(styles.paddingBlockStart).toBe('5px');
  expect(styles.paddingInlineStart).toBe('7px');
});

test('toggleOption selects in single mode and fires rc-listbox-change', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = OPTIONS;

  const handler = vi.fn();

  $listbox.addEventListener('rc-listbox-change', handler);
  $listbox.toggleOption('banana');

  expect($listbox.selectedValues).toEqual(['banana']);
  expect(handler).toHaveBeenCalledOnce();
  expect(handler.mock.calls[0][0].detail).toMatchObject({
    value: 'banana',
    selected: true,
    optionValue: 'banana',
    selectedValues: ['banana'],
    selectedOptions: [{ value: 'banana', label: 'Banana' }],
  });
});

test('toggleOption deselects in single mode', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = OPTIONS;
  $listbox.setSelectedValues(['banana']);
  $listbox.toggleOption('banana');

  expect($listbox.selectedValues).toEqual([]);
});

test('multiple mode: toggleOption toggles without clearing others', async () => {
  const screen = render(html`<rc-listbox multiple></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = OPTIONS;
  $listbox.setSelectedValues(['apple']);
  $listbox.toggleOption('banana');

  expect($listbox.selectedValues).toContain('apple');
  expect($listbox.selectedValues).toContain('banana');
});

test('multiple: aria-multiselectable="true" on host', async () => {
  const screen = render(html`<rc-listbox multiple></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  await $listbox.updateComplete;

  expect($listbox.getAttribute('aria-multiselectable')).toBe('true');
});

test('filterOptions hides non-matching options', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = OPTIONS;
  $listbox.filterOptions('ba');

  const $opts = $listbox.querySelectorAll('li[role="option"]');

  expect(($opts[0] as HTMLElement).hidden).toBe(true);
  expect(($opts[1] as HTMLElement).hidden).toBe(false);
});

test('clearFilter shows all options', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = OPTIONS;
  $listbox.filterOptions('xy');
  $listbox.clearFilter();

  const $opts = $listbox.querySelectorAll('li[role="option"]');

  expect(($opts[0] as HTMLElement).hidden).toBe(false);
  expect(($opts[1] as HTMLElement).hidden).toBe(false);
});

test('navigableItems excludes hidden and disabled options', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = OPTIONS;
  $listbox.filterOptions('ba');

  const $nav = $listbox.navigableItems;

  expect($nav).toHaveLength(1);
  expect($nav[0].getAttribute('data-value')).toBe('banana');
});

test('disabled option: aria-disabled="true", excluded from navigableItems', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = OPTIONS;

  const $opts = $listbox.querySelectorAll('li[role="option"]');

  expect($opts[2].getAttribute('aria-disabled')).toBe('true');
  expect($listbox.navigableItems.map((e) => e.getAttribute('data-value'))).not.toContain('cherry');
});

test('appendOption adds new option to end of list', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = [{ value: 'a', label: 'A' }];
  $listbox.appendOption({ value: 'b', label: 'B' });

  const $opts = $listbox.querySelectorAll('li[role="option"]');

  expect($opts).toHaveLength(2);
  expect($opts[1].textContent?.trim()).toBe('B');
});

test('setCreateOption shows Create option in navigableItems', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = [{ value: 'a', label: 'A' }];
  $listbox.setCreateOption('NewThing');

  const $createOpt = $listbox.querySelector('[part~="create-option"]');

  expect($createOpt).not.toBeNull();
  expect($createOpt!.getAttribute('data-action')).toBe('create');
  expect($createOpt!.textContent).toContain('NewThing');
  expect($listbox.navigableItems).toContain($createOpt);
});

test('setCreateOption(null) removes Create option', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = [{ value: 'a', label: 'A' }];
  $listbox.setCreateOption('NewThing');
  $listbox.setCreateOption(null);

  expect($listbox.querySelector('[part~="create-option"]')).toBeNull();
});

test('Create option fires rc-listbox-change as an action detail', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = [];
  $listbox.setCreateOption('Foo');
  await $listbox.updateComplete;

  const handler = vi.fn();

  $listbox.addEventListener('rc-listbox-change', handler);

  const $createEl = $listbox.querySelector<HTMLElement>('[data-action="create"]')!;

  $createEl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));

  expect(handler).toHaveBeenCalledOnce();
  expect(handler.mock.calls[0][0].detail).toMatchObject({
    reason: 'action',
    action: 'create',
    selected: false,
    option: {
      kind: 'action',
      action: 'create',
      value: 'create:Foo',
      label: 'Create "Foo"',
      data: { text: 'Foo' },
    },
    selectedValues: [],
  });
});

test('action options dispatch action details without changing selection', async () => {
  const screen = render(html`<rc-listbox></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = [
    { value: 'apple', label: 'Apple' },
    { kind: 'action', action: 'clear', value: 'clear', label: 'Clear selection' },
  ];
  $listbox.setSelectedValues(['apple', 'clear']);
  await $listbox.updateComplete;

  const handler = vi.fn();

  $listbox.addEventListener('rc-listbox-change', handler);

  $listbox
    .querySelector<HTMLElement>('[data-action="clear"]')!
    .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));

  expect($listbox.selectedValues).toEqual(['apple']);
  expect(handler).toHaveBeenCalledOnce();
  expect(handler.mock.calls[0][0].detail).toMatchObject({
    reason: 'action',
    action: 'clear',
    selected: false,
    optionValue: 'clear',
    selectedValues: ['apple'],
  });
});

test('checkmark injects option-checkmark spans', async () => {
  const screen = render(html`<rc-listbox checkmark></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = OPTIONS;
  await $listbox.updateComplete;

  const $opts = $listbox.querySelectorAll('li[role="option"]');

  expect($opts[0].querySelector('[part="option-checkmark"]')).not.toBeNull();
});

test('checkmark=false removes option-checkmark spans', async () => {
  const screen = render(html`<rc-listbox checkmark></rc-listbox>`);
  const $listbox = (await screen.getByRole('listbox').element()) as RCListbox;

  $listbox.options = OPTIONS;
  await $listbox.updateComplete;

  $listbox.checkmark = false;
  await $listbox.updateComplete;

  const $opts = $listbox.querySelectorAll('li[role="option"]');

  expect($opts[0].querySelector('[part="option-checkmark"]')).toBeNull();
});
