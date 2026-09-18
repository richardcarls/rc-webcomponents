import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE_PATH = join(ROOT, 'browser-performance-budgets.json');
const REPORT_PATH = join(ROOT, '.performance', 'browser-report.json');
const UPDATE_BASELINE = process.argv.includes('--update-baseline');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/*
 * `measureScenario()` in benchmarks/browser.ts always includes `samples`
 * (the raw per-run timings) alongside whatever metrics it measured. It's
 * report detail, not a budgeted metric, so it's excluded here rather than
 * required to have a RUNTIME_METRICS entry.
 */
const NON_METRIC_RESULT_FIELDS = new Set(['samples']);

/*
 * Three budget semantics, mirroring BYTE_METRICS/COUNT_METRICS in
 * audit-performance.mjs. `timingBudget` gives a timing measurement headroom
 * over its own baseline; `countBudget` allows no headroom at all, since a
 * count regressing by even one is itself the signal; `absoluteBudget` fixes
 * a ceiling that doesn't move with the baseline, for a metric where the
 * baseline value itself isn't a meaningful budget input (a frame that blows
 * past ~50ms is bad regardless of how fast prior runs happened to be).
 */
export function timingBudget(value) {
  return Math.max(value * 1.2, value + 5);
}

export function countBudget(value) {
  return value;
}

export function absoluteBudget(ceiling) {
  return () => ceiling;
}

/*
 * The metrics a scenario is allowed to report, each mapped to its budget
 * semantics. A scenario result carrying a metric with no entry here throws
 * during createRuntimeBudgets rather than silently being budgeted as a
 * timing (a motion scenario's frame-count metrics need countBudget/
 * absoluteBudget, not timingBudget's proportional headroom).
 */
export const RUNTIME_METRICS = {
  median: timingBudget,
  p95: timingBudget,
  /*
   * Motion scenarios (see benchmarks/browser.ts's measureMotionScenario):
   * longFrames and animationCount are deterministic counts a regression
   * should not grow at all, and longestFrameMs is judged against a fixed
   * ceiling rather than its own baseline, since dropped frames move in
   * ~16.7ms quanta and a proportional budget would be meaningless noise.
   */
  longFrames: countBudget,
  longestFrameMs: absoluteBudget(50),
  animationCount: countBudget,
};

const RUNTIME_METRIC_UNITS = {
  median: 'ms',
  p95: 'ms',
  longestFrameMs: 'ms',
};

function formatRuntimeMetric(metric, value) {
  return `${value.toFixed(2)}${RUNTIME_METRIC_UNITS[metric] ?? ''}`;
}

function budgetedMetricEntries(scenario, result) {
  return Object.entries(result)
    .filter(([metric]) => !NON_METRIC_RESULT_FIELDS.has(metric))
    .map(([metric, value]) => {
      const budgetFor = RUNTIME_METRICS[metric];

      if (!budgetFor) {
        throw new Error(
          `Unknown runtime metric "${metric}" in scenario "${scenario}"; add it to RUNTIME_METRICS.`,
        );
      }

      return [metric, value, budgetFor];
    });
}

export function createRuntimeBudgets(results) {
  return Object.fromEntries(
    Object.entries(results).map(([scenario, result]) => [
      scenario,
      Object.fromEntries(
        budgetedMetricEntries(scenario, result).map(([metric, value, budgetFor]) => [
          metric,
          budgetFor(value),
        ]),
      ),
    ]),
  );
}

export function createRuntimeBaseline(results) {
  return {
    version: 1,
    measurements: Object.fromEntries(
      Object.entries(results).map(([scenario, result]) => [
        scenario,
        Object.fromEntries(
          budgetedMetricEntries(scenario, result).map(([metric, value]) => [metric, value]),
        ),
      ]),
    ),
    budgets: createRuntimeBudgets(results),
  };
}

export function compareRuntimeResults(results, budgets) {
  const errors = [];

  for (const [scenario, limits] of Object.entries(budgets)) {
    const actual = results[scenario];

    if (!actual) {
      errors.push(`${scenario}: missing measurement.`);

      continue;
    }

    for (const [metric, limit] of Object.entries(limits)) {
      if (actual[metric] > limit) {
        errors.push(
          `${scenario}.${metric}: ${formatRuntimeMetric(metric, actual[metric])} exceeds ${formatRuntimeMetric(metric, limit)}.`,
        );
      }
    }
  }

  return errors;
}

async function runBenchmarks() {
  const server = await createServer({
    configFile: false,
    root: ROOT,
    logLevel: 'error',
    resolve: { dedupe: ['lit', '@lit/reactive-element'] },
    server: { host: '127.0.0.1', port: 0 },
  });
  let browser;

  try {
    await server.listen();

    const baseUrl = server.resolvedUrls?.local[0];

    if (!baseUrl) {
      throw new Error('Vite did not provide a local benchmark URL.');
    }

    browser = await chromium.launch({ headless: true });

    const url = new URL('benchmarks/', baseUrl).href;
    const discoveryPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    await discoveryPage.goto(url, { waitUntil: 'networkidle' });

    const scenarioNames = await discoveryPage.evaluate('window.rcBenchmarkNames');
    const results = {};

    await discoveryPage.close();

    for (const scenarioName of scenarioNames) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

      await page.goto(url, { waitUntil: 'networkidle' });

      results[scenarioName] = await page.evaluate(
        (name) => globalThis.runRcBenchmark(name),
        scenarioName,
      );

      await page.close();
    }

    return results;
  } finally {
    await browser?.close();
    await server.close();
  }
}

async function main() {
  const results = await runBenchmarks();
  const report = {
    generatedAt: new Date().toISOString(),
    browser: 'chromium',
    results,
  };

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  if (UPDATE_BASELINE) {
    writeFileSync(BASELINE_PATH, `${JSON.stringify(createRuntimeBaseline(results), null, 2)}\n`);
    console.log(`Updated ${BASELINE_PATH}`);
  }

  console.table(
    Object.fromEntries(
      Object.entries(results).map(([scenario, result]) => [
        scenario,
        Object.fromEntries(
          budgetedMetricEntries(scenario, result).map(([metric, value]) => [
            metric,
            formatRuntimeMetric(metric, value),
          ]),
        ),
      ]),
    ),
  );

  if (!UPDATE_BASELINE) {
    const errors = compareRuntimeResults(results, readJson(BASELINE_PATH).budgets);

    if (errors.length > 0) {
      throw new Error(`Browser performance budgets failed:\n${errors.join('\n')}`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
