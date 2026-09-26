import { test, expect, vi } from 'vitest';

import { RafScheduler } from './RafScheduler.js';

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

test('runs every phased sample before any phased apply', async () => {
  const first = new RafScheduler();
  const second = new RafScheduler();
  const calls: string[] = [];

  first.schedulePhased(
    () => {
      calls.push('sample:first');

      return 1;
    },
    (value) => calls.push(`apply:first:${value}`),
  );

  second.schedulePhased(
    () => {
      calls.push('sample:second');

      return 2;
    },
    (value) => calls.push(`apply:second:${value}`),
  );

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  expect(calls).toEqual(['sample:first', 'sample:second', 'apply:first:1', 'apply:second:2']);
  expect(first.pending).toBe(false);
  expect(second.pending).toBe(false);
});

test('keeps only the latest phased task', async () => {
  const scheduler = new RafScheduler();
  const calls: string[] = [];

  scheduler.schedulePhased(
    () => 'first',
    (value) => calls.push(value),
  );

  scheduler.schedulePhased(
    () => 'second',
    (value) => calls.push(value),
  );

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  expect(calls).toEqual(['second']);
});

test('defers phased work scheduled during apply to the next frame', async () => {
  const scheduler = new RafScheduler();
  const calls: string[] = [];

  scheduler.schedulePhased(
    () => 'first',
    (value) => {
      calls.push(value);

      scheduler.schedulePhased(
        () => 'second',
        (next) => calls.push(next),
      );
    },
  );

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  expect(calls).toEqual(['first']);
  expect(scheduler.pending).toBe(true);

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  expect(calls).toEqual(['first', 'second']);
});

test('cancel clears pending phased work', async () => {
  const scheduler = new RafScheduler();
  const apply = vi.fn();

  scheduler.schedulePhased(() => 1, apply);
  scheduler.cancel();

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  expect(apply).not.toHaveBeenCalled();
  expect(scheduler.pending).toBe(false);
});
