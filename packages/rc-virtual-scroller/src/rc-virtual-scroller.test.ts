import { html } from 'lit';
import { describe, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { getScrollOffset, resolveFlow, setScrollOffset } from '@rcarls/rc-common';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import { FLOW_FIXTURES, flowLabel, inFlow, type FlowFixture } from '../../../test-helpers/flow.js';
import './define.js';
import type {
  RCVirtualScroller,
  RCVirtualScrollerAxis,
  RCVirtualScrollerRangeDetail,
} from './rc-virtual-scroller.js';

const ITEM_SIZE = 40;
const PORT_SIZE = 200;
const DEFAULT_FLOW: FlowFixture = { dir: 'ltr', writingMode: 'horizontal-tb' };

/**
 * Renders the reported slice the way a keyed framework list would: items that
 * stay in range keep their DOM node, so focus and scroll behave as they do in
 * a real consumer rather than being reset by a wholesale replaceChildren.
 */
function bindSlice(
  host: RCVirtualScroller,
  list: HTMLElement,
  axis: RCVirtualScrollerAxis,
): () => RCVirtualScrollerRangeDetail {
  // Kept sorted by index. A real keyed framework list only moves a DOM node
  // when its position actually changes; re-appending every node on every
  // update (even ones already in place) is enough to blur a focused
  // descendant in a real browser, so this mirrors the narrower contract
  // instead of a naive full re-sort.
  const entries: Array<{ index: number; node: HTMLElement }> = [];

  let latest: RCVirtualScrollerRangeDetail = {
    start: 0,
    end: 0,
    itemsPerLine: 1,
    lineSize: 0,
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
      item.style[axis === 'inline' ? 'inlineSize' : 'blockSize'] = `${ITEM_SIZE}px`;
      item.style.margin = '0';

      item.append(
        Object.assign(document.createElement('button'), { textContent: `Item ${index}` }),
      );

      const before = entries.find((entry) => entry.index > index);

      list.insertBefore(item, before?.node ?? null);

      const insertAt = entries.findIndex((entry) => entry.index > index);

      entries.splice(insertAt < 0 ? entries.length : insertAt, 0, { index, node: item });
    }
  });

  return () => latest;
}

const LIST_STYLE: Record<RCVirtualScrollerAxis, string> = {
  block: 'display: grid; grid-template-columns: 1fr; gap: 0; margin: 0; padding: 0;',
  inline: 'display: flex; gap: 0; margin: 0; padding: 0;',
};

async function mount(
  attributes: {
    count: number;
    axis?: RCVirtualScrollerAxis;
    overscan?: number;
    disabled?: boolean;
  },
  { flow = DEFAULT_FLOW, listStyle }: { flow?: FlowFixture; listStyle?: string } = {},
) {
  const axis = attributes.axis ?? 'block';
  const screen = render(
    inFlow(
      html`
        <div
          data-testid="port"
          style="block-size: ${PORT_SIZE}px; inline-size: ${PORT_SIZE}px; overflow: auto;"
        >
          <rc-virtual-scroller
            data-testid="host"
            axis=${axis}
            count=${attributes.count}
            item-size=${ITEM_SIZE}
            overscan=${attributes.overscan ?? 2}
            ?disabled=${attributes.disabled ?? false}
          >
            <ul data-testid="list" style=${listStyle ?? LIST_STYLE[axis]}></ul>
          </rc-virtual-scroller>
        </div>
      `,
      flow,
    ),
  );

  const port = (await screen.getByTestId('port').element()) as HTMLElement;
  const host = (await screen.getByTestId('host').element()) as RCVirtualScroller;
  const list = (await screen.getByTestId('list').element()) as HTMLElement;
  const range = bindSlice(host, list, axis);

  await host.updateComplete;

  // A disabled scroller reports everything and never measures, by design.
  await vi.waitFor(() => expect(attributes.disabled ? range().end : range().measured).toBeTruthy());

  return { host, list, port, range, axis, portFlow: resolveFlow(port) };
}

