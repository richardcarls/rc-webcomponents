import { html } from 'lit';
import { afterEach, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import './define.js';
import type { RCAdaptiveMenu } from './rc-adaptive-menu.js';

async function settle(host: RCAdaptiveMenu): Promise<void> {
  await host.updateComplete;

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

afterEach(() => {
  for (const host of document.querySelectorAll<RCAdaptiveMenu>('rc-adaptive-menu')) {
    host.closeMenu();
  }
});

test('re-slots the authored action node and keeps its listener and identity', async () => {
  const activated = vi.fn();
  const screen = render(html`
    <rc-adaptive-menu data-testid="host" max-shown="1">
      <button data-testid="first" type="button">First</button>
      <button data-testid="second" type="button" @click=${activated}>Second</button>
    </rc-adaptive-menu>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;
  const second = (await screen.getByTestId('second').element()) as HTMLButtonElement;

  await settle(host);

  expect(second.parentElement).toBe(host);
  expect(second.slot).toBe('overflow');
  expect(second).toHaveAttribute('data-rc-action-overflowed');
  expect(second).toHaveAttribute('role', 'menuitem');

  host.openMenu();
  await userEvent.click(second);

  expect(activated).toHaveBeenCalledTimes(1);
  expect(await screen.getByTestId('second').element()).toBe(second);
});

test('uses descending data-priority while retaining DOM order as the tie breaker', async () => {
  const screen = render(html`
    <rc-adaptive-menu data-testid="host" max-shown="1">
      <button data-testid="first">First</button>
      <button data-testid="second" data-priority="20">Second</button>
      <button data-testid="third" data-priority="10">Third</button>
    </rc-adaptive-menu>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;
  const first = await screen.getByTestId('first').element();
  const second = await screen.getByTestId('second').element();
  const third = await screen.getByTestId('third').element();

  await settle(host);

  expect(second).toHaveAttribute('data-rc-action-promoted');
  expect(first).toHaveAttribute('data-rc-action-overflowed');
  expect(third).toHaveAttribute('data-rc-action-overflowed');
  expect(host.$actions).toEqual([first, second, third]);
  expect(host.$promotedActions).toEqual([second]);
  expect(host.$overflowedActions).toEqual([first, third]);
});

test('keeps authored overflow actions in the popup even when other actions fit', async () => {
  const screen = render(html`
    <rc-adaptive-menu data-testid="host" max-shown="3">
      <button data-testid="primary">Primary</button>
      <button data-testid="utility" slot="overflow">Utility</button>
    </rc-adaptive-menu>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;
  const primary = await screen.getByTestId('primary').element();
  const utility = await screen.getByTestId('utility').element();

  await settle(host);

  expect(primary).toHaveAttribute('data-rc-action-promoted');
  expect(utility).toHaveAttribute('data-rc-action-overflowed');
  expect(host).toHaveAttribute('data-overflow');
});

test('always overflows a negative data-priority action, even as the only action', async () => {
  const screen = render(html`
    <rc-adaptive-menu data-testid="host" max-shown="1">
      <button data-testid="only" data-priority="-1">Turn off</button>
    </rc-adaptive-menu>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;
  const only = await screen.getByTestId('only').element();

  await settle(host);

  expect(only).toHaveAttribute('data-rc-action-overflowed');
  expect(host.$promotedActions).toEqual([]);
  expect(host.$overflowedActions).toEqual([only]);
  expect(host).toHaveAttribute('data-overflow');
});

test('a negative data-priority still overflows once space allows every action to fit', async () => {
  const screen = render(html`
    <rc-adaptive-menu data-testid="host" max-shown="3">
      <button data-testid="primary" data-priority="10">Primary</button>
      <button data-testid="turnOff" data-priority="-1">Turn off</button>
    </rc-adaptive-menu>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;
  const primary = await screen.getByTestId('primary').element();
  const turnOff = await screen.getByTestId('turnOff').element();

  await settle(host);

  expect(primary).toHaveAttribute('data-rc-action-promoted');
  expect(turnOff).toHaveAttribute('data-rc-action-overflowed');
  expect(host.$promotedActions).toEqual([primary]);
  expect(host.$overflowedActions).toEqual([turnOff]);
});

test('re-evaluates promotion when max-shown changes, with no size measurement involved', async () => {
  const screen = render(html`
    <div data-testid="container" style="inline-size: 112px">
      <rc-adaptive-menu data-testid="host" max-shown="1" style="--rc-adaptive-menu-gap: 0px">
        <button style="inline-size: 48px">One</button>
        <button style="inline-size: 48px">Two</button>
        <button style="inline-size: 48px">Three</button>
      </rc-adaptive-menu>
    </div>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;

  await settle(host);

  // A cap of 1 promotes only the first action, even though the container is
  // narrower than all three authored actions would need — max-shown is a
  // static declarative cap, not a fit computation against available space.
  expect(host.querySelectorAll('[data-rc-action-promoted]')).toHaveLength(1);

  host.maxShown = 3;
  await settle(host);

  expect(host.querySelectorAll('[data-rc-action-promoted]')).toHaveLength(3);
  expect(host).not.toHaveAttribute('data-overflow');
});

test('--rc-adaptive-menu-touch-target-overlap-inline-end shifts the host flush with a flex-end container edge', async () => {
  const screen = render(html`
    <div data-testid="row" style="display:flex; justify-content:flex-end; width:120px">
      <rc-adaptive-menu
        data-testid="host"
        max-shown="0"
        style="
          --rc-adaptive-menu-trigger-inline-size: 32px;
          --rc-adaptive-menu-trigger-block-size: 32px;
          --rc-adaptive-menu-touch-target-overlap-inline-end: 8px;
        "
      >
        <button style="inline-size: 48px">One</button>
        <button style="inline-size: 48px">Two</button>
      </rc-adaptive-menu>
    </div>
  `);
  const row = (await screen.getByTestId('row').element()) as HTMLElement;
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;

  await settle(host);

  expect(host).toHaveAttribute('data-overflow');

  // The margin lives on the host itself, not on the internal
  // #overflow-trigger-target wrapper: #root has its own JS-managed fixed
  // width and doesn't align its content to its own trailing edge, so a
  // margin placed there has no visible effect on where the host renders in
  // an outer container. The host's own fit-content-sized box is what an
  // outer container's trailing alignment actually positions.
  expect(getComputedStyle(host).marginInlineEnd).toBe('-8px');
  expect(getComputedStyle(host).marginInlineStart).toBe('0px');

  const rowRect = row.getBoundingClientRect();
  const hostRect = host.getBoundingClientRect();
  const trigger = host.shadowRoot?.querySelector('#overflow-trigger') as HTMLElement;
  const triggerRect = trigger.getBoundingClientRect();

  // The 8px the touch target would otherwise reserve past the host is
  // given back, so the host's own box now extends past the row's trailing
  // edge instead of stopping flush with it.
  expect(hostRect.right).toBeCloseTo(rowRect.right + 8, 0);

  // The visible trigger inside sits at or past the row's own boundary too.
  expect(triggerRect.right).toBeGreaterThanOrEqual(rowRect.right);

  // A point just past the visible trigger's own edge still resolves to it:
  // the hit-slop pseudo-element is anchored to the trigger itself and
  // unaffected by any ancestor's margin, so the actual clickable region
  // keeps its full accessible touch-target size regardless of where the
  // margin repositioned the host. The hit-slop lives inside the shadow
  // root (unlike rc-button's light-DOM equivalent), so piercing shadow
  // boundaries requires shadowRoot.elementFromPoint, not
  // document.elementFromPoint, which stops at the host.
  const targetX = triggerRect.right + 2;
  const targetY = triggerRect.top + triggerRect.height / 2;

  expect(host.shadowRoot?.elementFromPoint(targetX, targetY)).toBe(trigger);
});

test('touch-target overlap still overhangs a shrink-to-fit trailing container, not just a fixed-width one', async () => {
  // A fixed-width flex-end row (the previous test above) never exercises
  // this: its container's own size doesn't depend on the host's margin, so
  // a plain `max-inline-size: 100%` on the host has nothing to feed back
  // into. A shrink-to-fit trailing group that hugs its single child — an
  // `auto` grid column pinned to its area's own end edge, an app bar's real
  // `#trailing` — does: the group's own auto size already nets out the
  // host's negative margin, so a plain 100% cap re-clamps the host down to
  // that already-shrunk size and quietly cancels the overlap instead of
  // letting it overhang.
  const screen = render(html`
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) auto; inline-size: 600px">
      <span>Page title</span>
      <nav data-testid="trailing" style="display: flex; justify-self: end">
        <rc-adaptive-menu
          data-testid="host"
          max-shown="0"
          style="
            --rc-adaptive-menu-trigger-inline-size: 32px;
            --rc-adaptive-menu-trigger-block-size: 32px;
            --rc-adaptive-menu-touch-target-overlap-inline-end: 8px;
          "
        >
          <button style="inline-size: 48px">One</button>
          <button style="inline-size: 48px">Two</button>
        </rc-adaptive-menu>
      </nav>
    </div>
  `);
  const trailing = (await screen.getByTestId('trailing').element()) as HTMLElement;
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;

  await settle(host);

  expect(host).toHaveAttribute('data-overflow');

  const trailingRect = trailing.getBoundingClientRect();
  const hostRect = host.getBoundingClientRect();

  // The host's own box overhangs the trailing group's edge by the overlap
  // amount, the same as it does against a fixed-width container.
  expect(hostRect.right).toBeCloseTo(trailingRect.right + 8, 0);
});

test('sizes a shrink-to-fit trailing grid area to only the actually-promoted actions, via plain CSS', async () => {
  const screen = render(html`
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) auto; inline-size: 600px">
      <span>Page title</span>
      <nav data-testid="trailing">
        <rc-adaptive-menu data-testid="host" max-shown="2" style="--rc-adaptive-menu-gap: 0px">
          <button type="button" slot="overflow">Utility</button>
        </rc-adaptive-menu>
      </nav>
    </div>
  `);
  const trailing = (await screen.getByTestId('trailing').element()) as HTMLElement;
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;

  await settle(host);

  for (const [label, priority] of [
    ['Filter', 20],
    ['View', 1],
  ] as const) {
    const action = document.createElement('button');

    action.type = 'button';
    action.textContent = label;
    action.dataset.priority = String(priority);
    action.style.cssText = 'flex: none; inline-size: 48px';
    host.append(action);
  }

  await settle(host);

  expect(host.$promotedActions).toHaveLength(2);
  expect(host.$promotedActions.map((action) => action.textContent)).toEqual(['Filter', 'View']);
  expect(trailing.getBoundingClientRect().width).toBeGreaterThanOrEqual(144);
});

test('keeps the outer popup open for a demoted submenu trigger and restores its orientation', async () => {
  const screen = render(html`
    <rc-adaptive-menu data-testid="host" max-shown="0">
      <rc-menu-button data-testid="submenu">
        <button data-testid="submenu-trigger" type="button" slot="trigger" aria-haspopup="menu">
          View
        </button>
      </rc-menu-button>
      <button data-testid="leaf" type="button">Settings</button>
    </rc-adaptive-menu>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;
  const submenu = (await screen.getByTestId('submenu').element()) as HTMLElement;
  const submenuTrigger = await screen.getByTestId('submenu-trigger').element();
  const leaf = await screen.getByTestId('leaf').element();

  await settle(host);

  expect(submenu).toHaveAttribute('orientation', 'vertical');
  host.openMenu('none');
  await userEvent.click(submenuTrigger);

  const popup = host.shadowRoot?.querySelector<HTMLElement>('#popup');

  expect(popup?.matches(':popover-open')).toBe(true);

  await userEvent.click(leaf);
  expect(popup?.matches(':popover-open')).toBe(false);

  host.remove();
  expect(submenu).not.toHaveAttribute('orientation');
});

test('uses real DOM focus for toolbar and overflow keyboard navigation', async () => {
  const screen = render(html`
    <rc-adaptive-menu data-testid="host" max-shown="1">
      <button data-testid="first">First</button>
      <button data-testid="second">Second</button>
      <button data-testid="third">Third</button>
    </rc-adaptive-menu>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;
  const first = (await screen.getByTestId('first').element()) as HTMLButtonElement;
  const second = (await screen.getByTestId('second').element()) as HTMLButtonElement;
  const third = (await screen.getByTestId('third').element()) as HTMLButtonElement;

  await settle(host);
  first.focus();
  await userEvent.keyboard('{ArrowRight}');

  const trigger = host.shadowRoot?.querySelector<HTMLButtonElement>('#overflow-trigger');

  expect(host.shadowRoot?.activeElement).toBe(trigger);

  trigger?.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }),
  );

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await vi.waitFor(() => expect(second.matches(':focus')).toBe(true));

  second.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }),
  );

  await vi.waitFor(() => expect(third.matches(':focus')).toBe(true));

  third.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }),
  );

  await vi.waitFor(() => expect(host.shadowRoot?.activeElement).toBe(trigger));
});

