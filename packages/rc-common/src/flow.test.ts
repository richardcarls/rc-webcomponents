import { html } from 'lit';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-lit';

import { FLOW_FIXTURES, flowLabel, inFlow, type FlowFixture } from '../../../test-helpers/flow.js';
import {
  arrowKeys,
  clientSize,
  getScrollOffset,
  logicalDelta,
  logicalRect,
  physicalAxis,
  physicalOffset,
  resolveFlow,
  scrollSize,
  setScrollOffset,
  type Flow,
} from './flow.js';

const PORT = 100;
const CONTENT = 400;

/** What each fixture is expected to resolve to. The spec, not the implementation. */
const EXPECTED: Record<string, Flow> = {
  'horizontal-tb ltr': {
    inline: 'x',
    block: 'y',
    inlineReversed: false,
    blockReversed: false,
    rtl: false,
  },
  'horizontal-tb rtl': {
    inline: 'x',
    block: 'y',
    inlineReversed: true,
    blockReversed: false,
    rtl: true,
  },
  'vertical-rl ltr': {
    inline: 'y',
    block: 'x',
    inlineReversed: false,
    blockReversed: true,
    rtl: false,
  },
  'vertical-rl rtl': {
    inline: 'y',
    block: 'x',
    inlineReversed: true,
    blockReversed: true,
    rtl: true,
  },
  'vertical-lr ltr': {
    inline: 'y',
    block: 'x',
    inlineReversed: false,
    blockReversed: false,
    rtl: false,
  },
};

async function mountScroller(fixture: FlowFixture) {
  const screen = render(
    inFlow(
      html`<div
        data-testid="port"
        style="inline-size: ${PORT}px; block-size: ${PORT}px; overflow: auto;"
      >
        <div
          data-testid="content"
          style="inline-size: ${CONTENT}px; block-size: ${CONTENT}px; position: relative;"
        >
          <div data-testid="first" style="inline-size: 10px; block-size: 20px;"></div>
        </div>
      </div>`,
      fixture,
    ),
  );
  const port = (await screen.getByTestId('port').element()) as HTMLElement;
  const first = (await screen.getByTestId('first').element()) as HTMLElement;

  return { port, first, flow: resolveFlow(port) };
}

