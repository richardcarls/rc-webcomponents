import type { RCMenuButton } from '@rcarls/rc-menu-button';
import type { RCNavigationRail } from '@rcarls/rc-navigation-rail';
import type { RCSwitch } from '@rcarls/rc-switch';
import '@rcarls/rc-menu-button/define';
import '@rcarls/rc-menu/define';
import '@rcarls/rc-navigation-rail/define';
import '@rcarls/rc-page-turner/define';
import '@rcarls/rc-switch/define';
import { $root, createPageTurner, percentile, resetRoot, settle } from './shared';

// Motion scenarios, checked against frame-count budgets in validate
// (scripts/benchmark-browser.mjs). Runtime timings are compared against the
// base commit with Tachometer instead (benchmarks/runtime-scenarios.ts).

type MotionBenchmarkResult = {
  median: number;
  p95: number;
  longFrames: number;
  longestFrameMs: number;
  animationCount: number;
  samples: number[];
};

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

/*
 * Each setup imports its own theme dynamically, inside the function, rather
 * than as a static top-level import, so a scenario loads only the theme it
 * animates. window.rcBenchmarkNames below still resolves synchronously, since
 * none of these imports are awaited at module scope.
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

/*
 * Turns between the first two pages of a 30-page turner, alternating forward
 * and back, so both the swing-away and swing-in paths are measured. No theme:
 * the turn is the component's own structural motion.
 */
async function setupPageTurnerTurn(): Promise<{
  root: Element;
  toggle: () => Promise<void>;
}> {
  resetRoot();

  const turner = createPageTurner(30);

  $root.append(turner);
  await settle(turner);

  return {
    root: turner,
    toggle: async () => {
      if (turner.activeIndex === 0) {
        turner.next();
      } else {
        turner.previous();
      }

      await settle(turner);
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
  pageTurnerTurnMotion: () => runMotionScenario(setupPageTurnerTurn),
};

window.rcBenchmarkNames = Object.keys(motionScenarios);

window.runRcBenchmark = async (name: string): Promise<MotionBenchmarkResult> => {
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
    runRcBenchmark: (name: string) => Promise<MotionBenchmarkResult>;
  }
}
