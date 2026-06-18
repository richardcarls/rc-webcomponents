import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import type { RCDisclosure } from '@rcarls/rc-disclosure';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

import './define.js';
import type { RCAccordion } from './rc-accordion.js';

function getElement<T>($items: T[], index: number): T {
  const $item = $items.at(index);

  if (!$item) {
    throw new Error(`Expected item at index ${index}.`);
  }

  return $item;
}

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

  const $one = screen.getByTestId('one').element() as RCDisclosure;
  const $two = screen.getByTestId('two').element() as RCDisclosure;
  const $twoDetails = $two.querySelector('details');

  if (!$twoDetails) {
    throw new Error('Expected second disclosure details.');
  }

  $two.open = true;

  $twoDetails.dispatchEvent(new Event('toggle'));

  expect($one.open).toBe(false);
  expect($two.open).toBe(true);
});

test('rc-accordion closes sibling native details', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion">
      <details open>
        <summary>One</summary>
        <p>One body</p>
      </details>
      <details>
        <summary>Two</summary>
        <p>Two body</p>
      </details>
    </rc-accordion>
  `);

  const $accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const $details = Array.from($accordion.querySelectorAll('details'));
  const $firstDetails = getElement($details, 0);
  const $secondDetails = getElement($details, 1);

  $secondDetails.open = true;
  $secondDetails.dispatchEvent(new Event('toggle'));

  expect($firstDetails.open).toBe(false);
  expect($secondDetails.open).toBe(true);
});

test('rc-accordion closes mixed native and wrapped details', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion">
      <details open>
        <summary>One</summary>
        <p>One body</p>
      </details>
      <rc-disclosure data-testid="two">
        <details>
          <summary>Two</summary>
          <p>Two body</p>
        </details>
      </rc-disclosure>
    </rc-accordion>
  `);

  const $accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const $two = screen.getByTestId('two').element() as RCDisclosure;
  const $details = Array.from($accordion.querySelectorAll('details'));
  const $firstDetails = getElement($details, 0);
  const $secondDetails = getElement($details, 1);

  $two.open = true;
  $secondDetails.dispatchEvent(new Event('toggle'));

  expect($firstDetails.open).toBe(false);
  expect($two.open).toBe(true);
});

test('rc-accordion keeps multiple native details open when multiple is set', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion" multiple>
      <details open>
        <summary>One</summary>
        <p>One body</p>
      </details>
      <details>
        <summary>Two</summary>
        <p>Two body</p>
      </details>
    </rc-accordion>
  `);

  const $accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const $details = Array.from($accordion.querySelectorAll('details'));
  const $firstDetails = getElement($details, 0);
  const $secondDetails = getElement($details, 1);

  $secondDetails.open = true;
  $secondDetails.dispatchEvent(new Event('toggle'));

  expect($firstDetails.open).toBe(true);
  expect($secondDetails.open).toBe(true);
});

test('rc-accordion keeps multiple wrapped details open when multiple is set', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion" multiple>
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

  const $accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const $one = screen.getByTestId('one').element() as RCDisclosure;
  const $two = screen.getByTestId('two').element() as RCDisclosure;
  const $details = Array.from($accordion.querySelectorAll('details'));
  const $secondDetails = getElement($details, 1);

  $two.open = true;
  $secondDetails.dispatchEvent(new Event('toggle'));

  expect($one.open).toBe(true);
  expect($two.open).toBe(true);
});

test('rc-accordion enforces single-open when multiple is removed', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion" multiple>
      <details open>
        <summary>One</summary>
        <p>One body</p>
      </details>
      <details open>
        <summary>Two</summary>
        <p>Two body</p>
      </details>
    </rc-accordion>
  `);

  const $accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const $details = Array.from($accordion.querySelectorAll('details'));
  const $firstDetails = getElement($details, 0);
  const $secondDetails = getElement($details, 1);

  $accordion.multiple = false;

  expect($firstDetails.open).toBe(true);
  expect($secondDetails.open).toBe(false);
});

