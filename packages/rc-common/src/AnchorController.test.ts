import { html } from 'lit';
import type { ReactiveControllerHost } from 'lit';
import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { AnchorController, resolveAnchorPlacement } from './AnchorController.js';
import { HORIZONTAL_LTR_FLOW, type Flow } from './flow.js';

type FakeHost = ReactiveControllerHost;

// Controllers only use addController/requestUpdate; lifecycle is driven
// manually so the controller can be tested without defining a host element.
function createHost(): FakeHost {
  return {
    addController() {},
    removeController() {},
    requestUpdate() {},
    updateComplete: Promise.resolve(true),
  };
}

async function renderAnchorAndFloating(
  anchorStyle: string,
  floatingStyle = 'width: 200px; height: 160px;',
): Promise<{ anchor: HTMLElement; floating: HTMLElement }> {
  const screen = render(html`
    <div data-testid="anchor" style="position: fixed; ${anchorStyle}">Anchor</div>
    <div data-testid="floating" style="${floatingStyle}">Floating</div>
  `);

  return {
    anchor: (await screen.getByTestId('anchor').element()) as HTMLElement,
    floating: (await screen.getByTestId('floating').element()) as HTMLElement,
  };
}

// _positionFallback and _clampToViewport are private: they're pure DOM-rect
// math with no public surface of their own, and both are specifically the
// paths that only naturally run in browsers lacking full native/polyfill
// anchor-positioning support (or, for the clamp, ones whose native support
// resolves the base placement but doesn't correctly flip it) — conditions
// this project's own browser test matrix can't reliably reproduce. Reaching
// into them directly is the only way to exercise this logic in isolation.
interface PrivateAnchorController {
  _clampLoopActive: boolean;
  _positionFallback(): void;
  _clampToViewport(): void;
  _scheduleClamp(): void;
}

// The class type can't be intersected with an object type redeclaring its
// private members (TypeScript collapses that to `never`), so go through
// `unknown` instead.
function asPrivate(ctl: AnchorController): PrivateAnchorController {
  return ctl as unknown as PrivateAnchorController;
}

test('_positionFallback positions an inline-end-start placement beside the anchor, not below it', async () => {
  const { anchor, floating } = await renderAnchorAndFloating(
    'left: 100px; top: 200px; width: 50px; height: 40px;',
  );
  const ctl = asPrivate(
    new AnchorController(createHost(), {
      anchor,
      floating,
      placement: 'inline-end-start',
      offset: 8,
    }),
  );

  ctl._positionFallback();

  const rect = floating.getBoundingClientRect();

  // Beside the anchor's right edge (100 + 50 + 8), not below it.
  expect(rect.left).toBeCloseTo(158, 0);
  expect(rect.top).toBeCloseTo(200, 0);
});

test('_positionFallback flips inline-end-start to the left when the right side has no room', async () => {
  const { anchor, floating } = await renderAnchorAndFloating(
    `left: ${window.innerWidth - 60}px; top: 200px; width: 50px; height: 40px;`,
  );
  const ctl = asPrivate(
    new AnchorController(createHost(), {
      anchor,
      floating,
      placement: 'inline-end-start',
      offset: 8,
    }),
  );

  ctl._positionFallback();

  const rect = floating.getBoundingClientRect();

  expect(rect.right).toBeLessThanOrEqual(anchor.getBoundingClientRect().left);
  expect(rect.top).toBeCloseTo(200, 0);
});

test('_positionFallback places a block-end-start popup below the anchor', async () => {
  const { anchor, floating } = await renderAnchorAndFloating(
    'left: 100px; top: 200px; width: 50px; height: 40px;',
  );
  const ctl = asPrivate(
    new AnchorController(createHost(), {
      anchor,
      floating,
      placement: 'block-end-start',
      offset: 8,
    }),
  );

  ctl._positionFallback();

  const rect = floating.getBoundingClientRect();
  const anchorRect = anchor.getBoundingClientRect();

  expect(rect.left).toBeCloseTo(anchorRect.left, 0);
  expect(rect.top).toBeCloseTo(anchorRect.bottom + 8, 0);
});

