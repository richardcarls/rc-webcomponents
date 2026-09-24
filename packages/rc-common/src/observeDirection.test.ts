import { afterEach, expect, test, vi } from 'vitest';

import { observeDirection } from './observeDirection.js';

const cleanups: Array<() => void> = [];

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
});

function fixture(): HTMLElement {
  const el = document.createElement('div');

  document.body.append(el);
  cleanups.push(() => el.remove());

  return el;
}

test('notifies every subscriber when a dir attribute changes anywhere', async () => {
  const el = fixture();
  const first = vi.fn();
  const second = vi.fn();

  cleanups.push(observeDirection(first), observeDirection(second));
  el.dir = 'rtl';

  await vi.waitFor(() => {
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });
});

test('ignores other attribute changes', async () => {
  const el = fixture();
  const listener = vi.fn();

  cleanups.push(observeDirection(listener));
  el.setAttribute('lang', 'ar');
  el.style.color = 'red';
  el.dir = 'rtl';

  // The dir change is the flush point: any earlier record would have been
  // delivered in the same batch.
  await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
});

test('stops notifying after unsubscribing', async () => {
  const el = fixture();
  const kept = vi.fn();
  const dropped = vi.fn();

  cleanups.push(observeDirection(kept));
  observeDirection(dropped)();
  el.dir = 'rtl';

  await vi.waitFor(() => expect(kept).toHaveBeenCalledTimes(1));
  expect(dropped).not.toHaveBeenCalled();
});

test('observes again after every subscriber has left', async () => {
  const el = fixture();
  const listener = vi.fn();

  observeDirection(vi.fn())();
  cleanups.push(observeDirection(listener));
  el.dir = 'rtl';

  await vi.waitFor(() => expect(listener).toHaveBeenCalledTimes(1));
});
