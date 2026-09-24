import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { afterEach, expect, test, vi } from 'vitest';

import { FlowController } from './FlowController.js';

const cleanups: Array<() => void> = [];

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * A ResizeObserver always reports once after `observe()`, which re-resolves
 * the flow. Flip only after that, or the resize hides a missing observer.
 */
async function settle() {
  await nextFrame();
  await nextFrame();
}

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
});

function mountHost() {
  const parent = document.createElement('div');
  const el = document.createElement('div');
  const controllers: ReactiveController[] = [];
  const requestUpdate = vi.fn();
  const host = Object.assign(el, {
    addController: (controller: ReactiveController) => controllers.push(controller),
    removeController() {},
    requestUpdate,
    updateComplete: Promise.resolve(true),
  }) as unknown as ReactiveControllerHost & HTMLElement;

  parent.dir = 'ltr';
  parent.append(el);
  document.body.append(parent);

  const controller = new FlowController(host);
  const disconnect = () => controllers.forEach((c) => c.hostDisconnected?.());

  controllers.forEach((c) => c.hostConnected?.());

  cleanups.push(() => {
    disconnect();
    parent.remove();
  });

  return { parent, controller, requestUpdate, disconnect };
}

test('re-resolves and requests an update when an ancestor dir flips', async () => {
  const { parent, controller, requestUpdate } = mountHost();

  await settle();

  expect(controller.flow.rtl).toBe(false);

  requestUpdate.mockClear();

  // Same size before and after, so only the direction observer can notice.
  parent.dir = 'rtl';

  await vi.waitFor(() => expect(controller.flow.rtl).toBe(true));
  expect(controller.flow.inlineReversed).toBe(true);
  expect(requestUpdate).toHaveBeenCalledTimes(1);
});

test('stops following the direction once disconnected', async () => {
  const gone = mountHost();
  const witness = mountHost();

  await settle();
  gone.disconnect();
  gone.parent.dir = 'rtl';
  witness.parent.dir = 'rtl';

  // The witness proves the notice was delivered.
  await vi.waitFor(() => expect(witness.controller.flow.rtl).toBe(true));
  expect(gone.controller.flow.rtl).toBe(false);
});
