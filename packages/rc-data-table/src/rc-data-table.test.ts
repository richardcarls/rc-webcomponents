import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { registerMessages } from '@rcarls/rc-common';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import './define.js';
import type { RCDataTable } from './rc-data-table.js';

const table = html`
  <table>
    <caption>
      Products. Column headers with buttons are sortable.
    </caption>
    <thead>
      <tr>
        <th scope="col" data-rc-sort-key="name"><button type="button">Name</button></th>
        <th scope="col" data-rc-sort-key="price" data-rc-sort-first="descending">
          <button type="button">Price</button>
        </th>
        <th scope="col">Notes</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Alpha</td>
        <td>3</td>
        <td>—</td>
      </tr>
      <tr>
        <td>Beta</td>
        <td>1</td>
        <td>—</td>
      </tr>
    </tbody>
  </table>
`;

async function host(screen: ReturnType<typeof render>): Promise<RCDataTable> {
  const $host = screen.container.querySelector('rc-data-table')!;

  await $host.updateComplete;

  return $host;
}

const header = ($host: Element, key: string) =>
  $host.querySelector<HTMLTableCellElement>(`th[data-rc-sort-key="${key}"]`)!;
const sortButton = ($host: Element, key: string) =>
  header($host, key).querySelector<HTMLButtonElement>('button')!;
const sorted = ($host: Element) =>
  [...$host.querySelectorAll('th[aria-sort]')].map(
    ($th) => `${($th as HTMLElement).dataset.rcSortKey}:${$th.getAttribute('aria-sort')}`,
  );

test('keeps the authored table, header buttons, and rows intact', async () => {
  const screen = render(html`<rc-data-table>${table}</rc-data-table>`);
  const $host = await host(screen);

  expect($host.querySelector(':scope > table')?.isConnected).toBe(true);
  expect($host.querySelectorAll('tbody tr')).toHaveLength(2);
  expect(sortButton($host, 'name').textContent).toBe('Name');
  expect(sorted($host)).toEqual([]);
});

test('reflects the default sort as aria-sort on the active header only', async () => {
  const screen = render(html`
    <rc-data-table default-sort-key="price" default-sort-direction="descending"
      >${table}</rc-data-table
    >
  `);
  const $host = await host(screen);

  await vi.waitFor(() => expect(sorted($host)).toEqual(['price:descending']));
  expect(header($host, 'name').hasAttribute('aria-sort')).toBe(false);
});

test('uncontrolled: activating a header sorts by it, then toggles its direction', async () => {
  const onSort = vi.fn();
  const screen = render(html`
    <rc-data-table @rc-data-table-sort=${onSort}>${table}</rc-data-table>
  `);
  const $host = await host(screen);

  sortButton($host, 'name').click();
  await vi.waitFor(() => expect(sorted($host)).toEqual(['name:ascending']));

  sortButton($host, 'name').click();
  await vi.waitFor(() => expect(sorted($host)).toEqual(['name:descending']));

  expect(onSort.mock.calls.map(([event]) => event.detail)).toEqual([
    { key: 'name', direction: 'ascending', previousKey: undefined, previousDirection: undefined },
    { key: 'name', direction: 'descending', previousKey: 'name', previousDirection: 'ascending' },
  ]);
});

test('a column can start descending', async () => {
  const screen = render(html`<rc-data-table default-sort-key="name">${table}</rc-data-table>`);
  const $host = await host(screen);

  sortButton($host, 'price').click();

  await vi.waitFor(() => expect(sorted($host)).toEqual(['price:descending']));
});

test('controlled: a request is reported and the host decides', async () => {
  const onSort = vi.fn();
  const screen = render(html`
    <rc-data-table sort-key="name" sort-direction="ascending" @rc-data-table-sort=${onSort}>
      ${table}
    </rc-data-table>
  `);
  const $host = await host(screen);

  sortButton($host, 'price').click();
  await $host.updateComplete;

  expect(onSort.mock.calls[0]?.[0].detail.key).toBe('price');
  expect(sorted($host)).toEqual(['name:ascending']);

  $host.sortKey = 'price';
  $host.sortDirection = 'descending';

  await vi.waitFor(() => expect(sorted($host)).toEqual(['price:descending']));
});

