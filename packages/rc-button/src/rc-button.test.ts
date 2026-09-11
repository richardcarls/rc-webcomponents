import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import './define.js';
import type { RCButton } from './rc-button.js';

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

test('preserves native button appearance without theme tokens', async () => {
  const screen = render(html`
    <button data-testid="native" type="button">Native</button>
    <rc-button data-testid="host">
      <button type="button">Enhanced</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;
  const nativeButton = await screen.getByTestId('native').element();

  await flushButton(host);

  const enhancedButton = host.querySelector('button')!;
  const nativeStyles = getComputedStyle(nativeButton);
  const enhancedStyles = getComputedStyle(enhancedButton);
  const nativeProperties = [
    'background-color',
    'border-block-start-color',
    'border-block-start-style',
    'border-block-start-width',
    'border-radius',
    'color',
    'font-family',
    'font-size',
    'font-weight',
    'padding-block-start',
    'padding-inline-start',
  ] as const;

  for (const property of nativeProperties) {
    expect(enhancedStyles.getPropertyValue(property), property).toBe(
      nativeStyles.getPropertyValue(property),
    );
  }
});

test('styles a direct native anchor child the same as a button child', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const screen = render(html`
    <rc-button
      data-testid="anchorHost"
      style="--rc-button-border: 2px solid red; --rc-button-padding-inline: 20px"
    >
      <a href="/somewhere">Go</a>
    </rc-button>
    <rc-button
      data-testid="buttonHost"
      style="--rc-button-border: 2px solid red; --rc-button-padding-inline: 20px"
    >
      <button type="button">Go</button>
    </rc-button>
  `);
  const anchorHost = (await screen.getByTestId('anchorHost').element()) as RCButton;
  const buttonHost = (await screen.getByTestId('buttonHost').element()) as RCButton;

  await flushButton(anchorHost);
  await flushButton(buttonHost);

  const anchor = anchorHost.querySelector('a')!;
  const button = buttonHost.querySelector('button')!;
  const anchorStyles = getComputedStyle(anchor);
  const buttonStyles = getComputedStyle(button);
  const sharedProperties = [
    'border-block-start-width',
    'border-block-start-style',
    'border-block-start-color',
    'padding-inline-start',
    'display',
  ] as const;

  for (const property of sharedProperties) {
    expect(anchorStyles.getPropertyValue(property), property).toBe(
      buttonStyles.getPropertyValue(property),
    );
  }

  expect(warn).not.toHaveBeenCalled();
  warn.mockRestore();
});

test('warns when the direct native button is missing', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const screen = render(html`<rc-button data-testid="host"><span>Save</span></rc-button>`);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  expect(warn).toHaveBeenCalledWith(
    '[rc-button] No supported direct child found. Place a native <button> or <a href> inside <rc-button>.',
    host,
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
    host,
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

test('pending disables the native button and blocks pointer activation', async () => {
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

  expect(button.disabled).toBe(true);
  expect(button.getAttribute('aria-busy')).toBe('true');
  expect(onClick).not.toHaveBeenCalled();
});

test('progress disables the native button and blocks keyboard activation', async () => {
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

  const button = host.querySelector('button')!;

  button.dispatchEvent(event);

  expect(button.disabled).toBe(true);
  expect(event.defaultPrevented).toBe(true);
  expect(onKeyDown).not.toHaveBeenCalled();
});

test('busy states restore a component-owned disabled state', async () => {
  const screen = render(html`
    <rc-button data-testid="host">
      <button type="button">Save</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);
  host.pending = true;
  await flushButton(host);
  expect(host.querySelector('button')?.disabled).toBe(true);

  host.pending = false;
  host.progress = true;
  await flushButton(host);
  expect(host.querySelector('button')?.disabled).toBe(true);

  host.progress = false;
  await flushButton(host);
  expect(host.querySelector('button')?.disabled).toBe(false);
});

