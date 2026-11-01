import { afterEach, expect, test, vi } from 'vitest';

import { LiveAnnouncer } from './LiveAnnouncer.js';

let $host: HTMLElement | undefined;

afterEach(() => {
  $host?.remove();
  $host = undefined;
});

function connectHost(): HTMLElement {
  $host = document.createElement('div');
  document.body.append($host);

  return $host;
}

test('announces through a polite, visually hidden status region', async () => {
  const announcer = new LiveAnnouncer(connectHost());
  const $region = announcer.element;

  expect($region.isConnected).toBe(false);

  announcer.announce('Moved to position 2 of 3.');

  expect($region.parentNode).toBe(document.body);
  expect($region.getAttribute('role')).toBe('status');
  expect($region.getAttribute('aria-live')).toBe('polite');
  expect($region.getBoundingClientRect().width).toBeLessThanOrEqual(1);

  await vi.waitFor(() => expect($region.textContent).toBe('Moved to position 2 of 3.'));

  announcer.dispose();
});

test('re-announces an identical message by clearing the region first', async () => {
  const announcer = new LiveAnnouncer(connectHost());
  const $region = announcer.element;

  announcer.announce('Same');
  await vi.waitFor(() => expect($region.textContent).toBe('Same'));

  announcer.announce('Same');
  expect($region.textContent).toBe('');
  await vi.waitFor(() => expect($region.textContent).toBe('Same'));

  announcer.dispose();
});

test('dispose removes the region and drops a pending message', async () => {
  const announcer = new LiveAnnouncer(connectHost());
  const $region = announcer.element;

  announcer.announce('Pending');
  announcer.dispose();

  await new Promise((resolve) => setTimeout(resolve, 80));

  expect($region.isConnected).toBe(false);
  expect($region.textContent).toBe('');
});

test('mounts in the open dialog around the host and leaves it when the dialog closes', async () => {
  const $dialog = document.createElement('dialog');
  const $inner = document.createElement('div');

  $dialog.append($inner);
  document.body.append($dialog);
  $dialog.showModal();

  const announcer = new LiveAnnouncer($inner);

  announcer.announce('Inside');
  expect(announcer.element.parentNode).toBe($dialog);

  $dialog.close();
  announcer.announce('Outside');
  expect(announcer.element.parentNode).toBe(document.body);

  announcer.dispose();
  $dialog.remove();
});

test('mounts again after a morph removes the region', async () => {
  const announcer = new LiveAnnouncer(connectHost());

  announcer.announce('First');
  announcer.element.remove();
  announcer.announce('Second');

  expect(announcer.element.parentNode).toBe(document.body);
  await vi.waitFor(() => expect(announcer.element.textContent).toBe('Second'));

  announcer.dispose();
});

test('follows a host moved into a replacement body', async () => {
  const $permanent = connectHost();
  const announcer = new LiveAnnouncer($permanent);
  const $originalBody = document.body;
  const $newBody = document.createElement('body');

  announcer.announce('Before');
  expect(announcer.element.parentNode).toBe($originalBody);

  // Turbo moves a permanent element into the incoming body, then swaps it in.
  $newBody.append($permanent);
  $originalBody.replaceWith($newBody);

  try {
    announcer.announce('After');

    expect(announcer.element.parentNode).toBe($newBody);
    await vi.waitFor(() => expect(announcer.element.textContent).toBe('After'));
  } finally {
    announcer.dispose();
    $newBody.replaceWith($originalBody);
  }
});

test('uses the root option when it resolves', () => {
  const $root = connectHost();
  const announcer = new LiveAnnouncer($root, { root: () => $root });

  announcer.announce('Here');
  expect(announcer.element.parentNode).toBe($root);

  announcer.dispose();
});
