import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import './define.js';
import type { RCListItem } from './rc-list-item.js';
import type { RCList } from './rc-list.js';

async function settle(list: RCList): Promise<void> {
  await list.updateComplete;

  await Promise.all(
    Array.from(list.querySelectorAll<RCListItem>('rc-list-item'), (item) => item.updateComplete),
  );

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

test('aligns mixed leading and trailing content through shared subgrid columns', async () => {
  const screen = render(html`
    <rc-list data-testid="list" style="inline-size: 24rem">
      <rc-list-item data-testid="first">
        <span slot="leading" style="display:block; inline-size:3rem">A</span>
        Alpha
      </rc-list-item>
      <rc-list-item data-testid="second">
        <span slot="leading" style="display:block; inline-size:1rem">B</span>
        Beta
        <span slot="trailing">Details</span>
      </rc-list-item>
    </rc-list>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;
  const first = (await screen.getByTestId('first').element()) as RCListItem;
  const second = (await screen.getByTestId('second').element()) as RCListItem;

  await settle(list);

  const firstContent = first.shadowRoot?.querySelector('[part="content"]');
  const secondContent = second.shadowRoot?.querySelector('[part="content"]');

  expect(list.hasAttribute('has-leading')).toBe(true);
  expect(list.hasAttribute('has-trailing')).toBe(true);

  expect(firstContent?.getBoundingClientRect().left).toBeCloseTo(
    secondContent?.getBoundingClientRect().left ?? 0,
  );
});

test('collapses globally unused optional columns', async () => {
  const screen = render(html`
    <rc-list data-testid="list" style="inline-size: 20rem; --rc-list-padding-inline: 1rem">
      <rc-list-item data-testid="item">Only content</rc-list-item>
    </rc-list>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;
  const item = (await screen.getByTestId('item').element()) as RCListItem;

  await settle(list);

  const content = item.shadowRoot?.querySelector('[part="content"]');

  expect(list.hasAttribute('has-leading')).toBe(false);
  expect(list.hasAttribute('has-trailing')).toBe(false);

  expect(
    (content?.getBoundingClientRect().left ?? 0) - list.getBoundingClientRect().left,
  ).toBeCloseTo(16);

  expect(list.getAttribute('role')).toBe('list');
  expect(item.getAttribute('role')).toBe('listitem');
});

test('supports consumer container queries that stack trailing content', async () => {
  const screen = render(html`
    <style>
      .list-container {
        container-type: inline-size;
        inline-size: 18rem;
      }

      @container (max-width: 20rem) {
        rc-list {
          --rc-list-trailing-size: 0;
          --rc-list-trailing-gap: 0;
          --rc-list-item-grid-template-rows: auto auto;
          --rc-list-item-row-gap: 0.25rem;
          --rc-list-item-leading-grid-row: 1 / -1;
          --rc-list-item-content-grid-row: 1;
          --rc-list-item-trailing-grid-column: content-start / content-end;
          --rc-list-item-trailing-grid-row: 2;
          --rc-list-item-trailing-justify-self: start;
        }
      }
    </style>
    <div class="list-container">
      <rc-list data-testid="list">
        <rc-list-item data-testid="item">
          <span slot="leading">A</span>
          Alpha
          <span slot="trailing">Supporting text</span>
        </rc-list-item>
      </rc-list>
    </div>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;
  const item = (await screen.getByTestId('item').element()) as RCListItem;

  await settle(list);

  const content = item.shadowRoot?.querySelector<HTMLElement>('[part="content"]');
  const trailing = item.shadowRoot?.querySelector<HTMLElement>('[part="trailing"]');

  if (!content || !trailing) {
    throw new Error('Expected the content and trailing list-item regions to render.');
  }

  expect(trailing.getBoundingClientRect().top).toBeGreaterThan(content.getBoundingClientRect().top);
  expect(trailing.getBoundingClientRect().left).toBeCloseTo(content.getBoundingClientRect().left);
  expect(getComputedStyle(trailing).justifySelf).toBe('start');
});

test('preserves author-provided host roles', async () => {
  const screen = render(html`
    <rc-list data-testid="list" role="group">
      <rc-list-item data-testid="item" role="presentation">Content</rc-list-item>
    </rc-list>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;
  const item = (await screen.getByTestId('item').element()) as RCListItem;

  await settle(list);

  expect(list.getAttribute('role')).toBe('group');
  expect(item.getAttribute('role')).toBe('presentation');
});

test('assigns segmented row positions as visible children change', async () => {
  const screen = render(html`
    <rc-list data-testid="list" variant="segmented">
      <rc-list-item data-testid="first">Alpha</rc-list-item>
      <rc-list-item data-testid="second">Beta</rc-list-item>
      <rc-list-item data-testid="third">Gamma</rc-list-item>
    </rc-list>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;
  const first = (await screen.getByTestId('first').element()) as RCListItem;
  const second = (await screen.getByTestId('second').element()) as RCListItem;
  const third = (await screen.getByTestId('third').element()) as RCListItem;

  await settle(list);

  expect(first.dataset.rcListPosition).toBe('first');
  expect(second.dataset.rcListPosition).toBe('middle');
  expect(third.dataset.rcListPosition).toBe('last');

  second.hidden = true;
  await settle(list);

  expect(first.dataset.rcListPosition).toBe('first');
  expect(third.dataset.rcListPosition).toBe('last');
});

test('mirrors native radio state and activates it from the row surface', async () => {
  const screen = render(html`
    <rc-list data-testid="list" selection="single">
      <rc-list-item data-testid="first">
        <input slot="leading" type="radio" name="choice" value="a" checked />
        Alpha
      </rc-list-item>
      <rc-list-item data-testid="second">
        <input slot="leading" type="radio" name="choice" value="b" />
        Beta
      </rc-list-item>
    </rc-list>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;
  const first = (await screen.getByTestId('first').element()) as RCListItem;
  const second = (await screen.getByTestId('second').element()) as RCListItem;

  await settle(list);

  expect(first.selected).toBe(true);
  expect(second.selected).toBe(false);

  (second.shadowRoot?.querySelector('[part="row"]') as HTMLElement).click();
  await settle(list);

  expect(first.querySelector('input')?.checked).toBe(false);
  expect(second.querySelector('input')?.checked).toBe(true);
  expect(first.selected).toBe(false);
  expect(second.selected).toBe(true);
});

test('mirrors native checkbox checked and disabled state', async () => {
  const screen = render(html`
    <rc-list data-testid="list" selection="multiple">
      <rc-list-item data-testid="item">
        <input slot="leading" type="checkbox" checked disabled />
        Alpha
      </rc-list-item>
    </rc-list>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;
  const item = (await screen.getByTestId('item').element()) as RCListItem;

  await settle(list);

  expect(item.selected).toBe(true);
  expect(item.disabled).toBe(true);
  expect(item.interactive).toBe(true);
});

test('restores author-owned item state when native selection coordination ends', async () => {
  const screen = render(html`
    <rc-list data-testid="list" selection="multiple">
      <rc-list-item data-testid="item" selected>
        <input slot="leading" type="checkbox" disabled />
        Recipes
      </rc-list-item>
    </rc-list>
  `);
  const $list = (await screen.getByTestId('list').element()) as RCList;
  const $item = (await screen.getByTestId('item').element()) as RCListItem;

  await settle($list);

  expect($item.selected).toBe(false);
  expect($item.disabled).toBe(true);
  expect($item.interactive).toBe(true);

  $list.selection = 'none';
  await settle($list);

  expect($item.selected).toBe(true);
  expect($item.disabled).toBe(false);
  expect($item.interactive).toBe(false);
});

test('does not hijack independent interactive descendants', async () => {
  const handler = vi.fn();
  const screen = render(html`
    <rc-list data-testid="list" selection="multiple">
      <rc-list-item data-testid="item">
        <input slot="leading" type="checkbox" />
        Alpha
        <button slot="trailing" @click=${handler}>More</button>
      </rc-list-item>
    </rc-list>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;
  const item = (await screen.getByTestId('item').element()) as RCListItem;

  await settle(list);
  item.querySelector('button')?.click();
  await settle(list);

  expect(handler).toHaveBeenCalledOnce();
  expect(item.querySelector('input')?.checked).toBe(false);
});

test('decorative trailing content does not intercept row hit testing', async () => {
  const screen = render(html`
    <rc-list data-testid="list">
      <rc-list-item data-testid="item" interactive action-target="theme-trigger">
        <button id="theme-trigger" type="button">Theme</button>
        <span slot="trailing" aria-hidden="true">chevron_right</span>
      </rc-list-item>
    </rc-list>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;
  const item = (await screen.getByTestId('item').element()) as RCListItem;

  await settle(list);

  expect(
    getComputedStyle(item.querySelector<HTMLElement>('[slot="trailing"]')!).pointerEvents,
  ).toBe('none');
});

test('action-target forwards surface clicks to a same-root anchor or button', async () => {
  const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
  const screen = render(html`
    <rc-list data-testid="list">
      <rc-list-item data-testid="item" interactive action-target="theme-trigger">
        <button id="theme-trigger" type="button" @click=${onClick}>Theme</button>
        <span slot="trailing">Use device setting</span>
      </rc-list-item>
    </rc-list>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;
  const item = (await screen.getByTestId('item').element()) as RCListItem;

  await settle(list);

  item.shadowRoot
    ?.querySelector('[part="trailing"]')
    ?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));

  expect(onClick).toHaveBeenCalledOnce();
});

test('action-target skips clicks that begin inside interactive descendants', async () => {
  const onTriggerClick = vi.fn((event: MouseEvent) => event.preventDefault());
  const onNestedClick = vi.fn();
  const screen = render(html`
    <rc-list data-testid="list">
      <rc-list-item data-testid="item" interactive action-target="theme-trigger">
        <button id="theme-trigger" type="button" @click=${onTriggerClick}>Theme</button>
        <button slot="trailing" @click=${onNestedClick}>Reset</button>
      </rc-list-item>
    </rc-list>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;
  const item = (await screen.getByTestId('item').element()) as RCListItem;

  await settle(list);
  item.querySelector<HTMLButtonElement>('[slot="trailing"]')?.click();

  expect(onNestedClick).toHaveBeenCalledOnce();
  expect(onTriggerClick).not.toHaveBeenCalled();
});

test('action-target preserves modifier-qualified clicks on row dead space', async () => {
  const onClick = vi.fn();
  const screen = render(html`
    <rc-list data-testid="list">
      <rc-list-item data-testid="item" interactive action-target="theme-trigger">
        <button id="theme-trigger" type="button" @click=${onClick}>Theme</button>
        <span slot="trailing">Use device setting</span>
      </rc-list-item>
    </rc-list>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;
  const item = (await screen.getByTestId('item').element()) as RCListItem;

  await settle(list);

  item.shadowRoot?.querySelector('[part="trailing"]')?.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      composed: true,
      cancelable: true,
      metaKey: true,
    }),
  );

  expect(onClick).not.toHaveBeenCalled();
});

test('action-target does not forward when not interactive or when disabled', async () => {
  const onClick = vi.fn();
  const screen = render(html`
    <rc-list data-testid="list">
      <rc-list-item data-testid="not-interactive" action-target="a">
        <button id="a" type="button" @click=${onClick}>A</button>
        <span slot="trailing">Dead space</span>
      </rc-list-item>
      <rc-list-item data-testid="disabled" interactive disabled action-target="b">
        <button id="b" type="button" @click=${onClick}>B</button>
        <span slot="trailing">Dead space</span>
      </rc-list-item>
    </rc-list>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;
  const notInteractive = (await screen.getByTestId('not-interactive').element()) as RCListItem;
  const disabledItem = (await screen.getByTestId('disabled').element()) as RCListItem;

  await settle(list);

  for (const item of [notInteractive, disabledItem]) {
    item.shadowRoot
      ?.querySelector('[part="trailing"]')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));
  }

  expect(onClick).not.toHaveBeenCalled();
});

test('warns about invalid selecting-list children in development', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const screen = render(html`
    <rc-list data-testid="list" selection="single">
      <div>Not a list item</div>
      <rc-list-item>Missing radio</rc-list-item>
    </rc-list>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;

  await settle(list);

  expect(warn).toHaveBeenCalledTimes(2);
  warn.mockRestore();
});

test('warns when interactive has no action-target and no native checkbox/radio', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const screen = render(html`
    <rc-list data-testid="list">
      <rc-list-item data-testid="unwired" interactive>
        <button type="button">Unreachable</button>
      </rc-list-item>
      <rc-list-item data-testid="wired" interactive action-target="wired-target">
        <button id="wired-target" type="button">Reachable</button>
      </rc-list-item>
      <rc-list-item data-testid="native-input" interactive>
        <input type="checkbox" />
      </rc-list-item>
      <rc-list-item data-testid="not-interactive">
        <button type="button">Fine as-is</button>
      </rc-list-item>
    </rc-list>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;

  await settle(list);

  expect(warn).toHaveBeenCalledTimes(1);

  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining(
      '[rc-list-item] interactive is set with no action-target and no direct-child',
    ),
    await screen.getByTestId('unwired').element(),
  );

  warn.mockRestore();
});

test('has no automated accessibility violations with native selection', async () => {
  const screen = render(html`
    <rc-list data-testid="list" selection="multiple" aria-label="Recipe filters">
      <rc-list-item>
        <input slot="leading" type="checkbox" aria-label="Vegetarian" />
        Vegetarian
      </rc-list-item>
      <rc-list-item>
        <input slot="leading" type="checkbox" aria-label="Quick" />
        Quick
      </rc-list-item>
    </rc-list>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;

  await settle(list);
  await expectNoA11yViolations(list);
});
