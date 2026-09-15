import type { LitElement } from 'lit';

import type { RCAdaptiveMenu } from '@rcarls/rc-adaptive-menu';
import type { RCCombobox } from '@rcarls/rc-combobox';
import type { RCSelect } from '@rcarls/rc-select';
import type { RCTextarea } from '@rcarls/rc-textarea';
import '@rcarls/rc-adaptive-menu/define';
import '@rcarls/rc-button/define';
import '@rcarls/rc-combobox/define';
import '@rcarls/rc-select/define';
import '@rcarls/rc-textarea/define';

type BenchmarkResult = {
  median: number;
  p95: number;
  samples: number[];
};

const $root = document.querySelector<HTMLElement>('#benchmarks');

if (!$root) {
  throw new Error('Missing benchmark root.');
}

function percentile(samples: number[], percentileValue: number): number {
  const sorted = [...samples].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil(percentileValue * sorted.length) - 1);

  return sorted[index] ?? 0;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle(element: Element): Promise<void> {
  const updateComplete = (element as LitElement).updateComplete;

  if (updateComplete) {
    await updateComplete;
  }

  await nextFrame();
}

function options(count: number): string {
  return Array.from(
    { length: count },
    (_, index) => `<option value="value-${index}">Option ${index}</option>`,
  ).join('');
}

function resetRoot(): void {
  $root.replaceChildren();
}

async function createButtons(): Promise<void> {
  resetRoot();

  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 100; index += 1) {
    const host = document.createElement('rc-button');
    const button = document.createElement('button');

    button.textContent = `Action ${index}`;
    host.append(button);
    fragment.append(host);
  }

  $root.append(fragment);
  await Promise.all(Array.from($root.children, (element) => settle(element)));
}

async function createSelects(): Promise<void> {
  resetRoot();

  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 50; index += 1) {
    const host = document.createElement('rc-select');

    host.innerHTML = `<select aria-label="Choice ${index}">${options(20)}</select>`;
    fragment.append(host);
  }

  $root.append(fragment);
  await Promise.all(Array.from($root.children, (element) => settle(element)));
}

async function openAndFilterCombobox(): Promise<void> {
  resetRoot();

  const host = document.createElement('rc-combobox') as RCCombobox;

  host.innerHTML = `<select aria-label="Large choice set">${options(1000)}</select>`;
  $root.append(host);
  await settle(host);

  host.openPopup();
  await settle(host);

  const input = host.renderRoot.querySelector<HTMLInputElement>('#trigger');

  if (!input) {
    throw new Error('Combobox trigger was not rendered.');
  }

  input.value = 'Option 99';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await settle(host);
  host.closePopup(false);
}

async function renderLargeTextarea(): Promise<void> {
  resetRoot();

  const host = document.createElement('rc-textarea') as RCTextarea;
  const textarea = document.createElement('textarea');
  const lines = Array.from(
    { length: 1000 },
    (_, index) => `${index}: const value = ${index}; ${index % 8 === 0 ? 'TODO revisit' : ''}`,
  );

  textarea.setAttribute('aria-label', 'Benchmark source');
  host.append(textarea);
  host.addPattern({ pattern: /TODO/g, className: 'benchmark-todo' });
  host.value = lines.join('\n');
  $root.append(host);
  await settle(host);

  host.value += '\n1001: TODO final edit';
  await settle(host);
}

async function updateAdaptiveMenu(): Promise<void> {
  resetRoot();

  const host = document.createElement('rc-adaptive-menu') as RCAdaptiveMenu;

  host.setAttribute('label', 'Benchmark actions');

  for (let index = 0; index < 50; index += 1) {
    const button = document.createElement('button');

    button.textContent = `Action ${index}`;
    host.append(button);
  }

  $root.append(host);
  await settle(host);

  for (const maximum of [5, 20, 1, 50, 3]) {
    host.maxShown = maximum;
    await host.updateComplete;
  }

  await nextFrame();
}

async function settleAnchoredPopup(): Promise<void> {
  resetRoot();

  const host = document.createElement('rc-select') as RCSelect;

  host.innerHTML = `<select aria-label="Anchored choice">${options(20)}</select>`;
  $root.append(host);
  await settle(host);
  host.openPopup();
  await settle(host);

  host.style.translate = '1px 1px';
  window.dispatchEvent(new Event('resize'));

  for (let frame = 0; frame < 12; frame += 1) {
    await nextFrame();
  }

  host.closePopup(false);
}

const scenarios: Record<string, () => Promise<void>> = {
  create100Buttons: createButtons,
  create50Selects: createSelects,
  filter1000OptionCombobox: openAndFilterCombobox,
  render1000LineTextarea: renderLargeTextarea,
  update50ActionAdaptiveMenu: updateAdaptiveMenu,
  settleAnchoredPopup,
};

async function measureScenario(run: () => Promise<void>): Promise<BenchmarkResult> {
  const warmups = 3;
  const measuredRuns = 10;

  for (let index = 0; index < warmups; index += 1) {
    await run();
  }

  const samples: number[] = [];

  for (let index = 0; index < measuredRuns; index += 1) {
    const startedAt = performance.now();

    await run();
    samples.push(performance.now() - startedAt);
  }

  return {
    median: percentile(samples, 0.5),
    p95: percentile(samples, 0.95),
    samples,
  };
}

window.rcBenchmarkNames = Object.keys(scenarios);

window.runRcBenchmark = async (name: string): Promise<BenchmarkResult> => {
  const run = scenarios[name];

  if (!run) {
    throw new Error(`Unknown benchmark scenario: ${name}`);
  }

  const result = await measureScenario(run);

  resetRoot();

  return result;
};

declare global {
  interface Window {
    rcBenchmarkNames: string[];
    runRcBenchmark: (name: string) => Promise<BenchmarkResult>;
  }
}
