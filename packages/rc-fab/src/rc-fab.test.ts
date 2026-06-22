import { html } from 'lit';
import { test, expect } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

import './define.ts';
import type { RCFab } from './rc-fab.ts';

test('native button remains connected with author attributes intact', async () => {
  const screen = render(html`
    <rc-fab data-testid="host">
      <button type="button" id="fab-btn" aria-label="Create">
        <span aria-hidden="true">+</span>
      </button>
    </rc-fab>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;

  const $button = host.querySelector('button');

  expect($button?.isConnected).toBe(true);
  expect($button?.id).toBe('fab-btn');
  expect($button?.type).toBe('button');
});

test('icon-only: accessible name comes from the button aria-label', async () => {
  const screen = render(html`
    <rc-fab data-testid="host">
      <button type="button" aria-label="Create">
        <span aria-hidden="true">+</span>
      </button>
    </rc-fab>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;

  expect(host.querySelector('button')?.getAttribute('aria-label')).toBe('Create');
});

test('extended: accessible name comes from the button text content', async () => {
  const screen = render(html`
    <rc-fab data-testid="host">
      <button type="button">
        <span aria-hidden="true">+</span>
        Compose
      </button>
    </rc-fab>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;

  expect(host.querySelector('button')?.textContent?.trim()).toContain('Compose');
  expect(host.querySelector('button')?.hasAttribute('aria-label')).toBe(false);
});

test('disabled is set directly on the native button', async () => {
  const screen = render(html`
    <rc-fab data-testid="host">
      <button type="button" aria-label="Create" disabled></button>
    </rc-fab>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;

  expect(host.querySelector('button')?.disabled).toBe(true);
});

test('position attribute reflects to the host element', async () => {
  const screen = render(html`
    <rc-fab data-testid="host" position="top-start">
      <button type="button" aria-label="Create"></button>
    </rc-fab>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;

  expect(host.getAttribute('position')).toBe('top-start');
  expect(host.position).toBe('top-start');
});

test('has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-fab data-testid="host">
      <button type="button" aria-label="Create">
        <span aria-hidden="true">+</span>
      </button>
    </rc-fab>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;

  await expectNoA11yViolations(host);
});