test('_clampToViewport nudges an off-screen floating element back within bounds', async () => {
  const { anchor, floating } = await renderAnchorAndFloating('left: 0px; top: 0px;');

  floating.style.position = 'fixed';
  floating.style.left = `${window.innerWidth - 50}px`; // mostly off the right edge
  floating.style.top = '0px';

  const ctl = asPrivate(new AnchorController(createHost(), { anchor, floating }));

  ctl._clampToViewport();

  const rect = floating.getBoundingClientRect();

  expect(rect.right).toBeLessThanOrEqual(window.innerWidth);
  expect(rect.left).toBeGreaterThanOrEqual(0);
});

test('_clampToViewport leaves an on-screen floating element untouched', async () => {
  const { anchor, floating } = await renderAnchorAndFloating('left: 0px; top: 0px;');

  floating.style.position = 'fixed';
  floating.style.left = '100px';
  floating.style.top = '100px';

  const ctl = asPrivate(new AnchorController(createHost(), { anchor, floating }));

  ctl._clampToViewport();

  expect(floating.style.translate).toBe('');
});

test('_clampToViewport publishes the available visual viewport size', async () => {
  const { anchor, floating } = await renderAnchorAndFloating('left: 0px; top: 0px;');
  const ctl = asPrivate(new AnchorController(createHost(), { anchor, floating }));

  ctl._clampToViewport();

  expect(floating.style.getPropertyValue('--rc-anchor-viewport-inline-size')).toBe(
    `${(window.visualViewport?.width ?? window.innerWidth) - 8}px`,
  );

  expect(floating.style.getPropertyValue('--rc-anchor-viewport-block-size')).toBe(
    `${(window.visualViewport?.height ?? window.innerHeight) - 8}px`,
  );
});

