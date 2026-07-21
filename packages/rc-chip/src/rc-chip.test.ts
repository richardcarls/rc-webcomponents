import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';
import './define';
import type { RCChip } from './rc-chip';

async function flushChip(host: RCChip): Promise<void> {
  await host.updateComplete;
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await host.updateComplete;
}

test('preserves a direct native button child', async () => {
  const screen = render(html`
    <rc-chip data-testid="host">
      <button type="button" name="filter" value="quick">Quick</button>
    </rc-chip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;

  await flushChip(host);

  const button = host.querySelector('button')!;

  expect(button.isConnected).toBe(true);
  expect(button.name).toBe('filter');
  expect(button.value).toBe('quick');
});

test('filter chips toggle selected state and dispatch change on user click', async () => {
  const listener = vi.fn();
  const screen = render(html`
    <rc-chip data-testid="host" variant="filter">
      <button type="button">Quick</button>
    </rc-chip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;
  const button = host.querySelector('button')!;

  host.addEventListener('rc-chip-change', listener);

  await flushChip(host);
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }));

  expect(host.selected).toBe(true);
  expect(button.getAttribute('aria-pressed')).toBe('true');
  expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { selected: true } }));
});

test('host selected writes are silent', async () => {
  const listener = vi.fn();
  const screen = render(html`
    <rc-chip data-testid="host" variant="filter">
      <button type="button">Quick</button>
    </rc-chip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;

  host.addEventListener('rc-chip-change', listener);

  await flushChip(host);
  host.selected = true;
  await flushChip(host);

  expect(host.querySelector('button')?.getAttribute('aria-pressed')).toBe('true');
  expect(listener).not.toHaveBeenCalled();
});

test('readonly chips accept non-interactive display content', async () => {
  const listener = vi.fn();
  const screen = render(html`
    <rc-chip data-testid="host" readonly>
      <span data-rc-chip-label>Dinner</span>
    </rc-chip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;

  host.addEventListener('rc-chip-change', listener);

  await flushChip(host);
  host.dispatchEvent(new MouseEvent('click', { bubbles: true }));

  expect(host.querySelector('[data-rc-chip-label]')?.textContent).toBe('Dinner');
  expect(listener).not.toHaveBeenCalled();
});

test('remove affordance dispatches rc-chip-remove without removing the host', async () => {
  const listener = vi.fn();
  const screen = render(html`
    <rc-chip data-testid="host" removable>
      <button type="button">Quick</button>
    </rc-chip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;

  host.addEventListener('rc-chip-remove', listener);

  await flushChip(host);
  (host.shadowRoot?.querySelector('[part="remove"]') as HTMLButtonElement).click();

  expect(host.isConnected).toBe(true);
  expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { chip: host } }));
});

test('does not overwrite author-owned pressed state', async () => {
  const screen = render(html`
    <rc-chip data-testid="host" variant="filter" selected>
      <button type="button" aria-pressed="false">Quick</button>
    </rc-chip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;

  await flushChip(host);

  expect(host.querySelector('button')?.getAttribute('aria-pressed')).toBe('false');
});

test('has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-chip data-testid="host" variant="filter">
      <button type="button">Quick</button>
    </rc-chip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;

  await flushChip(host);
  await expectNoA11yViolations(host);
});
