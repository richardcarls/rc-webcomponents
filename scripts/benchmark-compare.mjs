#!/usr/bin/env node
/**
 * Compares runtime benchmark timings of the working tree with a base commit
 * using Tachometer, which interleaves page loads of both variants and reports
 * a 95% confidence interval for the percent change.
 *
 * Usage:
 *   node scripts/benchmark-compare.mjs prepare [base-ref]
 *     Exports the base commit's package sources (needs git; runs on the host).
 *   node scripts/benchmark-compare.mjs run [scenario...]
 *     Builds both pages, runs Tachometer per scenario, writes the report, and
 *     exits 1 on a confident regression (runs in the Playwright image).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORK = join(ROOT, '.performance', 'tachometer');
const BASE_TREE = join(WORK, 'base');
const BASE_INFO = join(BASE_TREE, 'base-ref.json');
const PAGES = join(WORK, 'pages');
const RESULTS = join(WORK, 'results');
const SUMMARY_PATH = join(WORK, 'summary.md');
const PAGE_PATH = 'benchmarks/tachometer.html';
const VITE_CONFIG = join(ROOT, 'benchmarks', 'tachometer.vite.config.ts');
const require = createRequire(import.meta.url);

/** A file inside an installed package, bypassing its `exports` map. */
const packageFile = (name, file) => join(dirname(require.resolve(`${name}/package.json`)), file);

/** A HEAD change whose whole 95% interval sits above this percent fails. */
export const REGRESSION_PERCENT = 10;

const SAMPLE_SIZE = 50;
/** Minutes of extra sampling per scenario when the interval straddles a condition. */
const AUTO_SAMPLE_MINUTES = 1;
const PREFLIGHT_TIMEOUT_MS = 30_000;

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
}

/** The default base: the merge base with origin/develop, or HEAD's first parent on develop. */
function defaultBaseRef() {
  const head = git(['rev-parse', 'HEAD']);
  let mergeBase = head;

  try {
    mergeBase = git(['merge-base', 'HEAD', 'origin/develop']);
  } catch {
    // No origin/develop (shallow or detached checkout): fall back to the parent.
  }

  return mergeBase === head ? 'HEAD^' : mergeBase;
}

function prepare(baseRef = defaultBaseRef()) {
  const sha = git(['rev-parse', '--verify', `${baseRef}^{commit}`]);
  const archive = execFileSync(
    'git',
    ['archive', '--format=tar', sha, 'packages', 'tsconfig.base.json'],
    {
      cwd: ROOT,
      maxBuffer: 512 * 1024 * 1024,
    },
  );

  rmSync(BASE_TREE, { force: true, recursive: true });
  mkdirSync(BASE_TREE, { recursive: true });
  execFileSync('tar', ['-x', '-C', BASE_TREE], { input: archive });
  writeFileSync(BASE_INFO, `${JSON.stringify({ ref: baseRef, sha }, null, 2)}\n`);
  console.log(`Exported base packages from ${baseRef} (${sha.slice(0, 7)}).`);
}

function chromiumPath() {
  return require('playwright').chromium.executablePath();
}

function majorVersion(binary) {
  const output = execFileSync(binary, ['--version'], { encoding: 'utf8' });
  const match = /(\d+)\.\d+\.\d+/.exec(output);

  if (!match) {
    throw new Error(`Could not read a version from "${output.trim()}".`);
  }

  return Number(match[1]);
}

/** Yarn doesn't run install scripts here, so fetch the driver on first use. */
function ensureChromedriver() {
  const driverPath = () => require('chromedriver').path;

  if (!existsSync(driverPath())) {
    execFileSync(process.execPath, [packageFile('chromedriver', 'install.js')], {
      stdio: 'inherit',
    });
  }

  const driverMajor = majorVersion(driverPath());
  const chromiumMajor = majorVersion(chromiumPath());

  if (driverMajor !== chromiumMajor) {
    throw new Error(
      `chromedriver ${driverMajor} does not match the Playwright Chromium ${chromiumMajor}; ` +
        `set the chromedriver devDependency to ~${chromiumMajor}.0.0.`,
    );
  }
}

