import type { ReactiveControllerHost } from 'lit';
import { html } from 'lit';
import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { ClickDelegateController, type ClickDelegateControllerOptions } from './clickDelegate.js';

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

interface Delegation {
  target: HTMLAnchorElement;
  onTargetClick: ReturnType<typeof vi.fn>;
  controller: ClickDelegateController;
}

function delegate(
  host: HostElement,
  options: Partial<ClickDelegateControllerOptions> = {},
): Delegation {
  const target = host.querySelector<HTMLAnchorElement>('[data-testid="target"]')!;
  const onTargetClick = vi.fn();

  target.addEventListener('click', onTargetClick);

  const controller = new ClickDelegateController(host, { target: () => target, ...options });

  controller.hostConnected();

  return { target, onTargetClick, controller };
}

test('forwards a plain click on dead space to the target and consumes it', async () => {
  const host = await renderHost();
  const { onTargetClick } = delegate(host);
  const deadSpace = host.querySelector('[data-testid="dead-space"]')!;
  const event = new MouseEvent('click', { bubbles: true, composed: true, cancelable: true });

  deadSpace.dispatchEvent(event);

  expect(onTargetClick).toHaveBeenCalledOnce();
  expect(event.defaultPrevented).toBe(true);
});

test('does nothing when the click already hit an interactive descendant', async () => {
  const host = await renderHost();
  const { onTargetClick } = delegate(host);

  click(host.querySelector('[data-testid="nested"]')!);

  expect(onTargetClick).not.toHaveBeenCalled();
});

test('respects a custom interactive selector', async () => {
  const host = await renderHost();
  const roleButton = document.createElement('span');

  roleButton.setAttribute('role', 'button');
  host.append(roleButton);

  const defaults = delegate(host);

  click(roleButton);
  expect(defaults.onTargetClick).not.toHaveBeenCalled();
  defaults.controller.hostDisconnected();

  const custom = delegate(host, { interactiveSelector: 'button' });

  click(roleButton);
  expect(custom.onTargetClick).toHaveBeenCalledOnce();
});

test('contenteditable=false does not make a descendant interactive', async () => {
  const host = await renderHost();
  const { onTargetClick } = delegate(host);
  const editable = document.createElement('span');

  editable.contentEditable = 'false';
  host.append(editable);
  click(editable);

  expect(onTargetClick).toHaveBeenCalledOnce();
});

test('ignores non-primary-button clicks rather than forwarding them', async () => {
  const host = await renderHost();
  const { onTargetClick } = delegate(host);

  click(host.querySelector('[data-testid="dead-space"]')!, { button: 1 });

  expect(onTargetClick).not.toHaveBeenCalled();
});

test.each(['altKey', 'ctrlKey', 'metaKey', 'shiftKey'] as const)(
  'ignores clicks qualified by %s',
  async (modifier) => {
    const host = await renderHost();
    const { onTargetClick } = delegate(host);

    click(host.querySelector('[data-testid="dead-space"]')!, { [modifier]: true });

    expect(onTargetClick).not.toHaveBeenCalled();
  },
);

test('does nothing without a target, or while disabled', async () => {
  const host = await renderHost();
  const deadSpace = host.querySelector('[data-testid="dead-space"]')!;
  const withoutTarget = delegate(host, { target: () => null });

  click(deadSpace);
  withoutTarget.controller.hostDisconnected();

  const whileDisabled = delegate(host, { disabled: () => true });

  click(deadSpace);

  expect(withoutTarget.onTargetClick).not.toHaveBeenCalled();
  expect(whileDisabled.onTargetClick).not.toHaveBeenCalled();
});

test('tears down delegation with the host lifecycle', async () => {
  const host = await renderHost();
  const { onTargetClick, controller } = delegate(host);
  const deadSpace = host.querySelector('[data-testid="dead-space"]')!;

  click(deadSpace);
  expect(onTargetClick).toHaveBeenCalledOnce();

  controller.hostDisconnected();
  click(deadSpace);
  expect(onTargetClick).toHaveBeenCalledOnce();
});
