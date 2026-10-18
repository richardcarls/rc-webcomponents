import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import { inFlow } from '../../../test-helpers/flow.js';
import './define.js';
import type { RCPopover } from './rc-popover.js';

async function setup() {
  const screen = render(html`
    <rc-popover data-testid="host">
      <button slot="trigger" type="button" data-testid="trigger" popovertarget="test-panel">
        Help
      </button>
      <section
        slot="content"
        id="test-panel"
        popover
        role="dialog"
        aria-label="Help"
        data-testid="panel"
      >
        <button type="button" data-testid="action">Action</button>
      </section>
    </rc-popover>
  `);
  const host = (await screen.getByTestId('host').element()) as RCPopover;
  const trigger = (await screen.getByTestId('trigger').element()) as HTMLButtonElement;
  const panel = (await screen.getByTestId('panel').element()) as HTMLElement;
  const action = (await screen.getByTestId('action').element()) as HTMLButtonElement;

  await host.updateComplete;
  await new Promise<void>((resolve) => queueMicrotask(resolve));

  return { screen, host, trigger, panel, action };
}

test('click opens an authored surface, preserves semantics, and Escape returns focus', async () => {
  const { host, trigger, panel, action } = await setup();
  const toggles: boolean[] = [];

  host.addEventListener('rc-popover-toggle', (event) => toggles.push(event.detail.open));
  trigger.click();
  await vi.waitFor(() => expect(host.open).toBe(true));
  expect(panel.matches(':popover-open')).toBe(true);
  expect(panel.getAttribute('role')).toBe('dialog');
  expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
  expect(trigger.getAttribute('aria-expanded')).toBe('true');

  action.focus();

  action.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }),
  );

  await vi.waitFor(() => expect(host.open).toBe(false));
  expect(panel.matches(':popover-open')).toBe(false);
  expect(document.activeElement).toBe(trigger);
  expect(toggles).toEqual([true, false]);
});

test('controlled writes are silent and user activation requests host control', async () => {
  const { host, trigger } = await setup();
  const toggles: boolean[] = [];

  host.addEventListener('rc-popover-toggle', (event) => toggles.push(event.detail.open));
  host.open = true;
  await host.updateComplete;
  expect(toggles).toEqual([]);
  expect(host.open).toBe(true);

  trigger.click();
  expect(toggles).toEqual([false]);
  expect(host.open).toBe(true);

  host.open = false;
  await host.updateComplete;
  expect(host.open).toBe(false);
  expect(toggles).toEqual([false]);
});

test('missing native Popover API uses the shared fallback marker', async () => {
  const { host, trigger, panel } = await setup();

  Object.defineProperty(panel, 'showPopover', { configurable: true, value: undefined });
  Object.defineProperty(panel, 'hidePopover', { configurable: true, value: undefined });
  trigger.click();
  await vi.waitFor(() => expect(host.open).toBe(true));
  expect(panel).toHaveAttribute('data-rc-popover-fallback-open');
  expect(getComputedStyle(panel).display).not.toBe('none');

  trigger.click();
  await vi.waitFor(() => expect(host.open).toBe(false));
  expect(panel).not.toHaveAttribute('data-rc-popover-fallback-open');
});

test('rejected native opening falls back and an outside pointer dismisses', async () => {
  const { host, trigger, panel } = await setup();

  Object.defineProperty(panel, 'showPopover', {
    configurable: true,
    value: () => {
      throw new DOMException('rejected', 'InvalidStateError');
    },
  });

  trigger.click();
  await vi.waitFor(() => expect(panel).toHaveAttribute('data-rc-popover-fallback-open'));

  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  await vi.waitFor(() => expect(host.open).toBe(false));
  expect(panel).not.toHaveAttribute('data-rc-popover-fallback-open');
});

test('default-open initializes uncontrolled state before user interaction', async () => {
  const { host, trigger } = await setup();

  host.defaultOpen = true;
  await host.updateComplete;
  expect(host.open).toBe(true);

  trigger.click();
  await vi.waitFor(() => expect(host.open).toBe(false));
  host.defaultOpen = true;
  await host.updateComplete;
  expect(host.open).toBe(false);
});

test('hover and focus keep the panel open while interacting with its action', async () => {
  const { host, trigger, panel, action } = await setup();

  host.triggerAction = 'none';
  host.openOnHover = true;
  host.openOnFocus = true;
  await host.updateComplete;

  trigger.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
  await vi.waitFor(() => expect(host.open).toBe(true));

  trigger.dispatchEvent(
    new PointerEvent('pointerout', { bubbles: true, pointerType: 'mouse', relatedTarget: panel }),
  );

  panel.dispatchEvent(
    new PointerEvent('pointerover', {
      bubbles: true,
      pointerType: 'mouse',
      relatedTarget: trigger,
    }),
  );

  action.focus();
  expect(host.open).toBe(true);

  panel.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, pointerType: 'mouse' }));
  expect(host.open).toBe(true);
  action.blur();
  await vi.waitFor(() => expect(host.open).toBe(false));
});

test('restores consumer attributes on disconnect', async () => {
  const { host, trigger, panel } = await setup();
  const container = host.parentElement;

  expect(container).not.toBeNull();

  expect(trigger).not.toHaveAttribute('popovertarget');
  expect(panel.getAttribute('popover')).toBe('manual');
  host.remove();
  expect(trigger.getAttribute('popovertarget')).toBe('test-panel');
  expect(trigger).not.toHaveAttribute('aria-expanded');
  expect(panel.getAttribute('popover')).toBe('');
  container?.append(host);
  await host.updateComplete;
  expect(trigger).not.toHaveAttribute('popovertarget');
});

test('open named interactive surface has no automated accessibility violations', async () => {
  const { host, trigger } = await setup();

  trigger.click();
  await vi.waitFor(() => expect(host.open).toBe(true));
  await expectNoA11yViolations(host);
});

test('logical placement responds to a runtime ancestor direction change', async () => {
  const screen = render(
    inFlow(
      html`
        <rc-popover data-testid="host" placement="block-end-start">
          <button slot="trigger" type="button" data-testid="trigger">Details</button>
          <section slot="content" role="dialog" aria-label="Details" data-testid="panel">
            More details
          </section>
        </rc-popover>
      `,
      { dir: 'rtl', writingMode: 'horizontal-tb' },
    ),
  );
  const flow = (await screen.getByTestId('flow').element()) as HTMLElement;
  const host = (await screen.getByTestId('host').element()) as RCPopover;
  const trigger = (await screen.getByTestId('trigger').element()) as HTMLElement;
  const panel = (await screen.getByTestId('panel').element()) as HTMLElement;

  await host.updateComplete;
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  trigger.click();

  await vi.waitFor(() => {
    expect(panel.getBoundingClientRect().right).toBeCloseTo(
      trigger.getBoundingClientRect().right,
      0,
    );
  });

  flow.dir = 'ltr';

  await vi.waitFor(() => {
    expect(panel.getBoundingClientRect().left).toBeCloseTo(trigger.getBoundingClientRect().left, 0);
  });
});
