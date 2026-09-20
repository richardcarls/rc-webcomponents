import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
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

test('rc-disclosure applies default-open in uncontrolled mode', async () => {
  const screen = render(html`
    <rc-disclosure data-testid="host" default-open>
      <details>
        <summary>Status</summary>
        <p>Body</p>
      </details>
    </rc-disclosure>
  `);
  const $host = screen.getByTestId('host').element() as RCDisclosure;
  const $details = $host.querySelector('details') as HTMLDetailsElement;

  expect($host.defaultOpen).toBe(true);
  expect($host.open).toBe(true);
  expect($details.open).toBe(true);
});

test('rc-disclosure applies a defaultOpen property written before connection', () => {
  const $host = document.createElement('rc-disclosure') as RCDisclosure;
  const $details = document.createElement('details');

  $details.open = true;
  $details.innerHTML = '<summary>Status</summary><p>Body</p>';
  $host.defaultOpen = false;
  $host.append($details);
  document.body.append($host);

  expect($host.open).toBe(false);
  expect($details.open).toBe(false);

  $host.remove();
});

test('rc-disclosure keeps controlled state while reporting native toggle intent', async () => {
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
  const $details = $host.querySelector('details') as HTMLDetailsElement;
  const summary = screen.getByText('Status');

  $host.open = false;
  await summary.click();

  await vi.waitFor(() => expect(toggleSpy).toHaveBeenCalledOnce());
  expect(toggleSpy.mock.calls[0]?.[0].detail).toEqual({ open: true });
  expect($host.open).toBe(false);
  expect($details.open).toBe(false);
});

test('rc-disclosure releases controlled state back to default-open silently', async () => {
  const toggleSpy = vi.fn();
  const screen = render(html`
    <rc-disclosure
      data-testid="host"
      default-open
      @rc-disclosure-toggle=${toggleSpy as EventListener}
    >
      <details>
        <summary>Status</summary>
        <p>Body</p>
      </details>
    </rc-disclosure>
  `);
  const $host = screen.getByTestId('host').element() as RCDisclosure;
  const $details = $host.querySelector('details') as HTMLDetailsElement;

  $host.open = false;
  $host.open = undefined;

  expect($host.open).toBe(true);
  expect($details.open).toBe(true);

  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(toggleSpy).not.toHaveBeenCalled();
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

test('rc-disclosure installs its light-DOM base styles once per root', async () => {
  const screen = render(html`
    <rc-disclosure>
      <details>
        <summary>First</summary>
        <p>One</p>
      </details>
    </rc-disclosure>
    <rc-disclosure>
      <details>
        <summary>Second</summary>
        <p>Two</p>
      </details>
    </rc-disclosure>
  `);

  await expect.element(screen.getByText('First')).toBeInTheDocument();

  expect(document.querySelectorAll('[data-rc-light-dom-base="rc-disclosure"]')).toHaveLength(1);
});

test('rc-disclosure draws its panel from the public properties', async () => {
  const screen = render(html`
    <rc-disclosure
      style="--rc-disclosure-radius: 12px; --rc-disclosure-summary-padding-inline: 20px"
    >
      <details>
        <summary>Status</summary>
        <p>Population</p>
      </details>
    </rc-disclosure>
  `);

  await expect.element(screen.getByText('Status')).toBeInTheDocument();

  const $details = document.querySelector('rc-disclosure > details')!;
  const $summary = $details.querySelector('summary')!;

  expect(getComputedStyle($details).borderRadius).toBe('12px');
  expect(getComputedStyle($summary).paddingInlineStart).toBe('20px');
});

test('an unthemed disclosure keeps the native marker and snaps open', async () => {
  const screen = render(html`
    <rc-disclosure>
      <details>
        <summary>Status</summary>
        <p>Population</p>
      </details>
    </rc-disclosure>
  `);

  await expect.element(screen.getByText('Status')).toBeInTheDocument();

  const $summary = document.querySelector('rc-disclosure > details > summary')!;

  // The base layer never changes the summary's display, so the list-item box
  // that generates the disclosure triangle survives.
  expect(getComputedStyle($summary).display).toBe('list-item');

  // Motion is opt-in: with no theme the duration stays zero, so the panel keeps
  // the platform's snap-open behavior rather than animating to a guessed height.
  expect(
    getComputedStyle(document.querySelector('rc-disclosure')!)
      .getPropertyValue('--rc-disclosure-duration')
      .trim(),
  ).toBe('');
});

test('reduced motion zeros the spatial expand/collapse but only shortens the effects backstop', async () => {
  // A real media-emulation test would need Playwright's emulateMedia, which
  // this harness does not currently expose to component tests. This
  // test proves the split by construction: the panel's own
  // block-size/content-visibility transition (spatial) drops to 0ms, while the
  // panel/summary/content transition-duration backstop for a theme-added
  // effects transition (background-color, border-color, box-shadow) is only
  // shortened, so it cannot silently cancel a theme's own reduced-motion
  // handling.
  const { DISCLOSURE_BASE_CSS } = await import('./disclosureBaseStyles.js');

  expect(DISCLOSURE_BASE_CSS).toContain('@media (prefers-reduced-motion: reduce)');

  const motionBlock = DISCLOSURE_BASE_CSS.slice(
    DISCLOSURE_BASE_CSS.indexOf('@media (prefers-reduced-motion: reduce)'),
  );

  expect(motionBlock).toContain('transition-duration: 50ms;');

  const detailsContentBlock = motionBlock.slice(
    motionBlock.indexOf('@supports selector(::details-content)'),
  );

  expect(detailsContentBlock).toContain('transition-duration: 0ms;');
  expect(detailsContentBlock).not.toContain('50ms');
});
