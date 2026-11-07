import assert from 'node:assert/strict';
import { test } from 'node:test';

import { compareResult, REGRESSION_PERCENT, summaryMarkdown } from './benchmark-compare.mjs';

function tachometerJson(low, high) {
  return {
    benchmarks: [
      {
        mean: { low: 99, high: 101 },
        differences: [null, { percentChange: { low: -high, high: -low } }],
        samples: [],
      },
      {
        mean: { low: 109, high: 111 },
        differences: [{ percentChange: { low, high } }, null],
        samples: Array(50),
      },
    ],
  };
}

test('compareResult reads the HEAD row against base', () => {
  const result = compareResult(tachometerJson(8, 12));

  assert.equal(result.baseMean, 100);
  assert.equal(result.headMean, 110);
  assert.deepEqual(result.change, { low: 8, high: 12 });
  assert.equal(result.samples, 50);
});

test('compareResult fails only an interval entirely above the threshold', () => {
  assert.equal(compareResult(tachometerJson(REGRESSION_PERCENT + 0.1, 20)).verdict, 'regression');
  assert.equal(compareResult(tachometerJson(REGRESSION_PERCENT - 1, 20)).verdict, 'inconclusive');
  assert.equal(compareResult(tachometerJson(-3, 4)).verdict, `within ±${REGRESSION_PERCENT}%`);
  assert.equal(compareResult(tachometerJson(-30, -12)).verdict, 'faster');
  assert.equal(compareResult(tachometerJson(-15, 2)).verdict, 'inconclusive');
});

test('summaryMarkdown marks regressions and skipped scenarios', () => {
  const markdown = summaryMarkdown({
    base: { ref: 'HEAD^', sha: '0123456789abcdef' },
    rows: [
      { scenario: 'fast', ...compareResult(tachometerJson(-3, 4)) },
      { scenario: 'slow', ...compareResult(tachometerJson(15, 20)) },
      { scenario: 'new', skipped: 'base cannot run it' },
    ],
  });

  assert.match(markdown, /`0123456`/);

  assert.match(
    markdown,
    /\| fast \| 100\.0 ms \| 110\.0 ms \| -3\.0% to \+4\.0% \| 50 \| within ±10% \|/,
  );

  assert.match(markdown, /\| slow \|.*\| \*\*regression\*\* \|/);
  assert.match(markdown, /\| new \| \| \| \| \| skipped: base cannot run it \|/);
});
