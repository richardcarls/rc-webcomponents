import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { registerMessages } from '@rcarls/rc-common';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import { FLOW_FIXTURES, flowLabel, inFlow } from '../../../test-helpers/flow.js';
import './define.js';
import type { RCPagination } from './rc-pagination.js';

const linkList = html`
  <nav>
    <ul>
      <li><a href="?page=1" data-rc-page="previous" rel="prev">Previous</a></li>
      <li><a href="?page=1" data-rc-page="1">1</a></li>
      <li><a href="?page=2" data-rc-page="2">2</a></li>
      <li><a href="?page=3" data-rc-page="3">3</a></li>
      <li><a href="?page=3" data-rc-page="next" rel="next">Next</a></li>
    </ul>
  </nav>
`;

const buttonList = html`
  <nav>
    <ul>
      <li><button type="button" data-rc-page="previous"></button></li>
      <li><button type="button" data-rc-page="1">1</button></li>
      <li><button type="button" data-rc-page="2">2</button></li>
      <li><button type="button" data-rc-page="3">3</button></li>
      <li><button type="button" data-rc-page="next"></button></li>
    </ul>
  </nav>
`;

async function host(screen: ReturnType<typeof render>): Promise<RCPagination> {
  const $host = screen.container.querySelector('rc-pagination')!;

  await $host.updateComplete;

  return $host;
}

const current = ($host: Element) =>
  [...$host.querySelectorAll('[aria-current="page"]')].map(($el) => $el.textContent);

test('keeps the authored nav and controls connected with their attributes', async () => {
  const screen = render(html`<rc-pagination total="3">${linkList}</rc-pagination>`);
  const $host = await host(screen);
  const $links = [...$host.querySelectorAll('a')];

  expect($links.map(($link) => $link.getAttribute('href'))).toEqual([
    '?page=1',
    '?page=1',
    '?page=2',
    '?page=3',
    '?page=3',
  ]);

  expect($links[0]?.getAttribute('rel')).toBe('prev');
});

test('marks the current page and names the landmark and numbered controls', async () => {
  const screen = render(html`<rc-pagination total="3" page="2">${linkList}</rc-pagination>`);
  const $host = await host(screen);

  await vi.waitFor(() => expect(current($host)).toEqual(['2']));
  expect($host.querySelector('nav')?.getAttribute('aria-label')).toBe('Pagination');
  expect($host.querySelector('[data-rc-page="3"]')?.getAttribute('aria-label')).toBe('Page 3');
  // A step with visible text keeps it as its name.
  expect($host.querySelector('[data-rc-page="next"]')?.hasAttribute('aria-label')).toBe(false);
});

test('names icon-only steps and keeps authored names', async () => {
  const screen = render(html`
    <rc-pagination total="3" default-page="2">
      <nav aria-label="Results pages">
        <ul>
          <li><button type="button" data-rc-page="previous"></button></li>
          <li><button type="button" data-rc-page="1" aria-label="First results">1</button></li>
          <li><button type="button" data-rc-page="next"></button></li>
        </ul>
      </nav>
    </rc-pagination>
  `);
  const $host = await host(screen);

  await vi.waitFor(() =>
    expect($host.querySelector('[data-rc-page="previous"]')?.getAttribute('aria-label')).toBe(
      'Previous page',
    ),
  );

  expect($host.querySelector('[data-rc-page="next"]')?.getAttribute('aria-label')).toBe(
    'Next page',
  );

  expect($host.querySelector('[data-rc-page="1"]')?.getAttribute('aria-label')).toBe(
    'First results',
  );

  expect($host.querySelector('nav')?.getAttribute('aria-label')).toBe('Results pages');
});

test('disables steps past either end', async () => {
  const screen = render(
    html`<rc-pagination total="3" default-page="1">${buttonList}</rc-pagination>`,
  );
  const $host = await host(screen);
  const $previous = $host.querySelector<HTMLButtonElement>('[data-rc-page="previous"]')!;
  const $next = $host.querySelector<HTMLButtonElement>('[data-rc-page="next"]')!;

  await vi.waitFor(() => expect($previous.disabled).toBe(true));
  expect($next.disabled).toBe(false);

  $host.querySelector<HTMLButtonElement>('[data-rc-page="3"]')!.click();

  await vi.waitFor(() => expect($next.disabled).toBe(true));
  expect($previous.disabled).toBe(false);
});

