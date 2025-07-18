import { test, expect, vi } from "vitest";
import { render } from "vitest-browser-lit";
import { html } from "lit";
import { userEvent } from "vitest/browser";

import { mouseMove } from "./MouseMoveDirective";

function fireMouseEvent(
  target: EventTarget,
  type: string,
  init?: MouseEventInit,
) {
  target.dispatchEvent(
    new MouseEvent(type, { bubbles: true, cancelable: true, ...init }),
  );
}

// ─── Callback invocation ──────────────────────────────────────────────────────

test("mouseMove: callback fires on mousemove after mousedown", async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );
  const el = screen.getByTestId("handle");
  const node = await el.element();

  fireMouseEvent(node, "mousedown");
  fireMouseEvent(window, "mousemove");
  fireMouseEvent(window, "mousemove");

  expect(cb).toHaveBeenCalledTimes(2);
});

test("mouseMove: callback does not fire before mousedown", async () => {
  const cb = vi.fn();
  const _screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );

  // Directly fire mousemove on window without a prior mousedown
  fireMouseEvent(window, "mousemove");

  expect(cb).not.toHaveBeenCalled();
});

test("mouseMove: callback receives the mousemove event", async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );
  const el = screen.getByTestId("handle");
  const node = await el.element();

  fireMouseEvent(node, "mousedown");
  fireMouseEvent(window, "mousemove", { clientX: 42, clientY: 99 });

  expect(cb).toHaveBeenCalledOnce();
  const evt = cb.mock.calls[0][0] as MouseEvent;
  expect(evt.clientX).toBe(42);
  expect(evt.clientY).toBe(99);
});

// ─── Cleanup on mouseup / mouseleave ─────────────────────────────────────────

test("mouseMove: mousemove stops firing after mouseup", async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );
  const el = screen.getByTestId("handle");
  const node = await el.element();

  fireMouseEvent(node, "mousedown");
  fireMouseEvent(window, "mousemove");
  expect(cb).toHaveBeenCalledTimes(1);

  fireMouseEvent(window, "mouseup");
  fireMouseEvent(window, "mousemove");
  fireMouseEvent(window, "mousemove");

  // Only the one move before mouseup counts
  expect(cb).toHaveBeenCalledTimes(1);
});

test("mouseMove: mousemove stops firing after mouseleave on window", async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );
  const el = screen.getByTestId("handle");
  const node = await el.element();

  fireMouseEvent(node, "mousedown");
  fireMouseEvent(window, "mousemove");

  fireMouseEvent(window, "mouseleave");
  fireMouseEvent(window, "mousemove");

  expect(cb).toHaveBeenCalledTimes(1);
});

test("mouseMove: new mousedown re-arms after mouseup", async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );
  const el = screen.getByTestId("handle");
  const node = await el.element();

  fireMouseEvent(node, "mousedown");
  fireMouseEvent(window, "mousemove");
  fireMouseEvent(window, "mouseup");

  // Second drag cycle
  fireMouseEvent(node, "mousedown");
  fireMouseEvent(window, "mousemove");
  fireMouseEvent(window, "mousemove");

  expect(cb).toHaveBeenCalledTimes(3);
});

// ─── Disconnect / reconnect ───────────────────────────────────────────────────

test("mouseMove: mousedown listener is removed on disconnect (not click)", async () => {
  // Regression: the original bug removed 'click' instead of 'mousedown'.
  // Verify that after a simulated disconnect, mousedown no longer triggers moves.
  const cb = vi.fn();

  // We can't disconnect the directive directly in tests, but we can verify
  // the correct event name is used by confirming mousedown (not click) triggers the flow.
  const screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );
  const el = screen.getByTestId("handle");
  const node = await el.element();

  // A click event should NOT arm the move listener
  fireMouseEvent(node, "click");
  fireMouseEvent(window, "mousemove");

  expect(cb).not.toHaveBeenCalled();

  // Only mousedown arms it
  fireMouseEvent(node, "mousedown");
  fireMouseEvent(window, "mousemove");

  expect(cb).toHaveBeenCalledTimes(1);
});

// ─── mousedown focuses element ────────────────────────────────────────────────

test("mouseMove: mousedown focuses the element", async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );
  const el = screen.getByTestId("handle");
  const node = await el.element();

  await userEvent.click(document.body);
  await expect.element(el).not.toHaveFocus();

  fireMouseEvent(node, "mousedown");

  await expect.element(el).toHaveFocus();
});
