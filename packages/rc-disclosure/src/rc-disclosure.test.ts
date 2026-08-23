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

test('rc-disclosure adopts native initial open and closed states', async () => {
  const screen = render(html`
    <rc-disclosure data-testid="open-host">
      <details open>
        <summary>Open status</summary>
        <p>Body</p>
      </details>
    </rc-disclosure>
    <rc-disclosure data-testid="closed-host">
      <details>
        <summary>Closed status</summary>
        <p>Body</p>
      </details>
    </rc-disclosure>
  `);

  const $openHost = screen.getByTestId('open-host').element() as RCDisclosure;
  const $openDetails = $openHost.querySelector('details') as HTMLDetailsElement;
  const $closedHost = screen.getByTestId('closed-host').element() as RCDisclosure;
  const $closedDetails = $closedHost.querySelector('details') as HTMLDetailsElement;

  expect($openDetails.open).toBe(true);
  expect($openHost.open).toBe(true);
  expect($openHost.hasAttribute('open')).toBe(true);
  expect($closedDetails.open).toBe(false);
  expect($closedHost.open).toBe(false);
});

test('rc-disclosure opens when the hash matches details or a descendant', async () => {
  const screen = render(html`
    <rc-disclosure data-testid="details-host">
      <details id="details-target">
        <summary>Details target</summary>
        <p>Body</p>
      </details>
    </rc-disclosure>
    <rc-disclosure data-testid="descendant-host">
      <details>
        <summary>Descendant target</summary>
        <p id="descendant-target">Body</p>
      </details>
    </rc-disclosure>
  `);

  const $detailsHost = screen.getByTestId('details-host').element() as RCDisclosure;
  const $descendantHost = screen.getByTestId('descendant-host').element() as RCDisclosure;

  history.replaceState(null, '', '#details-target');
  window.dispatchEvent(new HashChangeEvent('hashchange'));

  expect($detailsHost.open).toBe(true);

  history.replaceState(null, '', '#descendant-target');
  window.dispatchEvent(new HashChangeEvent('hashchange'));

  expect($descendantHost.open).toBe(true);

  history.replaceState(null, '', location.pathname + location.search);
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
