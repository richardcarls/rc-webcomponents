import { afterEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';

import './define.js';
import type { RCVirtualScroller } from './rc-virtual-scroller.js';

let $host: RCVirtualScroller | undefined;

afterEach(() => {
  $host?.remove();
  window.scrollTo(0, 0);
});

test('updates a document-scrolled window and responds to viewport resizing', async () => {
  $host = document.createElement('rc-virtual-scroller');

  const $list = document.createElement('div');

  $list.style.cssText = 'display:grid;grid-auto-rows:40px';
  $host.count = 500;
  $host.itemSize = 40;
  $host.scrollTarget = document.scrollingElement;
  $host.append($list);

  $host.addEventListener('rc-virtual-scroller-range', (event) => {
    const $items = Array.from({ length: event.detail.end - event.detail.start }, () => {
      const $item = document.createElement('div');

      $item.textContent = 'Row';

      return $item;
    });

    $list.replaceChildren(...$items);
  });

  document.body.append($host);
  await $host.updateComplete;
  await vi.waitFor(() => expect($host?.range?.measured).toBe(true));
  window.scrollTo(0, 4000);
  await vi.waitFor(() => expect($host?.first).toBeGreaterThan(90));

  const before = $host.range!;
  const width = window.innerWidth;
  const height = window.innerHeight;

  try {
    await page.viewport(width, height + 200);

    await vi.waitFor(() =>
      expect($host!.range!.end - $host!.range!.start).toBeGreaterThan(before.end - before.start),
    );
  } finally {
    await page.viewport(width, height);
  }
});
