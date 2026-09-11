import type { ReactiveControllerHost } from 'lit';
import { html } from 'lit';
import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import {
  ClickDelegateController,
  delegateClickTo,
  isEventFromInteractiveDescendant,
} from './clickDelegate.js';

type HostElement = ReactiveControllerHost & HTMLElement;

async function renderHost(): Promise<HostElement> {
  const screen = render(html`
    <section data-testid="host">
      <a data-testid="target" href="/pie">Apple pie</a>
      <button type="button" data-testid="nested">Nested</button>
      <p data-testid="dead-space">Dead space</p>
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

  // The target is a real, navigable <a href> — guard every test against an
  // actual navigation (which breaks the whole browser-mode test run, not
  // just the one assertion) regardless of what each test's own click spy
  // does. Real assertions read `onTargetClick`, added separately per test.
  host
    .querySelector('[data-testid="target"]')
    ?.addEventListener('click', (e) => e.preventDefault());

  return host;
}

function click(el: Element, init: MouseEventInit = {}): void {
  el.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      composed: true,
      cancelable: true,
      button: 0,
      ...init,
    }),
  );
}

/**
 * `Event.composedPath()` only reflects the live propagation path while the
 * event is actually dispatching — it reads back empty once `dispatchEvent`
 * has returned. So, like the real call sites in `ClickDelegateController`
 * and both components, these tests must read it from inside a listener
 * attached before `click()` runs, not from a captured event afterward.
 */
function clickAndCapture<T>(
  el: Element,
  host: Element,
  compute: (event: MouseEvent) => T,
  init: MouseEventInit = {},
): T {
  let result!: T;

  const listener = (e: Event): void => {
    result = compute(e as MouseEvent);
  };

  host.addEventListener('click', listener);
  click(el, init);
  host.removeEventListener('click', listener);

  return result;
}

test('isEventFromInteractiveDescendant is false for a click on plain dead space', async () => {
  const host = await renderHost();
  const deadSpace = host.querySelector('[data-testid="dead-space"]')!;

  const result = clickAndCapture(deadSpace, host, (event) =>
    isEventFromInteractiveDescendant(event, host),
  );

  expect(result).toBe(false);
});

test('isEventFromInteractiveDescendant is true for a click on an interactive descendant', async () => {
  const host = await renderHost();
  const nested = host.querySelector('[data-testid="nested"]')!;

  const result = clickAndCapture(nested, host, (event) =>
    isEventFromInteractiveDescendant(event, host),
  );

  expect(result).toBe(true);
});

test('isEventFromInteractiveDescendant respects a custom selector', async () => {
  const host = await renderHost();
  const target = host.querySelector('[data-testid="target"]')!;

  const result = clickAndCapture(target, host, (event) =>
    isEventFromInteractiveDescendant(event, host, { interactiveSelector: 'button' }),
  );

  expect(result).toBe(false);
});

test('contenteditable=false does not make a descendant interactive', async () => {
  const host = await renderHost();
  const editable = document.createElement('span');

  editable.contentEditable = 'false';
  host.append(editable);

  const result = clickAndCapture(editable, host, (event) =>
    isEventFromInteractiveDescendant(event, host),
  );

  expect(result).toBe(false);
});

test('delegateClickTo forwards a plain click on dead space to the target', async () => {
  const host = await renderHost();
  const target = host.querySelector<HTMLAnchorElement>('[data-testid="target"]')!;
  const deadSpace = host.querySelector('[data-testid="dead-space"]')!;
  const onTargetClick = vi.fn();

  target.addEventListener('click', onTargetClick);

  const result = clickAndCapture(deadSpace, host, (event) => delegateClickTo(event, host, target));

  expect(result).toBe(true);
  expect(onTargetClick).toHaveBeenCalledOnce();
});

test('delegateClickTo does nothing when the click already hit an interactive descendant', async () => {
  const host = await renderHost();
  const target = host.querySelector<HTMLAnchorElement>('[data-testid="target"]')!;
  const nested = host.querySelector('[data-testid="nested"]')!;
  const onTargetClick = vi.fn();

  target.addEventListener('click', onTargetClick);

  const result = clickAndCapture(nested, host, (event) => delegateClickTo(event, host, target));

  expect(result).toBe(false);
  expect(onTargetClick).not.toHaveBeenCalled();
});

test('delegateClickTo ignores non-primary-button clicks rather than forwarding them', async () => {
  const host = await renderHost();
  const target = host.querySelector<HTMLAnchorElement>('[data-testid="target"]')!;
  const deadSpace = host.querySelector('[data-testid="dead-space"]')!;
  const onTargetClick = vi.fn();

  target.addEventListener('click', onTargetClick);

  const result = clickAndCapture(deadSpace, host, (event) => delegateClickTo(event, host, target), {
    button: 1,
  });

  expect(result).toBe(false);
  expect(onTargetClick).not.toHaveBeenCalled();
});

test.each(['altKey', 'ctrlKey', 'metaKey', 'shiftKey'] as const)(
  'delegateClickTo ignores clicks qualified by %s',
  async (modifier) => {
    const host = await renderHost();
    const target = host.querySelector<HTMLAnchorElement>('[data-testid="target"]')!;
    const deadSpace = host.querySelector('[data-testid="dead-space"]')!;
    const onTargetClick = vi.fn();

    target.addEventListener('click', onTargetClick);

    const result = clickAndCapture(
      deadSpace,
      host,
      (event) => delegateClickTo(event, host, target),
      { [modifier]: true },
    );

    expect(result).toBe(false);
    expect(onTargetClick).not.toHaveBeenCalled();
  },
);

test('delegateClickTo does nothing without a target, or while disabled', async () => {
  const host = await renderHost();
  const target = host.querySelector<HTMLAnchorElement>('[data-testid="target"]')!;
  const deadSpace = host.querySelector('[data-testid="dead-space"]')!;
  const onTargetClick = vi.fn();

  target.addEventListener('click', onTargetClick);

  const withoutTarget = clickAndCapture(deadSpace, host, (event) =>
    delegateClickTo(event, host, null),
  );
  const whileDisabled = clickAndCapture(deadSpace, host, (event) =>
    delegateClickTo(event, host, target, { disabled: true }),
  );

  expect(withoutTarget).toBe(false);
  expect(whileDisabled).toBe(false);
  expect(onTargetClick).not.toHaveBeenCalled();
});

test('ClickDelegateController wires and tears down delegation with the host lifecycle', async () => {
  const host = await renderHost();
  const target = host.querySelector<HTMLAnchorElement>('[data-testid="target"]')!;
  const deadSpace = host.querySelector('[data-testid="dead-space"]')!;
  const onTargetClick = vi.fn();

  target.addEventListener('click', onTargetClick);

  const controller = new ClickDelegateController(host, { target: () => target });

  controller.hostConnected();
  click(deadSpace);
  expect(onTargetClick).toHaveBeenCalledOnce();

  controller.hostDisconnected();
  click(deadSpace);
  expect(onTargetClick).toHaveBeenCalledOnce();
});

test('ClickDelegateController respects a disabled getter', async () => {
  const host = await renderHost();
  const target = host.querySelector<HTMLAnchorElement>('[data-testid="target"]')!;
  const deadSpace = host.querySelector('[data-testid="dead-space"]')!;
  const onTargetClick = vi.fn();

  target.addEventListener('click', onTargetClick);

  const controller = new ClickDelegateController(host, {
    target: () => target,
    disabled: () => true,
  });

  controller.hostConnected();
  click(deadSpace);

  expect(onTargetClick).not.toHaveBeenCalled();
});
