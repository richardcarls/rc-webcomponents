import { expect, test } from 'vitest';

import { paginationRange } from './range.js';

test('lists every page when nothing needs hiding', () => {
  expect(paginationRange({ page: 2, total: 5 })).toEqual([1, 2, 3, 4, 5]);
});

test('hides runs of pages on both sides of the current page', () => {
  expect(paginationRange({ page: 6, total: 12 })).toEqual([1, 'ellipsis', 5, 6, 7, 'ellipsis', 12]);
});

test('shows a single hidden page instead of an ellipsis', () => {
  expect(paginationRange({ page: 4, total: 7 })).toEqual([1, 2, 3, 4, 5, 6, 7]);
});

test('honors sibling and boundary counts', () => {
  expect(paginationRange({ page: 10, total: 20, siblings: 2, boundaries: 2 })).toEqual([
    1,
    2,
    'ellipsis',
    8,
    9,
    10,
    11,
    12,
    'ellipsis',
    19,
    20,
  ]);
});

test('clamps the current page and handles empty or single-page sets', () => {
  expect(paginationRange({ page: 99, total: 3 })).toEqual([1, 2, 3]);
  expect(paginationRange({ page: 1, total: 1 })).toEqual([1]);
  expect(paginationRange({ page: 1, total: 0 })).toEqual([]);
});
