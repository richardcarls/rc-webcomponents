import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RUNTIME_METRICS,
  absoluteBudget,
  compareRuntimeResults,
  countBudget,
  createRuntimeBaseline,
  createRuntimeBudgets,
  timingBudget,
} from './benchmark-browser.mjs';

test('timingBudget allows twenty percent or five milliseconds, whichever is larger', () => {
  assert.equal(timingBudget(10), 15);
  assert.equal(timingBudget(100), 120);
});

test('countBudget allows no headroom over the baseline', () => {
  assert.equal(countBudget(3), 3);
  assert.equal(countBudget(0), 0);
});

test('absoluteBudget ignores the baseline value and always returns its fixed ceiling', () => {
  const budgetFor = absoluteBudget(50);

  assert.equal(budgetFor(1), 50);
  assert.equal(budgetFor(1000), 50);
});

test('every RUNTIME_METRICS entry is a budget function', () => {
  for (const budgetFor of Object.values(RUNTIME_METRICS)) {
    assert.equal(typeof budgetFor, 'function');
  }
});

test('createRuntimeBudgets throws for a metric with no RUNTIME_METRICS entry', () => {
  assert.throws(
    () => createRuntimeBudgets({ example: { median: 10, longFrames: 2 } }),
    /Unknown runtime metric "longFrames" in scenario "example"/,
  );
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
