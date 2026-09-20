import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import './define.js';
import type { RCSwitch } from './rc-switch.js';

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

test('reduced motion shortens effects transitions but zeros spatial ones', async () => {
  // A real media-emulation test would need Playwright's emulateMedia, which
  // this harness does not currently expose to component tests. This
  // test proves the split by construction: track only
  // transitions background-color/border-color (effects) and shortens; the
  // icons only transition transform (spatial) and stay zeroed; the thumb
  // mixes both under one shared duration, so its background-color shortens
  // while its inline-size/block-size/transform drop to 0ms.
  const { switchStyles } = await import('./rc-switch.styles.js');
  const css = switchStyles.cssText;

  expect(css).toContain('@media (prefers-reduced-motion: reduce)');

  const motionBlock = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));

  expect(motionBlock).toContain('transition-duration: 50ms;');
  expect(motionBlock).toContain('background-color 50ms');
  expect(motionBlock).toContain('inline-size 0ms');
  expect(motionBlock).toContain('block-size 0ms');
  expect(motionBlock).toContain('transform 0ms');
  expect(motionBlock).toContain('transition-duration: 0ms;');
});
