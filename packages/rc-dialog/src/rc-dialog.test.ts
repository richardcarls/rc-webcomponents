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

// ---------------------------------------------------------------------------
// Group A — show() non-modal behavior
// ---------------------------------------------------------------------------

test('show() opens dialog as non-modal', async () => {
  const screen = renderDialog();
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.show();
  expect(host.open).toBe(true);

  const dlg = host.querySelector('dialog') as HTMLDialogElement;
  expect(dlg.matches(':modal')).toBe(false);

  host.close();
});

test('show() fires rc-dialog-open', async () => {
  const openSpy = vi.fn();
  const screen = render(html`
    <rc-dialog data-testid="host" @rc-dialog-open=${openSpy}>
      <dialog aria-labelledby="t">
        <span id="t">Title</span>
        <button>Close</button>
      </dialog>
    </rc-dialog>
  `);
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.show();
  expect(openSpy).toHaveBeenCalledTimes(1);

  host.close();
});

test('show() restores focus to opener on close', async () => {
  const screen = render(html`
    <div>
      <button data-testid="opener">Open</button>
      <rc-dialog data-testid="host">
        <dialog aria-labelledby="t">
          <span id="t">Title</span>
          <button>Close</button>
        </dialog>
      </rc-dialog>
    </div>
  `);
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  const opener = await screen.getByTestId('opener').element() as HTMLButtonElement;
  opener.focus();

  host.show();
  host.close();

  await vi.waitFor(() => expect(document.activeElement).toBe(opener));
});

// ---------------------------------------------------------------------------
// Group B — modal property and controlled open
// ---------------------------------------------------------------------------

test('controlled open = true opens dialog as modal', async () => {
  const screen = renderDialog();
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.open = true;
  expect(host.open).toBe(true);

  const dlg = host.querySelector('dialog') as HTMLDialogElement;
  expect(dlg.matches(':modal')).toBe(true);

  host.close();
});

test('controlled open = false closes dialog', async () => {
  const screen = renderDialog();
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.showModal();
  expect(host.open).toBe(true);

  host.open = false;
  expect(host.open).toBe(false);
});

test('modal = false with controlled open = true opens as non-modal', async () => {
  const screen = renderDialog();
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.modal = false;
  host.open = true;
  expect(host.open).toBe(true);

  const dlg = host.querySelector('dialog') as HTMLDialogElement;
  expect(dlg.matches(':modal')).toBe(false);

  host.close();
});

test('default-open attribute opens dialog on connect as modal', async () => {
  const screen = render(html`
    <rc-dialog data-testid="host" default-open>
      <dialog aria-labelledby="t">
        <span id="t">Title</span>
        <button>Close</button>
      </dialog>
    </rc-dialog>
  `);
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  expect(host.open).toBe(true);
  const dlg = host.querySelector('dialog') as HTMLDialogElement;
  expect(dlg.matches(':modal')).toBe(true);

  host.close();
});

// ---------------------------------------------------------------------------
// Group C — initial focus
// ---------------------------------------------------------------------------

test('showModal() moves initial focus inside the dialog', async () => {
  const screen = renderDialog();
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.showModal();

  const dlg = host.querySelector('dialog') as HTMLDialogElement;
  expect(dlg.contains(document.activeElement)).toBe(true);

  host.close();
});

test('show() moves initial focus inside the dialog', async () => {
  const screen = renderDialog();
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.show();

  const dlg = host.querySelector('dialog') as HTMLDialogElement;
  expect(dlg.contains(document.activeElement)).toBe(true);

  host.close();
});

// ---------------------------------------------------------------------------
// Group D — focus fallback when opener is removed from DOM
// ---------------------------------------------------------------------------

test('focus falls back to document.body when opener is removed before close', async () => {
  const screen = render(html`
    <div data-testid="container">
      <button data-testid="opener">Open</button>
      <rc-dialog data-testid="host">
        <dialog aria-labelledby="t">
          <span id="t">Title</span>
          <button>Close</button>
        </dialog>
      </rc-dialog>
    </div>
  `);
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  const opener = await screen.getByTestId('opener').element() as HTMLButtonElement;
  opener.focus();

  host.showModal();

  // Remove the opener from the DOM while dialog is open.
  opener.remove();

  host.close();

  await vi.waitFor(() => expect(document.activeElement).toBe(document.body));
});

// ---------------------------------------------------------------------------
// Group E — light-dismiss setup and behavior
// ---------------------------------------------------------------------------

test('light-dismiss sets closedby="any" on inner dialog when browser supports native closedby', async () => {
  // When the browser supports the native closedby attribute, rc-dialog delegates
  // backdrop dismissal to it rather than attaching a JS click handler.
  if (!('closedBy' in HTMLDialogElement.prototype)) return;

  const screen = render(html`
    <rc-dialog data-testid="host" light-dismiss>
      <dialog aria-labelledby="t">
        <span id="t">Title</span>
        <button>Close</button>
      </dialog>
    </rc-dialog>
  `);
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  const dlg = host.querySelector('dialog') as HTMLDialogElement;
  expect(dlg.getAttribute('closedby')).toBe('any');
});