test('preserves an author-disabled button after it leaves the edge', async () => {
  const screen = render(html`
    <rc-pagination total="3">
      <nav>
        <ul>
          <li><button type="button" data-rc-page="previous" disabled>Previous</button></li>
          <li><button type="button" data-rc-page="2">2</button></li>
        </ul>
      </nav>
    </rc-pagination>
  `);
  const $host = await host(screen);
  const $previous = $host.querySelector<HTMLButtonElement>('[data-rc-page="previous"]')!;

  expect($previous.disabled).toBe(true);
  $host.querySelector<HTMLButtonElement>('[data-rc-page="2"]')!.click();

  await vi.waitFor(() => expect($host.page).toBe(2));
  expect($previous.disabled).toBe(true);
});

test('restores an authored aria-disabled value after a link leaves the edge', async () => {
  const screen = render(html`
    <rc-pagination total="3">
      <nav>
        <ul>
          <li><a href="?page=1" data-rc-page="previous" aria-disabled="false">Previous</a></li>
          <li><button type="button" data-rc-page="2">2</button></li>
        </ul>
      </nav>
    </rc-pagination>
  `);
  const $host = await host(screen);
  const $previous = $host.querySelector<HTMLAnchorElement>('[data-rc-page="previous"]')!;

  await vi.waitFor(() => expect($previous.getAttribute('aria-disabled')).toBe('true'));
  $host.querySelector<HTMLButtonElement>('[data-rc-page="2"]')!.click();

  await vi.waitFor(() => expect($previous.getAttribute('aria-disabled')).toBe('false'));
});

test('uncontrolled: a click moves to the page and reports the change', async () => {
  const onChange = vi.fn();
  const screen = render(html`
    <rc-pagination total="3" @rc-pagination-change=${onChange}>${buttonList}</rc-pagination>
  `);
  const $host = await host(screen);

  $host.querySelector<HTMLButtonElement>('[data-rc-page="next"]')!.click();

  await vi.waitFor(() => expect(current($host)).toEqual(['2']));
  expect(onChange).toHaveBeenCalledOnce();
  expect(onChange.mock.calls[0]?.[0].detail).toEqual({ page: 2, previousPage: 1 });
  expect($host.page).toBe(2);
});

test('controlled: a click reports the request and the host decides', async () => {
  const onChange = vi.fn();
  const screen = render(html`
    <rc-pagination total="3" page="1" @rc-pagination-change=${onChange}
      >${buttonList}</rc-pagination
    >
  `);
  const $host = await host(screen);

  $host.querySelector<HTMLButtonElement>('[data-rc-page="3"]')!.click();
  await $host.updateComplete;

  expect(onChange.mock.calls[0]?.[0].detail).toEqual({ page: 3, previousPage: 1 });
  expect(current($host)).toEqual(['1']);

  $host.page = 3;

  await vi.waitFor(() => expect(current($host)).toEqual(['3']));
  expect(onChange).toHaveBeenCalledOnce();
});

test('canceling the change event cancels the link navigation', async () => {
  const screen = render(html`
    <rc-pagination total="3" @rc-pagination-change=${(event: Event) => event.preventDefault()}>
      ${linkList}
    </rc-pagination>
  `);
  const $host = await host(screen);
  const clicks: boolean[] = [];

  // An ancestor sees the click after the element's own listener has run.
  screen.container.addEventListener('click', (event) => clicks.push(event.defaultPrevented));
  $host.querySelector<HTMLAnchorElement>('[data-rc-page="2"]')!.click();

  expect(clicks).toEqual([true]);
  expect(current($host)).toEqual(['1']);
});

test('host writes are silent', async () => {
  const onChange = vi.fn();
  const screen = render(html`
    <rc-pagination total="3" @rc-pagination-change=${onChange}>${buttonList}</rc-pagination>
  `);
  const $host = await host(screen);

  $host.page = 3;
  $host.defaultPage = 2;
  await $host.updateComplete;

  expect(onChange).not.toHaveBeenCalled();
  expect(current($host)).toEqual(['3']);
});

test('clamps the page to the total', async () => {
  const screen = render(html`<rc-pagination total="3" page="9">${buttonList}</rc-pagination>`);
  const $host = await host(screen);

  expect($host.page).toBe(3);
  await vi.waitFor(() => expect(current($host)).toEqual(['3']));
});

