import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import './define.js';
import type { RCBottomSheet } from './rc-bottom-sheet.js';

function firePointerEvent(target: Element, type: string, init: PointerEventInit = {}) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      ...init,
    }),
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function renderSheet() {
  return render(html`
    <rc-bottom-sheet data-testid="host">
      <dialog aria-labelledby="sheet-title">
        <h2 id="sheet-title">Filter recipes</h2>
        <button value="done" formmethod="dialog">Done</button>
      </dialog>
    </rc-bottom-sheet>
  `);
}

test('rc-bottom-sheet fades in and out through CSS alone, with no JavaScript gating the timing', async () => {
  const screen = renderSheet();
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;

  expect(getComputedStyle($dialog).opacity).toBe('0');
  expect(getComputedStyle($dialog).transitionDuration).not.toBe('0s');

  $host.showModal();
  expect($host.open).toBe(true);

  await vi.waitFor(() => expect(getComputedStyle($dialog).opacity).toBe('1'));

  $host.close();
  expect($host.open).toBe(false);

  await vi.waitFor(() => expect(getComputedStyle($dialog).opacity).toBe('0'));
});

test('rc-bottom-sheet entrance does not shift measured geometry, unlike a slide transform would', async () => {
  const screen = renderSheet();
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;

  $host.showModal();

  const immediately = $dialog.getBoundingClientRect();

  await wait(250);

  const settled = $dialog.getBoundingClientRect();

  expect(Math.round(immediately.top)).toBe(Math.round(settled.top));
  expect(Math.round(immediately.height)).toBe(Math.round(settled.height));

  $host.close();
});

test('rc-bottom-sheet defaults and inherited dialog lifecycle integrate through the native child', async () => {
  const screen = renderSheet();
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;
  const toggleSpy = vi.fn();

  await $host.updateComplete;
  $host.addEventListener('rc-dialog-toggle', toggleSpy);

  expect($host.lightDismiss).toBe(true);
  expect($host.resize).toBe('vertical');
  expect($host.resizeOrigin).toBe('top');
  expect($host.resizeHandle).toBe('[data-rc-bottom-sheet-handle]');
  expect($host.swipeDismiss).toBe(true);
  expect($host.swipeVelocity).toBe(500);
  expect($host.querySelector('dialog')).toBeInstanceOf(HTMLDialogElement);

  $host.showModal();
  expect($host.open).toBe(true);
  expect(toggleSpy).toHaveBeenCalledTimes(1);
  expect(toggleSpy.mock.calls[0][0].detail).toEqual({ open: true, returnValue: '' });

  $host.close('done');
  await vi.waitFor(() => expect(toggleSpy).toHaveBeenCalledTimes(2));

  expect($host.open).toBe(false);
  expect($host.returnValue).toBe('done');
  expect(toggleSpy.mock.calls[1][0].detail).toEqual({ open: false, returnValue: 'done' });
});

test('un-themed sheets dock to the viewport block-end by default', async () => {
  const screen = renderSheet();
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.showModal();

  const $dialog = $host.querySelector('dialog')!;
  const styles = getComputedStyle($dialog);
  const rect = $dialog.getBoundingClientRect();

  expect(styles.position).toBe('fixed');
  expect(styles.insetBlockEnd).toBe('0px');
  expect(styles.insetInlineStart).toBe('0px');
  expect(styles.insetInlineEnd).toBe('0px');
  expect(Math.round(rect.bottom)).toBe(window.innerHeight);

  $host.close();
});

test('absolute non-modal sheets can dock to a positioned parent', async () => {
  const screen = render(html`
    <div data-testid="container" style="position: relative; inline-size: 24rem; block-size: 20rem;">
      <rc-bottom-sheet data-testid="host" style="--rc-bottom-sheet-position: absolute">
        <dialog aria-label="Filters">Filters</dialog>
      </rc-bottom-sheet>
    </div>
  `);
  const $container = await screen.getByTestId('container').element();
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.show();

  const $dialog = $host.querySelector('dialog')!;

  expect(getComputedStyle($dialog).position).toBe('absolute');

  expect(Math.round($dialog.getBoundingClientRect().bottom)).toBe(
    Math.round($container.getBoundingClientRect().bottom),
  );

  $host.close();
});

