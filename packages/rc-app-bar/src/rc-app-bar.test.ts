import { html } from 'lit';
import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import './define.js';
import type { RCAppBar } from './rc-app-bar.js';

const supportsCustomStates = 'states' in ElementInternals.prototype;

function shadowEl(host: RCAppBar, selector: string): HTMLElement {
  const el = host.shadowRoot?.querySelector<HTMLElement>(selector);

  if (!el) {
    throw new Error(`missing shadow element: ${selector}`);
  }

  return el;
}

function scrollTo(el: HTMLElement, top: number): void {
  el.scrollTop = top;
  el.dispatchEvent(new Event('scroll'));
}

test('applies the public elevation token to the host surface', async () => {
  const screen = render(html`
    <rc-app-bar data-testid="host" style="--rc-app-bar-shadow: rgb(1 2 3) 0 4px 8px">
      <span>Title</span>
    </rc-app-bar>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAppBar;

  await host.updateComplete;

  expect(getComputedStyle(host).boxShadow).toBe('rgb(1, 2, 3) 0px 4px 8px 0px');
});

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
  expect(shadowEl(host, '#title').querySelector('slot')?.assignedElements()).toEqual([title]);
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

  await vi.waitFor(() => {
    expect(host.style.getPropertyValue('--_rc-app-bar-collapse-distance')).not.toBe('');
  });
});

test('slot changes defer layout measurement to an animation frame', async () => {
  const screen = render(html`
    <rc-app-bar data-testid="host" center-symmetric>
      <span>Page title</span>
    </rc-app-bar>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAppBar;

  await host.updateComplete;

  await vi.waitFor(() => {
    expect(host.style.getPropertyValue('--_rc-app-bar-edge-size')).not.toBe('');
  });

  host.style.removeProperty('--_rc-app-bar-edge-size');
  shadowEl(host, '#title').querySelector('slot')?.dispatchEvent(new Event('slotchange'));

  expect(host.style.getPropertyValue('--_rc-app-bar-edge-size')).toBe('');

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  expect(host.style.getPropertyValue('--_rc-app-bar-edge-size')).not.toBe('');
});

test('reconnecting resumes deferred layout measurement', async () => {
  const screen = render(html`
    <div data-testid="container">
      <rc-app-bar data-testid="host" center-symmetric><span>Page title</span></rc-app-bar>
    </div>
  `);
  const container = (await screen.getByTestId('container').element()) as HTMLDivElement;
  const host = (await screen.getByTestId('host').element()) as RCAppBar;

  await host.updateComplete;

  await vi.waitFor(() => {
    expect(host.style.getPropertyValue('--_rc-app-bar-edge-size')).not.toBe('');
  });

  host.remove();
  host.style.removeProperty('--_rc-app-bar-edge-size');
  container.append(host);

  expect(host.style.getPropertyValue('--_rc-app-bar-edge-size')).toBe('');

  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  expect(host.style.getPropertyValue('--_rc-app-bar-edge-size')).not.toBe('');
});

test('layout measurement completes geometry reads before style writes', async () => {
  const operations: string[] = [];
  const screen = render(html`
    <rc-app-bar data-testid="host" variant="expanded">
      <span>Page title</span>
    </rc-app-bar>
  `);
  const host = (await screen.getByTestId('host').element()) as RCAppBar;
  const $leading = shadowEl(host, '#leading');
  const $title = shadowEl(host, '#title');
  const $trailing = shadowEl(host, '#trailing');
  const testable = host as unknown as {
    _measureLayout(): void;
    _setGeometryProperty(name: string, value: string): void;
  };

  await host.updateComplete;

  Object.defineProperties($leading, {
    offsetWidth: { configurable: true, get: () => (operations.push('read:leading'), 24) },
  });

  Object.defineProperties($title, {
    offsetHeight: { configurable: true, get: () => (operations.push('read:title-height'), 72) },
    offsetTop: { configurable: true, get: () => (operations.push('read:title-top'), 48) },
  });

  Object.defineProperties($trailing, {
    offsetWidth: { configurable: true, get: () => (operations.push('read:trailing'), 32) },
  });

  const computedStyle = vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    get paddingBlockStart() {
      operations.push('read:padding-start');

      return '8px';
    },
    get paddingBlockEnd() {
      operations.push('read:padding-end');

      return '8px';
    },
  } as CSSStyleDeclaration);
  const setGeometryProperty = vi.spyOn(testable, '_setGeometryProperty').mockImplementation(() => {
    operations.push('write');
  });

  try {
    testable._measureLayout();
  } finally {
    computedStyle.mockRestore();
    setGeometryProperty.mockRestore();
  }

  expect(operations.indexOf('write')).toBeGreaterThan(
    Math.max(
      operations.lastIndexOf('read:leading'),
      operations.lastIndexOf('read:trailing'),
      operations.lastIndexOf('read:title-height'),
      operations.lastIndexOf('read:title-top'),
      operations.lastIndexOf('read:padding-start'),
      operations.lastIndexOf('read:padding-end'),
    ),
  );
});