test('clamps a stale numbered target before reporting and announcing it', async () => {
  const onChange = vi.fn();
  const screen = render(html`
    <rc-pagination total="3" announce @rc-pagination-change=${onChange}>
      <nav>
        <ul>
          <li><button type="button" data-rc-page="3">3</button></li>
          <li><button type="button" data-rc-page="9">9</button></li>
        </ul>
      </nav>
    </rc-pagination>
  `);
  const $host = await host(screen);

  $host.querySelector<HTMLButtonElement>('[data-rc-page="9"]')!.click();

  await vi.waitFor(() => expect($host.page).toBe(3));
  expect(onChange.mock.calls[0]?.[0].detail).toEqual({ page: 3, previousPage: 1 });
  expect(current($host)).toEqual(['3']);

  await vi.waitFor(() =>
    expect(
      [...document.querySelectorAll('[data-rc-live-announcer]')].map(($el) => $el.textContent),
    ).toContain('Page 3 of 3'),
  );
});

test('does not follow a stale numbered link beyond the total', async () => {
  const onChange = vi.fn();
  const screen = render(html`
    <rc-pagination total="3" @rc-pagination-change=${onChange}>
      <nav><a href="?page=9" data-rc-page="9">9</a></nav>
    </rc-pagination>
  `);
  const $host = await host(screen);
  const clicks: boolean[] = [];

  screen.container.addEventListener('click', (event) => clicks.push(event.defaultPrevented));
  $host.querySelector('a')!.click();

  expect(clicks).toEqual([true]);
  expect(onChange.mock.calls[0]?.[0].detail.page).toBe(3);
});

test('announces the new page when announce is set', async () => {
  const screen = render(html`<rc-pagination total="3" announce>${buttonList}</rc-pagination>`);
  const $host = await host(screen);

  $host.querySelector<HTMLButtonElement>('[data-rc-page="2"]')!.click();

  await vi.waitFor(() =>
    expect(
      [...document.querySelectorAll('[data-rc-live-announcer]')].map(($el) => $el.textContent),
    ).toContain('Page 2 of 3'),
  );
});

test('announces inside an open modal dialog, where the rest of the page is inert', async () => {
  const screen = render(html`
    <dialog data-testid="dialog">
      <rc-pagination total="3" announce>${buttonList}</rc-pagination>
    </dialog>
  `);
  const $dialog = screen.getByTestId('dialog').element() as HTMLDialogElement;

  $dialog.showModal();

  const $host = $dialog.querySelector('rc-pagination') as RCPagination;

  await $host.updateComplete;
  $host.querySelector<HTMLButtonElement>('[data-rc-page="2"]')!.click();

  await vi.waitFor(() =>
    expect($dialog.querySelector(':scope > [data-rc-live-announcer]')?.textContent).toBe(
      'Page 2 of 3',
    ),
  );

  $dialog.close();
});

test('follows its lang and formats page numbers for it', async () => {
  registerMessages('fr', {
    'rc-pagination': { label: 'Pagination des résultats', page: (page) => `Page ${page}` },
  });

  const screen = render(html`<rc-pagination lang="en" total="3">${linkList}</rc-pagination>`);
  const $host = await host(screen);
  const $nav = $host.querySelector('nav')!;

  await vi.waitFor(() => expect($nav.getAttribute('aria-label')).toBe('Pagination'));

  $host.lang = 'fr';

  await vi.waitFor(() => expect($nav.getAttribute('aria-label')).toBe('Pagination des résultats'));
});

for (const flow of FLOW_FIXTURES) {
  test(`lays controls out along the inline axis in ${flowLabel(flow)}`, async () => {
    const screen = render(
      inFlow(html`<rc-pagination total="3">${buttonList}</rc-pagination>`, flow),
    );
    const $host = await host(screen);
    const [$first, $second] = [...$host.querySelectorAll('li')].map(($li) =>
      $li.getBoundingClientRect(),
    );
    const vertical = flow.writingMode !== 'horizontal-tb';
    const reversed = flow.dir === 'rtl';
    const start = (rect: DOMRect) =>
      vertical ? (reversed ? -rect.bottom : rect.top) : reversed ? -rect.right : rect.left;

    expect(start($second!)).toBeGreaterThan(start($first!));
  });
}

test('has no accessibility violations', async () => {
  const screen = render(html`<rc-pagination total="3" page="2">${buttonList}</rc-pagination>`);

  await host(screen);
  await vi.waitFor(() => expect(screen.container.querySelector('[aria-current]')).not.toBeNull());
  await expectNoA11yViolations(screen.container);
});
