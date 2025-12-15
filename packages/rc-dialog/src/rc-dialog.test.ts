import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './define';
import type { RCDialog } from './rc-dialog.js';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

// Helper: render an rc-dialog wrapping a <dialog> with a label
function renderDialog(extraAttrs = '') {
  return render(html`
    <rc-dialog data-testid="host" .innerHTML=${`
      <dialog aria-labelledby="dlg-title" ${extraAttrs}>
        <span id="dlg-title">Test Dialog</span>
        <button id="ok-btn">OK</button>
      </dialog>
    `}></rc-dialog>
  `);
}

test('rc-dialog delegates showModal() to inner <dialog>', async () => {
  const screen = renderDialog();
  const host = await screen.getByTestId('host').element() as RCDialog;

  await host.updateComplete;

  expect(host.open).toBe(false);
  host.showModal();
  expect(host.open).toBe(true);

  host.close();
});

test('rc-dialog has no automated accessibility violations', async () => {
  const screen = renderDialog();
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  // Open the dialog before auditing — axe must see the live modal state.
  host.showModal();
  await host.updateComplete;

  await expectNoA11yViolations(host);

  host.close();
});

test('rc-dialog delegates close() and exposes returnValue', async () => {
  const screen = renderDialog();
  const host = await screen.getByTestId('host').element() as RCDialog;

  await host.updateComplete;

  host.showModal();
  host.close('confirmed');

  expect(host.open).toBe(false);
  expect(host.returnValue).toBe('confirmed');
});

test('rc-dialog dispatches rc-dialog-close with returnValue detail', async () => {
  const closeSpy = vi.fn();

  const screen = render(html`
    <rc-dialog data-testid="host" @rc-dialog-close=${closeSpy}>
      <dialog aria-labelledby="t">
        <span id="t">Title</span>
      </dialog>
    </rc-dialog>
  `);

  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.showModal();
  host.close('ok');

  // The native <dialog> close event fires in a queued task (HTML spec step 8),
  // not synchronously, so we poll until the spy is called.
  await vi.waitFor(() => expect(closeSpy).toHaveBeenCalledTimes(1));
  expect(closeSpy.mock.calls[0][0].detail).toEqual({ returnValue: 'ok' });
});

test('rc-dialog dispatches rc-dialog-cancel then rc-dialog-close on Escape', async () => {
  const cancelSpy = vi.fn();
  const closeSpy = vi.fn();

  const screen = render(html`
    <rc-dialog
      data-testid="host"
      @rc-dialog-cancel=${cancelSpy}
      @rc-dialog-close=${closeSpy}
    >
      <dialog aria-labelledby="t">
        <span id="t">Title</span>
        <button id="focus-me">Focus</button>
      </dialog>
    </rc-dialog>
  `);

  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.showModal();

  // Simulate native <dialog> cancel + close sequence (fired by browser on Escape)
  const dlg = host.querySelector('dialog') as HTMLDialogElement;
  dlg.dispatchEvent(new Event('cancel', { bubbles: false }));
  dlg.dispatchEvent(new Event('close', { bubbles: false }));

  expect(cancelSpy).toHaveBeenCalledTimes(1);
  expect(closeSpy).toHaveBeenCalledTimes(1);

  if (host.open) host.close();
});

test('rc-dialog-request-close fires and is cancelable', async () => {
  const requestCloseSpy = vi.fn();
  const cancelSpy = vi.fn();

  const screen = render(html`
    <rc-dialog
      data-testid="host"
      @rc-dialog-request-close=${requestCloseSpy}
      @rc-dialog-cancel=${cancelSpy}
    >
      <dialog aria-labelledby="t">
        <span id="t">Title</span>
      </dialog>
    </rc-dialog>
  `);

  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.showModal();

  // Dispatch cancel without preventing rc-dialog-request-close → both events fire.
  const dlg = host.querySelector('dialog') as HTMLDialogElement;
  dlg.dispatchEvent(new Event('cancel', { cancelable: true, bubbles: false }));

  expect(requestCloseSpy).toHaveBeenCalledTimes(1);
  expect(cancelSpy).toHaveBeenCalledTimes(1);

  // Now add a listener that prevents the close.
  requestCloseSpy.mockReset();
  cancelSpy.mockReset();
  host.addEventListener('rc-dialog-request-close', (e: Event) => e.preventDefault(), { once: true });

  dlg.dispatchEvent(new Event('cancel', { cancelable: true, bubbles: false }));

  expect(requestCloseSpy).toHaveBeenCalledTimes(1);
  // rc-dialog-cancel must NOT fire when the close was prevented.
  expect(cancelSpy).toHaveBeenCalledTimes(0);
  // Dialog must still be open.
  expect(host.open).toBe(true);

  if (host.open) host.close();
});

test('rc-dialog open getter reflects inner dialog state', async () => {
  const screen = renderDialog();
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  expect(host.open).toBe(false);

  host.showModal();
  expect(host.open).toBe(true);

  host.close();
  expect(host.open).toBe(false);
});

test('rc-dialog restores focus to the opener on close', async () => {
  const screen = render(html`
    <div>
      <button data-testid="opener">Open</button>
      <rc-dialog data-testid="host">
        <dialog aria-labelledby="t">
          <span id="t">Title</span>
          <button id="close-btn">Close</button>
        </dialog>
      </rc-dialog>
    </div>
  `);

  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  const opener = await screen.getByTestId('opener').element() as HTMLButtonElement;
  opener.focus();

  host.showModal();
  host.close();

  // Native dialog close fires asynchronously; wait for the handler.
  await vi.waitFor(() => expect(document.activeElement).toBe(opener));
});
