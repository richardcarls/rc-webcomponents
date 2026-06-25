import type { ReactiveControllerHost } from 'lit';
import { test, expect, vi } from 'vitest';

import { MutationObserverController } from './MutationObserverController';

type FakeHost = ReactiveControllerHost & { controllers: unknown[] };

function createHost(): FakeHost {
  const host: FakeHost = {
    controllers: [],
    addController(controller) {
      host.controllers.push(controller);
    },
    removeController() {},
    requestUpdate() {},
    updateComplete: Promise.resolve(true),
  };

  return host;
}

test('observes mutations on connect', async () => {
  const target = document.createElement('div');
  const callback = vi.fn();
  const controller = new MutationObserverController(createHost(), {
    target,
    callback,
  });

  controller.hostConnected();
  target.append(document.createElement('span'));

  await vi.waitFor(() => expect(callback).toHaveBeenCalled());

  controller.hostDisconnected();
});

test('disconnects on hostDisconnected', async () => {
  const target = document.createElement('div');
  const callback = vi.fn();
  const controller = new MutationObserverController(createHost(), {
    target,
    callback,
  });

  controller.hostConnected();
  controller.hostDisconnected();
  target.append(document.createElement('span'));
  await Promise.resolve();

  expect(callback).not.toHaveBeenCalled();
});

test('setOptions retargets observation', async () => {
  const first = document.createElement('div');
  const second = document.createElement('div');
  const callback = vi.fn();
  const controller = new MutationObserverController(createHost(), {
    target: first,
    callback,
  });

  controller.hostConnected();
  controller.setOptions({ target: second });

  first.append(document.createElement('span'));
  await Promise.resolve();
  expect(callback).not.toHaveBeenCalled();

  second.append(document.createElement('span'));
  await vi.waitFor(() => expect(callback).toHaveBeenCalled());

  controller.hostDisconnected();
});
