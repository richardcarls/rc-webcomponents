import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './rc-dialog.js';

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
  const host = screen.getByTestId('host');
  const rcDialog = await host.element() as any;

  await rcDialog.updateComplete;

  expect(rcDialog.open).toBe(false);
  rcDialog.showModal();
  expect(rcDialog.open).toBe(true);

  rcDialog.close();
});

test('rc-dialog delegates close() and exposes returnValue', async () => {
  const screen = renderDialog();
  const host = screen.getByTestId('host');
  const rcDialog = await host.element() as any;

  await rcDialog.updateComplete;

  rcDialog.showModal();
  rcDialog.close('confirmed');

  expect(rcDialog.open).toBe(false);
  expect(rcDialog.returnValue).toBe('confirmed');
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

  const host = screen.getByTestId('host');
  const rcDialog = await host.element() as any;
  await rcDialog.updateComplete;

  rcDialog.showModal();
  rcDialog.close('ok');

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

  const host = screen.getByTestId('host');
  const rcDialog = await host.element() as any;
  await rcDialog.updateComplete;

  rcDialog.showModal();

  // Simulate native <dialog> cancel + close sequence (fired by browser on Escape)
  const dlg = rcDialog.querySelector('dialog') as HTMLDialogElement;
  dlg.dispatchEvent(new Event('cancel', { bubbles: false }));
  dlg.dispatchEvent(new Event('close', { bubbles: false }));

  expect(cancelSpy).toHaveBeenCalledTimes(1);
  expect(closeSpy).toHaveBeenCalledTimes(1);

  if (rcDialog.open) rcDialog.close();
});

test('rc-dialog open getter reflects inner dialog state', async () => {
  const screen = renderDialog();
  const host = screen.getByTestId('host');
  const rcDialog = await host.element() as any;
  await rcDialog.updateComplete;

  expect(rcDialog.open).toBe(false);

  rcDialog.showModal();
  expect(rcDialog.open).toBe(true);

  rcDialog.close();
  expect(rcDialog.open).toBe(false);
});
