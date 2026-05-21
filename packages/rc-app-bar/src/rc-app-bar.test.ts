import { html } from 'lit';
import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

import './define';
import type { RCAppBar } from './rc-app-bar';

const supportsCustomStates = 'states' in ElementInternals.prototype;

function shadowEl(host: RCAppBar, selector: string): HTMLElement {
  const el = host.shadowRoot?.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`missing shadow element: ${selector}`);

  return el;
}

// Headless Firefox only flushes natively-queued scroll events on refresh
// ticks; dispatching the event after moving scrollTop makes delivery
// deterministic in both browsers.
function scrollTo(el: HTMLElement, top: number): void {
  el.scrollTop = top;
  el.dispatchEvent(new Event('scroll'));
}

test('renders slotted content with no implicit landmark role', async () => {
  const screen = render(html`
    <rc-app-bar data-testid="host">
      <button slot="leading" aria-label="Back">&larr;</button>
      <span>Page title</span>
      <button slot="trailing" aria-label="Settings">&#9881;</button>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  await host.updateComplete;

  expect(host.getAttribute('role')).toBeNull();
  expect(host.querySelector('[slot="leading"]')?.isConnected).toBe(true);
  expect(host.variant).toBe('small');

  // Small variant renders no expanded row box.
  expect(getComputedStyle(shadowEl(host, '#expanded')).display).toBe('none');
});

test('medium variant exposes exactly one title to AT per scroll state', async () => {
  // Transitions never advance in headless Firefox; zeroing the duration
  // token asserts the end states without depending on animation timing.
  const screen = render(html`
    <rc-app-bar
      data-testid="host"
      variant="medium"
      style="--rc-app-bar-transition-duration: 0s"
    >
      <span>Recipe</span>
      <h1 slot="expanded-title">Recipe</h1>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  await host.updateComplete;

  const title = shadowEl(host, '#title');
  const expanded = shadowEl(host, '#expanded');

  // Unscrolled: expanded row active, inline title hidden from AT. The
  // expanded-title slotchange lands in a second render cycle, so wait.
  await vi.waitFor(() => expect(title.getAttribute('aria-hidden')).toBe('true'));
  expect(expanded.getAttribute('aria-hidden')).toBeNull();
  expect(getComputedStyle(expanded).visibility).toBe('visible');

  host.scrolled = true;
  await host.updateComplete;

  expect(title.getAttribute('aria-hidden')).toBeNull();
  expect(expanded.getAttribute('aria-hidden')).toBe('true');
  await vi.waitFor(() =>
    expect(getComputedStyle(expanded).visibility).toBe('hidden'),
  );
});

test('medium variant without expanded-title content keeps the inline title visible', async () => {
  const screen = render(html`
    <rc-app-bar data-testid="host" variant="medium">
      <span>Title only</span>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  await host.updateComplete;

  const title = shadowEl(host, '#title');
  expect(title.getAttribute('aria-hidden')).toBeNull();
  expect(getComputedStyle(title).visibility).toBe('visible');
});

test('controlled mode: host writes apply silently and ignore the observer', async () => {
  const screen = render(html`
    <div data-testid="sc" style="height: 100px; overflow-y: auto;">
      <div style="height: 1000px;"></div>
    </div>
    <rc-app-bar data-testid="host"><span>Title</span></rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  const sc = (await screen.getByTestId('sc').element()) as HTMLElement;
  const onScroll = vi.fn();
  host.addEventListener('rc-app-bar-scroll', onScroll);

  // Controlled before any observation: scrolled state applies, no events.
  host.scrolled = true;
  host.scrollTarget = sc;
  await host.updateComplete;

  expect(host.hasAttribute('data-scrolled')).toBe(true);
  if (supportsCustomStates) {
    expect(host.matches(':state(scrolled)')).toBe(true);
  }

  scrollTo(sc, 50);

  host.scrolled = false;
  await host.updateComplete;

  expect(host.hasAttribute('data-scrolled')).toBe(false);
  if (supportsCustomStates) {
    expect(host.matches(':state(scrolled)')).toBe(false);
  }
  expect(onScroll).not.toHaveBeenCalled();
});

test('uncontrolled mode: selector scroll-target drives state and fires events', async () => {
  const screen = render(html`
    <div id="rc-app-bar-sc" data-testid="sc" style="height: 100px; overflow-y: auto;">
      <div style="height: 1000px;"></div>
    </div>
    <rc-app-bar data-testid="host" scroll-target="#rc-app-bar-sc">
      <span>Title</span>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  const sc = (await screen.getByTestId('sc').element()) as HTMLElement;
  const onScroll = vi.fn();
  host.addEventListener('rc-app-bar-scroll', onScroll);
  await host.updateComplete;

  scrollTo(sc, 50);
  await host.updateComplete;

  expect(host.hasAttribute('data-scrolled')).toBe(true);
  expect(onScroll).toHaveBeenCalledTimes(1);
  expect((onScroll.mock.calls[0][0] as CustomEvent).detail).toEqual({ scrolled: true });

  scrollTo(sc, 0);
  await host.updateComplete;

  expect(host.hasAttribute('data-scrolled')).toBe(false);
  expect(onScroll).toHaveBeenCalledTimes(2);
});

test('scroll-threshold is honored', async () => {
  const screen = render(html`
    <div id="rc-app-bar-sc-threshold" data-testid="sc" style="height: 100px; overflow-y: auto;">
      <div style="height: 1000px;"></div>
    </div>
    <rc-app-bar
      data-testid="host"
      scroll-target="#rc-app-bar-sc-threshold"
      scroll-threshold="100"
    >
      <span>Title</span>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  const sc = (await screen.getByTestId('sc').element()) as HTMLElement;
  await host.updateComplete;

  scrollTo(sc, 50);
  await host.updateComplete;
  expect(host.hasAttribute('data-scrolled')).toBe(false);

  scrollTo(sc, 150);
  await host.updateComplete;
  expect(host.hasAttribute('data-scrolled')).toBe(true);
});

test('releasing controlled mode hands state back to the observer', async () => {
  const screen = render(html`
    <div data-testid="sc" style="height: 100px; overflow-y: auto;">
      <div style="height: 1000px;"></div>
    </div>
    <rc-app-bar data-testid="host"><span>Title</span></rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  const sc = (await screen.getByTestId('sc').element()) as HTMLElement;

  host.scrolled = false;
  host.scrollTarget = sc;
  await host.updateComplete;

  scrollTo(sc, 50);
  await host.updateComplete;
  expect(host.hasAttribute('data-scrolled')).toBe(false);

  // Release: the observer re-evaluates the already-scrolled container.
  host.scrolled = undefined;
  await host.updateComplete;

  expect(host.hasAttribute('data-scrolled')).toBe(true);
});

test('missing scroll-target selector degrades silently', async () => {
  const screen = render(html`
    <rc-app-bar data-testid="host" scroll-target="#does-not-exist">
      <span>Title</span>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  await host.updateComplete;

  expect(host.hasAttribute('data-scrolled')).toBe(false);
  expect(host.scrolled).toBe(false);
});

test('disconnecting the bar stops observation', async () => {
  const screen = render(html`
    <div data-testid="sc" style="height: 100px; overflow-y: auto;">
      <div style="height: 1000px;"></div>
    </div>
    <rc-app-bar data-testid="host"><span>Title</span></rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  const sc = (await screen.getByTestId('sc').element()) as HTMLElement;
  const onScroll = vi.fn();
  host.addEventListener('rc-app-bar-scroll', onScroll);

  host.scrollTarget = sc;
  await host.updateComplete;

  host.remove();
  scrollTo(sc, 50);

  expect(onScroll).not.toHaveBeenCalled();
});

test('has no automated accessibility violations in both medium states', async () => {
  // Zeroed transitions: axe samples mid-transition opacity for contrast,
  // and transitions never advance in headless Firefox.
  const screen = render(html`
    <rc-app-bar
      data-testid="host"
      variant="medium"
      style="--rc-app-bar-transition-duration: 0s"
    >
      <button slot="leading" aria-label="Back">&larr;</button>
      <span>Recipe</span>
      <button slot="trailing" aria-label="Edit">&#9998;</button>
      <h1 slot="expanded-title">Recipe</h1>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  await host.updateComplete;

  const title = shadowEl(host, '#title');

  // Expanded (resting) state — wait for the slotchange-driven second render
  // so the audited state is the intended one.
  await vi.waitFor(() => expect(title.getAttribute('aria-hidden')).toBe('true'));
  await expectNoA11yViolations(host);

  // Collapsed (scrolled) state — the aria-hidden swap is live here. Wait for
  // the inline title's fade-in to finish; axe samples mid-transition opacity
  // when computing color contrast.
  host.scrolled = true;
  await host.updateComplete;
  await vi.waitFor(() => expect(getComputedStyle(title).opacity).toBe('1'));
  await expectNoA11yViolations(host);
});
