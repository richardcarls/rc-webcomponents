import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';
import './define.ts';
import type { RCButton } from './rc-button.ts';

async function flushButton(host: RCButton): Promise<void> {
  await host.updateComplete;
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await host.updateComplete;
}

test('requires and preserves a direct native button child', async () => {
  const screen = render(html`
    <rc-button data-testid="host">
      <button type="submit" name="intent" value="save">Save</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  const button = host.querySelector('button');

  expect(button?.isConnected).toBe(true);
  expect(button?.type).toBe('submit');
  expect(button?.name).toBe('intent');
  expect(button?.value).toBe('save');
});

test('warns when the direct native button is missing', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const screen = render(html`<rc-button data-testid="host"><span>Save</span></rc-button>`);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  expect(warn).toHaveBeenCalledWith(
    '[rc-button] No direct child <button> found. Place a native <button> inside <rc-button>.',
  );

  warn.mockRestore();
});

test('warns instead of moving misplaced icon and label markers', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const screen = render(html`
    <rc-button data-testid="host">
      <span data-rc-button-icon aria-hidden="true">+</span>
      <span data-rc-button-label>Save</span>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  expect(warn).toHaveBeenCalledWith(
    '[rc-button] Place icon and label markers inside the direct child <button>; rc-button will not move author nodes.',
  );

  expect(host.querySelector('button')).toBeNull();
  warn.mockRestore();
});

test('disabled mirrors to the child button without removing author-owned disabled', async () => {
  const screen = render(html`
    <rc-button data-testid="host">
      <button type="button" disabled>Save</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);
  host.disabled = true;
  await flushButton(host);
  host.disabled = false;
  await flushButton(host);

  expect(host.querySelector('button')?.disabled).toBe(true);
});

test('disabled mirrors to and from the child button when host owns it', async () => {
  const screen = render(html`
    <rc-button data-testid="host">
      <button type="button">Save</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);
  host.disabled = true;
  await flushButton(host);
  expect(host.querySelector('button')?.disabled).toBe(true);

  host.disabled = false;
  await flushButton(host);
  expect(host.querySelector('button')?.disabled).toBe(false);
});

test('pending and progress expose busy state without clobbering author aria-busy', async () => {
  const screen = render(html`
    <rc-button data-testid="host">
      <button type="button" aria-busy="false">Save</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);
  host.pending = true;
  await flushButton(host);
  host.pending = false;
  host.progress = true;
  await flushButton(host);
  host.progress = false;
  await flushButton(host);

  expect(host.querySelector('button')?.getAttribute('aria-busy')).toBe('false');
});

test('pending blocks pointer activation while leaving the button focusable', async () => {
  const onClick = vi.fn();
  const screen = render(html`
    <rc-button data-testid="host" pending>
      <button type="button" @click=${onClick}>Save</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  const button = host.querySelector('button')!;

  button.click();

  expect(button.disabled).toBe(false);
  expect(button.getAttribute('aria-busy')).toBe('true');
  expect(onClick).not.toHaveBeenCalled();
});

test('progress blocks keyboard activation', async () => {
  const onKeyDown = vi.fn();
  const screen = render(html`
    <rc-button data-testid="host" progress>
      <button type="button" @keydown=${onKeyDown}>Save</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  const event = new KeyboardEvent('keydown', {
    key: 'Enter',
    bubbles: true,
    composed: true,
    cancelable: true,
  });

  host.querySelector('button')!.dispatchEvent(event);

  expect(event.defaultPrevented).toBe(true);
  expect(onKeyDown).not.toHaveBeenCalled();
});

test('reflects icon and label presence from immediate button children', async () => {
  const screen = render(html`
    <rc-button data-testid="host">
      <button type="button">
        <span data-rc-button-icon aria-hidden="true">+</span>
        <span data-rc-button-selected-icon aria-hidden="true">✓</span>
        <span data-rc-button-label>Save</span>
      </button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  expect(host.hasAttribute('has-icon')).toBe(true);
  expect(host.hasAttribute('has-selected-icon')).toBe(true);
  expect(host.hasAttribute('has-label')).toBe(true);
  expect(host.iconOnly).toBe(false);
});

test('updates child classification after mutations', async () => {
  const screen = render(html`
    <rc-button data-testid="host">
      <button type="button" aria-label="Create">
        <span data-rc-button-icon aria-hidden="true">+</span>
      </button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);
  expect(host.iconOnly).toBe(true);

  const label = document.createElement('span');

  label.setAttribute('data-rc-button-label', '');
  label.textContent = 'Create';
  host.querySelector('button')!.append(label);

  await flushButton(host);

  expect(host.hasAttribute('has-label')).toBe(true);
  expect(host.iconOnly).toBe(false);
});

test('renders state-layer and progress parts', async () => {
  const screen = render(html`
    <rc-button data-testid="host" progress>
      <button type="button">Save</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  expect(host.shadowRoot?.querySelector('[part="state-layer"]')).not.toBeNull();
  expect(host.shadowRoot?.querySelector('[part="progress"]')).not.toBeNull();
});

test('has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-button data-testid="host">
      <button type="button">
        <span data-rc-button-icon aria-hidden="true">+</span>
        <span data-rc-button-label>Save</span>
      </button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);
  await expectNoA11yViolations(host);
});