// Regression test for a real Android Firefox failure: a single post-open
// check measured the popover before its native anchor position had resolved,
// concluded nothing was overflowing, and never checked again. The geometry
// visibility-scoped loop must notice that late movement without guessing at a
// fixed settling timeout.
test('_scheduleClamp keeps polling until a position that settles late gets corrected', async () => {
  const { anchor, floating } = await renderAnchorAndFloating('left: 0px; top: 0px;');

  floating.style.position = 'fixed';
  floating.style.left = '0px'; // looks fine at the moment scheduling starts...
  floating.style.top = '0px';

  const controller = new AnchorController(createHost(), { anchor, floating });
  const ctl = asPrivate(controller);

  controller.hostConnected();
  ctl._scheduleClamp();

  // ...then only "resolves" its real (overflowing) position several frames
  // later, simulating an engine whose native anchor positioning doesn't
  // finish settling right after the popup opens.
  for (let i = 0; i < 10; i += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  floating.style.left = `${window.innerWidth - 20}px`;

  // Poll for IntersectionObserver to report the geometry change.
  const deadline = Date.now() + 2000;

  while (floating.getBoundingClientRect().right > window.innerWidth && Date.now() < deadline) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  const rect = floating.getBoundingClientRect();

  expect(rect.right).toBeLessThanOrEqual(window.innerWidth);

  controller.hostDisconnected();
});

test('_scheduleClamp stops when the floating element starts hidden', async () => {
  const { anchor, floating } = await renderAnchorAndFloating(
    'left: 0px; top: 0px;',
    'display: none; width: 200px; height: 160px;',
  );
  const controller = new AnchorController(createHost(), { anchor, floating });
  const ctl = asPrivate(controller);

  controller.hostConnected();
  ctl._scheduleClamp();

  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(ctl._clampLoopActive).toBe(false);

  controller.hostDisconnected();
});

test('_scheduleClamp cancels a visible loop on disconnect', async () => {
  const { anchor, floating } = await renderAnchorAndFloating('left: 0px; top: 0px;');
  const controller = new AnchorController(createHost(), { anchor, floating });
  const ctl = asPrivate(controller);

  controller.hostConnected();
  ctl._scheduleClamp();

  expect(ctl._clampLoopActive).toBe(true);

  controller.hostDisconnected();

  expect(ctl._clampLoopActive).toBe(false);
});

test('_scheduleClamp stops polling after visible geometry stabilizes', async () => {
  const { anchor, floating } = await renderAnchorAndFloating('left: 0px; top: 0px;');
  const controller = new AnchorController(createHost(), { anchor, floating });
  const ctl = asPrivate(controller);
  const rectSpy = vi.spyOn(floating, 'getBoundingClientRect');

  controller.hostConnected();
  ctl._scheduleClamp();

  for (let i = 0; i < 12; i += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  expect(ctl._clampLoopActive).toBe(false);

  const settledCalls = rectSpy.mock.calls.length;

  for (let i = 0; i < 5; i += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  expect(rectSpy).toHaveBeenCalledTimes(settledCalls);

  controller.hostDisconnected();
});

const RTL: Flow = {
  inline: 'x',
  block: 'y',
  inlineReversed: true,
  blockReversed: false,
  rtl: true,
};
const VERTICAL_RL: Flow = {
  inline: 'y',
  block: 'x',
  inlineReversed: false,
  blockReversed: true,
  rtl: false,
};
const VERTICAL_RL_RTL: Flow = { ...VERTICAL_RL, inlineReversed: true, rtl: true };
const VERTICAL_LR: Flow = { ...VERTICAL_RL, blockReversed: false };

test.each([
  // Horizontal LTR: block sides are top/bottom, inline sides left/right.
  [HORIZONTAL_LTR_FLOW, 'block-end-start', 'bottom-start'],
  [HORIZONTAL_LTR_FLOW, 'block-start-end', 'top-end'],
  [HORIZONTAL_LTR_FLOW, 'block-end', 'bottom'],
  [HORIZONTAL_LTR_FLOW, 'inline-end-start', 'right-start'],
  [HORIZONTAL_LTR_FLOW, 'inline-start', 'left'],
  // RTL: inline sides and alignment suffixes follow the reading direction.
  [RTL, 'block-end-start', 'bottom-end'],
  [RTL, 'block-start-end', 'top-start'],
  [RTL, 'block-end', 'bottom'],
  [RTL, 'inline-end-start', 'left-start'],
  [RTL, 'inline-start-end', 'right-end'],
  // vertical-rl: the inline axis runs top to bottom, lines right to left.
  [VERTICAL_RL, 'block-end-start', 'left-start'],
  [VERTICAL_RL, 'block-start', 'right'],
  [VERTICAL_RL, 'inline-end-start', 'bottom-end'],
  [VERTICAL_RL_RTL, 'block-end-start', 'left-end'],
  [VERTICAL_RL_RTL, 'inline-end', 'top'],
  // vertical-lr: lines run left to right.
  [VERTICAL_LR, 'block-end-start', 'right-start'],
  [VERTICAL_LR, 'block-start-end', 'left-end'],
] as const)('resolveAnchorPlacement(%#): %s resolves %s to %s', (flow, placement, expected) => {
  expect(resolveAnchorPlacement(placement, flow)).toBe(expected);
});

test("_positionFallback aligns a block-end-start popup to the anchor's right edge in RTL", async () => {
  const { anchor, floating } = await renderAnchorAndFloating(
    // Well inside the narrow test viewport so the viewport clamp stays out of it.
    'direction: rtl; left: 150px; top: 100px; width: 120px; height: 40px;',
    'width: 200px; height: 80px;',
  );
  const ctl = asPrivate(
    new AnchorController(createHost(), {
      anchor,
      floating,
      placement: 'block-end-start',
      offset: 0,
    }),
  );

  ctl._positionFallback();

  const popup = floating.getBoundingClientRect();
  const trigger = anchor.getBoundingClientRect();

  expect(popup.right).toBeCloseTo(trigger.right, 0);
  expect(popup.top).toBeCloseTo(trigger.bottom, 0);
});

test('_positionFallback opens an inline-end submenu to the left in RTL', async () => {
  const { anchor, floating } = await renderAnchorAndFloating(
    'direction: rtl; left: 400px; top: 100px; width: 120px; height: 40px;',
    'width: 200px; height: 80px;',
  );
  const ctl = asPrivate(
    new AnchorController(createHost(), {
      anchor,
      floating,
      placement: 'inline-end-start',
      offset: 8,
    }),
  );

  ctl._positionFallback();

  const popup = floating.getBoundingClientRect();
  const trigger = anchor.getBoundingClientRect();

  expect(popup.right).toBeCloseTo(trigger.left - 8, 0);
  expect(popup.top).toBeCloseTo(trigger.top, 0);
});

test('the applied positioning aligns a block-end-start popup to the right edge in RTL', async () => {
  const { anchor, floating } = await renderAnchorAndFloating(
    'direction: rtl; left: 150px; top: 100px; width: 120px; height: 40px;',
    'width: 200px; height: 80px;',
  );
  const ctl = new AnchorController(createHost(), {
    anchor,
    floating,
    placement: 'block-end-start',
    offset: 0,
  });

  // Whichever path this engine takes (native, polyfill, or fallback), the
  // rendered result must line up with the anchor's logical start edge.
  ctl.hostConnected();

  await vi.waitFor(() => {
    const popup = floating.getBoundingClientRect();
    const trigger = anchor.getBoundingClientRect();

    expect(popup.right).toBeCloseTo(trigger.right, 0);
    expect(popup.top).toBeCloseTo(trigger.bottom, 0);
  });

  ctl.hostDisconnected();
});

test('the applied positioning follows an ancestor direction change while open', async () => {
  const screen = render(html`
    <div data-testid="flow" dir="ltr">
      <div
        data-testid="anchor"
        style="position: fixed; left: 150px; top: 100px; width: 120px; height: 40px;"
      >
        Anchor
      </div>
      <div data-testid="floating" style="width: 80px; height: 60px;">Floating</div>
    </div>
  `);
  const flow = (await screen.getByTestId('flow').element()) as HTMLElement;
  const anchor = (await screen.getByTestId('anchor').element()) as HTMLElement;
  const floating = (await screen.getByTestId('floating').element()) as HTMLElement;
  const ctl = new AnchorController(createHost(), {
    anchor,
    floating,
    placement: 'block-end-start',
    offset: 0,
  });

  ctl.hostConnected();

  await vi.waitFor(() => {
    const popup = floating.getBoundingClientRect();
    const trigger = anchor.getBoundingClientRect();

    expect(popup.left).toBeCloseTo(trigger.left, 0);
  });

  flow.dir = 'rtl';

  await vi.waitFor(() => {
    const popup = floating.getBoundingClientRect();
    const trigger = anchor.getBoundingClientRect();

    expect(popup.right).toBeCloseTo(trigger.right, 0);
  });

  ctl.hostDisconnected();
});

test('the applied positioning opens a block-end popup to the left in vertical-rl', async () => {
  const { anchor, floating } = await renderAnchorAndFloating(
    // A vertical row: the block end is on the left.
    'writing-mode: vertical-rl; left: 250px; top: 100px; width: 40px; height: 120px;',
    'width: 80px; height: 160px;',
  );
  const ctl = new AnchorController(createHost(), {
    anchor,
    floating,
    placement: 'block-end-start',
    offset: 0,
  });

  ctl.hostConnected();

  await vi.waitFor(() => {
    const popup = floating.getBoundingClientRect();
    const trigger = anchor.getBoundingClientRect();

    expect(popup.right).toBeCloseTo(trigger.left, 0);
    expect(popup.top).toBeCloseTo(trigger.top, 0);
  });

  ctl.hostDisconnected();
});

test('the applied positioning flips a block-end popup to the block start without room', async () => {
  const { anchor, floating } = await renderAnchorAndFloating(
    // No room on the left, the block end in vertical-rl.
    'writing-mode: vertical-rl; left: 10px; top: 100px; width: 40px; height: 120px;',
    'width: 80px; height: 160px;',
  );
  const ctl = new AnchorController(createHost(), {
    anchor,
    floating,
    placement: 'block-end-start',
    offset: 0,
  });

  ctl.hostConnected();

  await vi.waitFor(() => {
    expect(floating.getBoundingClientRect().left).toBeCloseTo(
      anchor.getBoundingClientRect().right,
      0,
    );
  });

  ctl.hostDisconnected();
});
