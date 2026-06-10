import { html } from 'lit';
import { test, expect } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

import './define.ts';
import type { RCFab } from './rc-fab.ts';

test('regular variant exposes the label as the button accessible name', async () => {
  const screen = render(html`
    <rc-fab data-testid="host" label="New recipe">
      <span slot="icon" aria-hidden="true">+</span>
    </rc-fab>
  `);

  const host = (await screen.getByTestId('host').element()) as RCFab;
  await host.updateComplete;

  const button = host.shadowRoot?.querySelector('button');
  expect(button?.getAttribute('aria-label')).toBe('New recipe');
  expect(button?.textContent?.trim()).toBe('New recipe');
});

test('extended variant renders the visible label without a redundant aria-label', async () => {
  const screen = render(html`
    <rc-fab data-testid="host" variant="extended" label="New recipe">
      <span slot="icon" aria-hidden="true">+</span>
    </rc-fab>
  `);

  const host = (await screen.getByTestId('host').element()) as RCFab;
  await host.updateComplete;

  const button = host.shadowRoot?.querySelector('button');
  expect(button?.getAttribute('aria-label')).toBe('');
  expect(button?.textContent?.trim()).toBe('New recipe');
});

test('disabled maps to the native button', async () => {
  const screen = render(html`
    <rc-fab data-testid="host" label="New recipe" disabled></rc-fab>
  `);

  const host = (await screen.getByTestId('host').element()) as RCFab;
  await host.updateComplete;

  expect(host.shadowRoot?.querySelector('button')?.disabled).toBe(true);
});

test('has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-fab data-testid="host" label="New recipe">
      <span slot="icon" aria-hidden="true">+</span>
    </rc-fab>
  `);

  const host = (await screen.getByTestId('host').element()) as RCFab;
  await host.updateComplete;

  await expectNoA11yViolations(host);
});
