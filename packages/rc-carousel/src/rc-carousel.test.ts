import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import { unexpectedOverflow } from '../../../test-helpers/rendered-ui.js';
import './define.js';
import type { RCCarousel } from './rc-carousel.js';
import type { RCCarouselChangeDetail } from './rc-carousel.js';

async function settle(carousel: RCCarousel): Promise<void> {
  await carousel.updateComplete;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Comfortably past the component's 120ms settle debounce plus the
// browser's own async dispatch of the `scroll` events our scrollLeft
// writes trigger.
const SETTLE_WAIT_MS = 300;

function firePointerEvent(target: Element, type: string, init: PointerEventInit = {}) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      isPrimary: true,
      pointerType: 'mouse',
      ...init,
    }),
  );
}

function threeItems() {
  return html`
    <rc-carousel
      data-testid="carousel"
      aria-label="Featured recipes"
      style="inline-size: 20rem; block-size: 10rem"
    >
      <rc-carousel-item data-testid="item-0">One</rc-carousel-item>
      <rc-carousel-item data-testid="item-1">Two</rc-carousel-item>
      <rc-carousel-item data-testid="item-2">Three</rc-carousel-item>
    </rc-carousel>
  `;
}

test('renders with APG carousel roles and preserves the authored label', async () => {
  const screen = render(threeItems());
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  expect(carousel.getAttribute('role')).toBe('group');
  expect(carousel.getAttribute('aria-roledescription')).toBe('carousel');
  expect(carousel.getAttribute('aria-label')).toBe('Featured recipes');

  const item = (await screen.getByTestId('item-0').element()) as HTMLElement;

  expect(item.getAttribute('role')).toBe('group');
  expect(item.getAttribute('aria-roledescription')).toBe('slide');
});