test('resolves var() and calc() snap points in the sheet context at snap time', async () => {
  const screen = render(html`
    <div data-testid="context" style="--peek: 90px;">
      <rc-bottom-sheet
        data-testid="host"
        snap-points="var(--peek, 40px) calc(100px + 2rem) nonsense 300px"
      >
        <dialog aria-label="Details">Details</dialog>
      </rc-bottom-sheet>
    </div>
  `);
  const $context = (await screen.getByTestId('context').element()) as HTMLElement;
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;
  const $dialog = $host.querySelector('dialog');

  if (!$dialog) {
    throw new Error('Expected the sheet dialog to render.');
  }

  const height = () => Math.round($dialog.getBoundingClientRect().height);

  await $host.updateComplete;
  $host.show();

  $host.snapTo(0, 'instant');
  expect(height()).toBe(90);

  $host.snapTo(1, 'instant');
  expect(height()).toBe(132);

  // The invalid entry is dropped, so the last point is index 2.
  $host.snapTo(2, 'instant');
  expect(height()).toBe(300);

  // The inherited custom property is read again at its current value.
  $context.style.setProperty('--peek', '110px');
  $host.snapTo(0, 'instant');
  expect(height()).toBe(110);

  expect([...$host.children]).toEqual([$dialog]);

  $host.close();
});