describe.each(FLOW_FIXTURES.map((fixture) => [flowLabel(fixture), fixture] as const))(
  '%s',
  (label, fixture) => {
    test('resolves the physical axes and their start edges', async () => {
      const { flow } = await mountScroller(fixture);

      expect(flow).toEqual(EXPECTED[label]);
    });

    test('reports sizes along logical axes', async () => {
      const { port, flow } = await mountScroller(fixture);

      expect(scrollSize(port, 'inline', flow)).toBe(CONTENT);
      expect(scrollSize(port, 'block', flow)).toBe(CONTENT);
      // Scrollbars may take part of the port; the rest must still be the port.
      expect(clientSize(port, 'inline', flow)).toBeLessThanOrEqual(PORT);
      expect(clientSize(port, 'inline', flow)).toBeGreaterThan(PORT / 2);
    });

    test('starts at scroll offset 0 on both axes', async () => {
      const { port, flow } = await mountScroller(fixture);

      expect(getScrollOffset(port, 'inline', flow)).toBe(0);
      expect(getScrollOffset(port, 'block', flow)).toBe(0);
    });

    test.each(['inline', 'block'] as const)(
      'round-trips a logical scroll offset on the %s axis',
      async (axis) => {
        const { port, flow } = await mountScroller(fixture);

        setScrollOffset(port, axis, 120, flow);

        expect(getScrollOffset(port, axis, flow)).toBeCloseTo(120, 0);

        // The raw physical value is where engines have historically disagreed;
        // pin the spec behavior so a regression in any engine is visible here.
        const raw = physicalAxis(axis, flow) === 'x' ? port.scrollLeft : port.scrollTop;
        const reversed = axis === 'inline' ? flow.inlineReversed : flow.blockReversed;

        expect(Math.sign(raw)).toBe(reversed ? -1 : 1);
      },
    );

    test('places the first child at the logical start of its container', async () => {
      const { port, first, flow } = await mountScroller(fixture);
      const rect = logicalRect(
        first.getBoundingClientRect(),
        first.parentElement?.getBoundingClientRect() ?? port.getBoundingClientRect(),
        flow,
      );

      expect(rect.inlineStart).toBeCloseTo(0, 0);
      expect(rect.blockStart).toBeCloseTo(0, 0);
      expect(rect.inlineSize).toBe(10);
      expect(rect.blockSize).toBe(20);
    });

    test('translates a logical offset back to where logicalRect measured it', async () => {
      const { port, first, flow } = await mountScroller(fixture);
      const container =
        first.parentElement?.getBoundingClientRect() ?? port.getBoundingClientRect();

      // Anchor a probe at the logical start corner, move it by a logical
      // offset, and read the offset back from its rect.
      const probe = document.createElement('div');

      probe.style.cssText =
        'position: absolute; inset-inline-start: 0; inset-block-start: 0; inline-size: 4px; block-size: 4px;';

      first.parentElement?.append(probe);

      const { x, y } = physicalOffset({ inline: 30, block: 50 }, flow);

      probe.style.transform = `translate(${x}px, ${y}px)`;

      const measured = logicalRect(probe.getBoundingClientRect(), container, flow);

      expect(measured.inlineStart).toBeCloseTo(30, 0);
      expect(measured.blockStart).toBeCloseTo(50, 0);
    });

    test('projects a physical delta pointing toward the logical end as positive', async () => {
      const { flow } = await mountScroller(fixture);

      const toward = (axis: 'inline' | 'block') => {
        const physical = physicalAxis(axis, flow);
        const reversed = axis === 'inline' ? flow.inlineReversed : flow.blockReversed;
        const magnitude = reversed ? -10 : 10;

        return physical === 'x' ? { dx: magnitude, dy: 0 } : { dx: 0, dy: magnitude };
      };

      expect(logicalDelta(toward('inline'), 'inline', flow)).toBe(10);
      expect(logicalDelta(toward('block'), 'block', flow)).toBe(10);
    });
  },
);

describe('arrowKeys', () => {
  test('uses Right and Down for next in horizontal-tb LTR', () => {
    const flow = {
      inline: 'x',
      block: 'y',
      inlineReversed: false,
      blockReversed: false,
      rtl: false,
    } as const;

    expect(arrowKeys('horizontal', flow)).toEqual({
      next: 'ArrowRight',
      prev: 'ArrowLeft',
      openFirst: 'ArrowDown',
      openLast: 'ArrowUp',
    });

    expect(arrowKeys('vertical', flow)).toEqual({
      next: 'ArrowDown',
      prev: 'ArrowUp',
      openFirst: 'ArrowRight',
      openLast: 'ArrowLeft',
    });
  });

  test('flips horizontal next and the vertical open axis in RTL', () => {
    const flow = {
      inline: 'x',
      block: 'y',
      inlineReversed: true,
      blockReversed: false,
      rtl: true,
    } as const;

    expect(arrowKeys('horizontal', flow).next).toBe('ArrowLeft');
    expect(arrowKeys('horizontal', flow).prev).toBe('ArrowRight');
    // A vertical menu's submenu opens toward the inline end, which is left in RTL.
    expect(arrowKeys('vertical', flow).openFirst).toBe('ArrowLeft');
    expect(arrowKeys('vertical', flow).openLast).toBe('ArrowRight');
    expect(arrowKeys('vertical', flow).next).toBe('ArrowDown');
  });

  test('treats right-to-left line progression in vertical-rl as reversed x', () => {
    const flow = {
      inline: 'y',
      block: 'x',
      inlineReversed: false,
      blockReversed: true,
      rtl: false,
    } as const;

    expect(arrowKeys('horizontal', flow).next).toBe('ArrowLeft');
    expect(arrowKeys('vertical', flow).next).toBe('ArrowDown');
  });
});