function buildPage(variant, packagesDir) {
  const result = spawnSync(
    process.execPath,
    [packageFile('vite', 'bin/vite.js'), 'build', '--config', VITE_CONFIG],
    {
      cwd: ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        RC_BENCH_PACKAGES: packagesDir,
        RC_BENCH_OUT_DIR: join(PAGES, variant),
      },
    },
  );

  return { ok: result.status === 0, output: `${result.stdout}${result.stderr}`.trim() };
}

const CONTENT_TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

/** A minimal static server for the preflight; Tachometer serves the pages itself. */
async function serveStatic(root) {
  const server = createServer((request, response) => {
    const path = resolve(root, `.${decodeURIComponent(new URL(request.url, 'http://x').pathname)}`);

    if (!path.startsWith(root + sep) || !existsSync(path) || !statSync(path).isFile()) {
      response.writeHead(404).end();

      return;
    }

    response.writeHead(200, {
      'content-type': CONTENT_TYPES[extname(path)] ?? 'application/octet-stream',
    });

    createReadStream(path).pipe(response);
  });

  await new Promise((done) => server.listen(0, '127.0.0.1', done));

  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}

/** Loads each scenario once per variant, so Tachometer never polls a page that throws. */
async function preflight(variants) {
  const { chromium } = require('playwright');
  const { server, origin } = await serveStatic(PAGES);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();

    await page.goto(`${origin}/head/${PAGE_PATH}`);

    const scenarios = await page.evaluate('window.rcRuntimeScenarioNames');
    const outcomes = {};

    for (const scenario of scenarios) {
      outcomes[scenario] = {};

      for (const variant of variants) {
        await page.goto(`${origin}/${variant}/${PAGE_PATH}?scenario=${scenario}`);

        const outcome = await page
          .waitForFunction('window.tachometerResult ?? window.rcBenchmarkError', null, {
            timeout: PREFLIGHT_TIMEOUT_MS,
          })
          .then((handle) => handle.jsonValue())
          .catch((error) => `preflight timed out: ${error.message}`);

        outcomes[scenario][variant] = typeof outcome === 'number' ? null : String(outcome);
      }
    }

    return outcomes;
  } finally {
    await browser.close();
    server.close();
  }
}

function tachometerConfig(scenario) {
  const browser = {
    name: 'chrome',
    headless: true,
    binary: chromiumPath(),
    addArguments: ['--no-sandbox', '--disable-dev-shm-usage'],
    windowSize: { width: 1280, height: 800 },
  };

  return {
    root: PAGES,
    sampleSize: SAMPLE_SIZE,
    timeout: AUTO_SAMPLE_MINUTES,
    autoSampleConditions: [`${REGRESSION_PERCENT}%`],
    benchmarks: ['base', 'head'].map((variant) => ({
      name: `${scenario} ${variant}`,
      // Tachometer resolves benchmark paths against the config file's folder.
      url: `${relative(RESULTS, join(PAGES, variant, PAGE_PATH))}?scenario=${scenario}`,
      measurement: { mode: 'expression', expression: 'window.tachometerResult' },
      browser,
    })),
  };
}

function runTachometer(scenario) {
  const configPath = join(RESULTS, `${scenario}.config.json`);
  const jsonPath = join(RESULTS, `${scenario}.json`);

  writeFileSync(configPath, `${JSON.stringify(tachometerConfig(scenario), null, 2)}\n`);

  execFileSync(
    process.execPath,
    [packageFile('tachometer', 'bin/tach.js'), '--config', configPath, '--json-file', jsonPath],
    { cwd: ROOT, stdio: 'inherit' },
  );

  return JSON.parse(readFileSync(jsonPath, 'utf8'));
}

/**
 * Reads HEAD's change against base from Tachometer's JSON. Each difference
 * is (this - other) / other, so a positive change on the HEAD row is slower.
 */
