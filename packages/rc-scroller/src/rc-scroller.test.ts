import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import './define.js';
import type { RCScroller } from './rc-scroller.js';

test('uses the custom element host as the native block scrollport', async () => {
  const screen = render(html`
    <rc-scroller data-testid="host" style="block-size: 8rem; inline-size: 12rem;">
      <div style="block-size: 24rem;">Scrollable content</div>
    </rc-scroller>
  `);
  const host = (await screen.getByTestId('host').element()) as RCScroller;

  await host.updateComplete;

  expect(getComputedStyle(host).overflowY).toBe('auto');
  expect(host.scrollHeight).toBeGreaterThan(host.clientHeight);

  host.scrollTop = 48;
  expect(host.scrollTop).toBeCloseTo(48);
});

test('supports an inline scroll axis', async () => {
  const screen = render(html`
    <rc-scroller axis="inline" data-testid="host" style="block-size: 4rem; inline-size: 8rem;">
      <div style="block-size: 2rem; inline-size: 24rem;">Wide content</div>
    </rc-scroller>
  `);
  const host = (await screen.getByTestId('host').element()) as RCScroller;

  await host.updateComplete;

  expect(getComputedStyle(host).overflowX).toBe('auto');
  expect(getComputedStyle(host).overflowY).toBe('hidden');
  expect(host.scrollWidth).toBeGreaterThan(host.clientWidth);
});

test('lays out content and fullbleed direct children without changing source order', async () => {
  const screen = render(html`
    <rc-scroller layout="content" data-testid="host" style="inline-size: 30rem;">
      <section data-testid="content">Content</section>
      <section data-testid="fullbleed" data-rc-scroller-span="fullbleed">Fullbleed</section>
      <section data-testid="content-two">More content</section>
    </rc-scroller>
  `);
  const host = (await screen.getByTestId('host').element()) as RCScroller;
  const content = await screen.getByTestId('content').element();
  const fullbleed = await screen.getByTestId('fullbleed').element();

  await host.updateComplete;

  expect(getComputedStyle(content).gridColumnStart).toBe('content');
  expect(getComputedStyle(fullbleed).gridColumnStart).toBe('fullbleed');

  expect(Array.from(host.children).map((child) => child.textContent?.trim())).toEqual([
    'Content',
    'Fullbleed',
    'More content',
  ]);
});

test('accepts content sizing tokens', async () => {
  const screen = render(html`
    <rc-scroller
      layout="content"
      data-testid="host"
      style="inline-size: 30rem; --rc-scroller-content-padding-inline: 2rem; --rc-scroller-content-max-inline-size: 20rem;"
    >
      <section data-testid="content">Content</section>
    </rc-scroller>
  `);
  const host = (await screen.getByTestId('host').element()) as RCScroller;
  const content = await screen.getByTestId('content').element();

  await host.updateComplete;

  expect(content.getBoundingClientRect().width).toBeCloseTo(320);
  expect(content.getBoundingClientRect().left - host.getBoundingClientRect().left).toBeCloseTo(80);
});

test('leaves landmark and focus semantics to the author', async () => {
  const screen = render(html`<rc-scroller data-testid="host">Content</rc-scroller>`);
  const host = (await screen.getByTestId('host').element()) as RCScroller;

  await host.updateComplete;

  expect(host.hasAttribute('role')).toBe(false);
  expect(host.hasAttribute('tabindex')).toBe(false);
});

test('has no automated accessibility violations with an author-provided landmark', async () => {
  const screen = render(html`
    <rc-scroller data-testid="host" role="region" aria-label="Recipe list">
      <article>
        <h2>Apple pie</h2>
        <p>Flaky crust and bright apples.</p>
      </article>
    </rc-scroller>
  `);
  const host = (await screen.getByTestId('host').element()) as RCScroller;

  await host.updateComplete;
  await expectNoA11yViolations(host);
});

/**
 * Sets scrollLeft/scrollTop, dispatches scroll, and waits for the frame the
 * boundary evaluation is coalesced into.
 */
async function scrollTo(el: RCScroller, { top, left }: { top?: number; left?: number }) {
  if (top !== undefined) {
    el.scrollTop = top;
  }

  if (left !== undefined) {
    el.scrollLeft = left;
  }

  el.dispatchEvent(new Event('scroll'));

  await new Promise((resolve) => requestAnimationFrame(resolve));
}

test('reflects at-inline-start/at-inline-end on an inline scroller', async () => {
  const screen = render(html`
    <rc-scroller axis="inline" data-testid="host" style="block-size: 4rem; inline-size: 8rem;">
      <div style="block-size: 2rem; inline-size: 24rem;">Wide content</div>
    </rc-scroller>
  `);
  const host = (await screen.getByTestId('host').element()) as RCScroller;

  await host.updateComplete;

  // Freshly connected, scrolled to the start: at-inline-start, not at-inline-end.
  expect(host.hasAttribute('at-inline-start')).toBe(true);
  expect(host.hasAttribute('at-inline-end')).toBe(false);

  const maxScrollLeft = host.scrollWidth - host.clientWidth;

  await scrollTo(host, { left: maxScrollLeft });
  await host.updateComplete;
  expect(host.hasAttribute('at-inline-start')).toBe(false);
  expect(host.hasAttribute('at-inline-end')).toBe(true);

  await scrollTo(host, { left: maxScrollLeft / 2 });
  await host.updateComplete;
  expect(host.hasAttribute('at-inline-start')).toBe(false);
  expect(host.hasAttribute('at-inline-end')).toBe(false);
});

