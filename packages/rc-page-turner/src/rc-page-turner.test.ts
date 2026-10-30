import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-lit';

import { HORIZONTAL_LTR_FLOW, type Flow } from '@rcarls/rc-common';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import { FLOW_FIXTURES, flowLabel, inFlow } from '../../../test-helpers/flow.js';
import './define.js';
import type { RCPageTurnerPage } from './rc-page-turner-page.js';
import {
  turnGeometry,
  type RCPageTurner,
  type RCPageTurnerChangeDetail,
} from './rc-page-turner.js';

function threePages(
  { activeIndex, navigation = true } = {} as {
    activeIndex?: number;
    navigation?: boolean;
  },
) {
  return html`
    <rc-page-turner
      data-testid="turner"
      aria-label="Recipe steps"
      ?navigation=${navigation}
      active-index=${ifDefined(activeIndex)}
      style="inline-size: 20rem; block-size: 12rem; --rc-page-turner-duration: 200ms"
    >
      <rc-page-turner-page data-testid="page-0" id="first">
        <p>One</p>
        <input data-testid="input-0" aria-label="Note one" />
      </rc-page-turner-page>
      <rc-page-turner-page data-testid="page-1"><p>Two</p></rc-page-turner-page>
      <rc-page-turner-page data-testid="page-2"><p>Three</p></rc-page-turner-page>
    </rc-page-turner>
  `;
}

async function setup(template = threePages()) {
  const screen = render(template);
  const turner = (await screen.getByTestId('turner').element()) as RCPageTurner;

  await turner.updateComplete;

  const pages = [0, 1, 2].map(
    (index) => turner.querySelector(`[data-testid="page-${index}"]`) as RCPageTurnerPage,
  );

  return { screen, turner, pages };
}

function shadowButton(turner: RCPageTurner, part: 'previous' | 'next'): HTMLButtonElement {
  return turner.shadowRoot!.querySelector(
    `[part~='navigation-button-${part}']`,
  ) as HTMLButtonElement;
}

function viewport(turner: RCPageTurner): HTMLElement {
  return turner.shadowRoot!.querySelector('#viewport') as HTMLElement;
}

function runningAnimations(pages: RCPageTurnerPage[]): Animation[] {
  return pages.flatMap((page) => page.getAnimations());
}

function stubMatchMedia(matching: string[]): void {
  const original = window.matchMedia.bind(window);

  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) =>
    matching.includes(query)
      ? ({ ...original(query), matches: true } as MediaQueryList)
      : original(query),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

test('renders APG carousel roles, page positions, and keeps authored attributes', async () => {
  const { turner, pages } = await setup();

  expect(turner.getAttribute('role')).toBe('group');
  expect(turner.getAttribute('aria-roledescription')).toBe('pages');
  expect(turner.getAttribute('aria-label')).toBe('Recipe steps');
  expect(viewport(turner).getAttribute('aria-live')).toBe('polite');

  pages.forEach((page, index) => {
    expect(page.getAttribute('role')).toBe('group');
    expect(page.getAttribute('aria-roledescription')).toBe('page');
    expect(page.getAttribute('aria-label')).toBe(`${index + 1} of 3`);
    expect(page.isConnected).toBe(true);
  });

  expect(pages[0].id).toBe('first');
});

test('shows only the current page; its neighbor is laid out unpainted, the rest skip rendering', async () => {
  const { pages } = await setup();

  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(pages[0].matches(':state(active)')).toBe(true);
  expect(pages[0].hasAttribute('inert')).toBe(false);
  expect(pages[0].hasAttribute('aria-hidden')).toBe(false);

  for (const page of pages.slice(1)) {
    expect(page.hasAttribute('inert')).toBe(true);
    expect(page.getAttribute('aria-hidden')).not.toBeNull();
    expect(getComputedStyle(page).visibility).toBe('hidden');
  }

  expect(pages[1].matches(':state(adjacent)')).toBe(true);
  expect(getComputedStyle(pages[1]).contentVisibility).toBe('visible');
  expect(getComputedStyle(pages[2]).contentVisibility).toBe('hidden');
});

test('re-plans the neighbors a frame after a turn lands', async () => {
  const { turner, pages } = await setup();

  turner.goToIndex(2, true);
  await turner.updateComplete;
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(pages[1].matches(':state(adjacent)')).toBe(true);
  expect(pages[0].matches(':state(adjacent)')).toBe(false);
  expect(getComputedStyle(pages[0]).contentVisibility).toBe('hidden');
});

