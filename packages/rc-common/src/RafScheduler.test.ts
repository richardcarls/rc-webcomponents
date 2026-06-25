import { test, expect, vi } from 'vitest';

import { RafScheduler } from './RafScheduler';

test('coalesces repeated schedules into one frame', async () => {
  const scheduler = new RafScheduler();
  const first = vi.fn();
  const second = vi.fn();

  scheduler.schedule(first);
  scheduler.schedule(second);

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  expect(first).not.toHaveBeenCalled();
  expect(second).toHaveBeenCalledTimes(1);
  expect(scheduler.pending).toBe(false);
});

test('cancel clears pending frame', async () => {
  const scheduler = new RafScheduler();
  const callback = vi.fn();

  scheduler.schedule(callback);
  scheduler.cancel();

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  expect(callback).not.toHaveBeenCalled();
  expect(scheduler.pending).toBe(false);
});

test('hostDisconnected cancels pending frame', async () => {
  const scheduler = new RafScheduler();
  const callback = vi.fn();

  scheduler.schedule(callback);
  scheduler.hostDisconnected();

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  expect(callback).not.toHaveBeenCalled();
});