test('busy states preserve an author-owned disabled state', async () => {
  const screen = render(html`
    <rc-button data-testid="host" progress>
      <button type="button" disabled>Save</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);
  host.progress = false;
  await flushButton(host);

  expect(host.querySelector('button')?.disabled).toBe(true);
});

test.each(['pending', 'progress'] as const)(
  '%s does not repeat disabled writes from the button observer',
  async (state) => {
    const screen = render(html`
      <rc-button data-testid="host">
        <button type="button">Save</button>
      </rc-button>
    `);
    const host = (await screen.getByTestId('host').element()) as RCButton;

    await flushButton(host);

    const $button = host.querySelector('button');

    if (!$button) {
      throw new Error('Expected a direct child button.');
    }

    const disabledDescriptor = Object.getOwnPropertyDescriptor(
      HTMLButtonElement.prototype,
      'disabled',
    );
    const getDisabled = disabledDescriptor?.get;
    const setDisabled = disabledDescriptor?.set;

    if (!getDisabled || !setDisabled) {
      throw new Error('Expected HTMLButtonElement.disabled accessors.');
    }

    let disabledWrites = 0;

    Object.defineProperty($button, 'disabled', {
      configurable: true,
      get: () => getDisabled.call($button),
      set: (value: boolean) => {
        disabledWrites++;

        if (getDisabled.call($button) !== value) {
          setDisabled.call($button, value);
        }
      },
    });

    host[state] = true;

    await flushButton(host);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    expect(disabledWrites).toBe(1);
    expect($button.disabled).toBe(true);
  },
);

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

test('classifies icon-only from an unmarked icon element', async () => {
  const screen = render(html`
    <rc-button data-testid="host">
      <button type="button" aria-label="Delete">
        <svg-icon></svg-icon>
      </button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  expect(host.hasAttribute('has-icon')).toBe(true);
  expect(host.hasAttribute('has-label')).toBe(false);
  expect(host.iconOnly).toBe(true);
});

test('classifies icon-only from a direct SVG element', async () => {
  const screen = render(html`
    <rc-button data-testid="host">
      <button type="button" aria-label="Delete">
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M4 4h16v16H4z"></path>
        </svg>
      </button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  expect(host.hasAttribute('has-icon')).toBe(true);
  expect(host.hasAttribute('has-label')).toBe(false);
  expect(host.iconOnly).toBe(true);
});

test('does not classify a labeled button as icon-only when its icon is unmarked', async () => {
  const screen = render(html`
    <rc-button data-testid="host">
      <button type="button">
        <svg-icon></svg-icon>
        <span>Delete</span>
      </button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  expect(host.hasAttribute('has-label')).toBe(true);
  expect(host.iconOnly).toBe(false);
});

test('excludes data-rc-button-progress content from label detection', async () => {
  const screen = render(html`
    <rc-button data-testid="host">
      <button type="button">
        <span data-rc-button-icon aria-hidden="true">+</span>
        <span data-rc-button-progress aria-hidden="true">Saving…</span>
      </button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  expect(host.hasAttribute('has-label')).toBe(false);
  expect(host.iconOnly).toBe(true);
});

test('keeps a 32px visible icon-only button inside a clickable 48px target', async () => {
  const screen = render(html`
    <rc-button
      data-testid="host"
      style="--rc-button-block-size: 32px; --rc-button-icon-size: 32px;"
    >
      <button type="button">
        <span data-rc-button-icon aria-hidden="true">+</span>
      </button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  expect(host.iconOnly).toBe(true);

  const $button = host.querySelector('button')!;
  const hostRect = host.getBoundingClientRect();
  const buttonRect = $button.getBoundingClientRect();

  expect(hostRect.height).toBeCloseTo(48);
  expect(hostRect.width).toBeCloseTo(48);
  expect(buttonRect.height).toBeCloseTo(32);
  expect(buttonRect.width).toBeCloseTo(32);

  const targetX = hostRect.left + 2;
  const targetY = hostRect.top + hostRect.height / 2;

  expect(targetX).toBeLessThan(buttonRect.left);
  expect(document.elementFromPoint(targetX, targetY)).toBe($button);
});

test('does not grow a visible icon-only button that already meets the touch target', async () => {
  const screen = render(html`
    <rc-button
      data-testid="host"
      style="--rc-button-block-size: 56px; --rc-button-icon-size: 56px;"
    >
      <button type="button">
        <span data-rc-button-icon aria-hidden="true">+</span>
      </button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  expect(host.getBoundingClientRect().height).toBeCloseTo(56);
  expect(host.getBoundingClientRect().width).toBeCloseTo(56);
});

test('touch-target-overlap-inline-* defaults to 0px: no margin added', async () => {
  const screen = render(html`
    <rc-button
      data-testid="host"
      style="--rc-button-block-size: 32px; --rc-button-icon-size: 32px;"
    >
      <button type="button">
        <span data-rc-button-icon aria-hidden="true">+</span>
      </button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  const margin = getComputedStyle(host);

  expect(margin.marginInlineStart).toBe('0px');
  expect(margin.marginInlineEnd).toBe('0px');
});

test('--rc-button-touch-target-overlap-inline-end shifts a 32px icon-only button flush with a flex-end container edge', async () => {
  const screen = render(html`
    <div data-testid="row" style="display:flex; justify-content:flex-end; width:200px;">
      <rc-button
        data-testid="host"
        style="
          --rc-button-block-size: 32px;
          --rc-button-icon-size: 32px;
          --rc-button-touch-target-overlap-inline-end: 8px;
        "
      >
        <button type="button">
          <span data-rc-button-icon aria-hidden="true">+</span>
        </button>
      </rc-button>
    </div>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;
  const row = (await screen.getByTestId('row').element()) as HTMLElement;

  await flushButton(host);

  expect(getComputedStyle(host).marginInlineEnd).toBe('-8px');
  expect(getComputedStyle(host).marginInlineStart).toBe('0px');

  const rowRect = row.getBoundingClientRect();
  const $button = host.querySelector('button')!;
  const buttonRect = $button.getBoundingClientRect();

  // The 8px the touch target would otherwise reserve past the visible
  // button is given back, so the visible icon itself lands flush with the
  // row's own trailing edge instead of 8px short of it.
  expect(buttonRect.right).toBeCloseTo(rowRect.right);

  // A point just past the visible button -- outside the row's own
  // boundary, in the space it just reclaimed -- still resolves to the
  // button: the light-DOM hit-slop pseudo-element is anchored to the
  // button itself and unaffected by the host's margin, so the actual
  // clickable region keeps its full accessible size regardless.
  const targetX = buttonRect.right + 2;
  const targetY = buttonRect.top + buttonRect.height / 2;

  expect(targetX).toBeGreaterThan(rowRect.right);
  expect(document.elementFromPoint(targetX, targetY)).toBe($button);
});

test('--rc-button-touch-target-overlap-inline-start mirrors the same behavior on the leading edge', async () => {
  const screen = render(html`
    <div data-testid="row" style="display:flex; width:200px;">
      <rc-button
        data-testid="host"
        style="
          --rc-button-block-size: 32px;
          --rc-button-icon-size: 32px;
          --rc-button-touch-target-overlap-inline-start: 8px;
        "
      >
        <button type="button">
          <span data-rc-button-icon aria-hidden="true">+</span>
        </button>
      </rc-button>
    </div>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;
  const row = (await screen.getByTestId('row').element()) as HTMLElement;

  await flushButton(host);

  expect(getComputedStyle(host).marginInlineStart).toBe('-8px');
  expect(getComputedStyle(host).marginInlineEnd).toBe('0px');

  const rowRect = row.getBoundingClientRect();
  const buttonRect = host.querySelector('button')!.getBoundingClientRect();

  expect(buttonRect.left).toBeCloseTo(rowRect.left);
});

test('both touch-target-overlap-inline-* properties apply independently', async () => {
  const screen = render(html`
    <rc-button
      data-testid="host"
      style="
        --rc-button-block-size: 32px;
        --rc-button-icon-size: 32px;
        --rc-button-touch-target-overlap-inline-start: 8px;
        --rc-button-touch-target-overlap-inline-end: 8px;
      "
    >
      <button type="button">
        <span data-rc-button-icon aria-hidden="true">+</span>
      </button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  expect(getComputedStyle(host).marginInlineStart).toBe('-8px');
  expect(getComputedStyle(host).marginInlineEnd).toBe('-8px');
});

test('touch-target-overlap-inline-end has no automated accessibility violations', async () => {
  const screen = render(html`
    <div style="display:flex; justify-content:flex-end; width:200px;">
      <rc-button
        data-testid="host"
        style="
          --rc-button-block-size: 32px;
          --rc-button-icon-size: 32px;
          --rc-button-touch-target-overlap-inline-end: 8px;
        "
      >
        <button type="button" aria-label="More actions">
          <span data-rc-button-icon aria-hidden="true">+</span>
        </button>
      </rc-button>
    </div>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);
  await expectNoA11yViolations(host);
});

test('selected icon switching follows controlled state and native button clicks', async () => {
  const screen = render(html`
    <style>
      .icon-font {
        display: inline-block;
      }
    </style>
    <rc-button data-testid="host">
      <button type="button">
        <span class="icon-font" data-rc-button-icon aria-hidden="true">♡</span>
        <span class="icon-font" data-rc-button-selected-icon aria-hidden="true">♥</span>
        <span data-rc-button-label>Save</span>
      </button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  const icon = host.querySelector<HTMLElement>('[data-rc-button-icon]')!;
  const selectedIcon = host.querySelector<HTMLElement>('[data-rc-button-selected-icon]')!;

  expect(getComputedStyle(icon).display).not.toBe('none');
  expect(getComputedStyle(selectedIcon).display).toBe('none');

  host.selected = true;
  await flushButton(host);

  expect(getComputedStyle(icon).display).toBe('none');
  expect(getComputedStyle(selectedIcon).display).not.toBe('none');

  host.selected = false;
  await flushButton(host);

  host.querySelector('button')!.addEventListener('click', () => {
    host.selected = !host.selected;
  });

  host.querySelector('button')!.click();
  await flushButton(host);

  expect(host.selected).toBe(true);
  expect(getComputedStyle(icon).display).toBe('none');
  expect(getComputedStyle(selectedIcon).display).not.toBe('none');
});

test('toggle buttons manage aria-pressed and uncontrolled selected state', async () => {
  const listener = vi.fn();
  const screen = render(html`
    <rc-button data-testid="host" toggle>
      <button type="button">
        <span data-rc-button-icon aria-hidden="true">♡</span>
        <span data-rc-button-selected-icon aria-hidden="true">♥</span>
        <span data-rc-button-label>Save recipe</span>
      </button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;
  const button = host.querySelector('button')!;
  const label = button.textContent;

  host.addEventListener('rc-button-toggle', listener);

  await flushButton(host);
  expect(host.selected).toBe(false);
  expect(button.getAttribute('aria-pressed')).toBe('false');

  button.click();
  await flushButton(host);

  expect(host.selected).toBe(true);
  expect(host.hasAttribute('selected')).toBe(true);
  expect(button.getAttribute('aria-pressed')).toBe('true');
  expect(button.textContent).toBe(label);

  expect(listener).toHaveBeenLastCalledWith(
    expect.objectContaining({ detail: { selected: true } }),
  );

  button.click();
  await flushButton(host);

  expect(host.selected).toBe(false);
  expect(host.hasAttribute('selected')).toBe(false);
  expect(button.getAttribute('aria-pressed')).toBe('false');

  expect(listener).toHaveBeenLastCalledWith(
    expect.objectContaining({ detail: { selected: false } }),
  );
});

test('toggle buttons retain native Enter and Space activation', async () => {
  const screen = render(html`
    <rc-button data-testid="host" toggle>
      <button type="button">Save recipe</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;
  const button = host.querySelector('button')!;

  await flushButton(host);
  button.focus();
  await userEvent.keyboard('{Enter}');
  await flushButton(host);
  expect(host.selected).toBe(true);

  await userEvent.keyboard(' ');
  await flushButton(host);
  expect(host.selected).toBe(false);
});

test('default-selected initializes an uncontrolled toggle button', async () => {
  const screen = render(html`
    <rc-button data-testid="host" toggle default-selected>
      <button type="button">Save recipe</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  expect(host.selected).toBe(true);
  expect(host.querySelector('button')?.getAttribute('aria-pressed')).toBe('true');

  host.querySelector('button')?.click();
  await flushButton(host);
  expect(host.selected).toBe(false);
});

test('controlled toggle buttons request state without mutating selected', async () => {
  const listener = vi.fn();
  const screen = render(html`
    <rc-button data-testid="host" toggle>
      <button type="button">Save recipe</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;
  const button = host.querySelector('button')!;

  await flushButton(host);
  host.selected = false;
  host.addEventListener('rc-button-toggle', listener);
  await flushButton(host);
  button.click();
  await flushButton(host);

  expect(host.selected).toBe(false);
  expect(button.getAttribute('aria-pressed')).toBe('false');
  expect(listener).toHaveBeenCalledWith(expect.objectContaining({ detail: { selected: true } }));

  listener.mockClear();
  host.selected = true;
  await flushButton(host);

  expect(button.getAttribute('aria-pressed')).toBe('true');
  expect(listener).not.toHaveBeenCalled();
});

test('ordinary buttons do not acquire toggle semantics', async () => {
  const listener = vi.fn();
  const screen = render(html`
    <rc-button data-testid="host">
      <button type="button">Save recipe</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  host.addEventListener('rc-button-toggle', listener);

  await flushButton(host);
  host.querySelector('button')?.click();

  expect(host.selected).toBe(false);
  expect(host.querySelector('button')?.hasAttribute('aria-pressed')).toBe(false);
  expect(listener).not.toHaveBeenCalled();
});

test('canceled button activation does not toggle', async () => {
  const listener = vi.fn();
  const screen = render(html`
    <rc-button data-testid="host" toggle>
      <button type="button">Save recipe</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;
  const button = host.querySelector('button')!;

  button.addEventListener('click', (event) => event.preventDefault());
  host.addEventListener('rc-button-toggle', listener);

  await flushButton(host);
  button.click();

  expect(host.selected).toBe(false);
  expect(button.getAttribute('aria-pressed')).toBe('false');
  expect(listener).not.toHaveBeenCalled();
});

test('removing toggle restores an author-provided aria-pressed state', async () => {
  const screen = render(html`
    <rc-button data-testid="host" toggle selected>
      <button type="button" aria-pressed="false">Save recipe</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);
  expect(host.querySelector('button')?.getAttribute('aria-pressed')).toBe('true');

  host.toggle = false;
  await flushButton(host);

  expect(host.querySelector('button')?.getAttribute('aria-pressed')).toBe('false');
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
    <rc-button data-testid="host" progress style="--rc-button-progress-color: rgb(1, 2, 3)">
      <button type="button">Save</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  expect(host.shadowRoot?.querySelector('[part="state-layer"]')).not.toBeNull();

  const progress = host.shadowRoot?.querySelector<HTMLElement>('[part="progress"]');

  if (!progress) {
    throw new Error('Expected the progress part to render.');
  }

  expect(getComputedStyle(host.querySelector('button')!).color).toBe('rgba(0, 0, 0, 0)');
  expect(getComputedStyle(progress).color).toBe('rgb(1, 2, 3)');
});

test('renders a clamped determinate progress percentage', async () => {
  const screen = render(html`
    <rc-button data-testid="host" progress progress-value="125">
      <button type="button">Save</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  const progress = host.shadowRoot?.querySelector<HTMLElement>('[part="progress"]');

  expect(progress?.hasAttribute('data-determinate')).toBe(true);
  expect(progress?.textContent).toBe('100%');

  host.progressValue = -10;
  await flushButton(host);
  expect(progress?.textContent).toBe('0%');

  host.progress = false;
  await flushButton(host);
  expect(progress?.hasAttribute('data-determinate')).toBe(false);
  expect(progress?.textContent).toBe('');
});

test('shows themed hover state through the state-layer overlay', async () => {
  const screen = render(html`
    <rc-button
      data-testid="host"
      style="--rc-button-hover-state-layer-opacity: 0.25; --rc-button-state-layer-duration: 0ms"
    >
      <button type="button">Save</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);
  await userEvent.hover(host.querySelector('button')!);

  const stateLayer = host.shadowRoot?.querySelector<HTMLElement>('[part="state-layer"]');

  if (!stateLayer) {
    throw new Error('Expected the state-layer part to render.');
  }

  expect(getComputedStyle(stateLayer, '::before').opacity).toBe('0.25');
});

test('positions and starts an enabled ripple from primary pointer input', async () => {
  const screen = render(html`
    <rc-button
      data-testid="host"
      style="--_rc-button-ripple-enabled: 1; --_rc-button-ripple-duration: 10s"
    >
      <button type="button">Save</button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);

  const button = host.querySelector('button')!;
  const bounds = button.getBoundingClientRect();

  button.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      button: 0,
      clientX: bounds.left + bounds.width / 4,
      clientY: bounds.top + bounds.height / 2,
      composed: true,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'touch',
    }),
  );

  const stateLayer = host.shadowRoot?.querySelector<HTMLElement>('[part="state-layer"]');

  if (!stateLayer) {
    throw new Error('Expected the state-layer part to render.');
  }

  expect(stateLayer.hasAttribute('data-rippling')).toBe(true);

  expect(Number.parseFloat(stateLayer.style.getPropertyValue('--_rc-button-ripple-x'))).toBeCloseTo(
    bounds.width / 4,
  );

  expect(Number.parseFloat(stateLayer.style.getPropertyValue('--_rc-button-ripple-y'))).toBeCloseTo(
    bounds.height / 2,
  );

  expect(
    Number.parseFloat(stateLayer.style.getPropertyValue('--_rc-button-ripple-size')),
  ).toBeGreaterThan(bounds.width);
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

test('selected toggle state has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-button data-testid="host" toggle default-selected>
      <button type="button">
        <span data-rc-button-icon aria-hidden="true">♡</span>
        <span data-rc-button-selected-icon aria-hidden="true">♥</span>
        <span data-rc-button-label>Save recipe</span>
      </button>
    </rc-button>
  `);
  const host = (await screen.getByTestId('host').element()) as RCButton;

  await flushButton(host);
  expect(host.querySelector('button')?.getAttribute('aria-pressed')).toBe('true');
  await expectNoA11yViolations(host);
});
