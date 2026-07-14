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
  expect($host.querySelector('dialog')).toBeInstanceOf(HTMLDialogElement);
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

  expect(Math.round($dialog.getBoundingClientRect().height)).toBe(320);

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