test('title-start-padding is unset when a leading icon is present', async () => {
  const screen = render(html`
    <rc-app-bar data-testid="host" style="--rc-app-bar-title-start-padding: 24px">
      <button slot="leading" aria-label="Back">&larr;</button>
      <span data-testid="title">Page title</span>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;

  await host.updateComplete;

  // _hasLeading (and the shadow #leading.empty class it drives) updates from
  // the slot's own 'slotchange' event, which fires asynchronously — a tick
  // after updateComplete, not within it.
  await vi.waitFor(() => {
    expect(getComputedStyle(shadowEl(host, '#title')).paddingInlineStart).toBe('0px');
  });
});

test('title-start-padding applies when the leading slot is empty', async () => {
  const screen = render(html`
    <rc-app-bar data-testid="host" style="--rc-app-bar-title-start-padding: 24px">
      <span data-testid="title">Page title</span>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;

  await host.updateComplete;

  await vi.waitFor(() => {
    expect(getComputedStyle(shadowEl(host, '#title')).paddingInlineStart).toBe('24px');
  });
});

test('center-symmetric: center slot remains at the host midpoint with asymmetric edge controls', async () => {
  const screen = render(html`
    <rc-app-bar data-testid="host" center-symmetric style="width: 600px">
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

test('default (no center-symmetric): capped center content centers within available space, not the viewport, with asymmetric edges', async () => {
  const screen = render(html`
    <rc-app-bar
      data-testid="host"
      style="width: 600px; --rc-app-bar-center-max-inline-size: 120px;"
    >
      <button slot="leading" style="width: 140px">Long leading</button>
      <span>Title</span>
      <input slot="center" style="width: 120px" aria-label="Search" />
      <button slot="trailing" style="width: 40px">X</button>
    </rc-app-bar>
  `);

  const host = (await screen.getByTestId('host').element()) as RCAppBar;

  await host.updateComplete;

  const hostRect = host.getBoundingClientRect();
  const leadingRect = shadowEl(host, '#leading').getBoundingClientRect();
  const trailingRect = shadowEl(host, '#trailing').getBoundingClientRect();
  const centerRect = shadowEl(host, '#center').getBoundingClientRect();
  const centerMidpoint = centerRect.left + centerRect.width / 2;
  const trackMidpoint = (leadingRect.right + trailingRect.left) / 2;
  const viewportMidpoint = hostRect.left + hostRect.width / 2;

  expect(centerRect.width).toBeCloseTo(120, 0);
  // Centers within the flexible track between leading and trailing...
  expect(centerMidpoint).toBeCloseTo(trackMidpoint, 0);
  // ...which is not the same point as the bar's true viewport midpoint when
  // leading and trailing are asymmetric widths, unlike center-symmetric mode
  // (see the test above).
  expect(Math.abs(centerMidpoint - viewportMidpoint)).toBeGreaterThan(10);
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

  let distance = 0;

  await vi.waitFor(() => {
    distance = Number.parseFloat(host.style.getPropertyValue('--_rc-app-bar-collapse-distance'));
    expect(distance).toBeGreaterThan(0);
  });

  scrollTo(sc, distance / 2);

  expect(
    Number.parseFloat(host.style.getPropertyValue('--rc-app-bar-collapse-progress')),
  ).toBeCloseTo(0.5, 1);

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
    <rc-app-bar data-testid="host" variant="expanded" scroll-behavior="collapse">
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
  expect(onScroll).toHaveBeenCalledWith(expect.objectContaining({ detail: { scrolled: true } }));
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

test('reduced motion zeros the spatial hide/show transition but only shortens the title effects fade', async () => {
  // A real media-emulation test would need Playwright's emulateMedia, which
  // this harness does not currently expose to component tests. This
  // test proves the split by construction: the host's own
  // translate transition (spatial) drops to 0s, while the title's opacity
  // fade-in animation (effects) is shortened rather than zeroed.
  const { appBarStyles } = await import('./rc-app-bar.styles.js');
  const css = appBarStyles.cssText;

  expect(css).toContain('@media (prefers-reduced-motion: reduce)');

  const motionBlock = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));

  expect(motionBlock).toMatch(/:host\s*{\s*transition-duration:\s*0s;/);
  expect(motionBlock).toContain('animation-duration: 70ms;');
  expect(motionBlock).not.toContain('animation-duration: 0s');
});
