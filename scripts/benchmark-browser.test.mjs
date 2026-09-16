import test from 'node:test';
import assert from 'node:assert/strict';

import {
  compareRuntimeResults,
  createRuntimeBaseline,
  createRuntimeBudgets,
  runtimeBudget,
} from './benchmark-browser.mjs';

test('runtimeBudget allows twenty percent or five milliseconds, whichever is larger', () => {
  assert.equal(runtimeBudget(10), 15);
  assert.equal(runtimeBudget(100), 120);
});

test('createRuntimeBudgets covers median and p95 values', () => {
  assert.deepEqual(createRuntimeBudgets({ example: { median: 10, p95: 20, samples: [] } }), {
    example: { median: 15, p95: 25 },
  });
});

test('createRuntimeBaseline preserves measurements separately from limits', () => {
  assert.deepEqual(createRuntimeBaseline({ example: { median: 10, p95: 20, samples: [10, 20] } }), {
    version: 1,
    measurements: { example: { median: 10, p95: 20 } },
    budgets: { example: { median: 15, p95: 25 } },
  });
});

test('compareRuntimeResults reports missing and over-budget measurements', () => {
  const errors = compareRuntimeResults(
    { slow: { median: 11, p95: 20 } },
    {
      missing: { median: 10, p95: 20 },
      slow: { median: 10, p95: 19 },
    },
  );

  assert.deepEqual(errors, [
    'missing: missing measurement.',
    'slow.median: 11.00ms exceeds 10.00ms.',
    'slow.p95: 20.00ms exceeds 19.00ms.',
  ]);
});
