import type { LitElement } from 'lit';

import type { RCPageTurner } from '@rcarls/rc-page-turner';

// Helpers shared by the runtime scenarios (compared with Tachometer) and the
// motion scenarios (checked in validate).

const $benchmarks = document.querySelector<HTMLElement>('#benchmarks');

if (!$benchmarks) {
  throw new Error('Missing benchmark root.');
}

export const $root: HTMLElement = $benchmarks;

export function resetRoot(): void {
  $root.replaceChildren();
}

export function percentile(samples: number[], percentileValue: number): number {
  const sorted = [...samples].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil(percentileValue * sorted.length) - 1);

  return sorted[index] ?? 0;
}

export function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export async function settle(element: Element): Promise<void> {
  const updateComplete = (element as LitElement).updateComplete;

  if (updateComplete) {
    await updateComplete;
  }

  await nextFrame();
}

export function options(count: number): string {
  return Array.from(
    { length: count },
    (_, index) => `<option value="value-${index}">Option ${index}</option>`,
  ).join('');
}

/** A page turner of `count` recipe-step pages, each with text and controls. */
export function createPageTurner(count: number): RCPageTurner {
  const turner = document.createElement('rc-page-turner') as RCPageTurner;

  turner.setAttribute('aria-label', 'Steps');
  turner.style.cssText = 'display: block; inline-size: 24rem; block-size: 20rem;';

  turner.innerHTML = Array.from(
    { length: count },
    (_, index) => `
      <rc-page-turner-page>
        <h2>Step ${index + 1}</h2>
        <p>Whisk the eggs with the sugar until pale, then fold in the flour in three additions.</p>
        <label><input type="checkbox" /> Done</label>
        <button type="button">Start 5 minute timer</button>
      </rc-page-turner-page>
    `,
  ).join('');

  return turner;
}