test('resolves functional snap-point heights in vertical writing modes', async () => {
  const screen = render(html`
    <div style="writing-mode: vertical-rl; --peek: 90px;">
      <rc-bottom-sheet data-testid="host" snap-points="var(--peek) calc(100px + 2rem)">
        <dialog aria-label="Details">Details</dialog>
      </rc-bottom-sheet>
    </div>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;
  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;

  await $host.updateComplete;
  $host.show();

  $host.snapTo(0, 'instant');
  expect(Math.round($dialog.getBoundingClientRect().height)).toBe(90);

  $host.snapTo(1, 'instant');
  expect(Math.round($dialog.getBoundingClientRect().height)).toBe(132);

  $host.close();
});

test('keeps percentages inside calc() viewport-relative under transformed ancestors', async () => {
  const screen = render(html`
    <div style="width: 400px; height: 300px; transform: translateZ(0);">
      <rc-bottom-sheet data-testid="host" snap-points="calc(50% - 10px)">
        <dialog aria-label="Details">Details</dialog>
      </rc-bottom-sheet>
    </div>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;
  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;

  await $host.updateComplete;
  $host.show();
  $host.snapTo(0, 'instant');

  expect(Math.round($dialog.getBoundingClientRect().height)).toBe(
    Math.round(window.innerHeight / 2 - 10),
  );

  $host.close();
});

test('reads a snap duration expressed in seconds as milliseconds', async () => {
  const screen = render(html`
    <rc-bottom-sheet data-testid="host" snap-points="120px 320px">
      <dialog aria-label="Details" style="--rc-bottom-sheet-snap-duration: .25s;">Details</dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.show();
  $host.snapTo(0, 'instant');
  $host.snapTo(1);

  // The snap animation, not rc-dialog's own entrance animation.
  const animation = $host
    .querySelector('dialog')
    ?.getAnimations()
    .find((candidate) =>
      (candidate.effect as KeyframeEffect | null)
        ?.getKeyframes()
        .some((keyframe) => 'height' in keyframe),
    );

  expect(animation?.effect?.getTiming().duration).toBe(250);

  $host.close();
});

test('snapTo keeps a fixed sheet docked inside a layout-containing ancestor', async () => {
  const resizeStartSpy = vi.fn();
  const screen = render(html`
    <div data-testid="container" style="position: fixed; inset: 6rem 1rem 2rem; contain: layout;">
      <rc-bottom-sheet
        data-testid="host"
        snap-points="132px 320px"
        @rc-bottom-sheet-resize-start=${resizeStartSpy}
      >
        <dialog
          aria-label="Nutrition"
          style="inset-block-end: 0; margin: 0; --rc-bottom-sheet-snap-duration: 50ms;"
        >
          Nutrition
          <button type="button" data-rc-bottom-sheet-handle>Resize sheet</button>
        </dialog>
      </rc-bottom-sheet>
    </div>
  `);
  const $container = await screen.getByTestId('container').element();
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.show();

  $host.snapTo(0, 'instant');

  const $dialog = $host.querySelector('dialog');
  const $handle = $host.querySelector('[data-rc-bottom-sheet-handle]');

  expect($dialog).not.toBeNull();
  expect($handle).not.toBeNull();

  if (!$dialog || !$handle) {
    throw new Error('Expected the nutrition dialog and resize handle to render.');
  }

  expect(Math.round($dialog.getBoundingClientRect().height)).toBe(132);

  expect(Math.round($dialog.getBoundingClientRect().bottom)).toBe(
    Math.round($container.getBoundingClientRect().bottom),
  );

  const peek = $dialog.getBoundingClientRect();

  firePointerEvent($handle, 'pointerdown', { clientY: peek.top });

  expect(resizeStartSpy).toHaveBeenCalledTimes(1);

  expect(resizeStartSpy.mock.calls[0][0].detail).toEqual({
    height: 132,
    inputType: 'pointer',
  });

  expect(Math.round($dialog.getBoundingClientRect().top)).toBe(Math.round(peek.top));

  expect(Math.round($dialog.getBoundingClientRect().bottom)).toBe(Math.round(peek.bottom));

  firePointerEvent($handle, 'pointermove', { clientY: peek.top + 1 });

  expect(Math.round($dialog.getBoundingClientRect().bottom)).toBe(Math.round(peek.bottom));

  firePointerEvent($handle, 'pointerup', { clientY: peek.top + 1 });
  $host.snapTo(1);

  await vi.waitFor(() => {
    expect(Math.round($dialog.getBoundingClientRect().height)).toBe(320);
  });

  expect(Math.round($dialog.getBoundingClientRect().height)).toBe(320);

  expect(Math.round($dialog.getBoundingClientRect().bottom)).toBe(
    Math.round($container.getBoundingClientRect().bottom),
  );

  const expanded = $dialog.getBoundingClientRect();

  firePointerEvent($handle, 'pointerdown', { clientY: expanded.top });

  expect(Math.round($dialog.getBoundingClientRect().top)).toBe(Math.round(expanded.top));

  expect(Math.round($dialog.getBoundingClientRect().bottom)).toBe(Math.round(expanded.bottom));

  firePointerEvent($handle, 'pointermove', { clientY: expanded.top + 1 });

  expect(Math.round($dialog.getBoundingClientRect().bottom)).toBe(Math.round(expanded.bottom));

  firePointerEvent($handle, 'pointerup', { clientY: expanded.top + 1 });
  $host.snapTo(0);

  await vi.waitFor(() => {
    expect(Math.round($dialog.getBoundingClientRect().height)).toBe(132);
  });

  expect(Math.round($dialog.getBoundingClientRect().bottom)).toBe(
    Math.round($container.getBoundingClientRect().bottom),
  );

  $host.close();
});

test('gives an un-themed drag handle a large target around the centered visual indicator', async () => {
  const screen = render(html`
    <rc-bottom-sheet data-testid="host">
      <dialog aria-label="Filters">
        <button type="button" data-rc-bottom-sheet-handle aria-label="Resize sheet"></button>
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.showModal();

  const $dialog = $host.querySelector('dialog')!;
  const $handle = $host.querySelector<HTMLElement>('[data-rc-bottom-sheet-handle]')!;
  const dialogRect = $dialog.getBoundingClientRect();
  const handleRect = $handle.getBoundingClientRect();
  const styles = getComputedStyle($handle);
  const indicatorStyles = getComputedStyle($handle, '::before');

  expect(handleRect.width).toBeGreaterThanOrEqual(44);
  expect(handleRect.height).toBe(48);

  expect(Math.round(handleRect.left + handleRect.width / 2)).toBe(
    Math.round(dialogRect.left + dialogRect.width / 2),
  );

  expect(indicatorStyles.width).toBe('32px');
  expect(indicatorStyles.height).toBe('4px');
  expect(indicatorStyles.borderRadius).toBe('999px');
  expect(styles.cursor).toBe('n-resize');
  expect(styles.touchAction).toBe('none');

  $host.close();
});

test('rc-bottom-sheet has no automated accessibility violations while open', async () => {
  const screen = renderSheet();
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;

  $host.showModal();
  await $host.updateComplete;

  await expectNoA11yViolations($host);

  $host.close();
});

test('authored bottom-sheet handle resizes vertically from the top edge', async () => {
  const screen = render(html`
    <rc-bottom-sheet data-testid="host">
      <dialog
        aria-labelledby="sheet-title"
        style="position: fixed; left: 100px; top: 240px; width: 360px; height: 320px; margin: 0;"
      >
        <h2 id="sheet-title">Filter recipes</h2>
        <button
          type="button"
          data-rc-bottom-sheet-handle
          data-rc-dialog-resize-axis="y"
          data-rc-dialog-resize-origin="top"
        >
          Resize sheet
        </button>
        <button>Done</button>
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.show();

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;
  const $handle = $host.querySelector('[data-rc-bottom-sheet-handle]') as HTMLButtonElement;
  const start = $dialog.getBoundingClientRect();

  firePointerEvent($handle, 'pointerdown', { clientX: start.left + 20, clientY: start.top });
  firePointerEvent($handle, 'pointermove', { clientX: start.left + 20, clientY: start.top - 48 });
  firePointerEvent($handle, 'pointerup', { clientX: start.left + 20, clientY: start.top - 48 });

  const resized = $dialog.getBoundingClientRect();

  expect(Math.round(resized.height)).toBe(Math.round(start.height + 48));
  expect(Math.round(resized.bottom)).toBe(Math.round(start.bottom));

  $host.close();
});

test('snap-points resolves once and snaps to the nearest height on resize release', async () => {
  const screen = render(html`
    <rc-bottom-sheet data-testid="host" snap-points="calc(200px) calc(320px) calc(460px)">
      <dialog
        aria-labelledby="sheet-title"
        style="position: fixed; left: 100px; top: 240px; width: 360px; height: 280px; margin: 0;"
      >
        <h2 id="sheet-title">Filter recipes</h2>
        <button type="button" data-rc-bottom-sheet-handle>Resize sheet</button>
        <button>Done</button>
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.show();

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;
  const $handle = $host.querySelector('[data-rc-bottom-sheet-handle]') as HTMLButtonElement;
  const appendSpy = vi.spyOn($host, 'append');
  const start = $dialog.getBoundingClientRect();

  firePointerEvent($handle, 'pointerdown', { clientX: start.left + 20, clientY: start.top });
  firePointerEvent($handle, 'pointermove', { clientX: start.left + 20, clientY: start.top - 52 });
  firePointerEvent($handle, 'pointerup', { clientX: start.left + 20, clientY: start.top - 52 });

  expect(appendSpy).toHaveBeenCalledTimes(1);

  // The settle now animates rather than applying instantly.
  await vi.waitFor(() => expect(Math.round($dialog.getBoundingClientRect().height)).toBe(320));

  $host.close();
});

test('downward swipe past the threshold requests sheet close by default', async () => {
  const screen = render(html`
    <rc-bottom-sheet data-testid="host">
      <dialog
        aria-labelledby="sheet-title"
        style="position: fixed; left: 100px; top: 180px; width: 360px; height: 360px; margin: 0;"
      >
        <h2 id="sheet-title">Filter recipes</h2>
        <button type="button" data-rc-bottom-sheet-handle>Resize sheet</button>
        <button>Done</button>
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.showModal();

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;
  const $handle = $host.querySelector('[data-rc-bottom-sheet-handle]') as HTMLButtonElement;
  const start = $dialog.getBoundingClientRect();

  firePointerEvent($handle, 'pointerdown', { clientX: start.left + 20, clientY: start.top });
  firePointerEvent($handle, 'pointermove', { clientX: start.left + 20, clientY: start.top + 120 });
  firePointerEvent($handle, 'pointerup', { clientX: start.left + 20, clientY: start.top + 120 });

  await vi.waitFor(() => expect($host.open).toBe(false));
});

test('swipe-dismiss=false prevents downward resize release from closing', async () => {
  const screen = render(html`
    <rc-bottom-sheet data-testid="host" .swipeDismiss=${false}>
      <dialog
        aria-labelledby="sheet-title"
        style="position: fixed; left: 100px; top: 180px; width: 360px; height: 360px; margin: 0;"
      >
        <h2 id="sheet-title">Filter recipes</h2>
        <button type="button" data-rc-bottom-sheet-handle>Resize sheet</button>
        <button>Done</button>
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.showModal();

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;
  const $handle = $host.querySelector('[data-rc-bottom-sheet-handle]') as HTMLButtonElement;
  const start = $dialog.getBoundingClientRect();

  firePointerEvent($handle, 'pointerdown', { clientX: start.left + 20, clientY: start.top });
  firePointerEvent($handle, 'pointermove', { clientX: start.left + 20, clientY: start.top + 120 });
  firePointerEvent($handle, 'pointerup', { clientX: start.left + 20, clientY: start.top + 120 });

  expect($host.open).toBe(true);

  $host.close();
});

test('a slow drag release settles to the nearest point gradually, not instantly', async () => {
  const screen = render(html`
    <rc-bottom-sheet data-testid="host" snap-points="200px 320px 460px">
      <dialog
        aria-labelledby="sheet-title"
        style="position: fixed; left: 100px; top: 240px; width: 360px; height: 280px; margin: 0;"
      >
        <h2 id="sheet-title">Filter recipes</h2>
        <button type="button" data-rc-bottom-sheet-handle>Resize sheet</button>
        <button>Done</button>
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.show();

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;
  const $handle = $host.querySelector('[data-rc-bottom-sheet-handle]') as HTMLButtonElement;
  const start = $dialog.getBoundingClientRect();

  firePointerEvent($handle, 'pointerdown', { clientX: start.left + 20, clientY: start.top });
  await wait(500);
  // Slow: 80px over ~500ms is ~160px/s, far below the default 500px/s swipe threshold.
  // Releasing at 360px keeps the sheet between the 320px and 460px snap points.
  firePointerEvent($handle, 'pointermove', { clientX: start.left + 20, clientY: start.top - 80 });
  firePointerEvent($handle, 'pointerup', { clientX: start.left + 20, clientY: start.top - 80 });

  // Sampled mid-animation: neither the pre-drag start nor the settled target,
  // proving the settle is an animated transition rather than an instant jump.
  await wait(60);

  const midHeight = $dialog.getBoundingClientRect().height;

  expect(midHeight).toBeGreaterThan(320);
  expect(midHeight).toBeLessThan(360);

  await vi.waitFor(() => expect(Math.round($dialog.getBoundingClientRect().height)).toBe(320));

  $host.close();
});

test('a fast upward swipe jumps to the topmost snap point regardless of release proximity', async () => {
  const screen = render(html`
    <rc-bottom-sheet data-testid="host" snap-points="200px 320px 460px">
      <dialog
        aria-labelledby="sheet-title"
        style="position: fixed; left: 100px; top: 240px; width: 360px; height: 280px; margin: 0;"
      >
        <h2 id="sheet-title">Filter recipes</h2>
        <button type="button" data-rc-bottom-sheet-handle>Resize sheet</button>
        <button>Done</button>
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.show();

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;
  const $handle = $host.querySelector('[data-rc-bottom-sheet-handle]') as HTMLButtonElement;
  const start = $dialog.getBoundingClientRect();

  firePointerEvent($handle, 'pointerdown', { clientX: start.left + 20, clientY: start.top });
  await wait(20);
  // Fast: 40px in ~20ms is ~2000px/s, well past the 500px/s threshold. The
  // release lands near the 320px point, which nearest-point would pick —
  // the swipe should override that and jump to the topmost point instead.
  firePointerEvent($handle, 'pointermove', { clientX: start.left + 20, clientY: start.top - 40 });
  firePointerEvent($handle, 'pointerup', { clientX: start.left + 20, clientY: start.top - 40 });

  await vi.waitFor(() => expect(Math.round($dialog.getBoundingClientRect().height)).toBe(460));

  $host.close();
});

test('a fast downward swipe collapses to the lowest snap point regardless of release proximity', async () => {
  const snapSpy = vi.fn();
  const screen = render(html`
    <rc-bottom-sheet
      data-testid="host"
      snap-points="200px 320px 460px"
      .swipeDismiss=${false}
      @rc-bottom-sheet-snap=${snapSpy}
    >
      <dialog
        aria-labelledby="sheet-title"
        style="position: fixed; left: 100px; top: 100px; width: 360px; height: 420px; margin: 0;"
      >
        <h2 id="sheet-title">Filter recipes</h2>
        <button type="button" data-rc-bottom-sheet-handle>Resize sheet</button>
        <button>Done</button>
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.show();

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;
  const $handle = $host.querySelector('[data-rc-bottom-sheet-handle]') as HTMLButtonElement;
  const start = $dialog.getBoundingClientRect();

  firePointerEvent($handle, 'pointerdown', { clientX: start.left + 20, clientY: start.top });
  await wait(20);
  // Release lands near the 320px point; the fast downward swipe should
  // override nearest-point selection and collapse all the way to 200px.
  firePointerEvent($handle, 'pointermove', { clientX: start.left + 20, clientY: start.top + 40 });
  firePointerEvent($handle, 'pointerup', { clientX: start.left + 20, clientY: start.top + 40 });

  expect(snapSpy).not.toHaveBeenCalled();

  await vi.waitFor(() => expect(Math.round($dialog.getBoundingClientRect().height)).toBe(200));
  await vi.waitFor(() => expect(snapSpy).toHaveBeenCalledTimes(1));
  expect(snapSpy.mock.calls[0][0].detail).toEqual({ index: 0, height: 200, trigger: 'drag' });

  $host.close();
});

test.runIf('currentCSSZoom' in Element.prototype)(
  'percentage snap points resolve under a zoom when the host has no box',
  async () => {
    const screen = render(html`
      <div style="zoom: 0.7">
        <rc-bottom-sheet data-testid="host" snap-points="40%" style="display: contents">
          <dialog aria-label="Zoomed sheet"><button>Done</button></dialog>
        </rc-bottom-sheet>
      </div>
    `);
    const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

    await $host.updateComplete;
    $host.show();
    $host.snapTo(0, 'instant');

    const $dialog = $host.querySelector('dialog') as HTMLDialogElement;

    // A percentage is of the viewport on screen, whatever the ancestor zoom;
    // a display: contents host reports no zoom, so it is read from the dialog.
    // (40% stays under the default 70dvh cap, which the zoom scales.)
    expect($dialog.getBoundingClientRect().height).toBeCloseTo(window.innerHeight * 0.4, 0);

    $host.close();
  },
);

test('snapTo() before the inner dialog is attached applies when the sheet opens', async () => {
  const snapSpy = vi.fn();
  const $host = document.createElement('rc-bottom-sheet') as RCBottomSheet;

  // A framework ref runs once the host exists, before its children are added.
  $host.setAttribute('snap-points', '120px 320px');
  $host.addEventListener('rc-bottom-sheet-snap', snapSpy);
  document.body.append($host);
  $host.snapTo(0, 'instant');

  const $dialog = document.createElement('dialog');

  $dialog.setAttribute('aria-label', 'Ingredients');
  $dialog.innerHTML = '<button>Done</button><p style="block-size: 480px">Long content</p>';
  $host.append($dialog);
  $host.modal = false;
  $host.open = true;

  try {
    await vi.waitFor(() => expect($dialog.open).toBe(true));
    await vi.waitFor(() => expect(Math.round($dialog.getBoundingClientRect().height)).toBe(120));
    expect(snapSpy.mock.calls.at(-1)?.[0].detail).toMatchObject({ index: 0, trigger: 'api' });
  } finally {
    $host.remove();
  }
});

test('snapTo() settles to a specific index and fires rc-bottom-sheet-snap with an api trigger', async () => {
  const snapSpy = vi.fn();
  const screen = render(html`
    <rc-bottom-sheet
      data-testid="host"
      snap-points="200px 320px 460px"
      @rc-bottom-sheet-snap=${snapSpy}
    >
      <dialog
        aria-labelledby="sheet-title"
        style="position: fixed; left: 100px; top: 240px; width: 360px; height: 280px; margin: 0;"
      >
        <h2 id="sheet-title">Filter recipes</h2>
        <button>Done</button>
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.show();

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;

  $host.snapTo(2, 'instant');

  expect(Math.round($dialog.getBoundingClientRect().height)).toBe(460);
  expect(snapSpy).toHaveBeenCalledTimes(1);
  expect(snapSpy.mock.calls[0][0].detail).toEqual({ index: 2, height: 460, trigger: 'api' });

  $host.snapTo(0);

  // Animated snaps report settled state, not the target selected at the
  // beginning of the transition.
  expect(snapSpy).toHaveBeenCalledTimes(1);

  await vi.waitFor(() => expect(Math.round($dialog.getBoundingClientRect().height)).toBe(200));
  await vi.waitFor(() => expect(snapSpy).toHaveBeenCalledTimes(2));
  expect(snapSpy.mock.calls[1][0].detail).toEqual({ index: 0, height: 200, trigger: 'api' });

  $host.close();
});

test('an interrupted snap animation does not report a stale settled target', async () => {
  const snapSpy = vi.fn();
  const screen = render(html`
    <rc-bottom-sheet
      data-testid="host"
      snap-points="200px 320px 460px"
      @rc-bottom-sheet-snap=${snapSpy}
    >
      <dialog aria-label="Filter recipes" style="height: 460px">
        <button>Done</button>
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.show();

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;
  const animateSpy = vi.spyOn($dialog, 'animate');

  $host.snapTo(0);
  $host.snapTo(1);

  expect(animateSpy).toHaveBeenCalledTimes(2);
  expect(snapSpy).not.toHaveBeenCalled();

  animateSpy.mock.results[1].value.finish();

  await vi.waitFor(() => expect(snapSpy).toHaveBeenCalledTimes(1));
  expect(snapSpy.mock.calls[0][0].detail).toEqual({ index: 1, height: 320, trigger: 'api' });

  $host.close();
});

test('snap settling stays block-end anchored when CSS constrains the requested height', async () => {
  const snapSpy = vi.fn();
  const screen = render(html`
    <rc-bottom-sheet data-testid="host" snap-points="200px 500px" @rc-bottom-sheet-snap=${snapSpy}>
      <dialog aria-label="Filter recipes" style="height: 200px; max-block-size: 300px">
        <button>Done</button>
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.showModal();

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;
  const anchoredBottom = $dialog.getBoundingClientRect().bottom;

  $host.snapTo(1, 'instant');

  const settled = $dialog.getBoundingClientRect();

  expect(Math.round(settled.height)).toBe(300);
  expect(Math.round(settled.bottom)).toBe(Math.round(anchoredBottom));
  expect(snapSpy.mock.calls[0][0].detail).toEqual({ index: 1, height: 300, trigger: 'api' });

  $host.close();
});

test('window resize re-derives a pinned snap from the current CSS-driven position, not the stale pinned box', async () => {
  const snapSpy = vi.fn();
  const screen = render(html`
    <rc-bottom-sheet data-testid="host" snap-points="132px 400px" @rc-bottom-sheet-snap=${snapSpy}>
      <dialog
        aria-label="Nutrition"
        style="position: fixed; inset-block-end: 0px; left: 0; right: 0; margin: 0;"
      >
        <button>Done</button>
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.show();

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;

  $host.snapTo(0, 'instant');
  expect(snapSpy).toHaveBeenCalledTimes(1);

  // Simulate a viewport shrink that a stale pin wouldn't reflect: pretend
  // the sheet is still pinned somewhere higher up (as if a since-resized
  // viewport used to be much taller). A correct re-derivation on resize
  // must not simply trust this stale inline top — it should fall back to
  // the dialog's own CSS-driven (inset-block-end: 0) position first.
  $dialog.style.top = '50px';

  window.dispatchEvent(new Event('resize'));

  await vi.waitFor(() => expect(snapSpy).toHaveBeenCalledTimes(2));
  expect(snapSpy.mock.calls[1][0].detail).toEqual({ index: 0, height: 132, trigger: 'api' });

  const resettled = $dialog.getBoundingClientRect();

  // Re-anchored to the viewport block-end, not left dangling at the
  // corrupted stale top.
  expect(Math.round(resettled.bottom)).toBe(Math.round(window.innerHeight));
  expect(Math.round(resettled.height)).toBe(132);

  $host.close();
});

test('snap settling consumes the authored easing token', async () => {
  const screen = render(html`
    <rc-bottom-sheet data-testid="host" snap-points="200px 320px">
      <dialog
        aria-label="Filter recipes"
        style="height: 240px; --rc-bottom-sheet-snap-easing: linear"
      >
        <button>Done</button>
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.show();

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;
  const animateSpy = vi.spyOn($dialog, 'animate');

  $host.snapTo(1);

  expect(animateSpy).toHaveBeenCalledTimes(1);
  expect((animateSpy.mock.calls[0][1] as KeyframeAnimationOptions).easing).toBe('linear');

  animateSpy.mock.results[0].value.finish();
  $host.close();
});

test('snapTo() clamps finite indices and ignores non-finite indices', async () => {
  const snapSpy = vi.fn();
  const screen = render(html`
    <rc-bottom-sheet
      data-testid="host"
      snap-points="200px 320px 460px"
      @rc-bottom-sheet-snap=${snapSpy}
    >
      <dialog aria-label="Filter recipes" style="height: 280px">
        <button>Done</button>
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.show();

  $host.snapTo(8.9, 'instant');
  expect(snapSpy.mock.calls[0][0].detail).toEqual({ index: 2, height: 460, trigger: 'api' });

  $host.snapTo(Number.NaN, 'instant');
  $host.snapTo(Number.POSITIVE_INFINITY, 'instant');
  expect(snapSpy).toHaveBeenCalledTimes(1);

  $host.close();
});

test('window resize re-docks a sheet a drag gesture left pinned away from its edge', async () => {
  const screen = render(html`
    <rc-bottom-sheet data-testid="host" snap-points="132px 400px">
      <dialog aria-label="Nutrition"><button>Done</button></dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.show();

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;

  $host.snapTo(1, 'instant');

  // What ResizeController's pinElementBox leaves behind after a drag: every
  // edge pinned, including `bottom: auto`, against the pre-resize viewport.
  Object.assign($dialog.style, {
    inset: 'auto',
    top: `${window.innerHeight + 400}px`,
    left: '0px',
    width: '300px',
    margin: '0px',
  });

  window.dispatchEvent(new Event('resize'));

  const docked = $dialog.getBoundingClientRect();

  expect(Math.round(docked.bottom)).toBe(Math.round(window.innerHeight));
  expect(Math.round(docked.height)).toBe(400);
  expect($dialog.style.top).toBe('');
  expect($dialog.style.width).toBe('');

  $host.close();
});

test('snaps stay docked when the containing block moves afterward', async () => {
  const screen = render(html`
    <div data-testid="frame" style="position: fixed; inset: 100px 0 0; contain: layout;">
      <rc-bottom-sheet data-testid="host" snap-points="132px 300px">
        <dialog aria-label="Nutrition"><button>Done</button></dialog>
      </rc-bottom-sheet>
    </div>
  `);
  const $frame = (await screen.getByTestId('frame').element()) as HTMLElement;
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;
  $host.show();

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;

  $host.snapTo(1, 'instant');

  // A collapsing app bar moves the containing block's top edge, not its
  // bottom edge.
  $frame.style.top = '40px';

  const after = $dialog.getBoundingClientRect();

  expect(Math.round(after.bottom)).toBe(Math.round(window.innerHeight));
  expect(Math.round(after.height)).toBe(300);

  $host.close();
});

test('a focused field scrolls into view within the sheet', async () => {
  const screen = render(html`
    <rc-bottom-sheet data-testid="host" snap-points="200px">
      <dialog aria-label="Nutrition" style="display: flex; flex-direction: column; padding: 0;">
        <button>Done</button>
        <div data-testid="body" style="flex: 1; min-block-size: 0; overflow: auto;">
          <div style="block-size: 600px;"></div>
          <input data-testid="field" aria-label="Quantity" />
        </div>
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;
  const $field = (await screen.getByTestId('field').element()) as HTMLInputElement;

  await $host.updateComplete;
  $host.show();
  $host.snapTo(0, 'instant');

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;

  $field.focus({ preventScroll: true });
  // A software keyboard resizing the viewport re-runs the reveal as well.
  window.dispatchEvent(new Event('resize'));

  const sheet = $dialog.getBoundingClientRect();
  const field = $field.getBoundingClientRect();

  expect(field.top).toBeGreaterThanOrEqual(sheet.top);
  expect(field.bottom).toBeLessThanOrEqual(sheet.bottom);
  // Scrolling sufficed, so the sheet keeps its snap height.
  expect(Math.round(sheet.height)).toBe(200);

  $host.close();
});

test('a focused field the sheet cannot scroll to grows the sheet past its maximum until focus leaves', async () => {
  const screen = render(html`
    <button data-testid="outside">Outside</button>
    <rc-bottom-sheet data-testid="host" snap-points="132px">
      <dialog aria-label="Nutrition" style="max-block-size: 150px; overflow: hidden; padding: 0;">
        <button>Done</button>
        <div style="block-size: 220px;"></div>
        <input data-testid="field" aria-label="Quantity" />
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;
  const $field = (await screen.getByTestId('field').element()) as HTMLInputElement;
  const $outside = (await screen.getByTestId('outside').element()) as HTMLButtonElement;

  await $host.updateComplete;
  $host.show();
  $host.snapTo(0, 'instant');

  const $dialog = $host.querySelector('dialog') as HTMLDialogElement;

  $field.focus({ preventScroll: true });

  const sheet = $dialog.getBoundingClientRect();
  const field = $field.getBoundingClientRect();

  expect(field.bottom).toBeLessThanOrEqual(sheet.bottom);
  expect(sheet.height).toBeGreaterThan(150);
  expect(Math.round(sheet.bottom)).toBe(Math.round(window.innerHeight));

  $outside.focus();

  await vi.waitFor(() => {
    expect(Math.round($dialog.getBoundingClientRect().height)).toBe(132);
  });

  expect($dialog.style.maxBlockSize).toBe('');

  $host.close();
});

test.runIf('currentCSSZoom' in Element.prototype)(
  'snaps and drags in the sheet’s own pixels under an ancestor zoom',
  async () => {
    const snapSpy = vi.fn();
    const screen = render(html`
      <div style="zoom: 0.8">
        <rc-bottom-sheet data-testid="host" snap-points="100px 300px" @rc-bottom-sheet-snap=${snapSpy}>
          <dialog aria-labelledby="sheet-title">
            <h2 id="sheet-title">Filter recipes</h2>
            <button type="button" data-rc-bottom-sheet-handle>Resize sheet</button>
          </dialog>
        </rc-bottom-sheet>
      </div>
    `);
    const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

    await $host.updateComplete;
    $host.show();

    const $dialog = $host.querySelector('dialog') as HTMLDialogElement;
    const $handle = $host.querySelector('[data-rc-bottom-sheet-handle]') as HTMLButtonElement;

    // Snapping again to the same point keeps its height rather than zooming
    // the measured height a second time.
    $host.snapTo(0, 'instant');
    $host.snapTo(0, 'instant');

    expect($dialog.getBoundingClientRect().height).toBeCloseTo(80, 0);
    expect(snapSpy.mock.calls.at(-1)?.[0].detail.height).toBeCloseTo(100, 0);

    const start = $dialog.getBoundingClientRect();

    firePointerEvent($handle, 'pointerdown', { clientX: start.left + 20, clientY: start.top });
    firePointerEvent($handle, 'pointermove', { clientX: start.left + 20, clientY: start.top - 120 });

    // The dragged edge follows the pointer and the sheet stays docked.
    const dragged = $dialog.getBoundingClientRect();

    expect(dragged.top).toBeCloseTo(start.top - 120, 0);
    expect(dragged.bottom).toBeCloseTo(window.innerHeight, 0);

    firePointerEvent($handle, 'pointerup', { clientX: start.left + 20, clientY: start.top - 120 });

    await vi.waitFor(() => expect($dialog.getBoundingClientRect().height).toBeCloseTo(240, 0));
    expect($dialog.getBoundingClientRect().bottom).toBeCloseTo(window.innerHeight, 0);

    $host.close();
  },
);
