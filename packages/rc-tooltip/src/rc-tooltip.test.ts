import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import './define.js';
import type { RCTooltip } from './rc-tooltip.js';

async function settle(host: RCTooltip): Promise<void> {
  await host.updateComplete;
  await new Promise<void>((resolve) => queueMicrotask(resolve));
}

function pointer(
  type: 'pointerover' | 'pointerout',
  relatedTarget?: EventTarget | null,
): PointerEvent {
  return new PointerEvent(type, {
    bubbles: true,
    composed: true,
    pointerType: 'mouse',
    relatedTarget,
  });
}

test('focus opens the tooltip and describes the trigger without moving focus', async () => {
  const screen = render(html`
    <rc-tooltip data-testid="host">
      <button slot="trigger" data-testid="trigger">Save</button>
      <span slot="content" data-testid="content">Save your changes</span>
    </rc-tooltip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCTooltip;
  const trigger = (await screen.getByTestId('trigger').element()) as HTMLButtonElement;
  const content = (await screen.getByTestId('content').element()) as HTMLElement;

  await settle(host);
  trigger.focus();

  await vi.waitFor(() => expect(host).toHaveAttribute('open'));
  expect(document.activeElement).toBe(trigger);
  expect(content.getAttribute('role')).toBe('tooltip');
  expect(content.id).toBeTruthy();
  expect(trigger.getAttribute('aria-describedby')?.split(/\s+/)).toContain(content.id);
  expect(content.hidden).toBe(false);
});

test('pointer hover stays open while moving from trigger to content', async () => {
  const screen = render(html`
    <rc-tooltip data-testid="host">
      <button slot="trigger" data-testid="trigger">More</button>
      <span slot="content" data-testid="content">Additional information</span>
    </rc-tooltip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCTooltip;
  const trigger = (await screen.getByTestId('trigger').element()) as HTMLElement;
  const content = (await screen.getByTestId('content').element()) as HTMLElement;

  await settle(host);
  trigger.dispatchEvent(pointer('pointerover'));
  await vi.waitFor(() => expect(host).toHaveAttribute('open'));

  trigger.dispatchEvent(pointer('pointerout', content));
  content.dispatchEvent(pointer('pointerover', trigger));
  expect(host).toHaveAttribute('open');

  content.dispatchEvent(pointer('pointerout'));
  await vi.waitFor(() => expect(host).not.toHaveAttribute('open'));
});

test('Escape dismisses without moving focus and a fresh focus reopens', async () => {
  const screen = render(html`
    <rc-tooltip data-testid="host">
      <button slot="trigger" data-testid="trigger">Help</button>
      <span slot="content">Keyboard help</span>
    </rc-tooltip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCTooltip;
  const trigger = (await screen.getByTestId('trigger').element()) as HTMLButtonElement;

  await settle(host);
  trigger.focus();
  await vi.waitFor(() => expect(host).toHaveAttribute('open'));

  trigger.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }),
  );

  await vi.waitFor(() => expect(host).not.toHaveAttribute('open'));
  expect(document.activeElement).toBe(trigger);

  trigger.blur();
  trigger.focus();
  await vi.waitFor(() => expect(host).toHaveAttribute('open'));
});

test('Escape stops before reaching a containing escape handler', async () => {
  const screen = render(html`
    <div data-testid="parent">
      <rc-tooltip data-testid="host">
        <button slot="trigger" data-testid="trigger">Help</button>
        <span slot="content">Keyboard help</span>
      </rc-tooltip>
    </div>
  `);
  const parent = (await screen.getByTestId('parent').element()) as HTMLElement;
  const host = (await screen.getByTestId('host').element()) as RCTooltip;
  const trigger = (await screen.getByTestId('trigger').element()) as HTMLButtonElement;
  let parentEscapeCount = 0;

  parent.addEventListener('keydown', () => {
    parentEscapeCount += 1;
  });

  await settle(host);
  trigger.focus();
  await vi.waitFor(() => expect(host).toHaveAttribute('open'));

  trigger.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }),
  );

  await vi.waitFor(() => expect(host).not.toHaveAttribute('open'));
  expect(parentEscapeCount).toBe(0);
  expect(document.activeElement).toBe(trigger);
});

test('falls back to hidden state when Popover methods are unavailable', async () => {
  const screen = render(html`
    <rc-tooltip data-testid="host">
      <button slot="trigger" data-testid="trigger">Info</button>
      <span slot="content" data-testid="content">Fallback text</span>
    </rc-tooltip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCTooltip;
  const trigger = (await screen.getByTestId('trigger').element()) as HTMLButtonElement;
  const content = (await screen.getByTestId('content').element()) as HTMLElement;

  Object.defineProperty(content, 'showPopover', { configurable: true, value: undefined });
  Object.defineProperty(content, 'hidePopover', { configurable: true, value: undefined });

  await settle(host);
  trigger.focus();
  await vi.waitFor(() => expect(host).toHaveAttribute('open'));
  expect(content.hidden).toBe(false);

  trigger.blur();
  await vi.waitFor(() => expect(content).toHaveAttribute('hidden'));
});

test('restores author content and trigger attributes on disconnect and reconnects cleanly', async () => {
  const screen = render(html`
    <rc-tooltip data-testid="host">
      <button slot="trigger" data-testid="trigger" aria-describedby="author-description">
        Settings
      </button>
      <span slot="content" data-testid="content">Settings help</span>
    </rc-tooltip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCTooltip;
  const trigger = (await screen.getByTestId('trigger').element()) as HTMLButtonElement;
  const content = (await screen.getByTestId('content').element()) as HTMLElement;
  const container = screen.container;

  await settle(host);
  trigger.focus();
  await vi.waitFor(() => expect(host).toHaveAttribute('open'));

  host.remove();
  expect(trigger.getAttribute('aria-describedby')).toBe('author-description');
  expect(content.id).toBe('');
  expect(content.getAttribute('role')).toBeNull();
  expect(content.getAttribute('popover')).toBeNull();

  container.append(host);
  await settle(host);
  expect(host).not.toHaveAttribute('open');
  expect(content).toHaveAttribute('hidden');
  trigger.focus();
  await vi.waitFor(() => expect(host).toHaveAttribute('open'));
});

test('has no automated accessibility violations while visible', async () => {
  const screen = render(html`
    <rc-tooltip data-testid="host">
      <button slot="trigger">Delete</button>
      <span slot="content">Delete the selected item</span>
    </rc-tooltip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCTooltip;
  const trigger = host.querySelector<HTMLElement>(':scope > [slot="trigger"]');

  if (!trigger) {
    throw new Error('Expected a tooltip trigger');
  }

  await settle(host);
  trigger.focus();
  await vi.waitFor(() => expect(host).toHaveAttribute('open'));
  await expectNoA11yViolations(host);
});
