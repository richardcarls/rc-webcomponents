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

export function runtimeBudget(value) {
  return Math.max(value * 1.2, value + 5);
}

export function createRuntimeBudgets(results) {
  return Object.fromEntries(
    Object.entries(results).map(([scenario, result]) => [
      scenario,
      {
        median: runtimeBudget(result.median),
        p95: runtimeBudget(result.p95),
      },
    ]),
  );
}

export function createRuntimeBaseline(results) {
  return {
    version: 1,
    measurements: Object.fromEntries(
      Object.entries(results).map(([scenario, result]) => [
        scenario,
        { median: result.median, p95: result.p95 },
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

    for (const metric of ['median', 'p95']) {
      if (actual[metric] > limits[metric]) {
        errors.push(
          `${scenario}.${metric}: ${actual[metric].toFixed(2)}ms exceeds ${limits[metric].toFixed(2)}ms.`,
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
        { median: `${result.median.toFixed(2)}ms`, p95: `${result.p95.toFixed(2)}ms` },
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
