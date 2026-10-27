import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RUNTIME_METRICS,
  absoluteBudget,
  compareRuntimeResults,
  countBudget,
  createRuntimeBaseline,
  createRuntimeBudgets,
  runBenchmarkAttempts,
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
    () => createRuntimeBudgets({ example: { median: 10, futureMetric: 2 } }),
    /Unknown runtime metric "futureMetric" in scenario "example"/,
  );
});

test('the motion metrics added for frame sampling have the right budget semantics', () => {
  assert.deepEqual(
    createRuntimeBudgets({
      example: { median: 10, longFrames: 3, longestFrameMs: 20, animationCount: 4 },
    }),
    {
      example: { median: 15, longFrames: 3, longestFrameMs: 50, animationCount: 4 },
    },
  );
});

test('createRuntimeBudgets excludes diagnostic samples', () => {
  assert.deepEqual(
    createRuntimeBudgets({ example: { median: 10, p95: 20, samples: [], frameWaitSamples: [] } }),
    {
      example: { median: 15, p95: 25 },
    },
  );
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

test('runBenchmarkAttempts keeps a failing first attempt when a full retry passes', async () => {
  let runs = 0;
  const attempts = await runBenchmarkAttempts(
    async () => ({ example: { median: ++runs === 1 ? 20 : 8, p95: 9 } }),
    { example: { median: 10, p95: 10 } },
  );

  assert.equal(runs, 2);
  assert.match(attempts[0].errors[0], /median/);
  assert.deepEqual(attempts[1].errors, []);
  assert.equal(typeof attempts[0].runner.elapsedMs, 'number');
});

test('runBenchmarkAttempts preserves a reproducible budget failure', async () => {
  const attempts = await runBenchmarkAttempts(async () => ({ example: { median: 20, p95: 20 } }), {
    example: { median: 10, p95: 10 },
  });

  assert.equal(attempts.length, 2);
  assert.equal(attempts[0].errors.length, 2);
  assert.equal(attempts[1].errors.length, 2);
});