test('host writes are silent', async () => {
  const onSort = vi.fn();
  const screen = render(html`
    <rc-data-table @rc-data-table-sort=${onSort}>${table}</rc-data-table>
  `);
  const $host = await host(screen);

  $host.sortKey = 'name';
  $host.defaultSortDirection = 'descending';
  await $host.updateComplete;

  expect(onSort).not.toHaveBeenCalled();
  expect(sorted($host)).toEqual(['name:descending']);
});

test('canceling the sort event leaves the state and cancels a header link', async () => {
  const screen = render(html`
    <rc-data-table @rc-data-table-sort=${(event: Event) => event.preventDefault()}>
      <table>
        <caption>
          Products
        </caption>
        <thead>
          <tr>
            <th scope="col" data-rc-sort-key="name"><a href="?sort=name">Name</a></th>
          </tr>
        </thead>
      </table>
    </rc-data-table>
  `);
  const $host = await host(screen);
  const clicks: boolean[] = [];

  // An ancestor sees the click after the element's own listener has run.
  screen.container.addEventListener('click', (event) => clicks.push(event.defaultPrevented));
  $host.querySelector('a')!.click();

  expect(clicks).toEqual([true]);
  expect(sorted($host)).toEqual([]);
});

test('shows a distinct indicator for unsorted, ascending, and descending columns', async () => {
  const screen = render(html`<rc-data-table default-sort-key="name">${table}</rc-data-table>`);
  const $host = await host(screen);
  const indicator = (key: string) => getComputedStyle(sortButton($host, key), '::after').content;

  await vi.waitFor(() => expect(sorted($host)).toEqual(['name:ascending']));
  expect(indicator('name')).toContain('▲');
  expect(indicator('price')).toContain('◇');

  sortButton($host, 'name').click();

  await vi.waitFor(() => expect(indicator('name')).toContain('▼'));
  // The indicator is not part of the button's name.
  expect(sortButton($host, 'name').textContent).toBe('Name');
});

test('announces the sort when announce is set, in the element language', async () => {
  registerMessages('fr', {
    'rc-data-table': {
      sorted: (column, direction) =>
        `Trié par ${column}, ${direction === 'ascending' ? 'croissant' : 'décroissant'}`,
    },
  });

  const screen = render(html`<rc-data-table lang="fr" announce>${table}</rc-data-table>`);
  const $host = await host(screen);

  sortButton($host, 'name').click();

  await vi.waitFor(() =>
    expect(
      [...document.querySelectorAll('[data-rc-live-announcer]')].map(($el) => $el.textContent),
    ).toContain('Trié par Name, croissant'),
  );
});

test('becomes a focusable group named by the caption only while the table overflows', async () => {
  const screen = render(html`
    <div style="inline-size: 120px">
      <rc-data-table>${table}</rc-data-table>
    </div>
  `);
  const $host = await host(screen);

  await vi.waitFor(() => expect($host.getAttribute('role')).toBe('group'));
  expect($host.tabIndex).toBe(0);
  expect($host.getAttribute('aria-labelledby')).toBe($host.querySelector('caption')?.id);

  ($host.parentElement as HTMLElement).style.inlineSize = '2000px';

  await vi.waitFor(() => expect($host.hasAttribute('role')).toBe(false));
  expect($host.hasAttribute('tabindex')).toBe(false);
});

test('warns in development about a sortable header without a button', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const screen = render(html`
    <rc-data-table>
      <table>
        <caption>
          Products
        </caption>
        <thead>
          <tr>
            <th scope="col" data-rc-sort-key="name">Name</th>
          </tr>
        </thead>
      </table>
    </rc-data-table>
  `);

  await host(screen);

  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining('no direct child <button>'),
    expect.anything(),
  );

  warn.mockRestore();
});

test('has no accessibility violations while sorted', async () => {
  const screen = render(html`
    <div style="inline-size: 120px">
      <rc-data-table default-sort-key="name">${table}</rc-data-table>
    </div>
  `);
  const $host = await host(screen);

  await vi.waitFor(() => expect(sorted($host)).toEqual(['name:ascending']));
  await expectNoA11yViolations(screen.container);
});
