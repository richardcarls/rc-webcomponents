import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';
import type { RCChip } from '@rcarls/rc-chip';
import './define.ts';
import type { RCChipGroup } from './rc-chip-group.ts';

async function settle(host: RCChipGroup): Promise<void> {
  await host.updateComplete;
  await new Promise<void>((resolve) => queueMicrotask(resolve));
  await vi.waitFor(() => expect(host.shadowRoot?.querySelector('#root')).not.toBeNull());
}

test('generic mode lays out arbitrary direct children without adding widget semantics', async () => {
  const screen = render(html`
    <rc-chip-group data-testid="host" layout="wrap">
      <span>One</span>
      <a href="#two">Two</a>
    </rc-chip-group>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChipGroup;

  await settle(host);

  const root = host.shadowRoot!.querySelector<HTMLElement>('#root')!;

  expect(root.getAttribute('role')).toBeNull();
  expect(root.dataset.mode).toBe('wrap');
  expect(host.querySelector('a')?.getAttribute('tabindex')).toBeNull();
});

test('assist mode exposes one toolbar tab stop with arrow-key navigation', async () => {
  const screen = render(html`
    <rc-chip-group data-testid="host" kind="assist" layout="wrap" label="Recipe actions">
      <rc-chip><button type="button">One</button></rc-chip>
      <button type="button">Two</button>
    </rc-chip-group>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChipGroup;

  await settle(host);
  await vi.waitFor(() => expect(host.querySelector('button')?.tabIndex).toBe(0));

  const root = host.shadowRoot!.querySelector<HTMLElement>('#root')!;
  const buttons = host.querySelectorAll<HTMLButtonElement>('button');

  expect(root.getAttribute('role')).toBe('toolbar');
  expect(root.getAttribute('aria-label')).toBe('Recipe actions');
  expect(Array.from(buttons, (button) => button.tabIndex)).toEqual([0, -1]);

  buttons[0].focus();
  root.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

  expect(document.activeElement).toBe(buttons[1]);
});

test('filter mode preserves native radio behavior and synchronizes chip selection', async () => {
  const screen = render(html`
    <fieldset data-testid="fieldset">
      <legend>Recipe scope</legend>
      <rc-chip-group data-testid="host" kind="filter" selection="single" layout="wrap">
        <rc-chip>
          <label><input type="radio" name="scope" value="all" checked />All</label>
        </rc-chip>
        <rc-chip>
          <label><input type="radio" name="scope" value="favorites" />Favorites</label>
        </rc-chip>
      </rc-chip-group>
    </fieldset>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChipGroup;
  const fieldset = (await screen.getByTestId('fieldset').element()) as HTMLFieldSetElement;

  await settle(host);

  const chips = host.querySelectorAll('rc-chip');
  const radios = host.querySelectorAll<HTMLInputElement>('input[type="radio"]');

  await vi.waitFor(() => expect(chips[0]).toHaveAttribute('selected'));
  expect(fieldset.querySelector('legend')?.textContent).toBe('Recipe scope');
  expect(radios[0].checked).toBe(true);
  expect(radios[1].checked).toBe(false);

  radios[1].click();

  await vi.waitFor(() => {
    expect(chips[0]).not.toHaveAttribute('selected');
    expect(chips[1]).toHaveAttribute('selected');
  });

  expect(radios[0].checked).toBe(false);
  expect(radios[1].checked).toBe(true);
});

test('restores authored chip variants when coordination ends', async () => {
  const screen = render(html`
    <rc-chip-group data-testid="host" kind="assist" layout="wrap">
      <rc-chip data-testid="chip" variant="input"><button type="button">One</button></rc-chip>
    </rc-chip-group>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCChipGroup;
  const $chip = (await screen.getByTestId('chip').element()) as RCChip;

  await settle($host);
  expect($chip.variant).toBe('assist');

  $host.kind = 'generic';
  await settle($host);

  expect($chip.variant).toBe('input');
});

test('auto layout collapses after max rows and toggles back to wrapped layout', async () => {
  const listener = vi.fn();
  const screen = render(html`
    <rc-chip-group
      data-testid="host"
      style="inline-size: 12rem; --rc-chip-group-column-gap: 0;"
      max-rows="2"
    >
      ${Array.from(
        { length: 5 },
        (_, index) => html`<span style="inline-size: 5rem; block-size: 2rem;">${index}</span>`,
      )}
    </rc-chip-group>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChipGroup;

  host.addEventListener('rc-chip-group-toggle', listener);
  await settle(host);

  const root = host.shadowRoot!.querySelector<HTMLElement>('#root')!;
  const toggle = host.shadowRoot!.querySelector<HTMLButtonElement>('#toggle > button')!;
  const toggleIcon = host.shadowRoot!.querySelector<SVGElement>('[part="toggle-icon"]')!;
  const toggleSeparator = host.shadowRoot!.querySelector<HTMLElement>('[part="toggle-separator"]')!;

  await vi.waitFor(() => expect(root.dataset.mode).toBe('scroll'));
  expect(toggle.textContent?.trim()).toBe('Show all');
  expect(toggleIcon.getAttribute('viewBox')).toBe('0 0 24 24');
  expect(toggleIcon).toHaveAttribute('data-rc-chip-icon');
  expect(toggleSeparator).toBeVisible();

  toggle.click();
  await host.updateComplete;

  expect(host.expanded).toBe(true);
  expect(root.dataset.mode).toBe('wrap');
  expect(toggle.textContent?.trim()).toBe('Show less');

  expect(listener).toHaveBeenLastCalledWith(
    expect.objectContaining({ detail: { expanded: true } }),
  );

  toggle.click();
  await host.updateComplete;

  expect(host.expanded).toBe(false);
  expect(root.dataset.mode).toBe('scroll');
});

test('preserves horizontal scroll while selected chip geometry is remeasured', async () => {
  const screen = render(html`
    <fieldset>
      <legend>Sort by</legend>
      <rc-chip-group
        data-testid="host"
        kind="filter"
        selection="single"
        style="inline-size: 12rem;"
      >
        ${Array.from(
          { length: 8 },
          (_, index) => html`
            <rc-chip>
              <label>
                <input type="radio" name="preserve-scroll" value=${index} ?checked=${index === 0} />
                ${index === 0 ? html`<span data-selected-marker>✓</span>` : ''} Option ${index + 1}
              </label>
            </rc-chip>
          `,
        )}
      </rc-chip-group>
    </fieldset>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChipGroup;

  await settle(host);

  const root = host.shadowRoot!.querySelector<HTMLElement>('#root')!;
  const radios = host.querySelectorAll<HTMLInputElement>('input[type="radio"]');

  await vi.waitFor(() => expect(root.dataset.mode).toBe('scroll'));
  root.scrollLeft = root.scrollWidth;

  const scrollLeft = root.scrollLeft;

  expect(scrollLeft).toBeGreaterThan(0);

  host.addEventListener(
    'change',
    (event) => {
      host.querySelector('[data-selected-marker]')?.remove();

      const input = event
        .composedPath()
        .find(($element): $element is HTMLInputElement => $element instanceof HTMLInputElement);
      const marker = document.createElement('span');

      marker.dataset.selectedMarker = '';
      marker.textContent = '✓';
      input?.insertAdjacentElement('afterend', marker);
    },
    { once: true },
  );

  radios[radios.length - 1].click();
  await vi.waitFor(() => expect(radios[radios.length - 1].checked).toBe(true));

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

  const rootRect = root.getBoundingClientRect();
  const selectedRect = radios[radios.length - 1].closest('rc-chip')!.getBoundingClientRect();

  expect(root.scrollLeft).toBe(scrollLeft);
  expect(selectedRect.left).toBeGreaterThanOrEqual(rootRect.left - 0.5);
  expect(selectedRect.right).toBeLessThanOrEqual(rootRect.right + 0.5);
});

test('host expanded writes are silent', async () => {
  const listener = vi.fn();
  const screen = render(html`<rc-chip-group data-testid="host"></rc-chip-group>`);
  const host = (await screen.getByTestId('host').element()) as RCChipGroup;

  host.addEventListener('rc-chip-group-toggle', listener);
  host.expanded = true;
  await settle(host);

  expect(host.expanded).toBe(true);
  expect(listener).not.toHaveBeenCalled();
});

test('controlled disclosure reports user intent and can release to uncontrolled state', async () => {
  const screen = render(html`
    <rc-chip-group
      data-testid="host"
      layout="auto"
      style="inline-size: 12rem; --rc-chip-group-column-gap: 0;"
      max-rows="2"
    >
      ${Array.from(
        { length: 5 },
        (_, index) => html`<span style="inline-size: 5rem; block-size: 2rem;">${index}</span>`,
      )}
    </rc-chip-group>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCChipGroup;
  const listener = vi.fn();

  $host.expanded = false;
  $host.addEventListener('rc-chip-group-toggle', listener);
  await settle($host);

  const $toggle = $host.shadowRoot?.querySelector<HTMLButtonElement>('#toggle > button');

  await vi.waitFor(() => expect($toggle).toBeVisible());

  $toggle?.click();
  await $host.updateComplete;

  expect($host.expanded).toBe(false);

  expect(listener).toHaveBeenLastCalledWith(
    expect.objectContaining({ detail: { expanded: true } }),
  );

  $host.expanded = undefined;
  $toggle?.click();
  await $host.updateComplete;

  expect($host.expanded).toBe(true);
});

test('has no automated accessibility violations with native filter semantics', async () => {
  const screen = render(html`
    <fieldset data-testid="fieldset">
      <legend>Categories</legend>
      <rc-chip-group kind="filter" selection="multiple" layout="wrap">
        <rc-chip>
          <label><input type="checkbox" name="category" value="dinner" />Dinner</label>
        </rc-chip>
        <rc-chip>
          <label><input type="checkbox" name="category" value="quick" />Quick</label>
        </rc-chip>
      </rc-chip-group>
    </fieldset>
  `);
  const fieldset = (await screen.getByTestId('fieldset').element()) as HTMLFieldSetElement;

  await expectNoA11yViolations(fieldset);
});