test('the next button turns forward and reports the change; Previous is disabled at the start', async () => {
  const { turner, pages } = await setup();
  const changes: RCPageTurnerChangeDetail[] = [];

  turner.addEventListener('rc-page-turner-change', (event) => changes.push(event.detail));

  expect(shadowButton(turner, 'previous').getAttribute('aria-disabled')).toBe('true');
  shadowButton(turner, 'next').click();
  await turner.updateComplete;

  expect(changes).toEqual([{ index: 1, trigger: 'button' }]);
  expect(turner.activeIndex).toBe(1);
  expect(pages[1].hasAttribute('inert')).toBe(false);
  expect(pages[0].hasAttribute('inert')).toBe(true);
});

test('stops at the last page instead of wrapping', async () => {
  const { turner } = await setup();

  turner.goToIndex(2, true);
  await turner.updateComplete;

  const changes: RCPageTurnerChangeDetail[] = [];

  turner.addEventListener('rc-page-turner-change', (event) => changes.push(event.detail));
  expect(shadowButton(turner, 'next').getAttribute('aria-disabled')).toBe('true');
  shadowButton(turner, 'next').click();
  turner.next();
  await turner.updateComplete;

  expect(changes).toEqual([]);
  expect(turner.activeIndex).toBe(2);
});

test('seeds the first page from default-active-index', async () => {
  const screen = render(html`
    <rc-page-turner data-testid="turner" aria-label="Pages" default-active-index="2">
      <rc-page-turner-page>One</rc-page-turner-page>
      <rc-page-turner-page>Two</rc-page-turner-page>
      <rc-page-turner-page data-testid="last">Three</rc-page-turner-page>
    </rc-page-turner>
  `);
  const turner = (await screen.getByTestId('turner').element()) as RCPageTurner;

  await turner.updateComplete;

  expect(turner.activeIndex).toBe(2);
  expect(turner.querySelector('[data-testid="last"]')!.matches(':state(active)')).toBe(true);
});

test('controlled usage reports requests but only moves on a host write, which is silent', async () => {
  const { turner, pages } = await setup(threePages({ activeIndex: 0 }));
  const changes: RCPageTurnerChangeDetail[] = [];

  turner.addEventListener('rc-page-turner-change', (event) => changes.push(event.detail));
  shadowButton(turner, 'next').click();
  await turner.updateComplete;

  expect(changes).toEqual([{ index: 1, trigger: 'button' }]);
  expect(turner.activeIndex).toBe(0);
  expect(pages[0].matches(':state(active)')).toBe(true);

  turner.activeIndex = 1;
  await turner.updateComplete;

  expect(changes).toHaveLength(1);
  expect(pages[1].hasAttribute('inert')).toBe(false);
});

test('turns forward by swinging the current page away around the spine', async () => {
  const { turner, pages } = await setup();

  turner.next();
  await turner.updateComplete;

  const [animation] = pages[0].getAnimations();

  expect(runningAnimations(pages)).toHaveLength(1);
  expect(pages[0].matches(':state(turning)')).toBe(true);
  expect(pages[1].matches(':state(active)')).toBe(true);
  expect(pages[0].style.getPropertyValue('--_rc-page-turner-origin')).toBe('left center');

  const effect = animation.effect as KeyframeEffect;

  // The back turn played in reverse: flat at the start, folded at the end.
  expect(effect.getKeyframes().map((frame) => frame.transform)).toEqual([
    'rotateY(-180deg)',
    'rotateY(0deg)',
  ]);

  expect(effect.getTiming().direction).toBe('reverse');

  await animation.finished;
  await new Promise((resolve) => requestAnimationFrame(resolve));

  expect(pages[0].matches(':state(turning)')).toBe(false);
  expect(pages[0].hasAttribute('inert')).toBe(true);
  expect(getComputedStyle(pages[0]).visibility).toBe('hidden');
  expect(pages[0].style.getPropertyValue('--_rc-page-turner-origin')).toBe('');
});

