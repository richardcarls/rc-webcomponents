import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import './define.js';
import type { RCCard } from './rc-card.js';

async function flushCard(host: RCCard): Promise<void> {
  await host.updateComplete;
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await host.updateComplete;
}

function getPart(host: RCCard, partName: string): HTMLElement {
  const $part = host.shadowRoot?.querySelector<HTMLElement>(`[part="${partName}"]`);

  if (!$part) {
    throw new Error(`Missing rc-card part: ${partName}`);
  }

  return $part;
}

test('reflects slot presence attributes', async () => {
  const screen = render(html`
    <rc-card data-testid="host">
      <img slot="media" alt="" />
      <h2 slot="title">Recipe</h2>
      <p slot="subtitle">Dinner</p>
      <p>Body</p>
      <button slot="actions" type="button">Save</button>
      <small slot="footer">Updated today</small>
    </rc-card>
  `);
  const host = (await screen.getByTestId('host').element()) as RCCard;

  await flushCard(host);

  expect(host.hasAttribute('has-media')).toBe(true);
  expect(host.hasAttribute('has-header')).toBe(false);
  expect(host.hasAttribute('has-title')).toBe(true);
  expect(host.hasAttribute('has-subtitle')).toBe(true);
  expect(host.hasAttribute('has-actions')).toBe(true);
  expect(host.hasAttribute('has-footer')).toBe(true);
});

test('renders neutral structural parts', async () => {
  const screen = render(html`
    <rc-card data-testid="host">
      <h2 slot="title">Recipe</h2>
      <p>Body</p>
    </rc-card>
  `);
  const host = (await screen.getByTestId('host').element()) as RCCard;

  await flushCard(host);

  for (const part of [
    'container',
    'media',
    'header',
    'title',
    'subtitle',
    'body',
    'actions',
    'footer',
    'state-layer',
  ]) {
    expect(host.shadowRoot?.querySelector(`[part="${part}"]`), part).not.toBeNull();
  }
});

test('applies default padding to direct body content', async () => {
  const screen = render(html`
    <rc-card data-testid="host">
      <p data-testid="body">Body</p>
    </rc-card>
  `);
  const host = (await screen.getByTestId('host').element()) as RCCard;
  const body = await screen.getByTestId('body').element();

  await flushCard(host);

  expect(getComputedStyle(body).paddingBlockStart).toBe('16px');
  expect(getComputedStyle(body).paddingInlineStart).toBe('16px');
});

test('lays out every structural region in horizontal orientation', async () => {
  const screen = render(html`
    <rc-card data-testid="host" orientation="horizontal" style="inline-size: 400px;">
      <div slot="media">Media</div>
      <div slot="header">Header</div>
      <h2 slot="title">Recipe</h2>
      <p slot="subtitle">Dinner</p>
      <p>Body</p>
      <button slot="actions" type="button">Save</button>
      <small slot="footer">Updated today</small>
    </rc-card>
  `);
  const host = (await screen.getByTestId('host').element()) as RCCard;

  await flushCard(host);

  const [mediaWidth, contentWidth] = getComputedStyle(host)
    .gridTemplateColumns.split(' ')
    .map(Number.parseFloat);

  expect(host.orientation).toBe('horizontal');
  expect(mediaWidth).toBeCloseTo(160, 0);
  expect(contentWidth).toBeCloseTo(240, 0);

  const expectedPlacements = {
    media: ['1', '-1', '1'],
    header: ['1', 'auto', '2'],
    title: ['2', 'auto', '2'],
    subtitle: ['3', 'auto', '2'],
    body: ['4', 'auto', '2'],
    actions: ['5', 'auto', '2'],
    footer: ['6', 'auto', '2'],
  } as const;

  for (const [partName, [rowStart, rowEnd, columnStart]] of Object.entries(expectedPlacements)) {
    const styles = getComputedStyle(getPart(host, partName));

    expect(styles.gridRowStart, partName).toBe(rowStart);
    expect(styles.gridRowEnd, partName).toBe(rowEnd);
    expect(styles.gridColumnStart, partName).toBe(columnStart);
  }
});

test('collapses a horizontal card without media to one content column', async () => {
  const screen = render(html`
    <rc-card data-testid="host" orientation="horizontal" style="inline-size: 400px;">
      <h2 slot="title">Recipe</h2>
      <p>Body</p>
    </rc-card>
  `);
  const host = (await screen.getByTestId('host').element()) as RCCard;

  await flushCard(host);

  expect(getComputedStyle(host).gridTemplateColumns).toBe('400px');

  expect(getComputedStyle(getPart(host, 'title')).gridColumnStart).toBe('1');
});

test('lets public grid tokens override horizontal defaults', async () => {
  const screen = render(html`
    <rc-card
      data-testid="host"
      orientation="horizontal"
      style="
        inline-size: 400px;
        --rc-card-grid-template-columns: 1fr 1fr;
        --rc-card-media-grid-column: 2;
        --rc-card-title-grid-column: 1;
      "
    >
      <div slot="media">Media</div>
      <h2 slot="title">Recipe</h2>
    </rc-card>
  `);
  const host = (await screen.getByTestId('host').element()) as RCCard;

  await flushCard(host);

  expect(getComputedStyle(host).gridTemplateColumns).toBe('200px 200px');

  expect(getComputedStyle(getPart(host, 'media')).gridColumnStart).toBe('2');

  expect(getComputedStyle(getPart(host, 'title')).gridColumnStart).toBe('1');
});