test('rc-accordion ArrowDown moves focus to next summary', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion">
      <rc-disclosure>
        <details>
          <summary>One</summary>
          <p>Body one</p>
        </details>
      </rc-disclosure>
      <rc-disclosure>
        <details>
          <summary>Two</summary>
          <p>Body two</p>
        </details>
      </rc-disclosure>
    </rc-accordion>
  `);

  const $accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const $summaries = Array.from($accordion.querySelectorAll('summary')) as HTMLElement[];
  const $firstSummary = getElement($summaries, 0);
  const $secondSummary = getElement($summaries, 1);

  $firstSummary.focus();

  $accordion.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
    }),
  );

  expect(document.activeElement).toBe($secondSummary);
});

test('rc-accordion ArrowUp moves focus to previous summary', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion">
      <details>
        <summary>One</summary>
        <p>Body one</p>
      </details>
      <details>
        <summary>Two</summary>
        <p>Body two</p>
      </details>
      <details>
        <summary>Three</summary>
        <p>Body three</p>
      </details>
    </rc-accordion>
  `);

  const $accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const $summaries = Array.from($accordion.querySelectorAll('summary')) as HTMLElement[];
  const $secondSummary = getElement($summaries, 1);
  const $thirdSummary = getElement($summaries, 2);

  $thirdSummary.focus();

  $accordion.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
    }),
  );

  expect(document.activeElement).toBe($secondSummary);
});

test('rc-accordion wraps ArrowUp from first summary to last summary', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion">
      <details>
        <summary>One</summary>
        <p>Body one</p>
      </details>
      <details>
        <summary>Two</summary>
        <p>Body two</p>
      </details>
    </rc-accordion>
  `);

  const $accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const $summaries = Array.from($accordion.querySelectorAll('summary')) as HTMLElement[];
  const $firstSummary = getElement($summaries, 0);
  const $secondSummary = getElement($summaries, 1);

  $firstSummary.focus();

  $accordion.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
    }),
  );

  expect(document.activeElement).toBe($secondSummary);
});

test('rc-accordion Home and End move focus to boundary summaries', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion">
      <details>
        <summary>One</summary>
        <p>Body one</p>
      </details>
      <details>
        <summary>Two</summary>
        <p>Body two</p>
      </details>
      <details>
        <summary>Three</summary>
        <p>Body three</p>
      </details>
    </rc-accordion>
  `);

  const $accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const $summaries = Array.from($accordion.querySelectorAll('summary')) as HTMLElement[];
  const $firstSummary = getElement($summaries, 0);
  const $secondSummary = getElement($summaries, 1);
  const $thirdSummary = getElement($summaries, 2);

  $secondSummary.focus();

  $accordion.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Home',
      bubbles: true,
    }),
  );

  expect(document.activeElement).toBe($firstSummary);

  $firstSummary.focus();

  $accordion.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'End',
      bubbles: true,
    }),
  );

  expect(document.activeElement).toBe($thirdSummary);
});

test('rc-accordion ignores modified arrow keys', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion">
      <rc-disclosure>
        <details>
          <summary>One</summary>
          <p>Body one</p>
        </details>
      </rc-disclosure>
      <rc-disclosure>
        <details>
          <summary>Two</summary>
          <p>Body two</p>
        </details>
      </rc-disclosure>
    </rc-accordion>
  `);

  const $accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const $summaries = Array.from($accordion.querySelectorAll('summary')) as HTMLElement[];
  const $firstSummary = getElement($summaries, 0);

  $firstSummary.focus();

  $accordion.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      altKey: true,
      bubbles: true,
    }),
  );

  expect(document.activeElement).toBe($firstSummary);
});

test('rc-accordion syncs its name to child native details', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion" name="settings">
      <details>
        <summary>One</summary>
        <p>Body one</p>
      </details>
      <rc-disclosure>
        <details>
          <summary>Two</summary>
          <p>Body two</p>
        </details>
      </rc-disclosure>
      <rc-disclosure>
        <details name="custom">
          <summary>Three</summary>
          <p>Body three</p>
        </details>
      </rc-disclosure>
    </rc-accordion>
  `);

  const $accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const $details = Array.from($accordion.querySelectorAll('details'));
  const $firstDetails = getElement($details, 0);
  const $secondDetails = getElement($details, 1);
  const $thirdDetails = getElement($details, 2);

  expect($firstDetails.getAttribute('name')).toBe('settings');
  expect($secondDetails.getAttribute('name')).toBe('settings');
  expect($thirdDetails.getAttribute('name')).toBe('custom');
});