function spacerSize(host: RCVirtualScroller, part: string, axis: RCVirtualScrollerAxis): number {
  const spacer = host.shadowRoot?.querySelector(`[part="${part}"]`) as HTMLElement;

  return Number.parseFloat(
    getComputedStyle(spacer)[axis === 'inline' ? 'inlineSize' : 'blockSize'],
  );
}

describe.each(
  FLOW_FIXTURES.flatMap((flow) =>
    (['block', 'inline'] as const).map(
      (axis) => [`${axis} axis in ${flowLabel(flow)}`, axis, flow] as const,
    ),
  ),
)('%s', (_label, axis, flow) => {
  test('reports a window of the collection and reserves the rest of the scroll space', async () => {
    const { host, list, port, range, portFlow } = await mount({ count: 500, axis }, { flow });

    await vi.waitFor(() => {
      expect(range().end).toBeGreaterThan(0);
      expect(range().end).toBeLessThan(40);
    });

    expect(range().start).toBe(0);
    expect(list.children.length).toBe(range().end - range().start);

    // The scroll space still covers every item, so the scrollbar does not lie.
    const scrollSize = axis === 'inline' ? 'inline' : 'block';
    const physical = (
      portFlow[scrollSize] === 'x' ? port.scrollWidth : port.scrollHeight
    ) as number;

    expect(physical).toBeCloseTo(500 * ITEM_SIZE, -1);
    expect(host.last).toBe(range().end - 1);
  });

  test('advances the range and the leading spacer as the scroll container scrolls', async () => {
    const { host, port, range, portFlow } = await mount({ count: 500, axis }, { flow });

    setScrollOffset(port, axis, 100 * ITEM_SIZE, portFlow);

    await vi.waitFor(() => expect(range().start).toBeGreaterThan(50));

    expect(range().start).toBe(98);
    expect(spacerSize(host, 'spacer-start', axis)).toBeCloseTo(98 * ITEM_SIZE, 0);
  });

  test('scrolls an index that is not currently rendered to the start of the view', async () => {
    const { host, port, range, portFlow } = await mount({ count: 500, axis }, { flow });

    host.scrollToIndex(300);

    await vi.waitFor(() => expect(range().start).toBeGreaterThan(290));

    expect(getScrollOffset(port, axis, portFlow)).toBeCloseTo(300 * ITEM_SIZE, -1);
    expect(range().start).toBeLessThanOrEqual(300);
    expect(range().end).toBeGreaterThan(300);
  });
});

test('re-resolves the inline axis when the direction flips at runtime', async () => {
  const { host, port, range } = await mount({ count: 500, axis: 'inline' });
  const flow = port.parentElement as HTMLElement;

  // Let the first measurement's resize settle, so only the flip can prompt
  // a re-resolve.
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));

  // Nothing resizes, but the inline start moves to the other edge; measured
  // against the stale direction the view would sit at the far end.
  flow.dir = 'rtl';
  host.scrollToIndex(300);

  await vi.waitFor(() => expect(range().start).toBeGreaterThan(290));

  expect(getScrollOffset(port, 'inline', resolveFlow(port))).toBeCloseTo(300 * ITEM_SIZE, -1);
  expect(range().start).toBeLessThanOrEqual(300);
  expect(range().end).toBeGreaterThan(300);
});

test('keeps the range on the scroll position when the direction flips at runtime', async () => {
  const { port, range, portFlow } = await mount({ count: 500, axis: 'inline' });
  const flow = port.parentElement as HTMLElement;

  setScrollOffset(port, 'inline', 100 * ITEM_SIZE, portFlow);

  await vi.waitFor(() => expect(range().start).toBe(98));

  // The flip moves the scroll origin; engines settle the position where they
  // like, so check the range against whatever offset they kept.
  flow.dir = 'rtl';

  await vi.waitFor(() => {
    const line = Math.floor(getScrollOffset(port, 'inline', resolveFlow(port)) / ITEM_SIZE);

    expect(range().start).toBeLessThanOrEqual(line);
    expect(range().end).toBeGreaterThan(line + PORT_SIZE / ITEM_SIZE - 1);
  });
});