test('preserves an author-provided label instead of the fallback', async () => {
  const screen = render(html`
    <rc-carousel data-testid="carousel" aria-label="Photos of Beef Stew">
      <rc-carousel-item>One</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  expect(carousel.getAttribute('aria-label')).toBe('Photos of Beef Stew');
});

test('warns concisely when its accessible name is missing', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const screen = render(html`
    <rc-carousel data-testid="carousel">
      <rc-carousel-item>One</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  expect(warn).toHaveBeenCalledExactlyOnceWith(
    "[rc-carousel] No aria-label/aria-labelledby set. Provide one describing this carousel's content.",
  );

  warn.mockRestore();
});

test('defaultActiveIndex seeds uncontrolled activeIndex, and stops applying once set', async () => {
  const screen = render(html`
    <rc-carousel data-testid="carousel" aria-label="Test carousel" default-active-index="1">
      <rc-carousel-item>One</rc-carousel-item>
      <rc-carousel-item>Two</rc-carousel-item>
      <rc-carousel-item>Three</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  expect(carousel.activeIndex).toBe(1);

  carousel.next();
  await settle(carousel);
  expect(carousel.activeIndex).toBe(2);

  // Once user interaction establishes uncontrolled state, later defaults no
  // longer replace it.
  carousel.defaultActiveIndex = 0;
  await settle(carousel);
  expect(carousel.activeIndex).toBe(2);
});

test('a controlled activeIndex overrides uncontrolled state and does not self-advance', async () => {
  const screen = render(threeItems());
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  carousel.activeIndex = 0;
  await settle(carousel);
  expect(carousel.activeIndex).toBe(0);

  const items = Array.from(carousel.querySelectorAll('rc-carousel-item'));

  expect(items[0]?.hasAttribute('aria-hidden')).toBe(false);
  expect(items[1]?.hasAttribute('aria-hidden')).toBe(true);

  carousel.activeIndex = 2;
  await settle(carousel);
  expect(items[0]?.hasAttribute('aria-hidden')).toBe(true);
  expect(items[2]?.hasAttribute('aria-hidden')).toBe(false);

  carousel.activeIndex = 0;
  await settle(carousel);

  const changed = vi.fn();

  carousel.addEventListener('rc-carousel-change', changed);
  carousel.next();
  await settle(carousel);

  // A controlled consumer must feed the new index back in themselves —
  // the component reports the change but does not silently apply it.
  expect(changed).toHaveBeenCalledTimes(1);
  expect(carousel.activeIndex).toBe(0);

  carousel.activeIndex = undefined;
  carousel.next();
  await settle(carousel);

  expect(carousel.activeIndex).toBe(1);
});

test('next/previous/goToIndex report rc-carousel-change with the right trigger and clamp at the ends', async () => {
  const screen = render(threeItems());
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  const changed = vi.fn<(event: CustomEvent<RCCarouselChangeDetail>) => void>();

  carousel.addEventListener('rc-carousel-change', changed);

  carousel.next();
  await settle(carousel);
  expect(changed).toHaveBeenCalledTimes(1);
  expect(changed.mock.calls[0]?.[0]?.detail).toEqual({ index: 1, trigger: 'api' });

  carousel.goToIndex(2);
  await settle(carousel);
  expect(changed).toHaveBeenCalledTimes(2);
  expect(changed.mock.calls[1]?.[0]?.detail).toEqual({ index: 2, trigger: 'api' });

  // Already at the last slide — no further change to report.
  carousel.next();
  await settle(carousel);
  expect(changed).toHaveBeenCalledTimes(2);

  carousel.previous();
  await settle(carousel);
  expect(changed).toHaveBeenCalledTimes(3);
  expect(changed.mock.calls[2]?.[0]?.detail).toEqual({ index: 1, trigger: 'api' });
});

test('has no accessibility violations at rest', async () => {
  const screen = render(threeItems());
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);
  await expectNoA11yViolations(carousel);
});

test('navigation buttons step with a button trigger and use aria-disabled (not disabled) at the ends', async () => {
  const screen = render(html`
    <rc-carousel data-testid="carousel" aria-label="Test carousel" navigation>
      <rc-carousel-item>One</rc-carousel-item>
      <rc-carousel-item>Two</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  const previous = carousel.renderRoot.querySelector<HTMLButtonElement>(
    '[aria-label="Previous slide"]',
  )!;
  const next = carousel.renderRoot.querySelector<HTMLButtonElement>('[aria-label="Next slide"]')!;

  // At the first slide: Previous is inert but still a real, focusable
  // button — native `disabled` would remove it from the Tab sequence
  // entirely, so a keyboard/screen-reader user reaching the boundary could
  // no longer even locate it to confirm they're at the end.
  expect(previous.getAttribute('aria-disabled')).toBe('true');
  expect(previous.disabled).toBe(false);
  expect(next.getAttribute('aria-disabled')).toBe('false');

  const changed = vi.fn<(event: CustomEvent<RCCarouselChangeDetail>) => void>();

  carousel.addEventListener('rc-carousel-change', changed);
  next.click();
  await settle(carousel);

  expect(changed.mock.calls[0]?.[0]?.detail).toEqual({ index: 1, trigger: 'button' });
  expect(next.getAttribute('aria-disabled')).toBe('true');

  previous.click();
  await settle(carousel);
  expect(changed.mock.calls[1]?.[0]?.detail).toEqual({ index: 0, trigger: 'button' });
});

test('loop wraps navigation seamlessly instead of clamping at the ends', async () => {
  const screen = render(html`
    <rc-carousel data-testid="carousel" aria-label="Test carousel" navigation loop>
      <rc-carousel-item>One</rc-carousel-item>
      <rc-carousel-item>Two</rc-carousel-item>
      <rc-carousel-item>Three</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  const previous = carousel.renderRoot.querySelector<HTMLButtonElement>(
    '[aria-label="Previous slide"]',
  )!;
  const next = carousel.renderRoot.querySelector<HTMLButtonElement>('[aria-label="Next slide"]')!;

  // Never disabled when looping — there's always somewhere to go.
  expect(previous.getAttribute('aria-disabled')).toBe('false');
  expect(next.getAttribute('aria-disabled')).toBe('false');

  const changed = vi.fn<(event: CustomEvent<RCCarouselChangeDetail>) => void>();

  carousel.addEventListener('rc-carousel-change', changed);
  previous.click();
  await settle(carousel);

  expect(changed.mock.calls[0]?.[0]?.detail).toEqual({ index: 2, trigger: 'button' });
  expect(carousel.activeIndex).toBe(2);
});

test('loop clones the lead/trail slides but excludes them from the real item count and position labels', async () => {
  const screen = render(html`
    <rc-carousel data-testid="carousel" aria-label="Test carousel" loop>
      <rc-carousel-item data-testid="item-0">One</rc-carousel-item>
      <rc-carousel-item data-testid="item-1">Two</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  const clones = carousel.querySelectorAll('[data-clone]');

  expect(clones).toHaveLength(2);

  expect(Array.from(clones).every(($clone) => $clone.matches('[inert][aria-hidden="true"]'))).toBe(
    true,
  );

  // cloneNode(true) copies data-testid along with everything else, so a
  // real item and its clone share one — query the light DOM directly
  // (excluding clones) rather than through the ambiguous testid locator.
  const [first, second] = Array.from(
    carousel.querySelectorAll<HTMLElement>('rc-carousel-item:not([data-clone])'),
  );

  expect(first?.getAttribute('aria-label')).toBe('1 of 2');
  expect(second?.getAttribute('aria-label')).toBe('2 of 2');
});

test('pagination renders one button per real slide (not clones), reflecting the active slide', async () => {
  const screen = render(html`
    <rc-carousel data-testid="carousel" aria-label="Test carousel" pagination loop>
      <rc-carousel-item>One</rc-carousel-item>
      <rc-carousel-item>Two</rc-carousel-item>
      <rc-carousel-item>Three</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  const buttons = Array.from(
    carousel.renderRoot.querySelectorAll<HTMLButtonElement>('[data-pagination-item]'),
  );

  expect(buttons).toHaveLength(3);
  expect(buttons[0]?.getAttribute('aria-current')).toBe('true');
  expect(buttons[0]?.getAttribute('aria-disabled')).toBe('true');
  expect(buttons[1]?.getAttribute('aria-current')).toBe('false');

  const changed = vi.fn<(event: CustomEvent<RCCarouselChangeDetail>) => void>();

  carousel.addEventListener('rc-carousel-change', changed);
  buttons[2]?.click();
  await settle(carousel);

  expect(changed.mock.calls[0]?.[0]?.detail).toEqual({ index: 2, trigger: 'button' });
  expect(buttons[2]?.getAttribute('aria-current')).toBe('true');
  expect(buttons[0]?.getAttribute('aria-current')).toBe('false');
});

test('does not schedule a reactive update from firstUpdated', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const screen = render(html`
    <rc-carousel data-testid="carousel" aria-label="Featured recipes" pagination>
      <rc-carousel-item>One</rc-carousel-item>
      <rc-carousel-item>Two</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  expect(
    warn.mock.calls.some((args) =>
      args.some(
        (arg) =>
          typeof arg === 'string' && arg.includes('scheduled an update after an update completed'),
      ),
    ),
  ).toBe(false);

  warn.mockRestore();
});

test('mouse-dragging is off by default, so a pointer drag on the track does not scroll it', async () => {
  const screen = render(html`
    <rc-carousel
      data-testid="carousel"
      aria-label="Test carousel"
      style="inline-size: 20rem; block-size: 10rem"
    >
      <rc-carousel-item>One</rc-carousel-item>
      <rc-carousel-item>Two</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  const track = carousel.renderRoot.querySelector<HTMLElement>('#track')!;

  firePointerEvent(track, 'pointerdown', { clientX: 200, clientY: 20 });
  firePointerEvent(track, 'pointermove', { clientX: 100, clientY: 20 });
  firePointerEvent(track, 'pointerup', { clientX: 100, clientY: 20 });

  await wait(SETTLE_WAIT_MS);

  expect(track.classList.contains('dragging')).toBe(false);
  expect(carousel.activeIndex).toBe(0);
});

test('mouse-dragging drives scrollLeft during a drag and settles to the dragged-to slide on release', async () => {
  const screen = render(html`
    <rc-carousel
      data-testid="carousel"
      aria-label="Test carousel"
      mouse-dragging
      style="inline-size: 20rem; block-size: 10rem"
    >
      <rc-carousel-item>One</rc-carousel-item>
      <rc-carousel-item>Two</rc-carousel-item>
      <rc-carousel-item>Three</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  const track = carousel.renderRoot.querySelector<HTMLElement>('#track')!;
  const changed = vi.fn<(event: CustomEvent<RCCarouselChangeDetail>) => void>();

  carousel.addEventListener('rc-carousel-change', changed);

  firePointerEvent(track, 'pointerdown', { clientX: 300, clientY: 20 });
  // Crosses the 8px activation threshold — the drag is now live.
  firePointerEvent(track, 'pointermove', { clientX: 260, clientY: 20 });
  await carousel.updateComplete;

  expect(track.classList.contains('dragging')).toBe(true);
  expect(track.scrollLeft).toBeGreaterThan(0);

  // Drag far past the track's own width — with no `loop`, scrollLeft
  // clamps at its maximum, deterministically landing on the last slide
  // regardless of exact per-slide geometry.
  firePointerEvent(track, 'pointermove', { clientX: -2000, clientY: 20 });
  firePointerEvent(track, 'pointerup', { clientX: -2000, clientY: 20 });
  await carousel.updateComplete;

  expect(track.classList.contains('dragging')).toBe(false);

  await wait(SETTLE_WAIT_MS);
  await settle(carousel);

  expect(carousel.activeIndex).toBe(2);
  expect(changed.mock.calls.at(-1)?.[0]?.detail).toEqual({ index: 2, trigger: 'swipe' });
});

test('a drag across interactive slide content suppresses the trailing click, but a plain click still activates it', async () => {
  const screen = render(html`
    <rc-carousel
      data-testid="carousel"
      aria-label="Test carousel"
      mouse-dragging
      style="inline-size: 20rem; block-size: 10rem"
    >
      <rc-carousel-item>
        <button type="button" data-testid="slide-button">Start timer</button>
      </rc-carousel-item>
      <rc-carousel-item>Two</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  const track = carousel.renderRoot.querySelector<HTMLElement>('#track')!;
  const button = (await screen.getByTestId('slide-button').element()) as HTMLButtonElement;

  const clicked = vi.fn();

  button.addEventListener('click', clicked);

  // A real drag still ends in a native `click` on release, on whatever's
  // under the pointer — often unrelated slide content the drag scrolled
  // past, not a deliberate activation of it. `composed: true` mirrors a
  // real UI click crossing both this component's and rc-carousel-item's
  // shadow boundaries to reach the capture handler on #track.
  firePointerEvent(track, 'pointerdown', { clientX: 300, clientY: 20 });
  firePointerEvent(track, 'pointermove', { clientX: 200, clientY: 20 });
  firePointerEvent(track, 'pointerup', { clientX: 200, clientY: 20 });

  button.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }),
  );

  expect(clicked).not.toHaveBeenCalled();

  // Suppression is one-shot — an ordinary click with no preceding drag
  // reaches the button normally.
  button.dispatchEvent(
    new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }),
  );

  expect(clicked).toHaveBeenCalledTimes(1);
});

test('arrow keys navigate with a keyboard trigger, and Home/End jump to the extremes', async () => {
  const screen = render(threeItems());
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  const track = carousel.renderRoot.querySelector<HTMLElement>('#track')!;
  const changed = vi.fn<(event: CustomEvent<RCCarouselChangeDetail>) => void>();

  carousel.addEventListener('rc-carousel-change', changed);

  track.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await settle(carousel);
  expect(changed.mock.calls.at(-1)?.[0]?.detail).toEqual({ index: 1, trigger: 'keyboard' });

  track.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  await settle(carousel);
  expect(changed.mock.calls.at(-1)?.[0]?.detail).toEqual({ index: 2, trigger: 'keyboard' });

  track.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  await settle(carousel);
  expect(changed.mock.calls.at(-1)?.[0]?.detail).toEqual({ index: 0, trigger: 'keyboard' });

  // Already at the first slide — ArrowLeft clamps, no further change.
  track.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  await settle(carousel);
  expect(changed).toHaveBeenCalledTimes(3);
});

test('aria-busy reflects an in-flight settle and clears once it commits', async () => {
  const screen = render(html`
    <rc-carousel
      data-testid="carousel"
      aria-label="Test carousel"
      navigation
      style="inline-size: 20rem; block-size: 10rem"
    >
      <rc-carousel-item>One</rc-carousel-item>
      <rc-carousel-item>Two</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  const track = carousel.renderRoot.querySelector<HTMLElement>('#track')!;

  expect(track.getAttribute('aria-busy')).toBe('false');

  const next = carousel.renderRoot.querySelector<HTMLButtonElement>('[aria-label="Next slide"]')!;

  next.click();

  // The prop write settles synchronously, but aria-busy only flips once
  // the resulting smooth scrollTo actually starts firing real `scroll`
  // events — poll rather than guess a fixed delay for that first event.
  await vi.waitFor(() => {
    expect(track.getAttribute('aria-busy')).toBe('true');
  });

  await vi.waitFor(
    () => {
      expect(track.getAttribute('aria-busy')).toBe('false');
    },
    { timeout: 2000 },
  );
});

test('consumer slide sizing composes with loop clones', async () => {
  const screen = render(html`
    <rc-carousel
      data-testid="carousel"
      aria-label="Test carousel"
      loop
      style="inline-size: 20rem; block-size: 10rem; --rc-carousel-slide-size: min(75%, 300px)"
    >
      <rc-carousel-item>One</rc-carousel-item>
      <rc-carousel-item>Two</rc-carousel-item>
      <rc-carousel-item>Three</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  const track = carousel.renderRoot.querySelector<HTMLElement>('#track');

  if (!track) {
    throw new Error('Expected the carousel track to render.');
  }

  expect(carousel.querySelectorAll('[data-clone]')).toHaveLength(2);
  expect(getComputedStyle(track).gridAutoColumns).toBe('min(75%, 300px)');
});

test('inherits slide sizing from a consumer container query', async () => {
  const screen = render(html`
    <style>
      .carousel-region {
        container-type: inline-size;
        inline-size: 20rem;
      }

      @container (max-width: 24rem) {
        .carousel-region rc-carousel {
          --rc-carousel-slide-size: 100%;
        }
      }
    </style>
    <div class="carousel-region">
      <rc-carousel
        data-testid="carousel"
        aria-label="Test carousel"
        style="inline-size: 20rem; block-size: 10rem"
      >
        <rc-carousel-item>One</rc-carousel-item>
        <rc-carousel-item>Two</rc-carousel-item>
      </rc-carousel>
    </div>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  const track = carousel.renderRoot.querySelector<HTMLElement>('#track');

  if (!track) {
    throw new Error('Expected the carousel track to render.');
  }

  expect(getComputedStyle(track).gridAutoColumns).toBe('100%');
});

test('has no unexpected overflow at rest or with navigation/pagination interactive', async () => {
  // Sized like every other fixture in this file (and like a real consumer
  // always sizes it, per the documented --rc-carousel-slide-size/
  // inline-size/block-size contract) — an unsized host's auto block-size
  // is just its content's own line height, too short for the 40px nav
  // buttons centered on it not to overhang; that's an unrealistic usage
  // this check isn't meant to police.
  const screen = render(html`
    <rc-carousel
      data-testid="carousel"
      aria-label="Test carousel"
      navigation
      pagination
      loop
      style="inline-size: 20rem; block-size: 10rem"
    >
      <rc-carousel-item>One</rc-carousel-item>
      <rc-carousel-item>Two</rc-carousel-item>
      <rc-carousel-item>Three</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  // #track is an intentional scroll container (overflow-x: auto) and is
  // exempt by unexpectedOverflow's own scrollable-axis check; this looks
  // for anything else — e.g. the pagination/navigation button rows —
  // accidentally pushing the host wider or taller than its own bounds.
  expect(unexpectedOverflow(carousel)).toEqual([]);

  carousel.next();
  await settle(carousel);

  expect(unexpectedOverflow(carousel)).toEqual([]);
});

test('has no accessibility violations with navigation and pagination active mid-interaction', async () => {
  const screen = render(html`
    <rc-carousel data-testid="carousel" aria-label="Test carousel" navigation pagination loop>
      <rc-carousel-item>One</rc-carousel-item>
      <rc-carousel-item>Two</rc-carousel-item>
      <rc-carousel-item>Three</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);
  carousel.next();
  await settle(carousel);

  await expectNoA11yViolations(carousel);
});
