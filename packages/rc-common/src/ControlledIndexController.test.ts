import { expect, test, vi } from 'vitest';

import { ControlledIndexController } from './ControlledIndexController.js';

function setup(normalize = (index: number) => index) {
  const host = Object.assign(new EventTarget(), { requestUpdate: vi.fn() });
  const changes: Array<{ index: number; trigger: 'button' | 'api' }> = [];
  const controller = new ControlledIndexController<'button' | 'api'>(host, {
    normalize,
    eventName: 'index-change',
  });

  host.addEventListener('index-change', (event) => {
    changes.push((event as CustomEvent<{ index: number; trigger: 'button' | 'api' }>).detail);
  });

  return { host, controller, changes };
}

test('host writes stay silent and releasing control uses the current default', () => {
  const { host, controller, changes } = setup();

  controller.setDefault(2);
  expect(controller.value).toBe(2);
  expect(host.requestUpdate).toHaveBeenCalledWith('activeIndex', 0);

  controller.setControlled(1);
  controller.setDefault(0);
  expect(controller.value).toBe(1);
  expect(controller.isControlled).toBe(true);
  expect(changes).toEqual([]);

  controller.setControlled(undefined);
  expect(controller.value).toBe(0);
  expect(controller.isControlled).toBe(false);
  expect(changes).toEqual([]);
});

test('requests report normalized indices without changing a controlled value', () => {
  const { host, controller, changes } = setup((index) => Math.min(2, Math.max(0, index)));

  controller.setControlled(0);
  host.requestUpdate.mockClear();

  expect(controller.request(5, 'button')).toBe(true);
  expect(controller.value).toBe(0);
  expect(host.requestUpdate).not.toHaveBeenCalled();
  expect(changes).toEqual([{ index: 2, trigger: 'button' }]);

  controller.setControlled(undefined);
  host.requestUpdate.mockClear();

  expect(controller.request(5, 'api')).toBe(true);
  expect(controller.value).toBe(2);
  expect(host.requestUpdate).toHaveBeenCalledWith('activeIndex', 0);
  expect(changes.at(-1)).toEqual({ index: 2, trigger: 'api' });
  expect(controller.request(5, 'api')).toBe(false);
  expect(changes).toHaveLength(2);
});
