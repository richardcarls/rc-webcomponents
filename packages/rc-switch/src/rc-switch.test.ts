import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';
import './define';
import type { RCSwitch } from './rc-switch';

async function flushSwitch(host: RCSwitch): Promise<void> {
  await host.updateComplete;
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await host.updateComplete;
}

test('preserves a direct native checkbox with author attributes', async () => {
  const screen = render(html`
    <rc-switch data-testid="host">
      <input id="notify" name="notify" type="checkbox" value="yes" required />
    </rc-switch>
    <label for="notify">Notifications</label>
  `);
  const host = (await screen.getByTestId('host').element()) as RCSwitch;

  await flushSwitch(host);

  const input = host.querySelector('input')!;
  const label = document.querySelector('label')!;

  expect(input.isConnected).toBe(true);
  expect(input.name).toBe('notify');
  expect(input.value).toBe('yes');
  expect(input.required).toBe(true);
  expect(label.control).toBe(input);
  expect(input.getAttribute('role')).toBe('switch');
});

test('checked host writes are silent and sync to the native checkbox', async () => {
  const listener = vi.fn();
  const screen = render(html`
    <rc-switch data-testid="host">
      <input type="checkbox" />
    </rc-switch>
  `);
  const host = (await screen.getByTestId('host').element()) as RCSwitch;

  host.addEventListener('rc-switch-change', listener);

  await flushSwitch(host);
  host.checked = true;
  await flushSwitch(host);

  expect(host.querySelector('input')?.checked).toBe(true);
  expect(listener).not.toHaveBeenCalled();
});

test('user changes dispatch rc-switch-change', async () => {
  const listener = vi.fn();
  const screen = render(html`
    <rc-switch data-testid="host">
      <input type="checkbox" />
    </rc-switch>
  `);
  const host = (await screen.getByTestId('host').element()) as RCSwitch;
  const input = host.querySelector('input')!;

  host.addEventListener('rc-switch-change', listener);

  await flushSwitch(host);
  await userEvent.click(input);

  expect(host.checked).toBe(true);
  expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { checked: true } }));
});

test('disabled mirrors to and from the native checkbox when host owns it', async () => {
  const screen = render(html`
    <rc-switch data-testid="host">
      <input type="checkbox" />
    </rc-switch>
  `);
  const host = (await screen.getByTestId('host').element()) as RCSwitch;

  await flushSwitch(host);
  host.disabled = true;
  await flushSwitch(host);
  expect(host.querySelector('input')?.disabled).toBe(true);

  host.disabled = false;
  await flushSwitch(host);
  expect(host.querySelector('input')?.disabled).toBe(false);
});

test('has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-switch data-testid="host">
      <input id="switch-a11y" type="checkbox" aria-label="Dark mode" />
    </rc-switch>
  `);
  const host = (await screen.getByTestId('host').element()) as RCSwitch;

  await flushSwitch(host);
  await expectNoA11yViolations(host);
});
