import { expect, test } from 'vitest';

import { findExtremeSnapIndex, findNearestSnapIndex, findNextSnapIndex } from './snapUtils';

test('findNearestSnapIndex returns the closest finite point', () => {
  expect(findNearestSnapIndex([0, Number.NaN, 50, 100], 62)).toBe(2);
  expect(findNearestSnapIndex([], 10)).toBe(-1);
});

test('findNextSnapIndex selects the next point in either direction', () => {
  const points = [0, 25, 50, 100];

  expect(findNextSnapIndex(points, 40, 1)).toBe(2);
  expect(findNextSnapIndex(points, 40, -1)).toBe(1);
  expect(findNextSnapIndex(points, 100, 1)).toBe(3);
  expect(findNextSnapIndex(points, 0, -1)).toBe(0);
});

test('findExtremeSnapIndex selects the endpoint for a direction', () => {
  expect(findExtremeSnapIndex([10, 20, 30], -1)).toBe(0);
  expect(findExtremeSnapIndex([10, 20, 30], 1)).toBe(2);
  expect(findExtremeSnapIndex([], 1)).toBe(-1);
});
