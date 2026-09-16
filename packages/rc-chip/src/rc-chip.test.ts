import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import './define.js';
import type { RCChip } from './rc-chip.js';

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
  expect(getComputedStyle(button).gap).toBe('0px');

  if (CSS.supports('-webkit-tap-highlight-color', 'transparent')) {
    expect(getComputedStyle(button).getPropertyValue('-webkit-tap-highlight-color')).toBe(
      'rgba(0, 0, 0, 0)',
    );
  }
});

test('unlayered author styles override the layered light DOM base', async () => {
  const screen = render(html`
    <style>
      rc-chip > button {
        padding: 13px;
        border: 4px solid red;
        background: red;
      }
    </style>
    <rc-chip data-testid="host"><button type="button">Quick</button></rc-chip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;

  await flushChip(host);

  const styles = getComputedStyle(host.querySelector('button')!);

  expect(styles.paddingTop).toBe('13px');
  expect(styles.borderTopWidth).toBe('4px');
  expect(styles.backgroundColor).toBe('rgb(255, 0, 0)');
});

test('accepts a direct native anchor child without a development warning', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const screen = render(html`
    <rc-chip data-testid="host">
      <a href="/recipes">Recipes</a>
    </rc-chip>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCChip;

  await flushChip($host);

  expect($host.querySelector('a')?.isConnected).toBe(true);
  expect(warn).not.toHaveBeenCalled();

  warn.mockRestore();
});

test('warns once and without dumping an unsupported child', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const screen = render(html`
    <rc-chip data-testid="host">
      <span>Quick</span>
    </rc-chip>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCChip;

  await flushChip($host);

  expect(warn).toHaveBeenCalledExactlyOnceWith(
    '[rc-chip] No supported direct child found. Place a native <button>, <a href>, or a <label> containing a direct checkbox/radio inside <rc-chip>, or use readonly with a [data-rc-chip-label] child.',
  );

  warn.mockRestore();
});

test('uses its shape-clipped state layer for focus feedback', async () => {
  const screen = render(html`
    <rc-chip data-testid="host" variant="filter" style="--rc-chip-radius: 999px">
      <button type="button">Quick</button>
    </rc-chip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;

  await flushChip(host);
  host.querySelector('button')!.focus();

  const stateLayer = host.shadowRoot?.querySelector<HTMLElement>('[part="state-layer"]');

  if (!stateLayer) {
    throw new Error('Expected the state-layer part to render.');
  }

  expect(getComputedStyle(stateLayer).borderRadius).not.toBe('0px');
  await vi.waitFor(() => expect(getComputedStyle(stateLayer).opacity).toBe('0.12'));
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

test('menu-backed filter chips leave selected state to the menu owner', async () => {
  const listener = vi.fn();
  const screen = render(html`
    <rc-chip data-testid="host" variant="filter">
      <button type="button" aria-haspopup="menu" aria-expanded="false">Cuisine</button>
    </rc-chip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;

  host.addEventListener('rc-chip-change', listener);

  await flushChip(host);
  host.querySelector('button')!.click();

  expect(host.selected).toBe(false);
  expect(listener).not.toHaveBeenCalled();
});

test('native-backed filter chips preserve checkbox state and form values', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const listener = vi.fn();
  const screen = render(html`
    <form data-testid="form">
      <rc-chip data-testid="host" variant="filter">
        <label>
          <input type="checkbox" name="category" value="quick" checked />
          Quick
        </label>
      </rc-chip>
    </form>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;
  const form = (await screen.getByTestId('form').element()) as HTMLFormElement;

  host.addEventListener('rc-chip-change', listener);
  await flushChip(host);

  const input = host.querySelector<HTMLInputElement>('input')!;

  expect(host.selected).toBe(true);
  expect(new FormData(form).get('category')).toBe('quick');

  input.click();
  await flushChip(host);

  expect(host.selected).toBe(false);
  expect(new FormData(form).has('category')).toBe(false);

  expect(listener).toHaveBeenLastCalledWith(
    expect.objectContaining({ detail: { selected: false } }),
  );

  expect(warn).not.toHaveBeenCalled();

  warn.mockRestore();
});

test('controlled native-backed filters report user intent without changing host state', async () => {
  const listener = vi.fn();
  const screen = render(html`
    <rc-chip data-testid="host" variant="filter">
      <label><input type="checkbox" />Quick</label>
    </rc-chip>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCChip;
  const $input = $host.querySelector<HTMLInputElement>('input')!;

  $host.selected = true;
  $host.addEventListener('rc-chip-change', listener);
  await flushChip($host);

  $input.click();
  await flushChip($host);

  expect($host.selected).toBe(true);
  expect($input.checked).toBe(true);

  expect(listener).toHaveBeenLastCalledWith(
    expect.objectContaining({ detail: { selected: false } }),
  );

  $host.selected = undefined;
  await flushChip($host);

  expect($host.selected).toBe(false);

  $input.click();
  await flushChip($host);

  expect($host.selected).toBe(true);
  expect($input.checked).toBe(true);
});

test('native-backed filters follow native form reset state when uncontrolled', async () => {
  const screen = render(html`
    <form data-testid="form">
      <rc-chip data-testid="host" variant="filter">
        <label><input type="checkbox" checked />Quick</label>
      </rc-chip>
    </form>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCChip;
  const $form = (await screen.getByTestId('form').element()) as HTMLFormElement;
  const $input = $host.querySelector<HTMLInputElement>('input')!;

  await flushChip($host);
  $input.click();
  await flushChip($host);

  $form.reset();
  await flushChip($host);

  expect($host.selected).toBe(true);
  expect($input.checked).toBe(true);
});

test('keeps a 32px visible chip inside a 48px interactive wrapper', async () => {
  const screen = render(html`
    <rc-chip
      data-testid="host"
      style="--rc-chip-block-size: 32px; --rc-chip-touch-target-block-size: 48px; --rc-chip-padding-block: 0;"
    >
      <button type="button">Quick</button>
    </rc-chip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;

  await flushChip(host);

  expect(host.getBoundingClientRect().height).toBeCloseTo(48);
  expect(host.querySelector('button')!.getBoundingClientRect().height).toBeCloseTo(32);
});

test('--rc-chip-touch-target-overlap-block-end shifts a 32px chip flush with a flex-end container edge', async () => {
  const screen = render(html`
    <div
      data-testid="row"
      style="display:flex; flex-direction:column; justify-content:flex-end; height:200px;"
    >
      <rc-chip
        data-testid="host"
        style="
          --rc-chip-block-size: 32px;
          --rc-chip-padding-block: 0;
          --rc-chip-touch-target-overlap-block-end: 8px;
        "
      >
        <button type="button">Quick</button>
      </rc-chip>
    </div>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;
  const row = (await screen.getByTestId('row').element()) as HTMLElement;

  await flushChip(host);

  expect(getComputedStyle(host).marginBlockEnd).toBe('-8px');
  expect(getComputedStyle(host).marginBlockStart).toBe('0px');

  const rowRect = row.getBoundingClientRect();
  const $button = host.querySelector('button')!;
  const buttonRect = $button.getBoundingClientRect();

  // The 8px the touch target would otherwise reserve past the visible chip
  // is given back, so the visible chip lands flush with the row's own
  // trailing (block-end) edge instead of 8px short of it.
  expect(buttonRect.bottom).toBeCloseTo(rowRect.bottom);

  // A point just past the visible chip -- outside the row's own boundary,
  // in the space it just reclaimed -- still resolves to the chip: the
  // light-DOM hit-slop pseudo-element is anchored to the button itself and
  // unaffected by the host's margin, so the actual clickable region keeps
  // its full accessible size regardless.
  const targetX = buttonRect.left + buttonRect.width / 2;
  const targetY = buttonRect.bottom + 2;

  expect(targetY).toBeGreaterThan(rowRect.bottom);
  expect(document.elementFromPoint(targetX, targetY)).toBe($button);
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

test('removable chip button dispatches rc-chip-remove without removing the host', async () => {
  const listener = vi.fn();
  const screen = render(html`
    <rc-chip data-testid="host" removable>
      <button type="button">Quick</button>
    </rc-chip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;

  host.addEventListener('rc-chip-remove', listener);

  await flushChip(host);
  host.querySelector('button')?.click();

  expect(host.isConnected).toBe(true);
  expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { chip: host } }));
});

test('removable chip indicator is presentational and adds no button semantics', async () => {
  const screen = render(html`
    <rc-chip data-testid="host" removable>
      <button type="button" aria-label="Remove Quick">Quick</button>
      <span slot="remove-icon" style="font-size: 1.5rem">close</span>
    </rc-chip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;

  await flushChip(host);

  const indicator = host.shadowRoot?.querySelector('[part="remove"]');

  expect(indicator).toBeInstanceOf(HTMLSpanElement);
  expect(indicator?.getAttribute('aria-hidden')).toBe('true');
  expect(host.shadowRoot?.querySelectorAll('button')).toHaveLength(0);

  const removeIcon = host.querySelector<HTMLElement>('[slot="remove-icon"]')!;

  expect(parseFloat(getComputedStyle(removeIcon).fontSize)).toBeLessThan(
    parseFloat(getComputedStyle(host).fontSize),
  );

  await expectNoA11yViolations(host);
});

test('removable chip end padding reserves the remove target and its edge offset', async () => {
  const screen = render(html`
    <rc-chip
      data-testid="host"
      removable
      style="--rc-chip-remove-target-size: 2rem; --rc-chip-remove-offset-inline: 0.25rem; --rc-chip-gap: 0.5rem"
    >
      <button type="button" aria-label="Remove Quick"><span>Quick</span></button>
    </rc-chip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;

  await flushChip(host);

  const button = host.querySelector('button')!;
  const label = button.querySelector('span')!;
  const remove = host.shadowRoot!.querySelector<HTMLElement>('[part="remove"]')!;

  expect(getComputedStyle(button).paddingInlineEnd).toBe('36px');

  expect(label.getBoundingClientRect().right).toBeLessThanOrEqual(
    remove.getBoundingClientRect().left,
  );
});

test('removable filter chips remove instead of toggling selected state', async () => {
  const changeListener = vi.fn();
  const removeListener = vi.fn();
  const screen = render(html`
    <rc-chip data-testid="host" variant="filter" removable>
      <button type="button" aria-label="Remove Quick">Quick</button>
    </rc-chip>
  `);
  const host = (await screen.getByTestId('host').element()) as RCChip;

  host.addEventListener('rc-chip-change', changeListener);
  host.addEventListener('rc-chip-remove', removeListener);

  await flushChip(host);
  host.querySelector('button')?.click();

  expect(host.selected).toBe(false);
  expect(host.querySelector('button')?.hasAttribute('aria-pressed')).toBe(false);
  expect(changeListener).not.toHaveBeenCalled();
  expect(removeListener).toHaveBeenCalledOnce();
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
