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

function scrollTo(el: HTMLElement, top: number): void {
  el.scrollTop = top;
  el.dispatchEvent(new Event('scroll'));
}

test('renders one connected title with no implicit landmark role', async () => {
  const screen = render(html`
    <rc-app-bar data-testid="host">
      <button slot="leading" aria-label="Back">&larr;</button>
      <span data-testid="title">Page title</span>
      <button slot="trailing" aria-label="Settings">&#9881;</button>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  const title = (await screen.getByTestId('title').element()) as HTMLElement;
  await host.updateComplete;

  expect(host.getAttribute('role')).toBeNull();
  expect(host.variant).toBe('compact');
  expect(host.scrollBehavior).toBe('pinned');
  expect(title.isConnected).toBe(true);
  expect(host.querySelectorAll('[slot="expanded-title"]')).toHaveLength(0);
  expect(shadowEl(host, '#title').querySelector('slot')?.assignedElements()).toEqual([
    title,
  ]);
});

test('expanded variant keeps the same title node through controlled collapse', async () => {
  const screen = render(html`
    <rc-app-bar
      data-testid="host"
      variant="expanded"
      scroll-behavior="collapse"
      style="--rc-app-bar-transition-duration: 0s"
    >
      <div data-testid="title"><strong>Recipe</strong><small>Subtitle</small></div>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  const title = (await screen.getByTestId('title').element()) as HTMLElement;
  await host.updateComplete;

  expect(host.hasAttribute('data-collapsed')).toBe(false);
  expect(getComputedStyle(shadowEl(host, '#title')).gridRowStart).toBe('2');

  host.scrolled = true;
  await host.updateComplete;

  expect(title.isConnected).toBe(true);
  expect(host.hasAttribute('data-collapsed')).toBe(true);
  expect(getComputedStyle(shadowEl(host, '#title')).gridRowStart).toBe('1');
  if (supportsCustomStates) {
    expect(host.matches(':state(collapsed)')).toBe(true);
  }

  host.scrolled = false;
  await host.updateComplete;

  expect(title.isConnected).toBe(true);
  expect(host.hasAttribute('data-collapsed')).toBe(false);
});

test('expanded title row uses the title content natural height', async () => {
  const screen = render(html`
    <rc-app-bar data-testid="host" variant="expanded">
      <div style="height: 72px">Tall title</div>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  await host.updateComplete;

  const title = shadowEl(host, '#title');
  expect(title.offsetHeight).toBeGreaterThanOrEqual(72);
  expect(host.style.getPropertyValue('--_rc-app-bar-collapse-distance')).not.toBe('');
});

test('center slot remains at the host midpoint with asymmetric edge controls', async () => {
  const screen = render(html`
    <rc-app-bar data-testid="host" style="width: 600px">
      <button slot="leading" style="width: 140px">Long leading</button>
      <span>Title</span>
      <input slot="center" style="width: 120px" aria-label="Search" />
      <button slot="trailing" style="width: 40px">X</button>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  await host.updateComplete;

  await vi.waitFor(() => {
    const hostRect = host.getBoundingClientRect();
    const centerRect = shadowEl(host, '#center').getBoundingClientRect();
    expect(centerRect.left + centerRect.width / 2).toBeCloseTo(
      hostRect.left + hostRect.width / 2,
      0,
    );
  });
});

test('continuous collapse maps expanded-row scroll distance to progress', async () => {
  const screen = render(html`
    <div data-testid="sc" style="height: 100px; overflow-y: auto;">
      <rc-app-bar
        data-testid="host"
        variant="expanded"
        scroll-behavior="collapse"
        scroll-target="#collapse-scroll"
      >
        <div style="height: 80px">Recipe</div>
      </rc-app-bar>
      <div style="height: 1000px;"></div>
    </div>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  const sc = (await screen.getByTestId('sc').element()) as HTMLElement;
  sc.id = 'collapse-scroll';
  host.scrollTarget = sc;
  await host.updateComplete;

  const distance = Number.parseFloat(
    host.style.getPropertyValue('--_rc-app-bar-collapse-distance'),
  );
  expect(distance).toBeGreaterThan(0);

  scrollTo(sc, distance / 2);
  expect(Number.parseFloat(
    host.style.getPropertyValue('--rc-app-bar-collapse-progress'),
  )).toBeCloseTo(0.5, 1);
  expect(host.hasAttribute('data-collapsed')).toBe(false);

  // Firefox quantizes scrollTop to fractional device pixels, so cross the
  // measured endpoint instead of relying on exact equality.
  scrollTo(sc, distance + 2);
  expect(host.hasAttribute('data-collapsed')).toBe(true);
});

test('hide behavior hides downward and reveals upward or near the top', async () => {
  const screen = render(html`
    <div data-testid="sc" style="height: 100px; overflow-y: auto;">
      <div style="height: 1000px;"></div>
    </div>
    <rc-app-bar data-testid="host" scroll-behavior="hide">
      <span>Title</span>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  const sc = (await screen.getByTestId('sc').element()) as HTMLElement;
  host.scrollTarget = sc;
  await host.updateComplete;

  scrollTo(sc, 50);
  expect(host.hasAttribute('data-hidden')).toBe(true);
  if (supportsCustomStates) {
    expect(host.matches(':state(hidden)')).toBe(true);
  }

  scrollTo(sc, 40);
  expect(host.hasAttribute('data-hidden')).toBe(false);

  scrollTo(sc, 60);
  expect(host.hasAttribute('data-hidden')).toBe(true);

  scrollTo(sc, 0);
  expect(host.hasAttribute('data-hidden')).toBe(false);
});

test('controlled mode applies endpoints silently and ignores the observer', async () => {
  const screen = render(html`
    <div data-testid="sc" style="height: 100px; overflow-y: auto;">
      <div style="height: 1000px;"></div>
    </div>
    <rc-app-bar
      data-testid="host"
      variant="expanded"
      scroll-behavior="collapse"
    >
      <span>Title</span>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  const sc = (await screen.getByTestId('sc').element()) as HTMLElement;
  const onScroll = vi.fn();
  host.addEventListener('rc-app-bar-scroll', onScroll);

  host.scrolled = true;
  host.scrollTarget = sc;
  await host.updateComplete;

  expect(host.hasAttribute('data-scrolled')).toBe(true);
  expect(host.hasAttribute('data-collapsed')).toBe(true);

  scrollTo(sc, 50);
  expect(onScroll).not.toHaveBeenCalled();

  host.scrolled = false;
  await host.updateComplete;
  expect(host.hasAttribute('data-collapsed')).toBe(false);
});

test('uncontrolled threshold state and event behavior is preserved', async () => {
  const screen = render(html`
    <div data-testid="sc" style="height: 100px; overflow-y: auto;">
      <div style="height: 1000px;"></div>
    </div>
    <rc-app-bar data-testid="host" scroll-threshold="100"><span>Title</span></rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  const sc = (await screen.getByTestId('sc').element()) as HTMLElement;
  const onScroll = vi.fn();
  host.addEventListener('rc-app-bar-scroll', onScroll);
  host.scrollTarget = sc;
  await host.updateComplete;

  scrollTo(sc, 50);
  expect(host.hasAttribute('data-scrolled')).toBe(false);

  scrollTo(sc, 150);
  await host.updateComplete;
  expect(host.hasAttribute('data-scrolled')).toBe(true);
  expect(onScroll).toHaveBeenCalledWith(
    expect.objectContaining({ detail: { scrolled: true } }),
  );
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
  expect(host.hasAttribute('data-scrolled')).toBe(false);

  host.scrolled = undefined;
  await host.updateComplete;
  expect(host.hasAttribute('data-scrolled')).toBe(true);
});

test('missing selector and disconnect degrade silently', async () => {
  const screen = render(html`
    <rc-app-bar data-testid="host" scroll-target="#does-not-exist">
      <span>Title</span>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  await host.updateComplete;

  expect(host.scrolled).toBe(false);
  expect(() => host.remove()).not.toThrow();
});

test('has no automated accessibility violations in active layouts', async () => {
  const screen = render(html`
    <rc-app-bar
      data-testid="host"
      variant="expanded"
      scroll-behavior="collapse"
      style="--rc-app-bar-transition-duration: 0s"
    >
      <button slot="leading" aria-label="Back">&larr;</button>
      <div><strong>Recipe</strong><small>Subtitle</small></div>
      <input slot="center" type="search" aria-label="Search" />
      <button slot="trailing" aria-label="Edit">&#9998;</button>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  await host.updateComplete;
  await expectNoA11yViolations(host);

  host.scrolled = true;
  await host.updateComplete;
  await expectNoA11yViolations(host);
});