test('measures items per line from an auto-fill grid without changing it', async () => {
  const { host, list, range } = await mount(
    { count: 500 },
    {
      listStyle:
        'display: grid; grid-template-columns: repeat(auto-fill, minmax(40px, 1fr)); gap: 0; margin: 0; padding: 0; inline-size: 200px;',
    },
  );

  await vi.waitFor(() => expect(range().itemsPerLine).toBe(5));

  // The consumer's own track definition is untouched: the element reads it,
  // it does not replace it with a layout of its own.
  expect(getComputedStyle(list).gridTemplateColumns.split(/\s+/)).toHaveLength(5);
  expect(host.first % 5).toBe(0);
});

test('reads grid rows as the line for a column-flow grid on the inline axis', async () => {
  const { range } = await mount(
    { count: 500, axis: 'inline' },
    {
      listStyle:
        'display: grid; grid-auto-flow: column; grid-template-rows: repeat(4, 40px); grid-auto-columns: 40px; gap: 0; margin: 0; padding: 0;',
    },
  );

  await vi.waitFor(() => expect(range().itemsPerLine).toBe(4));

  expect(range().lineSize).toBeCloseTo(ITEM_SIZE, 0);
  expect(range().end % 4).toBe(0);
});

test('counts one item per line when each item spans every track of the line', async () => {
  // A shelf whose cards span all row tracks to align through subgrid: three
  // row tracks, but one card per column.
  const style = document.createElement('style');

  style.textContent = '[data-testid="list"] > * { grid-row: 1 / -1; }';
  document.head.append(style);

  try {
    const { range, port, portFlow } = await mount(
      { count: 500, axis: 'inline' },
      {
        listStyle:
          'display: grid; grid-auto-flow: column; grid-template-rows: auto auto 1fr; grid-auto-columns: 40px; gap: 0; margin: 0; padding: 0;',
      },
    );

    await vi.waitFor(() => expect(range().itemsPerLine).toBe(1));

    expect(range().lineSize).toBeCloseTo(ITEM_SIZE, 0);

    // One column per item, so a port of five columns shows five items, plus
    // two lines of overscan on each side.
    setScrollOffset(port, 'inline', 100 * ITEM_SIZE, portFlow);

    await vi.waitFor(() => expect(range().start).toBe(98));

    expect(range().end).toBe(107);
  } finally {
    style.remove();
  }
});

test('reports the whole collection and no spacers when disabled', async () => {
  const { host, list, range } = await mount({ count: 60, disabled: true });

  await vi.waitFor(() => expect(range().end).toBe(60));

  expect(list.children.length).toBe(60);
  expect(spacerSize(host, 'spacer-end', 'block')).toBe(0);
});

test('keeps the focused item in range after scrolling away from it', async () => {
  const { list, port, range } = await mount({ count: 500 });

  const target = list.querySelector('[data-index="1"] button') as HTMLButtonElement;

  target.focus({ preventScroll: true });
  expect(document.activeElement).toBe(target);

  // WebKit scrolls a newly focused element into view at the next rendering
  // update, which would undo a scroll made in the same frame.
  await new Promise((resolve) => requestAnimationFrame(resolve));

  port.scrollTop = 100 * ITEM_SIZE;

  await vi.waitFor(() => expect(range().end).toBeGreaterThan(100));

  // The window moved, but the focused item was not unmounted under the user.
  // The range stays contiguous, widened down to the focused line rather than
  // reset all the way to 0.
  expect(range().start).toBe(1);
  expect(list.querySelector('[data-index="1"]')).not.toBeNull();
  expect(document.activeElement).toBe(target);

  target.blur();

  await vi.waitFor(() => expect(range().start).toBeGreaterThan(1));

  expect(list.querySelector('[data-index="1"]')).toBeNull();
});

