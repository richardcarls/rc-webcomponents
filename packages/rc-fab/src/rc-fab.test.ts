import { html } from 'lit';
import { test, expect } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';

import './define.js';
import type { RCFab } from './rc-fab.js';

test('native button remains connected with author attributes intact', async () => {
  const screen = render(html`
    <rc-fab data-testid="host">
      <button type="button" id="fab-btn" aria-label="Create">
        <span aria-hidden="true">+</span>
      </button>
    </rc-fab>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;

  const $button = host.querySelector('button');

  expect($button?.isConnected).toBe(true);
  expect($button?.id).toBe('fab-btn');
  expect($button?.type).toBe('button');
});

test('icon-only: accessible name comes from the button aria-label', async () => {
  const screen = render(html`
    <rc-fab data-testid="host">
      <button type="button" aria-label="Create">
        <span aria-hidden="true">+</span>
      </button>
    </rc-fab>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;

  expect(host.querySelector('button')?.getAttribute('aria-label')).toBe('Create');
});

test('extended: accessible name comes from the button text content', async () => {
  const screen = render(html`
    <rc-fab data-testid="host">
      <button type="button">
        <span aria-hidden="true">+</span>
        Compose
      </button>
    </rc-fab>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;

  expect(host.querySelector('button')?.textContent?.trim()).toContain('Compose');
  expect(host.querySelector('button')?.hasAttribute('aria-label')).toBe(false);
});

test('disabled is set directly on the native button', async () => {
  const screen = render(html`
    <rc-fab data-testid="host">
      <button type="button" aria-label="Create" disabled></button>
    </rc-fab>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;

  expect(host.querySelector('button')?.disabled).toBe(true);
});

test('position attribute reflects to the host element', async () => {
  const screen = render(html`
    <rc-fab data-testid="host" position="block-start-inline-start">
      <button type="button" aria-label="Create"></button>
    </rc-fab>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;

  expect(host.getAttribute('position')).toBe('block-start-inline-start');
  expect(host.position).toBe('block-start-inline-start');
});

test('has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-fab data-testid="host">
      <button type="button" aria-label="Create">
        <span aria-hidden="true">+</span>
      </button>
    </rc-fab>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;
  await expectNoA11yViolations(host);
});

test('scroll-reveal attribute reflects to the host element', async () => {
  const screen = render(html`
    <rc-fab data-testid="host" scroll-reveal>
      <button type="button" aria-label="Back to top"></button>
    </rc-fab>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;

  expect(host.getAttribute('scroll-reveal')).not.toBeNull();
  expect(host.scrollReveal).toBe(true);
});

test('scroll-reveal: has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-fab data-testid="host" scroll-reveal>
      <button type="button" aria-label="Back to top">
        <span aria-hidden="true">↑</span>
      </button>
    </rc-fab>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;
  await expectNoA11yViolations(host);
});

test('scroll-reveal JS fallback: sets scroll-below-threshold below threshold', async () => {
  if (CSS.supports('animation-timeline: scroll()')) return;

  const screen = render(html`
    <rc-fab data-testid="host" scroll-reveal>
      <button type="button" aria-label="Back to top"></button>
    </rc-fab>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;

  // Document scroll is 0, which is less than the default 300px threshold
  expect(host.hasAttribute('scroll-below-threshold')).toBe(true);
});

test('scroll-reveal JS fallback: removes scroll-below-threshold when scroll-reveal is disabled', async () => {
  if (CSS.supports('animation-timeline: scroll()')) return;

  const screen = render(html`
    <rc-fab data-testid="host" scroll-reveal>
      <button type="button" aria-label="Back to top"></button>
    </rc-fab>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;
  expect(host.hasAttribute('scroll-below-threshold')).toBe(true);

  host.scrollReveal = false;
  await host.updateComplete;

  expect(host.hasAttribute('scroll-below-threshold')).toBe(false);
});

test('scroll-reveal reduced motion shortens the opacity/visibility fade in both fallback paths rather than removing it', async () => {
  // A real media-emulation test would need Playwright's emulateMedia, which
  // this harness does not currently expose to component tests. This
  // test proves the split by construction: the reveal is
  // opacity/visibility only (no translate or scale), so reduced motion
  // shortens it in both the scroll-timeline path and the JS-transition
  // fallback rather than eliminating it outright.
  const { fabStyles } = await import('./rc-fab.styles.js');
  const css = fabStyles.cssText;

  const timelineBlock = css.slice(
    css.indexOf('@supports (animation-timeline'),
    css.indexOf('@supports not (animation-timeline'),
  );

  expect(timelineBlock).toContain('@media (prefers-reduced-motion: reduce)');
  expect(timelineBlock).toMatch(
    /animation-range:\s*calc\(var\(--rc-fab-scroll-threshold, 300px\) - 8px\)/,
  );

  const fallbackBlock = css.slice(css.indexOf('@supports not (animation-timeline'));

  expect(fallbackBlock).toContain('@media (prefers-reduced-motion: reduce)');

  const fallbackMotionBlock = fallbackBlock.slice(
    fallbackBlock.indexOf('@media (prefers-reduced-motion: reduce)'),
  );

  expect(fallbackMotionBlock).toContain('opacity 50ms linear');
  expect(fallbackMotionBlock).not.toContain('transition: none');
});

/**
 * Which physical viewport edges each corner pins to, written out per writing
 * mode rather than derived. In vertical-rl the block axis runs right to left
 * and the inline axis top to bottom.
 */
const CORNER_EDGES: Record<string, Record<string, ['top' | 'bottom', 'left' | 'right']>> = {
  'horizontal-tb': {
    'block-end-inline-end': ['bottom', 'right'],
    'block-end-inline-start': ['bottom', 'left'],
    'block-start-inline-end': ['top', 'right'],
    'block-start-inline-start': ['top', 'left'],
  },
  'vertical-rl': {
    'block-end-inline-end': ['bottom', 'left'],
    'block-end-inline-start': ['top', 'left'],
    'block-start-inline-end': ['bottom', 'right'],
    'block-start-inline-start': ['top', 'right'],
  },
};

test.each(
  Object.entries(CORNER_EDGES).flatMap(([writingMode, corners]) =>
    Object.entries(corners).map(([corner, edges]) => [writingMode, corner, edges] as const),
  ),
)('pins to the %s %s corner', async (writingMode, corner, [vertical, horizontal]) => {
  const screen = render(html`
    <div style="writing-mode: ${writingMode};">
      <rc-fab
        data-testid="host"
        position=${corner}
        style="--rc-fab-inset-block: 10px; --rc-fab-inset-inline: 10px;"
      >
        <button type="button" aria-label="Create">+</button>
      </rc-fab>
    </div>
  `);
  const host = (await screen.getByTestId('host').element()) as RCFab;

  await host.updateComplete;

  const box = host.getBoundingClientRect();
  const distance = {
    top: box.top,
    bottom: window.innerHeight - box.bottom,
    left: box.left,
    right: window.innerWidth - box.right,
  };

  expect(distance[vertical]).toBeCloseTo(10, 0);
  expect(distance[horizontal]).toBeCloseTo(10, 0);
});
