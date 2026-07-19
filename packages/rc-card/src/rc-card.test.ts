import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';
import './define.ts';
import type { RCCard } from './rc-card.ts';

async function flushCard(host: RCCard): Promise<void> {
  await host.updateComplete;
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await host.updateComplete;
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

test('supports shelf-style subgrid coordination through host layout tokens', async () => {
  const screen = render(html`
    <div style="display: grid; grid-template-rows: auto auto 1fr;">
      <rc-card
        data-testid="host"
        style="grid-row: 1 / -1; grid-template-rows: subgrid; --rc-card-grid-template-rows: subgrid;"
      >
        <h2 slot="title">Recipe</h2>
        <p>Body</p>
      </rc-card>
    </div>
  `);
  const host = (await screen.getByTestId('host').element()) as RCCard;

  await flushCard(host);

  expect(getComputedStyle(host).gridTemplateRows).not.toBe('');
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
