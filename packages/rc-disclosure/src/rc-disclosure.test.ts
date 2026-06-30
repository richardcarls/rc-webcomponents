import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

import './define.js';
import type { RCDisclosure } from './rc-disclosure.js';

test('rc-disclosure preserves native details and summary content', async () => {
  const screen = render(html`
    <rc-disclosure open>
      <details>
        <summary>Status</summary>
        <p>Population</p>
      </details>
    </rc-disclosure>
  `);

  await expect.element(screen.getByText('Status')).toBeInTheDocument();
  await expect.element(screen.getByText('Population')).toBeInTheDocument();
});

test('rc-disclosure mirrors native toggle state', async () => {
  const toggleSpy = vi.fn();

  const screen = render(html`
    <rc-disclosure data-testid="host" @rc-disclosure-toggle=${toggleSpy as EventListener}>
      <details>
        <summary>Status</summary>
        <p>Body</p>
      </details>
    </rc-disclosure>
  `);

  const $host = screen.getByTestId('host').element() as RCDisclosure;
  const summary = screen.getByText('Status');

  await summary.click();

  expect($host.open).toBe(true);
  expect($host.hasAttribute('open')).toBe(true);
  expect(toggleSpy).toHaveBeenCalledOnce();
});

test('rc-disclosure opens matching fragment targets', async () => {
  const screen = render(html`
    <rc-disclosure data-testid="host">
      <details id="status-panel">
        <summary>Status</summary>
        <p>Body</p>
      </details>
    </rc-disclosure>
  `);

  const $host = screen.getByTestId('host').element() as RCDisclosure;

  history.replaceState(null, '', '#status-panel');
  window.dispatchEvent(new HashChangeEvent('hashchange'));

  expect($host.open).toBe(true);
});

test('rc-disclosure opens when hash matches a descendant element id', async () => {
  const screen = render(html`
    <rc-disclosure data-testid="host">
      <details>
        <summary>Status</summary>
        <p id="deep-target">Body</p>
      </details>
    </rc-disclosure>
  `);

  const $host = screen.getByTestId('host').element() as RCDisclosure;

  history.replaceState(null, '', '#deep-target');
  window.dispatchEvent(new HashChangeEvent('hashchange'));

  expect($host.open).toBe(true);
});

test('rc-disclosure injects aria-controls linking summary to details', async () => {
  const screen = render(html`
    <rc-disclosure data-testid="host">
      <details>
        <summary>Status</summary>
        <p>Body</p>
      </details>
    </rc-disclosure>
  `);

  const $host = screen.getByTestId('host').element() as RCDisclosure;
  const $details = $host.querySelector('details') as HTMLDetailsElement;
  const $summary = $host.querySelector('summary') as HTMLElement;

  expect($details.id).toBeTruthy();
  expect($summary.getAttribute('aria-controls')).toBe($details.id);
});

test('rc-disclosure has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-disclosure data-testid="host" open>
      <details open>
        <summary>Status</summary>
        <p>Body</p>
      </details>
    </rc-disclosure>
  `);

  await expectNoA11yViolations(screen.getByTestId('host').element());
});