test('turns back by swinging the previous page in over the current one', async () => {
  const { turner, pages } = await setup();

  turner.goToIndex(1, true);
  await turner.updateComplete;
  turner.previous();
  await turner.updateComplete;

  const [animation] = pages[0].getAnimations();
  const keyframes = (animation.effect as KeyframeEffect).getKeyframes();

  expect(runningAnimations(pages)).toHaveLength(1);
  expect(pages[0].matches(':state(turning)')).toBe(true);
  expect(pages[1].matches(':state(revealed)')).toBe(true);
  // The arriving page is current while it moves; the page beneath is not.
  expect(pages[0].hasAttribute('inert')).toBe(false);
  expect(pages[1].hasAttribute('inert')).toBe(true);
  expect(keyframes.map((frame) => frame.transform)).toEqual(['rotateY(-180deg)', 'rotateY(0deg)']);
});

test('a decelerating easing keeps the departing page in view for most of a forward turn', async () => {
  const { turner, pages } = await setup();

  // Material's emphasized curve folds a page past edge-on within the first
  // fifth of the turn when played forward.
  turner.style.setProperty('--rc-page-turner-easing', 'cubic-bezier(0.2, 0, 0, 1)');
  turner.next();
  await turner.updateComplete;

  const [animation] = pages[0].getAnimations();

  animation.pause();
  animation.currentTime = 50;

  // cos of the fold angle: positive while the page's front face shows.
  expect(new DOMMatrix(getComputedStyle(pages[0]).transform).m11).toBeGreaterThan(0);
});

test('a turn started mid-turn lands the first one, so only one page is ever lifted', async () => {
  const { turner, pages } = await setup();

  turner.next();
  await turner.updateComplete;
  turner.next();
  await turner.updateComplete;

  expect(runningAnimations(pages)).toHaveLength(1);
  expect(pages.filter((page) => page.matches(':state(turning)'))).toEqual([pages[1]]);
  expect(pages[0].matches(':state(hidden), :state(active), :state(revealed)')).toBe(false);
  expect(getComputedStyle(pages[0]).visibility).toBe('hidden');
  expect(pages[2].matches(':state(active)')).toBe(true);
});

test('reduced motion fades the arriving page in instead of turning', async () => {
  stubMatchMedia(['(prefers-reduced-motion: reduce)']);

  const { turner, pages } = await setup();

  turner.next();
  await turner.updateComplete;

  const [animation] = runningAnimations(pages);
  const keyframes = (animation.effect as KeyframeEffect).getKeyframes();

  expect(pages[1].getAnimations()).toHaveLength(1);
  expect(keyframes.every((frame) => frame.transform === undefined)).toBe(true);
  expect(keyframes.map((frame) => Number(frame.opacity))).toEqual([0, 1]);
  expect((animation.effect as KeyframeEffect).getTiming().duration).toBe(150);
});

test('forced colors also fade instead of turning', async () => {
  stubMatchMedia(['(forced-colors: active)']);

  const { turner, pages } = await setup();

  turner.next();
  await turner.updateComplete;

  const keyframes = (runningAnimations(pages)[0].effect as KeyframeEffect).getKeyframes();

  expect(keyframes.every((frame) => frame.transform === undefined)).toBe(true);
});

test('an instant change swaps pages without any animation', async () => {
  const { turner, pages } = await setup();

  turner.goToIndex(2, true);
  await turner.updateComplete;

  expect(runningAnimations(pages)).toHaveLength(0);
  expect(pages[2].matches(':state(active)')).toBe(true);
  expect(pages[0].hasAttribute('inert')).toBe(true);
});

test('turning keeps every page and its content as the same nodes', async () => {
  const { turner, pages } = await setup();
  const contents = pages.map((page) => page.firstElementChild);

  turner.next();
  await turner.updateComplete;
  turner.next();
  await turner.updateComplete;
  turner.goToIndex(0, true);
  await turner.updateComplete;

  expect([...turner.children]).toEqual(pages);
  expect(pages.map((page) => page.firstElementChild)).toEqual(contents);
});

test('moves focus to the arriving page only when it was inside the departing one', async () => {
  const { turner, pages } = await setup();
  const input = turner.querySelector('[data-testid="input-0"]') as HTMLInputElement;

  input.focus();
  turner.next();
  await turner.updateComplete;

  expect(document.activeElement).toBe(pages[1]);

  const previous = shadowButton(turner, 'previous');

  previous.focus();
  turner.next();
  await turner.updateComplete;

  expect(turner.shadowRoot!.activeElement).toBe(previous);
});

test('keys typed inside page content are left to the content', async () => {
  const { turner, screen } = await setup();

  await userEvent.click(screen.getByTestId('input-0'));
  await userEvent.keyboard('{ArrowRight}{End}');
  await turner.updateComplete;

  expect(turner.activeIndex).toBe(0);
});