test('supports shelf-style row and column subgrid coordination through layout tokens', async () => {
  const screen = render(html`
    <div style="display: grid; grid-template: auto auto 1fr / 8rem minmax(0, 1fr);">
      <rc-card
        data-testid="host"
        style="
          grid-area: 1 / 1 / -1 / -1;
          --rc-card-grid-template-rows: subgrid;
          --rc-card-grid-template-columns: subgrid;
          --rc-card-media-grid-row: 1 / -1;
          --rc-card-media-grid-column: 1;
          --rc-card-title-grid-row: 1;
          --rc-card-title-grid-column: 2;
          --rc-card-body-grid-row: 2 / -1;
          --rc-card-body-grid-column: 2;
        "
      >
        <div slot="media">Media</div>
        <h2 slot="title">Recipe</h2>
        <p>Body</p>
      </rc-card>
    </div>
  `);
  const host = (await screen.getByTestId('host').element()) as RCCard;

  await flushCard(host);

  expect(getComputedStyle(host).gridTemplateRows).not.toBe('');
  expect(getComputedStyle(host).gridTemplateColumns).not.toBe('');
  expect(getComputedStyle(host).display).toBe('grid');
});

test('action-target forwards non-interactive surface clicks to same-root anchors', async () => {
  const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
  const screen = render(html`
    <rc-card data-testid="host" action-target="recipe-link" interactive>
      <a id="recipe-link" slot="title" href="/recipes/pie" @click=${onClick}>Apple pie</a>
      <p>Body</p>
    </rc-card>
  `);
  const host = (await screen.getByTestId('host').element()) as RCCard;

  await flushCard(host);

  host.shadowRoot
    ?.querySelector('[part="body"]')
    ?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true, cancelable: true }));

  expect(onClick).toHaveBeenCalledOnce();
});

test('action-target skips clicks that begin inside interactive descendants', async () => {
  const onLinkClick = vi.fn((event: MouseEvent) => event.preventDefault());
  const onNestedClick = vi.fn();
  const screen = render(html`
    <rc-card data-testid="host" action-target="recipe-link" interactive>
      <a id="recipe-link" slot="title" href="/recipes/pie" @click=${onLinkClick}>Apple pie</a>
      <button type="button" @click=${onNestedClick}>Nested</button>
    </rc-card>
  `);
  const host = (await screen.getByTestId('host').element()) as RCCard;

  await flushCard(host);

  host.querySelector('button')!.click();

  expect(onNestedClick).toHaveBeenCalledOnce();
  expect(onLinkClick).not.toHaveBeenCalled();
});

test('action-target does not forward when disabled', async () => {
  const onClick = vi.fn((event: MouseEvent) => event.preventDefault());
  const screen = render(html`
    <rc-card data-testid="host" action-target="recipe-link" interactive disabled>
      <a id="recipe-link" slot="title" href="/recipes/pie" @click=${onClick}>Apple pie</a>
      <p>Body</p>
    </rc-card>
  `);
  const host = (await screen.getByTestId('host').element()) as RCCard;

  await flushCard(host);
  host.click();

  expect(onClick).not.toHaveBeenCalled();
});

test('action-target warns for missing or non-interactive targets', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const screen = render(html`
    <rc-card data-testid="host" action-target="not-a-link" interactive>
      <span id="not-a-link">Title</span>
    </rc-card>
  `);
  const host = (await screen.getByTestId('host').element()) as RCCard;

  await flushCard(host);
  host.click();

  expect(warn).toHaveBeenCalledWith(
    '[rc-card] action-target="not-a-link" must reference a same-root <a> or <button>.',
  );

  warn.mockRestore();
});

test('warns when interactive has no action-target at all', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const screen = render(html`
    <rc-card data-testid="host" interactive>
      <a slot="title" href="/recipes/pie">Apple pie</a>
    </rc-card>
  `);
  const host = (await screen.getByTestId('host').element()) as RCCard;

  await flushCard(host);

  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining('[rc-card] interactive is set with no action-target'),
    host,
  );

  warn.mockRestore();
});

test('does not warn when action-target is set or interactive is off', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const screen = render(html`
    <div>
      <rc-card data-testid="wired" interactive action-target="wired-link">
        <a id="wired-link" slot="title" href="/recipes/pie">Apple pie</a>
      </rc-card>
      <rc-card data-testid="passive">
        <a slot="title" href="/recipes/pie">Apple pie</a>
      </rc-card>
    </div>
  `);
  const wired = (await screen.getByTestId('wired').element()) as RCCard;
  const passive = (await screen.getByTestId('passive').element()) as RCCard;

  await flushCard(wired);
  await flushCard(passive);

  expect(warn).not.toHaveBeenCalled();

  warn.mockRestore();
});

test('has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-card data-testid="host" action-target="recipe-link" interactive>
      <img slot="media" alt="" />
      <a id="recipe-link" slot="title" href="/recipes/pie">Apple pie</a>
      <p>Body</p>
      <button slot="actions" type="button">Save</button>
    </rc-card>
  `);
  const host = (await screen.getByTestId('host').element()) as RCCard;

  await flushCard(host);
  await expectNoA11yViolations(host);
});