test('light-dismiss JS fallback: backdrop click calls requestClose() when native closedby not supported', async () => {
  // Only tests the JS click-handler path used in older browsers. Skip when the
  // browser supports the native closedby attribute (which takes priority).
  if ('closedBy' in HTMLDialogElement.prototype) return;

  const requestCloseSpy = vi.fn();
  const screen = render(html`
    <rc-dialog
      data-testid="host"
      light-dismiss
      @rc-dialog-request-close=${requestCloseSpy}
    >
      <dialog aria-labelledby="t">
        <span id="t">Title</span>
        <button>Close</button>
      </dialog>
    </rc-dialog>
  `);
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.showModal();

  // The JS backdrop handler fires when e.target === <dialog>. Dispatch directly
  // on the <dialog> element to satisfy that check.
  const dlg = host.querySelector('dialog') as HTMLDialogElement;
  dlg.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

  expect(requestCloseSpy).toHaveBeenCalledTimes(1);

  if (host.open) host.close();
});

test('light-dismiss keeps dialog open when rc-dialog-request-close is prevented', async () => {
  // Both the native (closedby="any" → cancel event) and JS fallback paths
  // go through rc-dialog-request-close. Simulate via the cancel event, which
  // is what the browser fires on backdrop click with closedby="any".
  const screen = render(html`
    <rc-dialog
      data-testid="host"
      light-dismiss
      @rc-dialog-request-close=${(e: Event) => e.preventDefault()}
    >
      <dialog aria-labelledby="t">
        <span id="t">Title</span>
        <button>Close</button>
      </dialog>
    </rc-dialog>
  `);
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.showModal();

  const dlg = host.querySelector('dialog') as HTMLDialogElement;
  dlg.dispatchEvent(new Event('cancel', { cancelable: true, bubbles: false }));

  expect(host.open).toBe(true);

  host.close();
});

// ---------------------------------------------------------------------------
// Group F — requestClose() method
// ---------------------------------------------------------------------------

test('requestClose() fires rc-dialog-request-close and closes when not prevented', async () => {
  const requestCloseSpy = vi.fn();
  const screen = render(html`
    <rc-dialog data-testid="host" @rc-dialog-request-close=${requestCloseSpy}>
      <dialog aria-labelledby="t">
        <span id="t">Title</span>
        <button>Close</button>
      </dialog>
    </rc-dialog>
  `);
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.showModal();
  host.requestClose();

  expect(requestCloseSpy).toHaveBeenCalledTimes(1);
  await vi.waitFor(() => expect(host.open).toBe(false));
});

test('requestClose() keeps dialog open when rc-dialog-request-close is prevented', async () => {
  const screen = render(html`
    <rc-dialog
      data-testid="host"
      @rc-dialog-request-close=${(e: Event) => e.preventDefault()}
    >
      <dialog aria-labelledby="t">
        <span id="t">Title</span>
        <button>Close</button>
      </dialog>
    </rc-dialog>
  `);
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.showModal();
  host.requestClose();

  expect(host.open).toBe(true);

  host.close();
});

// ---------------------------------------------------------------------------
// Group G — event contract
// ---------------------------------------------------------------------------

test('rc-dialog-toggle fires with { open: true } on showModal()', async () => {
  const toggleSpy = vi.fn();
  const screen = render(html`
    <rc-dialog data-testid="host" @rc-dialog-toggle=${toggleSpy}>
      <dialog aria-labelledby="t">
        <span id="t">Title</span>
        <button>Close</button>
      </dialog>
    </rc-dialog>
  `);
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.showModal();
  expect(toggleSpy).toHaveBeenCalledTimes(1);
  expect(toggleSpy.mock.calls[0][0].detail).toMatchObject({ open: true });

  host.close();
});

test('rc-dialog-toggle fires with { open: false } on close', async () => {
  const toggleSpy = vi.fn();
  const screen = render(html`
    <rc-dialog data-testid="host" @rc-dialog-toggle=${toggleSpy}>
      <dialog aria-labelledby="t">
        <span id="t">Title</span>
        <button>Close</button>
      </dialog>
    </rc-dialog>
  `);
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.showModal();
  toggleSpy.mockReset();

  host.close();
  await vi.waitFor(() => expect(toggleSpy).toHaveBeenCalledTimes(1));
  expect(toggleSpy.mock.calls[0][0].detail).toMatchObject({ open: false });
});

test('rc-dialog-open fires on showModal()', async () => {
  const openSpy = vi.fn();
  const screen = render(html`
    <rc-dialog data-testid="host" @rc-dialog-open=${openSpy}>
      <dialog aria-labelledby="t">
        <span id="t">Title</span>
        <button>Close</button>
      </dialog>
    </rc-dialog>
  `);
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.showModal();
  expect(openSpy).toHaveBeenCalledTimes(1);

  host.close();
});

test('rc-dialog-open fires on show()', async () => {
  const openSpy = vi.fn();
  const screen = render(html`
    <rc-dialog data-testid="host" @rc-dialog-open=${openSpy}>
      <dialog aria-labelledby="t">
        <span id="t">Title</span>
        <button>Close</button>
      </dialog>
    </rc-dialog>
  `);
  const host = await screen.getByTestId('host').element() as RCDialog;
  await host.updateComplete;

  host.show();
  expect(openSpy).toHaveBeenCalledTimes(1);

  host.close();
});
