import { runtimeScenarios } from './runtime-scenarios';
import { resetRoot } from './shared';

/*
 * One Tachometer sample per page load: warm the scenario up, time one run,
 * and publish the milliseconds on `window.tachometerResult`. Tachometer
 * interleaves base and candidate loads and computes the statistics.
 */
const WARMUP_RUNS = 2;

async function measure(name: string): Promise<number> {
  const run = runtimeScenarios[name];

  if (!run) {
    throw new Error(`Unknown runtime scenario: ${name}`);
  }

  for (let index = 0; index < WARMUP_RUNS; index += 1) {
    await run();
  }

  const startedAt = performance.now();

  await run();

  const elapsed = performance.now() - startedAt;

  resetRoot();

  return elapsed;
}

window.rcRuntimeScenarioNames = Object.keys(runtimeScenarios);

const scenario = new URLSearchParams(location.search).get('scenario');

if (scenario) {
  measure(scenario).then(
    (elapsed) => {
      window.tachometerResult = elapsed;
    },
    (error: unknown) => {
      window.rcBenchmarkError = String(error);
    },
  );
}

declare global {
  interface Window {
    rcRuntimeScenarioNames: string[];
    rcBenchmarkError?: string;
    tachometerResult?: number;
  }
}
