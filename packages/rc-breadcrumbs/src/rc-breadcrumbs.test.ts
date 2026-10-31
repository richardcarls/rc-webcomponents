import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { registerMessages } from '@rcarls/rc-common';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import { FLOW_FIXTURES, flowLabel, inFlow } from '../../../test-helpers/flow.js';
import './define.js';
import type { RCBreadcrumbs } from './rc-breadcrumbs.js';

const trail = (current = true) => html`
  <nav>
    <ol>
      <li><a href="/">Home</a></li>
      <li><a href="/settings">Settings</a></li>
      <li><a href="/settings/members" aria-current=${current ? 'page' : 'false'}>Members</a></li>
    </ol>
  </nav>
`;

async function host(screen: ReturnType<typeof render>): Promise<RCBreadcrumbs> {
  const $host = screen.container.querySelector('rc-breadcrumbs')!;

  await $host.updateComplete;

  return $host;
}

test('keeps the authored nav, list, and links connected and intact', async () => {
  const screen = render(html`<rc-breadcrumbs>${trail()}</rc-breadcrumbs>`);
  const $host = await host(screen);
  const $links = $host.querySelectorAll('nav > ol > li > a');

  expect($links).toHaveLength(3);

  expect([...$links].map(($link) => $link.getAttribute('href'))).toEqual([
    '/',
    '/settings',
    '/settings/members',
  ]);

  expect($host.querySelector(':scope > nav')?.isConnected).toBe(true);
});

test('names an unlabeled nav landmark and leaves an authored name alone', async () => {
  const screen = render(html`
    <rc-breadcrumbs id="plain">${trail()}</rc-breadcrumbs>
    <rc-breadcrumbs id="named">
      <nav aria-label="You are here">
        <ol>
          <li><a href="/">Home</a></li>
        </ol>
      </nav>
    </rc-breadcrumbs>
    <span id="external">Location</span>
    <rc-breadcrumbs id="labelledby">
      <nav aria-labelledby="external">
        <ol>
          <li><a href="/">Home</a></li>
        </ol>
      </nav>
    </rc-breadcrumbs>
  `);

  await host(screen);

  const nav = (id: string) => screen.container.querySelector(`#${id} > nav`)!;

  await vi.waitFor(() => expect(nav('plain').getAttribute('aria-label')).toBe('Breadcrumb'));
  expect(nav('named').getAttribute('aria-label')).toBe('You are here');
  expect(nav('labelledby').hasAttribute('aria-label')).toBe(false);
});

test('follows its lang for the landmark name and updates when lang changes', async () => {
  registerMessages('fr', { 'rc-breadcrumbs': { label: "Fil d'Ariane" } });

  const screen = render(html`<rc-breadcrumbs lang="en">${trail()}</rc-breadcrumbs>`);
  const $host = await host(screen);
  const $nav = $host.querySelector('nav')!;

  await vi.waitFor(() => expect($nav.getAttribute('aria-label')).toBe('Breadcrumb'));

  $host.lang = 'fr';

  await vi.waitFor(() => expect($nav.getAttribute('aria-label')).toBe("Fil d'Ariane"));
});

test('moves aria-current to the link matching current-href, ignoring the fragment', async () => {
  const screen = render(
    html`<rc-breadcrumbs current-href="/settings#team">${trail()}</rc-breadcrumbs>`,
  );
  const $host = await host(screen);
  const current = () =>
    [...$host.querySelectorAll('[aria-current="page"]')].map(($el) => $el.textContent);

  await vi.waitFor(() => expect(current()).toEqual(['Settings']));

  $host.currentHref = '/';

  await vi.waitFor(() => expect(current()).toEqual(['Home']));
});

test('releases aria-current it wrote when current-href is removed', async () => {
  const screen = render(
    html`<rc-breadcrumbs current-href="/settings">${trail(false)}</rc-breadcrumbs>`,
  );
  const $host = await host(screen);
  const $settings = $host.querySelector('a[href="/settings"]')!;

  await vi.waitFor(() => expect($settings.getAttribute('aria-current')).toBe('page'));

  $host.removeAttribute('current-href');

  await vi.waitFor(() => expect($settings.hasAttribute('aria-current')).toBe(false));
});

test('leaves authored aria-current alone without current-href', async () => {
  const screen = render(html`<rc-breadcrumbs>${trail()}</rc-breadcrumbs>`);
  const $host = await host(screen);

  expect($host.querySelector('a[href="/settings/members"]')?.getAttribute('aria-current')).toBe(
    'page',
  );
});

test('marks a link added after upgrade when it matches current-href', async () => {
  const screen = render(html`
    <rc-breadcrumbs current-href="/reports">
      <nav>
        <ol>
          <li><a href="/">Home</a></li>
        </ol>
      </nav>
    </rc-breadcrumbs>
  `);
  const $host = await host(screen);
  const $item = document.createElement('li');

  $item.innerHTML = '<a href="/reports">Reports</a>';
  $host.querySelector('ol')!.append($item);

  await vi.waitFor(() =>
    expect($item.querySelector('a')?.getAttribute('aria-current')).toBe('page'),
  );
});

test('draws separators that are not part of the text or accessible names', async () => {
  const screen = render(html`<rc-breadcrumbs>${trail()}</rc-breadcrumbs>`);
  const $host = await host(screen);
  const [$first, $second] = $host.querySelectorAll('li');

  expect(getComputedStyle($first!, '::before').content).toBe('none');
  expect(getComputedStyle($second!, '::before').content).toContain('/');

  expect($host.querySelector('ol')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
    'Home Settings Members',
  );
});

test('warns in development when the nav is missing', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  const screen = render(
    html`<rc-breadcrumbs
      ><ol>
        <li>Home</li>
      </ol></rc-breadcrumbs
    >`,
  );

  await host(screen);

  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining('No direct child <nav>'),
    expect.anything(),
  );

  warn.mockRestore();
});

for (const flow of FLOW_FIXTURES) {
  test(`lays items out along the inline axis in ${flowLabel(flow)}`, async () => {
    const screen = render(inFlow(html`<rc-breadcrumbs>${trail()}</rc-breadcrumbs>`, flow));
    const $host = await host(screen);
    const [$first, $second] = [...$host.querySelectorAll('li')].map(($li) =>
      $li.getBoundingClientRect(),
    );
    const vertical = flow.writingMode !== 'horizontal-tb';
    const reversed = flow.dir === 'rtl';
    // The inline axis runs left to right, right to left, top to bottom, or
    // bottom to top, depending on the writing mode and direction.
    const start = (rect: DOMRect) =>
      vertical ? (reversed ? -rect.bottom : rect.top) : reversed ? -rect.right : rect.left;

    expect(start($second!)).toBeGreaterThan(start($first!));
  });
}

test('has no accessibility violations', async () => {
  const screen = render(
    html`<rc-breadcrumbs current-href="/settings/members">${trail(false)}</rc-breadcrumbs>`,
  );

  await host(screen);
  await expectNoA11yViolations(screen.container);
});