test('restores authored slot, role, and tabindex when disconnected', async () => {
  const screen = render(html`
    <rc-adaptive-menu data-testid="host" max-shown="0">
      <button data-testid="action" role="button" tabindex="2">Action</button>
    </rc-adaptive-menu>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;
  const action = (await screen.getByTestId('action').element()) as HTMLButtonElement;

  await settle(host);
  expect(action.slot).toBe('overflow');
  expect(action).toHaveAttribute('role', 'menuitem');

  host.remove();

  expect(action.slot).toBe('');
  expect(action).toHaveAttribute('role', 'button');
  expect(action).toHaveAttribute('tabindex', '2');
  expect(action).not.toHaveAttribute('data-rc-action-overflowed');
});

test('keeps controlled writes and imperative methods silent', async () => {
  const screen = render(html`
    <rc-adaptive-menu data-testid="host" max-shown="0">
      <button>Action</button>
    </rc-adaptive-menu>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;
  const toggled = vi.fn();

  host.addEventListener('rc-adaptive-menu-toggle', toggled);
  await settle(host);

  host.open = true;
  await host.updateComplete;
  expect(host.open).toBe(true);
  expect(toggled).not.toHaveBeenCalled();

  host.closeMenu();
  await host.updateComplete;
  expect(host.open).toBe(false);
  expect(toggled).not.toHaveBeenCalled();
});

test('dispatches requested state without mutating a controlled open value', async () => {
  const screen = render(html`
    <rc-adaptive-menu data-testid="host" max-shown="0">
      <button>Action</button>
    </rc-adaptive-menu>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;
  const toggled = vi.fn();

  host.open = false;
  host.addEventListener('rc-adaptive-menu-toggle', toggled);
  await settle(host);

  const $trigger = host.shadowRoot?.querySelector<HTMLButtonElement>('#overflow-trigger');

  $trigger?.click();

  expect(host.open).toBe(false);
  expect(toggled).toHaveBeenCalledTimes(1);
  expect(toggled.mock.calls[0]?.[0]).toMatchObject({ detail: { open: true } });

  host.open = undefined;
  $trigger?.click();
  await host.updateComplete;

  expect(host.open).toBe(true);
});

test('uses default-open only as the initial uncontrolled state', async () => {
  const screen = render(html`
    <rc-adaptive-menu data-testid="host" max-shown="0" default-open>
      <button>Action</button>
    </rc-adaptive-menu>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;

  await settle(host);
  expect(host.open).toBe(true);

  const $trigger = host.shadowRoot?.querySelector<HTMLButtonElement>('#overflow-trigger');

  $trigger?.click();
  await host.updateComplete;
  expect(host.open).toBe(false);

  host.defaultOpen = true;
  await host.updateComplete;
  expect(host.open).toBe(false);
});

test('tracks initially disabled actions and current DOM order', async () => {
  const screen = render(html`
    <rc-adaptive-menu data-testid="host" max-shown="1">
      <button data-testid="first" disabled>First</button>
      <button data-testid="second">Second</button>
    </rc-adaptive-menu>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;
  const first = (await screen.getByTestId('first').element()) as HTMLButtonElement;
  const second = (await screen.getByTestId('second').element()) as HTMLButtonElement;

  await settle(host);
  expect(host.$actions).toEqual([first, second]);

  first.disabled = false;
  host.prepend(second);
  await settle(host);

  expect(host.$actions).toEqual([second, first]);
  expect(host.$promotedActions).toEqual([second]);
});

test('resumes action tracking and layout observation after reconnect', async () => {
  const screen = render(html`
    <div data-testid="container">
      <rc-adaptive-menu data-testid="host" max-shown="0">
        <button data-testid="action">Action</button>
      </rc-adaptive-menu>
    </div>
  `);
  const $container = (await screen.getByTestId('container').element()) as HTMLDivElement;
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;
  const action = await screen.getByTestId('action').element();

  await settle(host);
  host.remove();
  $container.append(host);
  await settle(host);

  expect(host.$actions).toEqual([action]);
  expect(action).toHaveAttribute('data-rc-action-overflowed');
});

test('uses the explicit fallback state when the Popover API is unavailable', async () => {
  const screen = render(html`
    <rc-adaptive-menu data-testid="host" max-shown="0">
      <button>Action</button>
    </rc-adaptive-menu>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;

  await settle(host);

  const $popup = host.shadowRoot?.querySelector<HTMLDivElement>('#popup');

  Object.defineProperties($popup, {
    hidePopover: { value: undefined, configurable: true },
    showPopover: { value: undefined, configurable: true },
  });

  host.openMenu('none');
  await host.updateComplete;

  expect($popup).toHaveAttribute('data-fallback-open');
  expect(getComputedStyle($popup!).display).toBe('flex');
});

test('has no automated accessibility violations in its live open state', async () => {
  const screen = render(html`
    <rc-adaptive-menu data-testid="host" max-shown="1" label="Recipe actions">
      <button>Favorite</button>
      <button>Edit</button>
      <button>Delete</button>
    </rc-adaptive-menu>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAdaptiveMenu;

  await settle(host);
  host.openMenu();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

  await expectNoA11yViolations(host);
});