test('re-measures when the axis changes', async () => {
  const { host, list, range } = await mount({ count: 500 });

  list.setAttribute('style', LIST_STYLE.inline);

  for (const item of list.children) {
    (item as HTMLElement).style.blockSize = '';
    (item as HTMLElement).style.inlineSize = `${ITEM_SIZE}px`;
  }

  host.axis = 'inline';

  await vi.waitFor(() => {
    expect(range().measured).toBe(true);
    expect(range().lineSize).toBeCloseTo(ITEM_SIZE, 0);
  });

  expect(host.getAttribute('axis')).toBe('inline');
});

test('exposes the current range to a subscriber that attaches after the first report', async () => {
  const screen = render(html`
    <div style="block-size: ${PORT_SIZE}px; overflow: auto;">
      <rc-virtual-scroller data-testid="late" count="500" item-size=${ITEM_SIZE}>
        <ul></ul>
      </rc-virtual-scroller>
    </div>
  `);
  const host = (await screen.getByTestId('late').element()) as RCVirtualScroller;
  const events: RCVirtualScrollerRangeDetail[] = [];

  // Nobody is listening while the element measures and reports.
  await vi.waitFor(() => expect(host.range).not.toBeNull());

  host.addEventListener('rc-virtual-scroller-range', (event) => events.push(event.detail));

  // Unchanged, so no event will ever arrive for the late listener...
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  expect(events).toHaveLength(0);

  // ...which is why the current range is readable directly.
  expect(host.range?.start).toBe(host.first);
  expect(host.range?.end).toBe(host.last + 1);
  expect(host.range?.end).toBeGreaterThan(0);
});

test('leaves the slotted list accessible', async () => {
  const { host, list } = await mount({ count: 500 });

  list.setAttribute('aria-label', 'Items');

  await expectNoA11yViolations(host);
});

test('keeps its range and scroll position when its pane is hidden and shown', async () => {
  const { port, range, portFlow } = await mount({ count: 500 });
  const pane = port.parentElement as HTMLElement;

  setScrollOffset(port, 'block', 100 * ITEM_SIZE, portFlow);
  await vi.waitFor(() => expect(range().start).toBe(98));

  // An app shell hides a pane with display: none while another view is open.
  pane.style.display = 'none';
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  expect(range().start).toBe(98);
  pane.style.display = '';

  await vi.waitFor(() => {
    expect(getScrollOffset(port, 'block', resolveFlow(port))).toBeCloseTo(100 * ITEM_SIZE, -1);
    expect(range().start).toBe(98);
  });
});

test('settles a one-card spanning shelf with no overscan', async () => {
  const { host, list, port, range } = await mount({ count: 500, axis: 'inline', overscan: 0 });

  port.style.inlineSize = '40px';

  list.style.cssText =
    'display:grid;grid-auto-flow:column;grid-template-rows:10px 10px 20px;grid-auto-columns:40px;margin:0;padding:0';

  for (const $item of list.children) {
    ($item as HTMLElement).style.gridRow = '1 / -1';
  }

  // Apply the same span to newly rendered cards without global test CSS.
  host.addEventListener('rc-virtual-scroller-range', () => {
    for (const $item of list.children) {
      ($item as HTMLElement).style.gridRow = '1 / -1';
    }
  });

  host.measure();
  await vi.waitFor(() => expect(range().end).toBe(1));

  const listener = vi.fn();

  host.addEventListener('rc-virtual-scroller-range', listener);

  for (let i = 0; i < 8; i++) {
    await new Promise(requestAnimationFrame);
  }

  expect(range().itemsPerLine).toBe(1);
  expect(listener).not.toHaveBeenCalled();
});

test('uses track pitch when items in the same grid row have different alignment', async () => {
  const { host, list, range } = await mount({ count: 500 });

  list.style.gridTemplateColumns = '[start a] 100px [middle] 100px [end]';
  list.style.gridAutoRows = '40px';

  const $first = list.firstElementChild as HTMLElement;

  $first.style.blockSize = '20px';
  $first.style.alignSelf = 'end';
  host.measure();
  await vi.waitFor(() => expect(range().itemsPerLine).toBe(2));
  expect(range().lineSize).toBe(40);
});