test('Home and End on the viewport go to the first and last page', async () => {
  const { turner } = await setup();

  viewport(turner).focus();
  await userEvent.keyboard('{End}');
  await turner.updateComplete;
  expect(turner.activeIndex).toBe(2);

  await userEvent.keyboard('{Home}');
  await turner.updateComplete;
  expect(turner.activeIndex).toBe(0);
});

/** The arrow key toward the next page, written out rather than derived. */
const NEXT_KEY: Record<string, string> = {
  'horizontal-tb ltr': 'ArrowRight',
  'horizontal-tb rtl': 'ArrowLeft',
  'vertical-rl ltr': 'ArrowDown',
  'vertical-rl rtl': 'ArrowUp',
  'vertical-lr ltr': 'ArrowDown',
};

describe.each(FLOW_FIXTURES.map((flow) => [flowLabel(flow), flow] as const))(
  'in %s',
  (label, flow) => {
    test('the inline arrow keys turn pages', async () => {
      const screen = render(inFlow(threePages(), flow));
      const turner = (await screen.getByTestId('turner').element()) as RCPageTurner;

      await turner.updateComplete;
      viewport(turner).focus();
      await userEvent.keyboard(`{${NEXT_KEY[label]}}`);
      await turner.updateComplete;

      expect(turner.activeIndex).toBe(1);
    });
  },
);

test('keys follow a dir change made after layout settles', async () => {
  const screen = render(inFlow(threePages(), { dir: 'ltr', writingMode: 'horizontal-tb' }));
  const turner = (await screen.getByTestId('turner').element()) as RCPageTurner;
  const wrapper = (await screen.getByTestId('flow').element()) as HTMLElement;

  await turner.updateComplete;
  wrapper.dir = 'rtl';
  viewport(turner).focus();
  await userEvent.keyboard('{ArrowLeft}');
  await turner.updateComplete;

  expect(turner.activeIndex).toBe(1);
});

test('viewport gesture and clipping axes follow an ancestor writing-mode change', async () => {
  const screen = render(inFlow(threePages(), { dir: 'ltr', writingMode: 'horizontal-tb' }));
  const turner = (await screen.getByTestId('turner').element()) as RCPageTurner;
  const wrapper = (await screen.getByTestId('flow').element()) as HTMLElement;
  const target = viewport(turner);

  await turner.updateComplete;
  expect(getComputedStyle(target).touchAction).toBe('pan-y pinch-zoom');

  wrapper.style.writingMode = 'vertical-rl';

  await vi.waitFor(() => {
    expect(getComputedStyle(target).touchAction).toBe('pan-x pinch-zoom');
    expect(getComputedStyle(target).overflowX).toBe('clip');
    expect(getComputedStyle(target).overflowY).toBe('visible');
  });

  turner.next();
  await turner.updateComplete;

  expect(
    turner.querySelector('rc-page-turner-page')?.style.getPropertyValue('--_rc-page-turner-origin'),
  ).toBe('center top');
});

test('turn geometry puts the spine on the inline-start edge in every flow', () => {
  const flow = (overrides: Partial<Flow>): Flow => ({ ...HORIZONTAL_LTR_FLOW, ...overrides });

  // The flip mirrors the back layer across the page's own center, which sits
  // half a page from the spine.
  expect(turnGeometry(flow({}))).toEqual({
    origin: 'left center',
    folded: 'rotateY(-180deg)',
    flip: 'translateX(50%) rotateY(180deg) translateX(-50%)',
  });

  expect(turnGeometry(flow({ inlineReversed: true, rtl: true }))).toEqual({
    origin: 'right center',
    folded: 'rotateY(180deg)',
    flip: 'translateX(-50%) rotateY(180deg) translateX(50%)',
  });

  expect(turnGeometry(flow({ inline: 'y', block: 'x' }))).toEqual({
    origin: 'center top',
    folded: 'rotateX(180deg)',
    flip: 'translateY(50%) rotateX(180deg) translateY(-50%)',
  });

  expect(turnGeometry(flow({ inline: 'y', block: 'x', inlineReversed: true }))).toEqual({
    origin: 'center bottom',
    folded: 'rotateX(-180deg)',
    flip: 'translateY(-50%) rotateX(180deg) translateY(50%)',
  });
});

