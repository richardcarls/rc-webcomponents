import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
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
    <rc-disclosure data-testid="host" @rc-disclosure-toggle=${toggleSpy}>
      <details>
        <summary>Status</summary>
        <p>Body</p>
      </details>
    </rc-disclosure>
  `);
  const host = screen.getByTestId('host').element() as RCDisclosure;
  const summary = screen.getByText('Status');

  await summary.click();

  expect(host.open).toBe(true);
  expect(host.hasAttribute('open')).toBe(true);
  expect(toggleSpy).toHaveBeenCalledOnce();
});

test('rc-accordion closes sibling disclosures', async () => {
  const screen = render(html`
    <rc-accordion>
      <rc-disclosure data-testid="one" open>
        <details open>
          <summary>One</summary>
          <p>One body</p>
        </details>
      </rc-disclosure>
      <rc-disclosure data-testid="two">
        <details>
          <summary>Two</summary>
          <p>Two body</p>
        </details>
      </rc-disclosure>
    </rc-accordion>
  `);
  const one = screen.getByTestId('one').element() as RCDisclosure;
  const two = screen.getByTestId('two').element() as RCDisclosure;

  two.open = true;
  two.dispatchEvent(new CustomEvent('rc-disclosure-toggle', { bubbles: true, detail: { open: true } }));

  expect(one.open).toBe(false);
  expect(two.open).toBe(true);
});

test('rc-disclosure opens matching fragment targets', async () => {
  const screen = render(html`
    <rc-disclosure data-testid="host" fragment>
      <details id="status-panel">
        <summary>Status</summary>
        <p>Body</p>
      </details>
    </rc-disclosure>
  `);
  const host = screen.getByTestId('host').element() as RCDisclosure;

  history.replaceState(null, '', '#status-panel');
  window.dispatchEvent(new HashChangeEvent('hashchange'));

  expect(host.open).toBe(true);
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
  const host = screen.getByTestId('host').element() as RCDisclosure;
  const details = host.querySelector('details') as HTMLDetailsElement;
  const summary = host.querySelector('summary') as HTMLElement;

  expect(details.id).toBeTruthy();
  expect(summary.getAttribute('aria-controls')).toBe(details.id);
});

test('rc-accordion ArrowDown moves focus to next summary', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion">
      <rc-disclosure>
        <details><summary>One</summary><p>Body one</p></details>
      </rc-disclosure>
      <rc-disclosure>
        <details><summary>Two</summary><p>Body two</p></details>
      </rc-disclosure>
    </rc-accordion>
  `);
  const accordion = screen.getByTestId('accordion').element() as HTMLElement;
  const summaries = Array.from(accordion.querySelectorAll('summary')) as HTMLElement[];

  summaries[0].focus();
  accordion.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

  expect(document.activeElement).toBe(summaries[1]);
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