test('an explicit capacity handles named spans and removal restores inference', async () => {
  const { host, list, range } = await mount({ count: 500 });

  list.style.gridTemplateColumns = '[start] 100px [middle] 100px [end]';
  list.style.gridAutoRows = '40px';
  host.setAttribute('items-per-line', '1');

  for (const $item of list.children) {
    ($item as HTMLElement).style.gridColumn = 'start / end';
  }

  host.measure();
  await vi.waitFor(() => expect(range().itemsPerLine).toBe(1));
  expect(range().measured).toBe(true);

  for (const $item of list.children) {
    ($item as HTMLElement).style.gridColumn = '';
  }

  host.removeAttribute('items-per-line');
  await vi.waitFor(() => expect(range().itemsPerLine).toBe(2));
  expect(host.itemsPerLine).toBe(0);
});

test('enlarging only the scrollport fills the newly visible space', async () => {
  const { host, port, range } = await mount({ count: 500 });
  const before = host.getBoundingClientRect().height;

  port.style.blockSize = '600px';
  await vi.waitFor(() => expect(range().end).toBe(17));
  expect(host.getBoundingClientRect().height).toBe(before);
});

test.each(
  FLOW_FIXTURES.flatMap((flow) => (['block', 'inline'] as const).map((axis) => ({ flow, axis }))),
)('measures full-track spans on $axis in $flow', async ({ flow, axis }) => {
  const { host, list, port, portFlow, range } = await mount({ count: 500, axis }, { flow });

  list.style.cssText =
    axis === 'inline'
      ? 'display:grid;grid-auto-flow:column;grid-template-rows:10px 10px 20px;grid-auto-columns:40px;margin:0;padding:0'
      : 'display:grid;grid-template-columns:1fr 1fr 1fr;grid-auto-rows:40px;margin:0;padding:0';

  const applySpans = () => {
    for (const $item of list.children) {
      ($item as HTMLElement).style[axis === 'inline' ? 'gridRow' : 'gridColumn'] = '1 / -1';
    }
  };

  applySpans();
  host.addEventListener('rc-virtual-scroller-range', applySpans);
  host.measure();
  await vi.waitFor(() => expect(range().itemsPerLine).toBe(1));
  setScrollOffset(port, axis, 4000, portFlow);
  await vi.waitFor(() => expect(range().start).toBe(98));
  expect(range().lineSize).toBeCloseTo(40, 0);
});

test('preserves mounted rows throughout a hidden pane', async () => {
  const { host, port, list, range } = await mount({ count: 500 });

  port.scrollTop = 4000;
  await vi.waitFor(() => expect(range().start).toBe(98));

  const $rows = Array.from(list.children);
  const before = range();

  port.style.display = 'none';
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
  host.measure();
  await new Promise(requestAnimationFrame);
  expect(range()).toBe(before);
  expect(Array.from(list.children)).toEqual($rows);
  port.style.display = '';
  await vi.waitFor(() => expect(range().start).toBe(98));
  expect(Array.from(list.children)).toEqual($rows);
});

test('rebinds an explicit scroll target and cleans up the old listener', async () => {
  const { host, port, range } = await mount({ count: 500 });
  const $outer = port.parentElement!;

  $outer.style.cssText += ';block-size:300px;overflow:auto;';
  port.style.blockSize = '600px';
  host.scrollTarget = $outer;
  await host.updateComplete;
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);

  const rect = vi.spyOn(host, 'getBoundingClientRect');

  try {
    port.dispatchEvent(new Event('scroll'));
    await new Promise(requestAnimationFrame);
    expect(rect).not.toHaveBeenCalled();
    $outer.scrollTop = 120;
    await vi.waitFor(() => expect(range().start).toBeGreaterThan(0));
  } finally {
    rect.mockRestore();
  }
});

