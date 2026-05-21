import { html } from 'lit';
import type { ReactiveControllerHost } from 'lit';
import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { ScrollObserverController } from './ScrollObserverController';

type FakeHost = ReactiveControllerHost & { updates: number };

// Controllers only use addController/requestUpdate; lifecycle is driven
// manually so the controller can be tested without defining a host element.
function createHost(): FakeHost {
  const host = {
    updates: 0,
    addController() {},
    removeController() {},
    requestUpdate() {
      host.updates += 1;
    },
    updateComplete: Promise.resolve(true),
  };

  return host;
}

async function renderScrollContainer(): Promise<HTMLElement> {
  const screen = render(html`
    <div data-testid="sc" style="height: 100px; overflow-y: auto;">
      <div style="height: 1000px;"></div>
    </div>
  `);

  return (await screen.getByTestId('sc').element()) as HTMLElement;
}

// Headless Firefox only flushes natively-queued scroll events on refresh
// ticks, which stall without paint activity. Dispatching the event after
// moving scrollTop makes delivery deterministic in both browsers while
// still exercising the listener wiring and evaluation logic.
function scrollTo(el: HTMLElement, top: number): void {
  el.scrollTop = top;
  el.dispatchEvent(new Event('scroll'));
}

// Firefox quantizes scrollTop to fractional device pixels (50 can read back
// as 50.36…), so scroll offsets are asserted with closeTo.
function expectChange(cb: ReturnType<typeof vi.fn>, scrolled: boolean, scrollTop: number) {
  expect(cb).toHaveBeenCalledWith(scrolled, expect.closeTo(scrollTop, 0));
}

test('fires onChange(true) once when crossing the threshold', async () => {
  const sc = await renderScrollContainer();
  const cb = vi.fn();
  const ctl = new ScrollObserverController(createHost(), { target: sc, onChange: cb });
  ctl.hostConnected();

  scrollTo(sc, 50);
  expectChange(cb, true, 50);

  scrollTo(sc, 80);

  expect(cb).toHaveBeenCalledTimes(1);
  expect(ctl.scrolled).toBe(true);

  ctl.hostDisconnected();
});

test('fires onChange(false) when scrolling back above the threshold', async () => {
  const sc = await renderScrollContainer();
  const cb = vi.fn();
  const ctl = new ScrollObserverController(createHost(), { target: sc, onChange: cb });
  ctl.hostConnected();

  scrollTo(sc, 50);
  expectChange(cb, true, 50);

  scrollTo(sc, 0);
  expectChange(cb, false, 0);

  expect(cb).toHaveBeenCalledTimes(2);
  expect(ctl.scrolled).toBe(false);

  ctl.hostDisconnected();
});

test('below-threshold offsets do not set scrolled', async () => {
  const sc = await renderScrollContainer();
  const cb = vi.fn();
  const ctl = new ScrollObserverController(createHost(), {
    target: sc,
    threshold: 10,
    onChange: cb,
  });
  ctl.hostConnected();

  scrollTo(sc, 9);

  expect(cb).not.toHaveBeenCalled();
  expect(ctl.scrolled).toBe(false);

  ctl.hostDisconnected();
});

test('repeated scroll events produce a single flip callback', async () => {
  const sc = await renderScrollContainer();
  const cb = vi.fn();
  const ctl = new ScrollObserverController(createHost(), { target: sc, onChange: cb });
  ctl.hostConnected();

  // Every event is evaluated, but only the flip reports.
  scrollTo(sc, 50);
  sc.dispatchEvent(new Event('scroll'));
  sc.dispatchEvent(new Event('scroll'));

  expect(cb).toHaveBeenCalledTimes(1);

  ctl.hostDisconnected();
});

test('setOptions retargets the listener to a new container', async () => {
  const first = await renderScrollContainer();
  const second = await renderScrollContainer();
  const cb = vi.fn();
  const ctl = new ScrollObserverController(createHost(), { target: first, onChange: cb });
  ctl.hostConnected();

  ctl.setOptions({ target: second });

  scrollTo(first, 50);
  expect(cb).not.toHaveBeenCalled();

  scrollTo(second, 50);
  expectChange(cb, true, 50);

  ctl.hostDisconnected();
});

test('disabled silences callbacks; re-enabling re-evaluates the position', async () => {
  const sc = await renderScrollContainer();
  const cb = vi.fn();
  const ctl = new ScrollObserverController(createHost(), {
    target: sc,
    onChange: cb,
    disabled: true,
  });
  ctl.hostConnected();

  scrollTo(sc, 50);
  expect(cb).not.toHaveBeenCalled();

  // Re-enable while already scrolled: attach evaluates immediately.
  ctl.setOptions({ disabled: false });
  expectChange(cb, true, 50);

  ctl.hostDisconnected();
});

test('already-scrolled target fires the initial onChange at attach', async () => {
  const sc = await renderScrollContainer();
  sc.scrollTop = 50;

  const cb = vi.fn();
  const ctl = new ScrollObserverController(createHost(), { target: sc, onChange: cb });
  ctl.hostConnected();

  expectChange(cb, true, 50);
  expect(ctl.scrolled).toBe(true);

  ctl.hostDisconnected();
});

test('hostDisconnected detaches the listener cleanly', async () => {
  const sc = await renderScrollContainer();
  const cb = vi.fn();
  const ctl = new ScrollObserverController(createHost(), { target: sc, onChange: cb });
  ctl.hostConnected();
  ctl.hostDisconnected();

  scrollTo(sc, 50);

  expect(cb).not.toHaveBeenCalled();
});

test('null target and getter targets are handled without errors', async () => {
  const sc = await renderScrollContainer();
  const cb = vi.fn();

  const inert = new ScrollObserverController(createHost(), { target: null, onChange: cb });
  inert.hostConnected();
  inert.hostDisconnected();
  expect(cb).not.toHaveBeenCalled();

  const viaGetter = new ScrollObserverController(createHost(), {
    target: () => sc,
    onChange: cb,
  });
  viaGetter.hostConnected();

  scrollTo(sc, 50);
  expectChange(cb, true, 50);

  viaGetter.hostDisconnected();
});

test('requestUpdate is called on the host when the state flips', async () => {
  const sc = await renderScrollContainer();
  const host = createHost();
  const ctl = new ScrollObserverController(host, { target: sc });
  ctl.hostConnected();

  scrollTo(sc, 50);

  expect(host.updates).toBe(1);
  expect(ctl.scrolled).toBe(true);

  ctl.hostDisconnected();
});
