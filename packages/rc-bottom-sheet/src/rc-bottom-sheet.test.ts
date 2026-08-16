import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';
import './define';
import type { RCBottomSheet } from './rc-bottom-sheet';

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

test('rc-bottom-sheet registers a native dialog wrapper with light dismiss by default', async () => {
  const screen = renderSheet();
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;

  expect($host.lightDismiss).toBe(true);
  expect($host.resize).toBe('vertical');
  expect($host.resizeOrigin).toBe('top');
  expect($host.resizeHandle).toBe('[data-rc-bottom-sheet-handle]');
  expect($host.swipeDismiss).toBe(true);
  expect($host.swipeVelocity).toBe(500);
  expect($host.querySelector('dialog')).toBeInstanceOf(HTMLDialogElement);
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

test('rc-bottom-sheet inherits showModal(), close(), and returnValue', async () => {
  const screen = renderSheet();
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;

  $host.showModal();
  expect($host.open).toBe(true);

  $host.close('done');
  expect($host.open).toBe(false);
  expect($host.returnValue).toBe('done');
});

test('rc-bottom-sheet dispatches inherited dialog toggle events', async () => {
  const toggleSpy = vi.fn();
  const screen = render(html`
    <rc-bottom-sheet data-testid="host" @rc-dialog-toggle=${toggleSpy}>
      <dialog aria-label="Filter recipes">
        <button>Done</button>
      </dialog>
    </rc-bottom-sheet>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCBottomSheet;

  await $host.updateComplete;

  $host.showModal();
  expect(toggleSpy).toHaveBeenCalledTimes(1);
  expect(toggleSpy.mock.calls[0][0].detail).toEqual({ open: true, returnValue: '' });

  $host.close();
  await vi.waitFor(() => expect(toggleSpy).toHaveBeenCalledTimes(2));
  expect(toggleSpy.mock.calls[1][0].detail).toEqual({ open: false, returnValue: '' });
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

test('snap-points snaps to the nearest declared height on resize release', async () => {
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
  firePointerEvent($handle, 'pointermove', { clientX: start.left + 20, clientY: start.top - 52 });
  firePointerEvent($handle, 'pointerup', { clientX: start.left + 20, clientY: start.top - 52 });

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
  const screen = render(html`
    <rc-bottom-sheet data-testid="host" snap-points="200px 320px 460px" .swipeDismiss=${false}>
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

  await vi.waitFor(() => expect(Math.round($dialog.getBoundingClientRect().height)).toBe(200));

  $host.close();
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
  await vi.waitFor(() => expect(Math.round($dialog.getBoundingClientRect().height)).toBe(200));
  expect(snapSpy).toHaveBeenCalledTimes(2);
  expect(snapSpy.mock.calls[1][0].detail).toEqual({ index: 0, height: 200, trigger: 'api' });

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