test.each(['open', 'closed'] as const)('keeps focus within a %s item shadow root', async (mode) => {
  const { host, list, port, range } = await mount({ count: 500 });
  const $item = list.children[1]!;
  const $button = $item.querySelector('button')!;
  const $shell = document.createElement('span');
  const $shadow = $shell.attachShadow({ mode });

  $item.append($shell);
  $shadow.append($button);
  $button.focus();
  await new Promise(requestAnimationFrame);
  port.scrollTop = 4000;
  await vi.waitFor(() => expect(range().end).toBeGreaterThan(100));
  expect(range().start).toBe(1);
  expect($button.isConnected).toBe(true);
  expect($shadow.activeElement).toBe($button);
  $button.blur();
  await vi.waitFor(() => expect(host.first).toBeGreaterThan(1));
});

test('reconnects inside a shadow root and observes the outer scrollport', async () => {
  const { host, port, range } = await mount({ count: 500 });
  const $shell = document.createElement('div');

  port.append($shell);
  $shell.attachShadow({ mode: 'closed' }).append(host);
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
  port.scrollTop = 4000;
  await vi.waitFor(() => expect(range().start).toBe(98));
});

test('renders unsupported variable-pitch grids in full and deduplicates warnings', async () => {
  const { host, list, range } = await mount({ count: 60 });
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  try {
    list.style.gridAutoRows = '40px 60px';
    host.measure();
    await vi.waitFor(() => expect(range().end).toBe(60));
    host.measure();
    await new Promise(requestAnimationFrame);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(spacerSize(host, 'spacer-end', 'block')).toBe(0);
  } finally {
    warn.mockRestore();
  }
});

test('normalizes numeric configuration and ignores writes to computed output attributes', async () => {
  const { host, range } = await mount({ count: 500 });

  host.count = 3.9;
  host.overscan = -2;
  host.itemSize = Infinity;
  host.itemsPerLine = NaN;
  await host.updateComplete;
  await vi.waitFor(() => expect(range().end).toBe(3));
  expect(host.count).toBe(3);
  expect(host.overscan).toBe(2);
  expect(host.itemSize).toBe(0);
  expect(host.itemsPerLine).toBe(0);
  host.setAttribute('first', '100');
  expect(host.first).toBe(0);

  expect(
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(host), 'first')?.set,
  ).toBeUndefined();
});

test('does not resample item styles or rectangles on unchanged scroll-only frames', async () => {
  const { host, list, port } = await mount({ count: 500 });

  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);

  const $first = list.firstElementChild!;
  const rect = vi.spyOn($first, 'getBoundingClientRect');
  const styles = vi.spyOn(window, 'getComputedStyle');

  try {
    port.scrollTop = 1;
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    expect(host.first).toBe(0);
    expect(rect).not.toHaveBeenCalled();

    expect(
      styles.mock.calls.filter(([element]) => element === $first || element === list),
    ).toHaveLength(0);
  } finally {
    rect.mockRestore();
    styles.mockRestore();
  }
});

test('measures once a pane it mounted inside while hidden is shown', async () => {
  const screen = render(html`
    <div data-testid="pane" style="display: none;">
      <div
        data-testid="port"
        style="block-size: ${PORT_SIZE}px; inline-size: ${PORT_SIZE}px; overflow: auto;"
      >
        <rc-virtual-scroller data-testid="host" count="500" item-size=${ITEM_SIZE} overscan="2">
          <ul data-testid="list" style=${LIST_STYLE.block}></ul>
        </rc-virtual-scroller>
      </div>
    </div>
  `);
  const pane = (await screen.getByTestId('pane').element()) as HTMLElement;
  const host = (await screen.getByTestId('host').element()) as RCVirtualScroller;
  const list = (await screen.getByTestId('list').element()) as HTMLElement;
  const range = bindSlice(host, list, 'block');

  await host.updateComplete;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  pane.style.display = '';

  // A first window sized for the port, from real geometry.
  await vi.waitFor(() => {
    expect(range().measured).toBe(true);
    expect(range().start).toBe(0);
    expect(range().end).toBeGreaterThan(PORT_SIZE / ITEM_SIZE);
    expect(range().end).toBeLessThan(20);
  });
});
