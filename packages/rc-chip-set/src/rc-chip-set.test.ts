import { html } from 'lit';
import { expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';
import './define';
import type { RCChipSet } from './rc-chip-set';

test('groups chips in an accessible toolbar', async () => {
  const screen = render(html`
    <rc-chip-set data-testid="host" label="Filters">
      <button type="button">Quick</button>
      <button type="button">Vegetarian</button>
    </rc-chip-set>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChipSet;

  await host.updateComplete;

  const root = host.shadowRoot?.querySelector('[part="root"]');

  expect(root?.getAttribute('role')).toBe('toolbar');
  expect(root?.getAttribute('aria-label')).toBe('Filters');
});

test('uses roving focus across direct chips', async () => {
  const screen = render(html`
    <rc-chip-set data-testid="host" label="Filters">
      <button type="button" data-testid="quick">Quick</button>
      <button type="button" data-testid="veg">Vegetarian</button>
    </rc-chip-set>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChipSet;
  const quick = await screen.getByTestId('quick').element();
  const veg = await screen.getByTestId('veg').element();

  await host.updateComplete;
  quick.focus();
  await userEvent.keyboard('{ArrowRight}');

  expect(document.activeElement).toBe(veg);
});

test('has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-chip-set data-testid="host" label="Filters">
      <button type="button">Quick</button>
      <button type="button">Vegetarian</button>
    </rc-chip-set>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChipSet;

  await host.updateComplete;
  await expectNoA11yViolations(host);
});
