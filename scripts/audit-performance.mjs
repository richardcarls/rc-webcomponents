import { brotliCompressSync, gzipSync } from 'node:zlib';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE_PATH = join(ROOT, 'performance-budgets.json');
const REPORT_PATH = join(ROOT, '.performance', 'report.json');
const BYTE_METRICS = [
  'initialGzip',
  'initialBrotli',
  'totalGzip',
  'totalBrotli',
  'largestLazyGzip',
];
const COUNT_METRICS = ['initialChunks', 'lazyChunks'];

const JAVASCRIPT_SCENARIOS = {
  button: ['rc-button', './define'],
  select: ['rc-select', './define'],
  textarea: ['rc-textarea', './define'],
  markdownEditor: ['rc-markdown-editor', './define'],
  aggregateClasses: ['rc-webcomponents', '.'],
  aggregateDefine: ['rc-webcomponents', './define'],
};

const CSS_SCENARIOS = {
  baseTheme: 'packages/rc-webcomponents/themes/base.css',
  materialTheme: 'packages/rc-theme-material/theme.css',
  substrateTheme: 'packages/rc-theme-substrate/theme.css',
  win31Theme: 'packages/rc-theme-win31/theme.css',
};

function compressedSize(contents, compressor) {
  return compressor(contents, { level: 9 }).byteLength;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function packageEntry(packageDirectory, exportName) {
  const packageRoot = join(ROOT, 'packages', packageDirectory);
  const manifest = readJson(join(packageRoot, 'package.json'));
  const exportValue = manifest.exports?.[exportName];
  const relativeEntry =
    typeof exportValue === 'string'
      ? exportValue
      : (exportValue?.import?.default ?? exportValue?.import);

  if (typeof relativeEntry !== 'string') {
    throw new Error(`${manifest.name} has no import entry for ${exportName}.`);
  }

  const entry = resolve(packageRoot, relativeEntry);

  if (!existsSync(entry)) {
    throw new Error(`Missing built entry ${entry}; run yarn build before auditing performance.`);
  }

  return entry;
}

function outputBytes(output) {
  if (output.type === 'chunk') {
    return Buffer.from(output.code);
  }

  return Buffer.isBuffer(output.source) ? output.source : Buffer.from(output.source);
}

function sumOutput(outputs) {
  return outputs.reduce(
    (total, output) => {
      const contents = outputBytes(output);

      total.raw += contents.byteLength;
      total.gzip += compressedSize(contents, gzipSync);
      total.brotli += brotliCompressSync(contents).byteLength;

      return total;
    },
    { raw: 0, gzip: 0, brotli: 0 },
  );
}

function initialChunkNames(outputs) {
  const chunks = new Map(
    outputs.filter((output) => output.type === 'chunk').map((output) => [output.fileName, output]),
  );
  const initial = new Set();
  const pending = outputs
    .filter((output) => output.type === 'chunk' && output.isEntry)
    .map((output) => output.fileName);

  while (pending.length > 0) {
    const fileName = pending.pop();

    if (!fileName || initial.has(fileName)) {
      continue;
    }

    initial.add(fileName);

    for (const imported of chunks.get(fileName)?.imports ?? []) {
      pending.push(imported);
    }
  }

  return initial;
}

function summarizeOutputs(outputs) {
  const relevant = outputs.filter(
    (output) => output.type === 'chunk' || output.fileName.endsWith('.css'),
  );
  const initialNames = initialChunkNames(relevant);
  const initial = relevant.filter(
    (output) => output.type === 'asset' || initialNames.has(output.fileName),
  );
  const lazy = relevant.filter(
    (output) => output.type === 'chunk' && !initialNames.has(output.fileName),
  );
  const initialSize = sumOutput(initial);
  const totalSize = sumOutput(relevant);
  const lazyGzip = lazy.map((output) => compressedSize(outputBytes(output), gzipSync));

  return {
    initialRaw: initialSize.raw,
    initialGzip: initialSize.gzip,
    initialBrotli: initialSize.brotli,
    totalRaw: totalSize.raw,
    totalGzip: totalSize.gzip,
    totalBrotli: totalSize.brotli,
    largestLazyGzip: Math.max(0, ...lazyGzip),
    initialChunks: initial.filter((output) => output.type === 'chunk').length,
    lazyChunks: lazy.length,
  };
}

async function measureJavaScript(entry) {
  const outDir = mkdtempSync(join(tmpdir(), 'rc-performance-'));

  try {
    const result = await build({
      configFile: false,
      logLevel: 'error',
      resolve: {
        dedupe: ['lit', '@lit/reactive-element'],
      },
      build: {
        emptyOutDir: true,
        minify: 'esbuild',
        outDir,
        target: 'es2022',
        write: false,
        lib: {
          entry,
          formats: ['es'],
          fileName: () => 'entry.js',
        },
      },
    });
    const rollupOutput = Array.isArray(result) ? result[0] : result;

    return summarizeOutputs(rollupOutput.output);
  } finally {
    rmSync(outDir, { force: true, recursive: true });
  }
}

function inlineCssImports(path, seen = new Set()) {
  const resolvedPath = resolve(path);

  if (seen.has(resolvedPath)) {
    return '';
  }

  seen.add(resolvedPath);

  return readFileSync(resolvedPath, 'utf8').replace(
    /@import\s+['"](.+?)['"];/g,
    (_match, importPath) => inlineCssImports(resolve(dirname(resolvedPath), importPath), seen),
  );
}

function measureCss(path) {
  const contents = Buffer.from(inlineCssImports(path));
  const gzip = compressedSize(contents, gzipSync);
  const brotli = brotliCompressSync(contents).byteLength;

  return {
    initialRaw: contents.byteLength,
    initialGzip: gzip,
    initialBrotli: brotli,
    totalRaw: contents.byteLength,
    totalGzip: gzip,
    totalBrotli: brotli,
    largestLazyGzip: 0,
    initialChunks: 1,
    lazyChunks: 0,
  };
}

export function byteBudget(value) {
  return Math.max(Math.ceil(value * 1.05), value + 1024);
}

export function createBudgets(measurements) {
  return Object.fromEntries(
    Object.entries(measurements).map(([scenario, metrics]) => [
      scenario,
      Object.fromEntries([
        ...BYTE_METRICS.map((metric) => [metric, byteBudget(metrics[metric])]),
        ...COUNT_METRICS.map((metric) => [metric, metrics[metric]]),
      ]),
    ]),
  );
}

export function compareMeasurements(measurements, budgets) {
  const errors = [];

  for (const [scenario, limits] of Object.entries(budgets)) {
    const actual = measurements[scenario];

    if (!actual) {
      errors.push(`${scenario}: missing measurement.`);

      continue;
    }

    for (const [metric, limit] of Object.entries(limits)) {
      if (actual[metric] > limit) {
        errors.push(`${scenario}.${metric}: ${actual[metric]} exceeds ${limit}.`);
      }
    }
  }

  return errors;
}

export async function collectMeasurements() {
  const measurements = {};

  for (const [scenario, [packageDirectory, exportName]] of Object.entries(JAVASCRIPT_SCENARIOS)) {
    measurements[scenario] = await measureJavaScript(packageEntry(packageDirectory, exportName));
  }

  for (const [scenario, path] of Object.entries(CSS_SCENARIOS)) {
    measurements[scenario] = measureCss(join(ROOT, path));
  }

  return measurements;
}

export async function runPerformanceAudit({ updateBaseline = false } = {}) {
  const measurements = await collectMeasurements();

  mkdirSync(dirname(REPORT_PATH), { recursive: true });

  if (updateBaseline) {
    const baseline = {
      version: 1,
      measurements,
      budgets: createBudgets(measurements),
    };

    writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);
  }

  if (!existsSync(BASELINE_PATH)) {
    throw new Error('Missing performance-budgets.json; run yarn audit:performance:update once.');
  }

  const baseline = readJson(BASELINE_PATH);
  const errors = compareMeasurements(measurements, baseline.budgets);
  const report = {
    version: 1,
    passed: errors.length === 0,
    measurements,
    budgets: baseline.budgets,
    errors,
  };

  writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  return report;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const report = await runPerformanceAudit({
    updateBaseline: process.argv.includes('--update-baseline'),
  });

  for (const [scenario, metrics] of Object.entries(report.measurements)) {
    console.log(
      `${scenario}: ${metrics.initialGzip} B initial gzip, ${metrics.totalGzip} B total gzip, ${metrics.lazyChunks} lazy chunks`,
    );
  }

  if (!report.passed) {
    console.error(report.errors.join('\n'));
    process.exitCode = 1;
  }
}