test('page positions follow per-element message overrides', async () => {
  const { turner, pages } = await setup();

  turner.messages = { position: (position, count) => `Paso ${position} de ${count}` };
  await turner.updateComplete;

  expect(pages[1].getAttribute('aria-label')).toBe('Paso 2 de 3');
});

describe('dragging', () => {
  function pointer(target: Element, type: string, init: PointerEventInit = {}) {
    target.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: 1,
        pointerType: 'touch',
        isPrimary: true,
        ...init,
      }),
    );
  }

  /**
   * Drags across the viewport by `share` of its width (negative toward the
   * left), in `steps` moves `gap` ms apart. Synthetic moves with no gap
   * carry no velocity.
   */
  async function drag(
    turner: RCPageTurner,
    share: number,
    { steps = 4, gap = 0, release = true, init = {} as PointerEventInit } = {},
  ) {
    const target = viewport(turner);
    const rect = target.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    pointer(target, 'pointerdown', { clientX: startX, clientY: y, ...init });

    for (let step = 1; step <= steps; step++) {
      if (gap) {
        await new Promise((resolve) => setTimeout(resolve, gap));
      }

      pointer(target, 'pointermove', {
        clientX: startX + (rect.width * share * step) / steps,
        clientY: y,
        ...init,
      });
    }

    if (release) {
      pointer(target, 'pointerup', { clientX: startX + rect.width * share, clientY: y, ...init });
    }

    return target;
  }

  function changes(turner: RCPageTurner) {
    const details: RCPageTurnerChangeDetail[] = [];

    turner.addEventListener('rc-page-turner-change', (event) => details.push(event.detail));

    return details;
  }

  async function settled(pages: RCPageTurnerPage[]) {
    await Promise.all(runningAnimations(pages).map((animation) => animation.finished));
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }

  test('the current page follows a forward drag without changing the current page', async () => {
    const { turner, pages } = await setup();

    await drag(turner, -0.25, { release: false });

    const [animation] = pages[0].getAnimations();

    expect(animation.playState).toBe('paused');
    // The free edge sits where the pointer is, three quarters of the way out.
    expect(Number(animation.currentTime)).toBeCloseTo((Math.acos(0.75) / Math.PI) * 1000, 0);
    expect(pages[0].matches(':state(turning)')).toBe(true);
    expect(pages[1].matches(':state(revealed)')).toBe(true);
    expect(pages[0].hasAttribute('inert')).toBe(false);
    expect(pages[1].hasAttribute('inert')).toBe(true);
    expect(turner.matches(':state(dragging)')).toBe(true);
  });

  test('the blank back layer turns with the page and faces the viewer past 90°', async () => {
    const { turner, pages } = await setup();
    const pageBack = turner.shadowRoot!.querySelector<HTMLElement>('[part~="page-back"]')!;

    expect(getComputedStyle(pageBack).visibility).toBe('hidden');

    await drag(turner, -0.25, { release: false });

    const [page] = pages[0].getAnimations();
    const [back] = pageBack.getAnimations();
    const frames = (back.effect as KeyframeEffect).getKeyframes();

    expect(turner.matches(':state(turning)')).toBe(true);
    expect(getComputedStyle(pageBack).visibility).toBe('visible');
    expect(back.currentTime).toBe(page.currentTime);

    expect(frames.map((frame) => frame.transform)).toEqual([
      'rotateY(0deg) translateX(50%) rotateY(180deg) translateX(-50%)',
      'rotateY(-180deg) translateX(50%) rotateY(180deg) translateX(-50%)',
    ]);

    // Folded past 90°, the page's front turns away and the back faces out.
    back.currentTime = 700;
    page.currentTime = 700;
    expect(new DOMMatrix(getComputedStyle(pageBack).transform).m33).toBeGreaterThan(0);
    expect(new DOMMatrix(getComputedStyle(pages[0]).transform).m33).toBeLessThan(0);

    pointer(viewport(turner), 'pointerup', { clientX: 0, clientY: 0 });
    await settled([...pages]);
    await Promise.all(pageBack.getAnimations().map((animation) => animation.finished));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(turner.matches(':state(turning)')).toBe(false);
    expect(pageBack.getAnimations()).toHaveLength(0);
  });

  test('a button turn draws the back layer too, and clears it when the page lands', async () => {
    const { turner, pages } = await setup();
    const pageBack = turner.shadowRoot!.querySelector<HTMLElement>('[part~="page-back"]')!;

    turner.next();
    await turner.updateComplete;

    const [back] = pageBack.getAnimations();

    expect(back.effect?.getTiming().direction).toBe('reverse');
    expect(turner.matches(':state(turning)')).toBe(true);

    await back.finished;
    await settled(pages);

    expect(turner.matches(':state(turning)')).toBe(false);
  });

  test('the viewport clips only across the inline axis, so a falling page can show', async () => {
    const { turner } = await setup();

    expect(getComputedStyle(viewport(turner)).overflowX).toBe('visible');
    expect(getComputedStyle(viewport(turner)).overflowY).toBe('clip');
  });

  test('the free edge follows the pointer under CSS zoom', async () => {
    const { turner, pages } = await setup();

    // Pointer coordinates are zoomed, but clientWidth is not.
    turner.style.zoom = '0.8';
    await drag(turner, -0.25, { release: false });

    const [animation] = pages[0].getAnimations();

    expect(Number(animation.currentTime)).toBeCloseTo((Math.acos(0.75) / Math.PI) * 1000, 0);
  });

  test('a release whose edge has not crossed the middle settles back', async () => {
    const { turner, pages } = await setup();
    const reported = changes(turner);

    // The page looks over half turned (about 66°), but its edge has only
    // travelled 40% of the page.
    await drag(turner, -0.4);
    await settled(pages);

    expect(reported).toEqual([]);
    expect(pages[0].matches(':state(active)')).toBe(true);
  });

  test('a release past halfway completes the turn and reports a swipe', async () => {
    const { turner, pages } = await setup();
    const reported = changes(turner);

    await drag(turner, -0.6);

    expect(reported).toEqual([{ index: 1, trigger: 'swipe' }]);
    expect(pages[1].hasAttribute('inert')).toBe(false);
    expect(pages[0].hasAttribute('inert')).toBe(true);
    expect(runningAnimations(pages)).toHaveLength(1);

    await settled(pages);

    expect(turner.activeIndex).toBe(1);
    expect(pages[1].matches(':state(active)')).toBe(true);
    expect(pages[0].matches(':state(turning)')).toBe(false);
    expect(getComputedStyle(pages[0]).visibility).toBe('hidden');
  });

  test('a short slow release settles back to the same page', async () => {
    const { turner, pages } = await setup();
    const reported = changes(turner);

    await drag(turner, -0.2);
    await settled(pages);

    expect(reported).toEqual([]);
    expect(turner.activeIndex).toBe(0);
    expect(pages[0].matches(':state(active)')).toBe(true);
    expect(getComputedStyle(pages[1]).visibility).toBe('hidden');
  });

  test('a fast short swipe turns the page', async () => {
    const { turner, pages } = await setup();
    const reported = changes(turner);

    await drag(turner, -0.2, { steps: 3, gap: 16 });

    expect(reported).toEqual([{ index: 1, trigger: 'swipe' }]);
    await settled(pages);
    expect(pages[1].matches(':state(active)')).toBe(true);
  });

  test('a drag toward the inline end turns back, the previous page coming in on top', async () => {
    const { turner, pages } = await setup();

    turner.goToIndex(1, true);
    await turner.updateComplete;

    const reported = changes(turner);

    await drag(turner, 0.3, { release: false });
    expect(pages[0].matches(':state(turning)')).toBe(true);
    expect(pages[1].matches(':state(active)')).toBe(true);

    // Edge-on at the spine from the first move, then opening with the
    // pointer: under 90°, so its front already shows.
    expect(Number(pages[0].getAnimations()[0].currentTime)).toBeCloseTo(
      (Math.acos(0.3) / Math.PI) * 1000,
      0,
    );

    pointer(viewport(turner), 'pointermove', { clientX: 10_000, clientY: 0 });
    pointer(viewport(turner), 'pointerup', { clientX: 10_000, clientY: 0 });

    expect(reported).toEqual([{ index: 0, trigger: 'swipe' }]);
    await settled(pages);
    expect(pages[0].matches(':state(active)')).toBe(true);
  });

  test('in RTL a drag toward the right turns forward', async () => {
    const { turner, pages } = await setup();

    turner.dir = 'rtl';

    const reported = changes(turner);

    await drag(turner, 0.6);

    expect(reported).toEqual([{ index: 1, trigger: 'swipe' }]);
    expect(pages[0].style.getPropertyValue('--_rc-page-turner-origin')).toBe('right center');
  });

  test('a vertical drag follows the updated inline axis', async () => {
    const screen = render(inFlow(threePages(), { dir: 'ltr', writingMode: 'horizontal-tb' }));
    const turner = (await screen.getByTestId('turner').element()) as RCPageTurner;
    const wrapper = (await screen.getByTestId('flow').element()) as HTMLElement;

    await turner.updateComplete;
    wrapper.style.writingMode = 'vertical-rl';

    await vi.waitFor(() =>
      expect(getComputedStyle(viewport(turner)).touchAction).toBe('pan-x pinch-zoom'),
    );

    const target = viewport(turner);
    const rect = target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const reported = changes(turner);

    pointer(target, 'pointerdown', { clientX: x, clientY: y });
    pointer(target, 'pointermove', { clientX: x, clientY: y - rect.height * 0.6 });
    pointer(target, 'pointerup', { clientX: x, clientY: y - rect.height * 0.6 });

    expect(reported).toEqual([{ index: 1, trigger: 'swipe' }]);
  });

  test('a drag past the first or last page moves nothing', async () => {
    const { turner, pages } = await setup();
    const reported = changes(turner);

    await drag(turner, 0.6);

    expect(reported).toEqual([]);
    expect(runningAnimations(pages)).toHaveLength(0);
    expect(pages[0].matches(':state(active)')).toBe(true);
  });

  test('mouse drags turn pages only with mouse-dragging', async () => {
    const { turner } = await setup();
    const reported = changes(turner);
    const mouse = { pointerType: 'mouse', button: 0 };

    await drag(turner, -0.6, { init: mouse });
    expect(reported).toEqual([]);

    turner.mouseDragging = true;
    await turner.updateComplete;
    await drag(turner, -0.6, { init: mouse });
    expect(reported).toEqual([{ index: 1, trigger: 'swipe' }]);
  });

  test('the click that ends a drag never reaches page content', async () => {
    const { turner, pages } = await setup();
    const clicked = vi.fn();

    pages[0].addEventListener('click', clicked);
    await drag(turner, -0.2);
    pages[0].querySelector('p')!.click();

    expect(clicked).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve));
    pages[0].querySelector('p')!.click();

    expect(clicked).toHaveBeenCalledTimes(1);
  });

  test('under reduced motion a drag only decides: a long one fades to the next page', async () => {
    stubMatchMedia(['(prefers-reduced-motion: reduce)']);

    const { turner, pages } = await setup();
    const reported = changes(turner);

    await drag(turner, -0.6, { release: false });
    expect(runningAnimations(pages)).toHaveLength(0);

    pointer(viewport(turner), 'pointerup', { clientX: 0, clientY: 0 });
    await turner.updateComplete;

    expect(reported).toEqual([{ index: 1, trigger: 'swipe' }]);

    const [animation] = runningAnimations(pages);

    expect(
      (animation.effect as KeyframeEffect).getKeyframes().map((frame) => Number(frame.opacity)),
    ).toEqual([0, 1]);
  });

  test('a turn requested mid-drag drops the drag', async () => {
    const { turner, pages } = await setup();
    const reported = changes(turner);

    await drag(turner, -0.3, { release: false });
    turner.goToIndex(2, true);
    await turner.updateComplete;

    expect(reported).toEqual([{ index: 2, trigger: 'api' }]);
    expect(runningAnimations(pages)).toHaveLength(0);
    expect(pages[2].matches(':state(active)')).toBe(true);
    expect(pages[0].style.getPropertyValue('--_rc-page-turner-origin')).toBe('');

    pointer(viewport(turner), 'pointerup', { clientX: 0, clientY: 0 });

    expect(reported).toHaveLength(1);
  });

  test('a controlled host that ignores the swipe keeps its page', async () => {
    const { turner, pages } = await setup(threePages({ activeIndex: 0 }));

    await drag(turner, -0.6);
    await Promise.resolve();
    await turner.updateComplete;

    expect(turner.activeIndex).toBe(0);
    expect(pages[0].matches(':state(active)')).toBe(true);
    expect(pages[0].hasAttribute('inert')).toBe(false);
  });
});

test('has no accessibility violations at rest or mid-turn', async () => {
  const { turner } = await setup();

  await expectNoA11yViolations(turner);
  turner.next();
  await turner.updateComplete;
  await expectNoA11yViolations(turner);
});
