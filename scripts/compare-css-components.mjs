import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_PATH = join(ROOT, '.performance', 'css-component-comparison.json');
const RUNS = 5;

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);

  return sorted[Math.floor(sorted.length / 2)];
}

function metric(metrics, name) {
  return metrics.find((entry) => entry.name === name)?.value ?? 0;
}

async function measure(browser, url, mode) {
  const samples = [];

  for (let index = 0; index < RUNS; index += 1) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const cdp = await page.context().newCDPSession(page);

    try {
      await cdp.send('Performance.enable');
      await page.goto(`${url}?mode=${mode}`, { waitUntil: 'networkidle' });
      await page.waitForFunction(() => typeof globalThis.runRcCssComparison === 'function');
      await cdp.send('HeapProfiler.collectGarbage');

      const before = metric((await cdp.send('Performance.getMetrics')).metrics, 'TaskDuration');
      const mount = await page.evaluate(() => globalThis.runRcCssComparison());

      await cdp.send('HeapProfiler.collectGarbage');

      const after = (await cdp.send('Performance.getMetrics')).metrics;

      samples.push({
        mountMs: mount.mountMs,
        taskMs: (metric(after, 'TaskDuration') - before) * 1000,
        heapBytes: metric(after, 'JSHeapUsedSize'),
        domNodes: metric(after, 'Nodes'),
        controls: mount.controls,
      });
    } finally {
      await cdp.detach();
      await page.close();
    }
  }

  return {
    medianMountMs: median(samples.map((sample) => sample.mountMs)),
    medianTaskMs: median(samples.map((sample) => sample.taskMs)),
    medianHeapBytes: median(samples.map((sample) => sample.heapBytes)),
    medianDomNodes: median(samples.map((sample) => sample.domNodes)),
    samples,
  };
}

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
    throw new Error('Vite did not provide a comparison URL.');
  }

  browser = await chromium.launch({ headless: true });

  const url = new URL('benchmarks/css-comparison.html', baseUrl).href;
  const results = {
    css: await measure(browser, url, 'css'),
    component: await measure(browser, url, 'component'),
  };

  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, `${JSON.stringify({ version: 1, results }, null, 2)}\n`);

  for (const [mode, result] of Object.entries(results)) {
    console.log(
      `${mode}: ${result.medianMountMs.toFixed(1)} ms mount, ${result.medianTaskMs.toFixed(1)} ms task, ${result.medianHeapBytes} B heap, ${result.medianDomNodes} DOM nodes`,
    );
  }
} finally {
  await browser?.close();
  await server.close();
}
