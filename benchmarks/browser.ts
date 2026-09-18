import type { LitElement } from 'lit';

import type { RCAdaptiveMenu } from '@rcarls/rc-adaptive-menu';
import type { RCCombobox } from '@rcarls/rc-combobox';
import type { RCMenuButton } from '@rcarls/rc-menu-button';
import type { RCNavigationRail } from '@rcarls/rc-navigation-rail';
import type { RCSelect } from '@rcarls/rc-select';
import type { RCSwitch } from '@rcarls/rc-switch';
import type { RCTextarea } from '@rcarls/rc-textarea';
import '@rcarls/rc-adaptive-menu/define';
import '@rcarls/rc-button/define';
import '@rcarls/rc-combobox/define';
import '@rcarls/rc-menu-button/define';
import '@rcarls/rc-menu/define';
import '@rcarls/rc-navigation-rail/define';
import '@rcarls/rc-select/define';
import '@rcarls/rc-switch/define';
import '@rcarls/rc-textarea/define';

type BenchmarkResult = {
  median: number;
  p95: number;
  samples: number[];
};

type MotionBenchmarkResult = {
  median: number;
  p95: number;
  longFrames: number;
  longestFrameMs: number;
  animationCount: number;
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

/*
 * A dropped frame moves in ~16.7ms quanta at 60Hz; two dropped frames back to
 * back is a real stutter, one is noise. This threshold, not a proportional
 * one, is what "long" means for a single frame.
 */
const LONG_FRAME_THRESHOLD_MS = 32;
/*
 * A wall-clock ceiling independent of any animation's own duration. Without
 * this, a scenario that accidentally creates an infinite or never-settling
 * animation hangs the whole benchmark run rather than failing loudly.
 */
const SETTLE_TIMEOUT_MS = 4000;

/** True for an animation WAAPI's `finished` promise would never resolve on its own. */
function isInfiniteAnimation(animation: Animation): boolean {
  return animation.effect?.getComputedTiming().iterations === Infinity;
}

/*
 * `Element.getAnimations({ subtree: true })` does not cross into the
 * element's own shadow root in this browser, despite the spec's wording
 * suggesting it should: a component whose transition lives on an internal
 * shadow part (`rc-navigation-rail`'s `#root`, not its host) reports zero
 * animations from the host, even mid-transition, confirmed directly against
 * `rail.shadowRoot.getAnimations()` finding them. Since every component
 * here animates a shadow part, walking every shadow boundary explicitly is
 * required, not an edge case.
 */
function collectAnimations(root: Element | ShadowRoot): Animation[] {
  const animations = [...root.getAnimations({ subtree: true })];
  const descendants = Array.from(root.querySelectorAll('*'));
  const elements = root instanceof Element ? [root, ...descendants] : descendants;

  for (const element of elements) {
    if (element.shadowRoot) {
      animations.push(...collectAnimations(element.shadowRoot));
    }
  }

  return animations;
}

async function settleAnimations(root: Element): Promise<void> {
  const finite = collectAnimations(root).filter((animation) => {
    return !isInfiniteAnimation(animation);
  });

  await Promise.race([
    Promise.all(finite.map((animation) => animation.finished.catch(() => undefined))),
    new Promise<void>((resolve) => {
      setTimeout(resolve, SETTLE_TIMEOUT_MS);
    }),
  ]);
}

/*
 * Samples requestAnimationFrame deltas from the moment `toggle()` is invoked
 * until every finite animation it started has settled (or the wall-clock cap
 * elapses), rather than trusting a single before/after timestamp the way
 * measureScenario() does. A theme that adds an extra animated property shows
 * up here as a longer settle time, more long frames, or a higher animation
 * count — three independent signals a single timing number would blur
 * together.
 */
async function measureMotionScenario(
  root: Element,
  toggle: () => void | Promise<void>,
): Promise<MotionBenchmarkResult> {
  const warmups = 3;
  const measuredRuns = 10;
  const samples: number[] = [];
  let longFrames = 0;
  let longestFrameMs = 0;
  let peakAnimationCount = 0;

  const runOnce = async (record: boolean): Promise<void> => {
    let previousTimestamp: number | null = null;
    let sampling = true;

    const sample = (timestamp: number): void => {
      if (previousTimestamp !== null) {
        // The delta from sampling's own first callback to its trigger is
        // discarded by construction: there is no previous timestamp yet.
        const delta = timestamp - previousTimestamp;

        if (record) {
          longestFrameMs = Math.max(longestFrameMs, delta);

          if (delta > LONG_FRAME_THRESHOLD_MS) {
            longFrames += 1;
          }
        }
      }

      previousTimestamp = timestamp;

      if (sampling) {
        requestAnimationFrame(sample);
      }
    };

    const startedAt = performance.now();

    requestAnimationFrame(sample);
    await toggle();

    if (record) {
      peakAnimationCount = Math.max(peakAnimationCount, collectAnimations(root).length);
    }

    await settleAnimations(root);
    sampling = false;

    if (record) {
      samples.push(performance.now() - startedAt);
    }
  };

  for (let index = 0; index < warmups; index += 1) {
    await runOnce(false);
  }

  for (let index = 0; index < measuredRuns; index += 1) {
    await runOnce(true);
  }

  return {
    median: percentile(samples, 0.5),
    p95: percentile(samples, 0.95),
    longFrames,
    longestFrameMs,
    animationCount: peakAnimationCount,
    samples,
  };
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

/*
 * Each setup imports its own theme dynamically, inside the function, rather
 * than as a static top-level import. A motion scenario is the only place
 * benchmarks/browser.ts reaches for a theme at all, and loading three themes'
 * CSS unconditionally for every scenario (including the many that have
 * nothing to do with theming) would be pure overhead on every page load this
 * harness makes. window.rcBenchmarkNames below still resolves synchronously
 * either way, since none of these imports are awaited at module scope.
 */
async function setupMaterialNavigationRailExpand(): Promise<{
  root: Element;
  toggle: () => Promise<void>;
}> {
  await import('@rcarls/rc-theme-material/theme.css');
  resetRoot();
  $root.classList.add('rc-theme-material');

  const rail = document.createElement('rc-navigation-rail') as RCNavigationRail;
  const link = document.createElement('a');

  link.href = '#';
  link.textContent = 'Recipes';
  link.setAttribute('aria-current', 'page');
  rail.append(link);
  $root.append(rail);
  await settle(rail);

  return {
    root: rail,
    toggle: async () => {
      rail.expanded = !rail.expanded;
      await settle(rail);
    },
  };
}

async function setupMaterialMenuOpenClose(): Promise<{
  root: Element;
  toggle: () => Promise<void>;
}> {
  await import('@rcarls/rc-theme-material/theme.css');
  resetRoot();
  $root.classList.add('rc-theme-material');

  const menuButton = document.createElement('rc-menu-button') as RCMenuButton;

  menuButton.innerHTML = `
    <button slot="trigger">Options</button>
    <rc-menu label="Options">
      <button>Cut</button>
      <button>Copy</button>
      <button>Paste</button>
    </rc-menu>
  `;

  $root.append(menuButton);
  await settle(menuButton);

  return {
    root: menuButton,
    toggle: async () => {
      menuButton.open = !menuButton.open;
      await settle(menuButton);
    },
  };
}

async function setupMaterialSwitchToggle(): Promise<{
  root: Element;
  toggle: () => Promise<void>;
}> {
  await import('@rcarls/rc-theme-material/theme.css');
  resetRoot();
  $root.classList.add('rc-theme-material');

  const toggle = document.createElement('rc-switch') as RCSwitch;
  const input = document.createElement('input');

  input.type = 'checkbox';
  toggle.append(input);
  $root.append(toggle);
  await settle(toggle);

  return {
    root: toggle,
    toggle: async () => {
      toggle.checked = !toggle.checked;
      await settle(toggle);
    },
  };
}

async function setupWin31MenuOpenClose(): Promise<{
  root: Element;
  toggle: () => Promise<void>;
}> {
  await import('@rcarls/rc-theme-win31/theme.css');
  resetRoot();
  $root.classList.add('rc-theme-win31');

  const menuButton = document.createElement('rc-menu-button') as RCMenuButton;

  menuButton.innerHTML = `
    <button slot="trigger">Options</button>
    <rc-menu label="Options">
      <button>Cut</button>
      <button>Copy</button>
      <button>Paste</button>
    </rc-menu>
  `;

  $root.append(menuButton);
  await settle(menuButton);

  return {
    root: menuButton,
    toggle: async () => {
      menuButton.open = !menuButton.open;
      await settle(menuButton);
    },
  };
}

async function runMotionScenario(
  setup: () => Promise<{ root: Element; toggle: () => Promise<void> }>,
): Promise<MotionBenchmarkResult> {
  const { root, toggle } = await setup();

  return measureMotionScenario(root, toggle);
}

const motionScenarios: Record<string, () => Promise<MotionBenchmarkResult>> = {
  materialNavigationRailExpandMotion: () => runMotionScenario(setupMaterialNavigationRailExpand),
  materialMenuOpenCloseMotion: () => runMotionScenario(setupMaterialMenuOpenClose),
  materialSwitchToggleMotion: () => runMotionScenario(setupMaterialSwitchToggle),
  win31MenuOpenCloseMotion: () => runMotionScenario(setupWin31MenuOpenClose),
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

window.rcBenchmarkNames = [...Object.keys(scenarios), ...Object.keys(motionScenarios)];

window.runRcBenchmark = async (name: string): Promise<BenchmarkResult | MotionBenchmarkResult> => {
  const run = scenarios[name];

  if (run) {
    const result = await measureScenario(run);

    resetRoot();

    return result;
  }

  const runMotion = motionScenarios[name];

  if (!runMotion) {
    throw new Error(`Unknown benchmark scenario: ${name}`);
  }

  const result = await runMotion();

  resetRoot();
  $root.classList.remove('rc-theme-material', 'rc-theme-win31');

  return result;
};

declare global {
  interface Window {
    rcBenchmarkNames: string[];
    runRcBenchmark: (name: string) => Promise<BenchmarkResult | MotionBenchmarkResult>;
  }
}