test('rc-accordion does not sync its name to child details when multiple is set', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion" name="settings" multiple>
      <details>
        <summary>One</summary>
        <p>Body one</p>
      </details>
      <details name="custom">
        <summary>Two</summary>
        <p>Body two</p>
      </details>
    </rc-accordion>
  `);

  const $accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const $details = Array.from($accordion.querySelectorAll('details'));
  const $firstDetails = getElement($details, 0);
  const $secondDetails = getElement($details, 1);

  expect($firstDetails.hasAttribute('name')).toBe(false);
  expect($secondDetails.getAttribute('name')).toBe('custom');
});

test('rc-accordion removes only its own synced names when multiple is set', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion" name="settings">
      <details>
        <summary>One</summary>
        <p>Body one</p>
      </details>
      <details name="custom">
        <summary>Two</summary>
        <p>Body two</p>
      </details>
    </rc-accordion>
  `);

  const $accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const $details = Array.from($accordion.querySelectorAll('details'));
  const $firstDetails = getElement($details, 0);
  const $secondDetails = getElement($details, 1);

  $accordion.multiple = true;

  expect($firstDetails.hasAttribute('name')).toBe(false);
  expect($secondDetails.getAttribute('name')).toBe('custom');
});

test('rc-accordion syncs its name to added child details', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion" name="settings">
      <details>
        <summary>One</summary>
        <p>Body one</p>
      </details>
    </rc-accordion>
  `);

  const $accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const $details = document.createElement('details');
  const $summary = document.createElement('summary');

  $summary.textContent = 'Two';
  $details.append($summary);
  $accordion.append($details);

  await vi.waitFor(() => expect($details.getAttribute('name')).toBe('settings'));
});

test('rc-accordion keeps newly added open details and closes older open siblings', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion">
      <details open>
        <summary>One</summary>
        <p>Body one</p>
      </details>
    </rc-accordion>
  `);

  const $accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const $firstDetails = getElement(Array.from($accordion.querySelectorAll('details')), 0);
  const $secondDetails = document.createElement('details');
  const $summary = document.createElement('summary');

  $summary.textContent = 'Two';
  $secondDetails.open = true;
  $secondDetails.append($summary);
  $accordion.append($secondDetails);

  await vi.waitFor(() => expect($firstDetails.open).toBe(false));

  expect($secondDetails.open).toBe(true);
});

test('rc-accordion ignores nested details outside its direct child contract', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion">
      <details open>
        <summary>One</summary>
        <p>Body one</p>
      </details>
      <section>
        <details>
          <summary>Nested</summary>
          <p>Nested body</p>
        </details>
      </section>
    </rc-accordion>
  `);

  const $accordion = screen.getByTestId('accordion').element() as RCAccordion;
  const $details = Array.from($accordion.querySelectorAll('details'));
  const $firstDetails = getElement($details, 0);
  const $nestedDetails = getElement($details, 1);

  $nestedDetails.open = true;
  $nestedDetails.dispatchEvent(new Event('toggle'));

  expect($firstDetails.open).toBe(true);
  expect($nestedDetails.open).toBe(true);
});

test('rc-accordion has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-accordion data-testid="accordion">
      <rc-disclosure open>
        <details open>
          <summary>One</summary>
          <p>Body one</p>
        </details>
      </rc-disclosure>
      <rc-disclosure>
        <details>
          <summary>Two</summary>
          <p>Body two</p>
        </details>
      </rc-disclosure>
    </rc-accordion>
  `);

  await expectNoA11yViolations(screen.getByTestId('accordion').element());
});
