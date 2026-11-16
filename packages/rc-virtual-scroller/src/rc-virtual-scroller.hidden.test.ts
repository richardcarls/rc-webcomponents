import { afterEach, expect, test, vi } from 'vitest';

import './define.js';
import type { RCVirtualScroller, RCVirtualScrollerRangeDetail } from './rc-virtual-scroller.js';

const COUNT = 300;

let $port: HTMLElement | undefined;

afterEach(() => {
  $port?.remove();
  $port = undefined;
});

const frames = (count = 3) =>
  new Promise<void>((resolve) => {
    const step = (left: number) => (left ? requestAnimationFrame(() => step(left - 1)) : resolve());

    step(count);
  });

/**
 * A scrollport holding an auto-fill card grid, like a library pane, with the
 * consumer rendering exactly the reported range into the grid.
 */
function mountCardGrid(hidden = false): { $host: RCVirtualScroller; $pane: HTMLElement; ranges: RCVirtualScrollerRangeDetail[] } {
  $port = document.createElement('div');
  $port.style.cssText = 'block-size:400px;inline-size:600px;overflow:auto';

  const $pane = document.createElement('div');
  const $host = document.createElement('rc-virtual-scroller');
  const $grid = document.createElement('div');
  const ranges: RCVirtualScrollerRangeDetail[] = [];

  $grid.style.cssText =
    'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));grid-auto-rows:120px;gap:8px';

  $host.count = COUNT;
  $host.itemSize = 128;
  $host.append($grid);

  $host.addEventListener('rc-virtual-scroller-range', (event) => {
    ranges.push(event.detail);

    $grid.replaceChildren(
      ...Array.from({ length: event.detail.end - event.detail.start }, (_, i) => {
        const $card = document.createElement('div');

        $card.textContent = `Card ${event.detail.start + i}`;

        return $card;
      }),
    );
  });

  if (hidden) {
    $pane.style.cssText = 'visibility:hidden;content-visibility:hidden';
  }

  $pane.append($host);
  $port.append($pane);
  document.body.append($port);

  return { $host, $pane, ranges };
}

test('keeps its window when an ancestor skips its contents with content-visibility: hidden', async () => {
  const { $host, $pane, ranges } = mountCardGrid();

  await vi.waitFor(() => expect($host.range?.measured).toBe(true));

  const shown = $host.range!;

  expect(shown.end).toBeLessThan(COUNT);

  // How a list-detail layout hides the inactive pane without unmounting it.
  $pane.style.cssText = 'visibility:hidden;content-visibility:hidden';
  await frames();

  // The consumer re-renders its slice while the pane is skipped; the new
  // grid rows are never laid out, so Firefox reports them as 0px tracks.
  const $grid = $host.firstElementChild!;

  $grid.append(...Array.from({ length: 8 }, () => document.createElement('div')));
  await frames(4);

  expect(ranges.every((range) => range.end < COUNT)).toBe(true);
  expect($host.range?.end).toBe(shown.end);
});

test('does not render the full collection when it first connects inside skipped content', async () => {
  const { $host, $pane, ranges } = mountCardGrid(true);

  await $host.updateComplete;
  await frames(6);

  expect(ranges.every((range) => range.end < COUNT)).toBe(true);

  // Once shown, it measures and windows as usual.
  $pane.style.cssText = '';
  await vi.waitFor(() => expect($host.range?.measured).toBe(true));
  expect($host.range?.end).toBeLessThan(COUNT);
});
