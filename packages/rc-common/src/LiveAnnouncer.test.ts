import { expect, test, vi } from 'vitest';

import { LiveAnnouncer } from './LiveAnnouncer.js';

test('announces through a polite, visually hidden status region', async () => {
  const announcer = new LiveAnnouncer(document.body);
  const $region = announcer.element;

  expect($region.parentNode).toBe(document.body);
  expect($region.getAttribute('role')).toBe('status');
  expect($region.getAttribute('aria-live')).toBe('polite');
  expect($region.getBoundingClientRect().width).toBeLessThanOrEqual(1);

  announcer.announce('Moved to position 2 of 3.');
  await vi.waitFor(() => expect($region.textContent).toBe('Moved to position 2 of 3.'));

  announcer.dispose();
});

test('re-announces an identical message by clearing the region first', async () => {
  const announcer = new LiveAnnouncer(document.body);
  const $region = announcer.element;

  announcer.announce('Same');
  await vi.waitFor(() => expect($region.textContent).toBe('Same'));

  announcer.announce('Same');
  expect($region.textContent).toBe('');
  await vi.waitFor(() => expect($region.textContent).toBe('Same'));

  announcer.dispose();
});

test('dispose removes the region and drops a pending message', async () => {
  const announcer = new LiveAnnouncer(document.body);
  const $region = announcer.element;

  announcer.announce('Pending');
  announcer.dispose();

  await new Promise((resolve) => setTimeout(resolve, 80));

  expect($region.isConnected).toBe(false);
  expect($region.textContent).toBe('');
});
