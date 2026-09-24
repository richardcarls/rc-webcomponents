import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import './define.js';
import type { RCVirtualScroller, RCVirtualScrollerRangeDetail } from './rc-virtual-scroller.js';

const ITEM_SIZE = 40;
const PORT_SIZE = 200;

/**
 * Renders the reported slice the way a keyed framework list would: items that
 * stay in range keep their DOM node, so focus and scroll behave as they do in
 * a real consumer rather than being reset by a wholesale replaceChildren.
 */
function bindSlice(host: RCVirtualScroller, list: HTMLElement): () => RCVirtualScrollerRangeDetail {
  // Kept sorted by index. A real keyed framework list only moves a DOM node
  // when its position actually changes; re-appending every node on every
  // update (even ones already in place) is enough to blur a focused
  // descendant in a real browser, so this mirrors the narrower contract
  // instead of a naive full re-sort.
  const entries: Array<{ index: number; node: HTMLElement }> = [];

  let latest: RCVirtualScrollerRangeDetail = {
    start: 0,
    end: 0,
    columns: 1,
    rowSize: 0,
    measured: false,
  };

  host.addEventListener('rc-virtual-scroller-range', (event) => {
    const { start, end } = event.detail;

    latest = event.detail;

    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const entry = entries[i];

      if (entry && (entry.index < start || entry.index >= end)) {
        entry.node.remove();
        entries.splice(i, 1);
      }
    }

    for (let index = start; index < end; index += 1) {
      if (entries.some((entry) => entry.index === index)) {
        continue;
      }

      const item = document.createElement('li');

      item.dataset.index = String(index);
      item.style.blockSize = `${ITEM_SIZE}px`;
      item.style.margin = '0';
      item.append(Object.assign(document.createElement('button'), { textContent: `Item ${index}` }));

      const before = entries.find((entry) => entry.index > index);

      list.insertBefore(item, before?.node ?? null);

      const insertAt = entries.findIndex((entry) => entry.index > index);

      entries.splice(insertAt < 0 ? entries.length : insertAt, 0, { index, node: item });
    }
  });

  return () => latest;
}

async function mount(
  attributes: { count: number; overscan?: number; disabled?: boolean } & Record<string, unknown>,
  listStyle = 'display: grid; grid-template-columns: 1fr; gap: 0; margin: 0; padding: 0;',
) {
  const screen = render(html`
    <div data-testid="port" style="block-size: ${PORT_SIZE}px; overflow: auto;">
      <rc-virtual-scroller
        data-testid="host"
        count=${attributes.count}
        item-size=${ITEM_SIZE}
        overscan=${attributes.overscan ?? 2}
        ?disabled=${attributes.disabled ?? false}
      >
        <ul data-testid="list" style=${listStyle}></ul>
      </rc-virtual-scroller>
    </div>
  `);

  const port = (await screen.getByTestId('port').element()) as HTMLElement;
  const host = (await screen.getByTestId('host').element()) as RCVirtualScroller;
  const list = (await screen.getByTestId('list').element()) as HTMLElement;
  const range = bindSlice(host, list);

  await host.updateComplete;
  await vi.waitFor(() => expect(range().rowSize).toBeGreaterThan(0));

  return { host, list, port, range, screen };
}

test('reports a window of the collection and reserves the rest of the scroll space', async () => {
  const { host, list, port, range } = await mount({ count: 500 });

  await vi.waitFor(() => {
    expect(range().end).toBeGreaterThan(0);
    expect(range().end).toBeLessThan(40);
  });

  // The visible port plus overscan, not the collection.
  expect(list.children.length).toBe(range().end - range().start);
  expect(list.children.length).toBeLessThan(40);

  // The scroll space still covers every item, so the scrollbar does not lie.
  expect(port.scrollHeight).toBeCloseTo(500 * ITEM_SIZE, -1);
  expect(host.first).toBe(0);
  expect(host.last).toBe(range().end - 1);
});

test('advances the range and the leading spacer as the scroll container scrolls', async () => {
  const { host, port, range } = await mount({ count: 500 });

  const initialEnd = range().end;

  port.scrollTop = 100 * ITEM_SIZE;

  await vi.waitFor(() => expect(range().start).toBeGreaterThan(initialEnd));

  expect(range().start).toBeCloseTo(98, 0);

  const spacerStart = host.shadowRoot?.querySelector('[part="spacer-start"]') as HTMLElement;

  expect(spacerStart.getBoundingClientRect().height).toBeCloseTo(range().start * ITEM_SIZE, -1);
});

test('measures the column count from an auto-fill grid without changing it', async () => {
  const { host, list, range } = await mount(
    { count: 500 },
    'display: grid; grid-template-columns: repeat(auto-fill, minmax(40px, 1fr)); gap: 0; margin: 0; padding: 0; inline-size: 200px;',
  );

  await vi.waitFor(() => expect(range().columns).toBe(5));

  // The consumer's own track definition is untouched: the element reads it,
  // it does not replace it with a layout of its own.
  expect(getComputedStyle(list).gridTemplateColumns.split(/\s+/)).toHaveLength(5);
  expect(host.first % 5).toBe(0);
});

test('reports the whole collection and no spacers when disabled', async () => {
  const { host, list, range } = await mount({ count: 60, disabled: true });

  await vi.waitFor(() => expect(range().end).toBe(60));

  expect(list.children.length).toBe(60);

  const spacerEnd = host.shadowRoot?.querySelector('[part="spacer-end"]') as HTMLElement;

  expect(spacerEnd.getBoundingClientRect().height).toBe(0);
});

test('keeps the focused item in range after scrolling away from it', async () => {
  const { list, port, range } = await mount({ count: 500 });

  const target = list.querySelector('[data-index="1"] button') as HTMLButtonElement;

  target.focus();
  expect(document.activeElement).toBe(target);

  port.scrollTop = 100 * ITEM_SIZE;

  await vi.waitFor(() => expect(range().end).toBeGreaterThan(100));

  // The window moved, but the focused item was not unmounted under the user.
  // The range stays contiguous, widened down to the focused row rather than
  // reset all the way to 0.
  expect(range().start).toBe(1);
  expect(list.querySelector('[data-index="1"]')).not.toBeNull();
  expect(document.activeElement).toBe(target);

  target.blur();

  await vi.waitFor(() => expect(range().start).toBeGreaterThan(1));

  expect(list.querySelector('[data-index="1"]')).toBeNull();
});

test('scrolls an index that is not currently rendered into view', async () => {
  const { host, port, range } = await mount({ count: 500 });

  expect(range().end).toBeLessThan(300);

  host.scrollToIndex(300);

  await vi.waitFor(() => expect(range().start).toBeGreaterThan(290));

  expect(port.scrollTop).toBeCloseTo(300 * ITEM_SIZE, -1);
  expect(range().start).toBeLessThanOrEqual(300);
  expect(range().end).toBeGreaterThan(300);
});

test('leaves the slotted list accessible', async () => {
  const { host, list } = await mount({ count: 500 });

  list.setAttribute('aria-label', 'Items');

  await expectNoA11yViolations(host);
});
