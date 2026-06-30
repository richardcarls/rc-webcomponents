import type { ReactiveControllerHost } from 'lit';
import { html } from 'lit';
import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import {
  NativeChildController,
  getDirectChild,
  getDirectChildren,
  warnMissingDirectChild,
} from './nativeChild';

type HostElement = ReactiveControllerHost & HTMLElement;

async function renderHost(): Promise<HostElement> {
  const screen = render(html`
    <section data-testid="host">
      <button type="button" data-testid="direct"></button>
      <span><button type="button" data-testid="nested"></button></span>
    </section>
  `);
  const host = (await screen.getByTestId('host').element()) as HostElement;

  host.addController = () => {};
  host.removeController = () => {};
  host.requestUpdate = () => {};
  Object.defineProperty(host, 'updateComplete', {
    configurable: true,
    value: Promise.resolve(true),
  });

  return host;
}

test('getDirectChild scopes selector to direct children', async () => {
  const host = await renderHost();

  expect(getDirectChild<HTMLButtonElement>(host, ':scope > button')).toBe(
    await host.querySelector('[data-testid="direct"]'),
  );
});

test('getDirectChildren returns matching direct children', async () => {
  const host = await renderHost();

  expect(getDirectChildren<HTMLButtonElement>(host, ':scope > button')).toHaveLength(1);
});

test('warnMissingDirectChild reports a standard warning', async () => {
  const host = await renderHost();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  const warned = warnMissingDirectChild(host, {
    selector: ':scope > input',
    childDescription: 'native <input>',
    hostName: 'test-host',
  });

  expect(warned).toBe(true);
  expect(warn).toHaveBeenCalledWith(
    '[test-host] No direct child native <input> found. Place native <input> inside <test-host>.',
    host,
  );

  warn.mockRestore();
});

test('warnMissingDirectChild can require multiple direct children', async () => {
  const host = await renderHost();
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  const warned = warnMissingDirectChild(host, {
    selector: ':scope > button',
    minimum: 2,
    message: 'Need two direct buttons.',
  });

  expect(warned).toBe(true);
  expect(warn).toHaveBeenCalledWith('Need two direct buttons.', host);

  warn.mockRestore();
});

test('NativeChildController syncs and reports child replacement', async () => {
  const host = await renderHost();
  const onChange = vi.fn();
  const controller = new NativeChildController<HTMLButtonElement>(host, {
    selector: ':scope > button',
    onChange,
  });

  const first = controller.sync();
  const second = document.createElement('button');

  first?.replaceWith(second);

  expect(controller.sync()).toBe(second);
  expect(onChange).toHaveBeenNthCalledWith(1, first, null);
  expect(onChange).toHaveBeenNthCalledWith(2, second, first);
});

test('NativeChildController observes light-DOM child changes when enabled', async () => {
  const host = await renderHost();
  const onChange = vi.fn();
  const controller = new NativeChildController<HTMLButtonElement>(host, {
    selector: ':scope > button',
    observe: true,
    onChange,
  });

  controller.hostConnected();

  const first = controller.child;
  const second = document.createElement('button');
  first?.replaceWith(second);

  await vi.waitFor(() => expect(controller.child).toBe(second));
  expect(onChange).toHaveBeenLastCalledWith(second, first);

  controller.hostDisconnected();
});
