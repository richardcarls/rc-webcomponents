import { expect, test } from 'vitest';

import {
  calculateWindow,
  positive,
  resolvedTracks,
  trackSpan,
  whole,
  type WindowInput,
} from './range.js';

const input: WindowInput = {
  count: 500,
  overscan: 2,
  itemsPerLine: 1,
  lineSize: 40,
  viewStart: 4000,
  viewSize: 200,
  focused: -1,
  measured: true,
};

test('reserves the unrendered lines and pins focused items contiguously', () => {
  expect(calculateWindow(input)).toEqual({
    start: 98,
    end: 107,
    spacerStart: 3920,
    spacerEnd: 15720,
  });

  expect(calculateWindow({ ...input, focused: 1 })).toEqual({
    start: 1,
    end: 107,
    spacerStart: 40,
    spacerEnd: 15720,
  });
});

test('clamps partial lines, empty collections, and offscreen windows', () => {
  for (const count of [0, 1, 3, 17]) {
    for (const viewStart of [-1000, 0, 200, 4000]) {
      const range = calculateWindow({ ...input, count, viewStart, itemsPerLine: 5 });

      expect(range.start).toBeGreaterThanOrEqual(0);
      expect(range.end).toBeGreaterThanOrEqual(range.start);
      expect(range.end).toBeLessThanOrEqual(count);
      expect(range.spacerStart).toBeGreaterThanOrEqual(0);
      expect(range.spacerEnd).toBeGreaterThanOrEqual(0);
    }
  }
});

test('absorbs subpixel noise without dropping visible lines', () => {
  expect(calculateWindow({ ...input, viewStart: 3999.98 })).toEqual(calculateWindow(input));
  expect(calculateWindow({ ...input, viewStart: 0, viewSize: 40, overscan: 0 }).end).toBe(1);
});

test('normalizes public numeric inputs', () => {
  expect(whole(3.9)).toBe(3);
  expect(whole(-2, 2)).toBe(2);
  expect(whole(NaN)).toBe(0);
  expect(whole(Infinity, 2)).toBe(2);
  expect(positive(-1)).toBe(0);
  expect(positive(NaN)).toBe(0);
  expect(positive(2.5)).toBe(2.5);
});

test('reads resolved tracks without treating named grid lines as tracks', () => {
  expect(resolvedTracks('[start a] 20px [middle] 40.5px [end]')).toEqual([20, 40.5]);
  expect(resolvedTracks('subgrid [a] [b]')).toBeNull();
  expect(resolvedTracks('none')).toBeNull();
  expect(trackSpan('1', '-1', 3)).toBe(3);
  expect(trackSpan('auto', 'span 2', 4)).toBe(2);
  expect(trackSpan('auto', 'auto', 4)).toBe(1);
  expect(trackSpan('start', 'end', 4)).toBeNull();
});
