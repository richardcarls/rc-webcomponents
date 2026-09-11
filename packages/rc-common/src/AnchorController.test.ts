import { html } from 'lit';
import type { ReactiveControllerHost } from 'lit';
import { test, expect } from 'vitest';
import { render } from 'vitest-browser-lit';

import { AnchorController } from './AnchorController.js';

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

test('_positionFallback positions a right-start placement beside the anchor, not below it', async () => {
  const { anchor, floating } = await renderAnchorAndFloating(
    'left: 100px; top: 200px; width: 50px; height: 40px;',
  );
  const ctl = asPrivate(
    new AnchorController(createHost(), {
      anchor,
      floating,
      placement: 'right-start',
      offset: 8,
    }),
  );

  ctl._positionFallback();

  const rect = floating.getBoundingClientRect();

  // Beside the anchor's right edge (100 + 50 + 8), not below it.
  expect(rect.left).toBeCloseTo(158, 0);
  expect(rect.top).toBeCloseTo(200, 0);
});

test('_positionFallback flips right-start to the left when the right side has no room', async () => {
  const { anchor, floating } = await renderAnchorAndFloating(
    `left: ${window.innerWidth - 60}px; top: 200px; width: 50px; height: 40px;`,
  );
  const ctl = asPrivate(
    new AnchorController(createHost(), {
      anchor,
      floating,
      placement: 'right-start',
      offset: 8,
    }),
  );

  ctl._positionFallback();

  const rect = floating.getBoundingClientRect();

  expect(rect.right).toBeLessThanOrEqual(anchor.getBoundingClientRect().left);
  expect(rect.top).toBeCloseTo(200, 0);
});

test('_positionFallback keeps top/bottom placements working as before', async () => {
  const { anchor, floating } = await renderAnchorAndFloating(
    'left: 100px; top: 200px; width: 50px; height: 40px;',
  );
  const ctl = asPrivate(
    new AnchorController(createHost(), {
      anchor,
      floating,
      placement: 'bottom-start',
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