export function compareResult(json, threshold = REGRESSION_PERCENT) {
  const [base, head] = json.benchmarks;
  const change = head.differences[0].percentChange;

  let verdict = `within ±${threshold}%`;

  if (change.low > threshold) {
    verdict = 'regression';
  } else if (change.high < -threshold) {
    verdict = 'faster';
  } else if (change.high > threshold || change.low < -threshold) {
    verdict = 'inconclusive';
  }

  return {
    baseMean: (base.mean.low + base.mean.high) / 2,
    headMean: (head.mean.low + head.mean.high) / 2,
    change,
    verdict,
    samples: head.samples.length,
  };
}

const formatMs = (value) => `${value.toFixed(1)} ms`;
const formatPercent = (value) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

export function summaryMarkdown({ base, rows }) {
  const lines = [
    '## Runtime benchmarks',
    '',
    `HEAD compared with \`${base.sha.slice(0, 7)}\` (${base.ref}) by Tachometer. A regression is a ` +
      `95% interval entirely above +${REGRESSION_PERCENT}%.`,
    '',
    '| Scenario | Base | HEAD | Change (95% CI) | Samples | Result |',
    '| --- | ---: | ---: | --- | ---: | --- |',
  ];

  for (const row of rows) {
    if (row.skipped) {
      lines.push(`| ${row.scenario} | | | | | skipped: ${row.skipped} |`);

      continue;
    }

    lines.push(
      `| ${row.scenario} | ${formatMs(row.baseMean)} | ${formatMs(row.headMean)} | ` +
        `${formatPercent(row.change.low)} to ${formatPercent(row.change.high)} | ${row.samples} | ` +
        `${row.verdict === 'regression' ? '**regression**' : row.verdict} |`,
    );
  }

  return `${lines.join('\n')}\n`;
}

async function run(only = []) {
  if (!existsSync(BASE_INFO)) {
    throw new Error('No base packages; run `node scripts/benchmark-compare.mjs prepare` first.');
  }

  const base = JSON.parse(readFileSync(BASE_INFO, 'utf8'));

  ensureChromedriver();
  rmSync(PAGES, { force: true, recursive: true });
  rmSync(RESULTS, { force: true, recursive: true });
  mkdirSync(RESULTS, { recursive: true });

  const head = buildPage('head', join(ROOT, 'packages'));

  if (!head.ok) {
    throw new Error(`The HEAD benchmark page failed to build:\n${head.output}`);
  }

  const baseBuild = buildPage('base', join(BASE_TREE, 'packages'));

  if (!baseBuild.ok) {
    console.warn(
      `The base benchmark page failed to build; skipping the comparison:\n${baseBuild.output}`,
    );
  }

  const outcomes = await preflight(baseBuild.ok ? ['head', 'base'] : ['head']);
  const broken = Object.entries(outcomes).filter(([, outcome]) => outcome.head);

  if (broken.length > 0) {
    throw new Error(
      `Runtime scenarios fail on HEAD:\n${broken.map(([name, outcome]) => `${name}: ${outcome.head}`).join('\n')}`,
    );
  }

  const rows = [];

  for (const [scenario, outcome] of Object.entries(outcomes)) {
    if (only.length > 0 && !only.includes(scenario)) {
      continue;
    }

    if (!baseBuild.ok) {
      rows.push({ scenario, skipped: 'base page did not build' });
    } else if (outcome.base) {
      rows.push({ scenario, skipped: `base cannot run it (${outcome.base})` });
    } else {
      rows.push({ scenario, ...compareResult(runTachometer(scenario)) });
    }
  }

  const summary = summaryMarkdown({ base, rows });

  writeFileSync(SUMMARY_PATH, summary);
  writeFileSync(join(WORK, 'report.json'), `${JSON.stringify({ base, rows }, null, 2)}\n`);
  console.log(`\n${summary}`);

  const regressions = rows.filter((row) => row.verdict === 'regression');

  if (regressions.length > 0) {
    console.error(
      `Confident runtime regressions: ${regressions.map((row) => row.scenario).join(', ')}.`,
    );

    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, ...args] = process.argv.slice(2);

  if (command === 'prepare') {
    prepare(args[0]);
  } else if (command === 'run') {
    await run(args);
  } else {
    console.error(
      'Usage: node scripts/benchmark-compare.mjs <prepare [base-ref] | run [scenario...]>',
    );

    process.exitCode = 2;
  }
}
