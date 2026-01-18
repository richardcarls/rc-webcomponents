import { test, expect } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

import './define.js';
import type { RCAccordion } from './rc-accordion.js';
import type { RCDisclosure } from '@rcarls/rc-disclosure';

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
  const accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const summaries = Array.from(accordion.querySelectorAll('summary')) as HTMLElement[];

  summaries[0].focus();
  accordion.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

  expect(document.activeElement).toBe(summaries[1]);
});

test('rc-accordion ignores modified arrow keys', async () => {
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
  const accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const summaries = Array.from(accordion.querySelectorAll('summary')) as HTMLElement[];

  summaries[0].focus();
  accordion.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', altKey: true, bubbles: true }));

  expect(document.activeElement).toBe(summaries[0]);
});

test('rc-accordion syncs its name to child native details', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion" name="settings">
      <rc-disclosure>
        <details><summary>One</summary><p>Body one</p></details>
      </rc-disclosure>
      <rc-disclosure>
        <details name="custom"><summary>Two</summary><p>Body two</p></details>
      </rc-disclosure>
    </rc-accordion>
  `);
  const accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const details = Array.from(accordion.querySelectorAll('details'));

  expect(details[0].getAttribute('name')).toBe('settings');
  expect(details[1].getAttribute('name')).toBe('custom');
});

test('rc-accordion has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion">
      <rc-disclosure open>
        <details open><summary>One</summary><p>Body one</p></details>
      </rc-disclosure>
      <rc-disclosure>
        <details><summary>Two</summary><p>Body two</p></details>
      </rc-disclosure>
    </rc-accordion>
  `);

  await expectNoA11yViolations(screen.getByTestId('accordion').element());
});
