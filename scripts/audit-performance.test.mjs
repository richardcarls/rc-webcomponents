import assert from 'node:assert/strict';
import test from 'node:test';

import { byteBudget, compareMeasurements, createBudgets } from './audit-performance.mjs';

const measurements = {
  example: {
    initialRaw: 10_000,
    initialGzip: 4_000,
    initialBrotli: 3_500,
    totalRaw: 15_000,
    totalGzip: 6_000,
    totalBrotli: 5_000,
    largestLazyGzip: 2_000,
    initialChunks: 1,
    lazyChunks: 1,
  },
};

test('byte budgets allow five percent or one KiB, whichever is larger', () => {
  assert.equal(byteBudget(4_000), 5_024);
  assert.equal(byteBudget(40_000), 42_000);
});

test('created budgets keep chunk counts fixed', () => {
  const budgets = createBudgets(measurements);

  assert.equal(budgets.example.initialChunks, 1);
  assert.equal(budgets.example.lazyChunks, 1);
  assert.equal(budgets.example.initialGzip, 5_024);
});

test('comparison reports missing and over-budget measurements', () => {
  const budgets = createBudgets(measurements);
  const overBudget = JSON.parse(JSON.stringify(measurements));

  overBudget.example.initialChunks = 2;

  assert.deepEqual(compareMeasurements(overBudget, budgets), [
    'example.initialChunks: 2 exceeds 1.',
  ]);

  assert.deepEqual(compareMeasurements({}, budgets), ['example: missing measurement.']);
});