test('maps negative RTL scroll offsets to logical inline boundaries', async () => {
  const screen = render(html`
    <rc-scroller
      axis="inline"
      dir="rtl"
      data-testid="host"
      style="block-size: 4rem; inline-size: 8rem;"
    >
      <div style="block-size: 2rem; inline-size: 24rem;">Wide content</div>
    </rc-scroller>
  `);
  const $host = (await screen.getByTestId('host').element()) as RCScroller;

  await $host.updateComplete;

  const maxScrollLeft = $host.scrollWidth - $host.clientWidth;

  await scrollTo($host, { left: -maxScrollLeft });
  await $host.updateComplete;

  expect($host.hasAttribute('at-inline-start')).toBe(false);
  expect($host.hasAttribute('at-inline-end')).toBe(true);
});

test('reflects at-block-start/at-block-end on a block scroller', async () => {
  const screen = render(html`
    <rc-scroller data-testid="host" style="block-size: 4rem; inline-size: 8rem;">
      <div style="block-size: 24rem;">Tall content</div>
    </rc-scroller>
  `);
  const host = (await screen.getByTestId('host').element()) as RCScroller;

  await host.updateComplete;

  expect(host.hasAttribute('at-block-start')).toBe(true);
  expect(host.hasAttribute('at-block-end')).toBe(false);

  const maxScrollTop = host.scrollHeight - host.clientHeight;

  await scrollTo(host, { top: maxScrollTop });
  await host.updateComplete;
  expect(host.hasAttribute('at-block-start')).toBe(false);
  expect(host.hasAttribute('at-block-end')).toBe(true);
});

test('reports both edges reached on the non-scrollable axis', async () => {
  const screen = render(html`
    <rc-scroller axis="inline" data-testid="host" style="block-size: 4rem; inline-size: 8rem;">
      <div style="block-size: 24rem; inline-size: 24rem;">Wide and tall content</div>
    </rc-scroller>
  `);
  const host = (await screen.getByTestId('host').element()) as RCScroller;

  await host.updateComplete;

  // axis="inline" forces overflow-block: hidden — the block axis can't
  // scroll at all, so both of its boundaries count as already reached.
  expect(host.hasAttribute('at-block-start')).toBe(true);
  expect(host.hasAttribute('at-block-end')).toBe(true);
});

test('reports both edges reached when content does not overflow', async () => {
  const screen = render(html`
    <rc-scroller axis="inline" data-testid="host" style="block-size: 4rem; inline-size: 20rem;">
      <div style="inline-size: 8rem;">Short content</div>
    </rc-scroller>
  `);
  const host = (await screen.getByTestId('host').element()) as RCScroller;

  await host.updateComplete;

  expect(host.hasAttribute('at-inline-start')).toBe(true);
  expect(host.hasAttribute('at-inline-end')).toBe(true);
});

test('maps boundaries through a vertical-rl writing mode', async () => {
  const screen = render(html`
    <rc-scroller
      data-testid="host"
      style="writing-mode: vertical-rl; block-size: 4rem; inline-size: 8rem;"
    >
      <div style="block-size: 24rem;">Content stacked right to left</div>
    </rc-scroller>
  `);
  const host = (await screen.getByTestId('host').element()) as RCScroller;

  await host.updateComplete;

  // The block axis runs horizontally, starting at the right edge.
  expect(host.hasAttribute('at-block-start')).toBe(true);
  expect(host.hasAttribute('at-block-end')).toBe(false);

  const maxScrollLeft = host.scrollWidth - host.clientWidth;

  await scrollTo(host, { left: -maxScrollLeft });
  await host.updateComplete;

  expect(host.hasAttribute('at-block-start')).toBe(false);
  expect(host.hasAttribute('at-block-end')).toBe(true);
});

test('evaluates boundaries once per frame however many scroll events arrive', async () => {
  const screen = render(html`
    <rc-scroller data-testid="host" style="block-size: 4rem; inline-size: 8rem;">
      <div style="block-size: 24rem;">Tall content</div>
    </rc-scroller>
  `);
  const host = (await screen.getByTestId('host').element()) as RCScroller;

  await host.updateComplete;

  const reads = vi.spyOn(host, 'scrollHeight', 'get');

  for (let i = 0; i < 10; i += 1) {
    host.dispatchEvent(new Event('scroll'));
  }

  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(reads).toHaveBeenCalledTimes(1);
});
