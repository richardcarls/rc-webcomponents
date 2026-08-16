import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';
import './define';
import type { RCSnackbar } from './rc-snackbar';

test('show opens a polite status message', async () => {
  const screen = render(html`<rc-snackbar data-testid="host"></rc-snackbar>`);
  const host = (await screen.getByTestId('host').element()) as RCSnackbar;

  host.show('Saved');
  await host.updateComplete;

  const surface = host.shadowRoot?.querySelector('[part="surface"]');

  expect(host.open).toBe(true);
  expect(host.message).toBe('Saved');
  expect(surface?.getAttribute('role')).toBe('status');
  expect(surface?.getAttribute('aria-live')).toBe('polite');
});

test('default-open seeds the initial visible state', async () => {
  const screen = render(
    html`<rc-snackbar data-testid="host" default-open message="Welcome back"></rc-snackbar>`,
  );
  const host = (await screen.getByTestId('host').element()) as RCSnackbar;

  await host.updateComplete;

  expect(host.open).toBe(true);
  expect(host.hasAttribute('open')).toBe(true);
});

test('assigning open to undefined releases control back to default-open', async () => {
  const screen = render(html`<rc-snackbar data-testid="host" default-open></rc-snackbar>`);
  const host = (await screen.getByTestId('host').element()) as RCSnackbar;

  await host.updateComplete;
  expect(host.open).toBe(true);

  host.open = false;
  await host.updateComplete;
  expect(host.open).toBe(false);

  host.open = undefined;
  await host.updateComplete;
  expect(host.open).toBe(true);
});

test('host writes to open are silent', async () => {
  const listener = vi.fn();
  const screen = render(html`<rc-snackbar data-testid="host"></rc-snackbar>`);
  const host = (await screen.getByTestId('host').element()) as RCSnackbar;

  host.addEventListener('rc-snackbar-close', listener);

  host.show({ message: 'Saved', duration: 0 });
  await host.updateComplete;

  host.open = false;
  await host.updateComplete;

  expect(host.open).toBe(false);
  expect(listener).not.toHaveBeenCalled();
});

test('action emits an event and closes', async () => {
  const listener = vi.fn();
  const screen = render(html`<rc-snackbar data-testid="host"></rc-snackbar>`);
  const host = (await screen.getByTestId('host').element()) as RCSnackbar;

  host.addEventListener('rc-snackbar-action', listener);

  host.show({ message: 'Saved', actionLabel: 'Undo', duration: 0 });
  await host.updateComplete;
  (host.shadowRoot?.querySelector('[part="action"]') as HTMLButtonElement).click();

  expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { message: 'Saved' } }));
  expect(host.open).toBe(false);
});

test('queues messages by default', async () => {
  vi.useFakeTimers();

  const screen = render(html`<rc-snackbar data-testid="host" duration="10"></rc-snackbar>`);
  const host = (await screen.getByTestId('host').element()) as RCSnackbar;

  host.show('One');
  host.show('Two');
  await host.updateComplete;
  expect(host.message).toBe('One');

  vi.advanceTimersByTime(10);
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await host.updateComplete;

  expect(host.message).toBe('Two');
  vi.useRealTimers();
});

test('replace policy closes current message immediately', async () => {
  const listener = vi.fn();
  const screen = render(
    html`<rc-snackbar data-testid="host" queue-policy="replace"></rc-snackbar>`,
  );
  const host = (await screen.getByTestId('host').element()) as RCSnackbar;

  host.addEventListener('rc-snackbar-close', listener);

  host.show({ message: 'One', duration: 0 });
  host.show({ message: 'Two', duration: 0 });
  await host.updateComplete;

  expect(host.message).toBe('Two');

  expect(listener).toHaveBeenCalledWith(
    expect.objectContaining({ detail: { reason: 'replace', message: 'One' } }),
  );
});

test('has no automated accessibility violations while open', async () => {
  const screen = render(html`<rc-snackbar data-testid="host"></rc-snackbar>`);
  const host = (await screen.getByTestId('host').element()) as RCSnackbar;

  host.show({ message: 'Saved', actionLabel: 'Undo', duration: 0 });
  await host.updateComplete;
  await expectNoA11yViolations(host);
});
