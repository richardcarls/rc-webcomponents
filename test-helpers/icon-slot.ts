import { expect } from 'vitest';

const PATH = '<path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2"/>';
const IMG_SRC = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${PATH}</svg>`,
)}`;
const LATE_ICON = 'rc-test-late-icon';

/** Mimics `<iconify-icon>`: an inline host whose SVG renders two frames after it connects. */
class LateIcon extends HTMLElement {
  connectedCallback(): void {
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const root = this.shadowRoot ?? this.attachShadow({ mode: 'open' });

        root.innerHTML = `<style>:host{display:inline-block;width:1em;height:1em}svg{display:block;width:1em;height:1em}</style><svg viewBox="0 0 24 24">${PATH}</svg>`;
      }),
    );
  }
}

if (!customElements.get(LATE_ICON)) {
  customElements.define(LATE_ICON, LateIcon);
}

/**
 * Icon kinds a consumer puts in an icon slot. Each one is the opening tag
 * name followed by the rest of the markup, so the slot attribute can be added.
 */
export const ICON_KINDS = {
  'svg with fixed size': `<svg width="24" height="24" viewBox="0 0 24 24">${PATH}</svg>`,
  'svg at 1em': `<svg width="1em" height="1em" viewBox="0 0 24 24">${PATH}</svg>`,
  'svg with no size': `<svg viewBox="0 0 24 24">${PATH}</svg>`,
  'icon-font glyph': `<span style="font-size: 24px">&#x2039;</span>`,
  'unloaded ligature': `<span class="material-symbols-outlined">chevron_left</span>`,
  img: `<img alt="" width="24" height="24" src="${IMG_SRC}">`,
  emoji: `<span>⬅️</span>`,
  'late element': `<${LATE_ICON}></${LATE_ICON}>`,
} as const;

/** Icon kinds that are replaced elements: they must fit inside the box, not just be clipped. */
const REPLACED_KINDS = new Set(['svg with fixed size', 'svg at 1em', 'svg with no size', 'img']);

export interface IconSlotFixture {
  /** Markup for the host element, with `icon` (already carrying its `slot`) inside it. */
  markup: (icon: string) => string;
  /** The icon box in the host's shadow root. */
  box: (host: HTMLElement) => Element | null;
  /** The slot name, or `null` for a built-in icon with no slot. */
  slot: string | null;
  /** The custom property that sizes the box. */
  sizeProperty: string;
}

const frames = (count: number): Promise<void> =>
  new Promise((resolve) => {
    const step = (left: number): void => {
      if (left === 0) {
        resolve();
      } else {
        requestAnimationFrame(() => step(left - 1));
      }
    };

    step(count);
  });

async function mount(fixture: IconSlotFixture, icon: string) {
  const scope = document.createElement('div');

  scope.style.cssText = 'padding: 16px; font: 16px/1.5 sans-serif';
  scope.innerHTML = fixture.markup(icon);
  document.body.append(scope);

  const host = scope.firstElementChild as HTMLElement & { updateComplete?: Promise<unknown> };

  await customElements.whenDefined(host.localName);
  await host.updateComplete;
  await frames(1);

  const box = fixture.box(host);

  if (!box) {
    throw new Error(`${host.localName}: icon box not found`);
  }

  return { scope, host, box };
}

function withSlot(markup: string, slot: string): string {
  return markup.replace(/^<([\w-]+)/, `<$1 slot="${slot}"`);
}

function iconRect(host: HTMLElement, slot: string): DOMRect {
  const icon = host.querySelector(`[slot="${slot}"]`)!;

  return (icon.shadowRoot?.querySelector('svg') ?? icon).getBoundingClientRect();
}

function center(rect: DOMRect): [number, number] {
  return [rect.left + rect.width / 2, rect.top + rect.height / 2];
}

/**
 * Checks a component's icon box against the icon box contract
 * (`iconBoxStyles()` in rc-common): every icon kind is centered in a box
 * whose size doesn't depend on its content, replaced icons fit inside it,
 * and the built-in icon follows the size property.
 */
export async function expectIconBoxContract(fixture: IconSlotFixture): Promise<void> {
  const builtIn = await mount(fixture, '');
  const expected = builtIn.box.getBoundingClientRect();

  expect(getComputedStyle(builtIn.box).overflow).toBe('clip');

  const builtInIcon = builtIn.box.querySelector('svg');

  if (builtInIcon) {
    const rect = builtInIcon.getBoundingClientRect();

    expect(rect.width, 'built-in icon fills the box').toBeCloseTo(expected.width, 1);
    expect(rect.height, 'built-in icon fills the box').toBeCloseTo(expected.height, 1);

    builtIn.host.style.setProperty(fixture.sizeProperty, '40px');
    await frames(1);
    expect(builtInIcon.getBoundingClientRect().width, 'size property resizes the icon').toBe(40);
  }

  builtIn.scope.remove();

  if (fixture.slot === null) {
    return;
  }

  for (const [kind, markup] of Object.entries(ICON_KINDS)) {
    const { scope, host, box } = await mount(fixture, withSlot(markup, fixture.slot));
    const firstFrame = box.getBoundingClientRect();

    await frames(4);

    const boxRect = box.getBoundingClientRect();
    const icon = iconRect(host, fixture.slot);
    const [boxX, boxY] = center(boxRect);
    const [iconX, iconY] = center(icon);

    expect(boxRect.width, `${kind}: box width`).toBeCloseTo(expected.width, 1);
    expect(boxRect.height, `${kind}: box height`).toBeCloseTo(expected.height, 1);

    expect(firstFrame.height, `${kind}: box height before the icon renders`).toBeCloseTo(
      expected.height,
      1,
    );

    expect(Math.abs(iconX - boxX), `${kind}: inline centering`).toBeLessThan(0.5);
    expect(Math.abs(iconY - boxY), `${kind}: block centering`).toBeLessThan(0.5);

    if (REPLACED_KINDS.has(kind)) {
      expect(icon.width, `${kind}: fits the box`).toBeLessThanOrEqual(boxRect.width + 0.5);
      expect(icon.height, `${kind}: fits the box`).toBeLessThanOrEqual(boxRect.height + 0.5);
      expect(icon.width, `${kind}: is visible`).toBeGreaterThan(0);
    }

    scope.remove();
  }
}

/**
 * Checks a theme's `data-rc-icon` contract: a marked icon reserves its `1em`
 * square before it renders, and a marked `svg` or `img` takes the theme
 * size whatever its own attributes say.
 */
export async function expectThemeIconMarkers(themeClass: string): Promise<void> {
  const scope = document.createElement('div');

  scope.className = themeClass;

  scope.innerHTML = `
    <svg data-rc-icon data-kind="svg with fixed size" width="7" height="7" viewBox="0 0 24 24">${PATH}</svg>
    <svg data-rc-icon data-kind="svg with no size" viewBox="0 0 24 24">${PATH}</svg>
    <img data-rc-icon data-kind="img" alt="" width="7" height="7" src="${IMG_SRC}">
    <span data-rc-icon data-kind="icon-font glyph">&#x2039;</span>
    <${LATE_ICON} data-rc-icon data-kind="late element"></${LATE_ICON}>
  `;

  document.body.append(scope);

  try {
    for (const icon of scope.querySelectorAll<HTMLElement>('[data-rc-icon]')) {
      const kind = icon.dataset.kind!;
      const size = parseFloat(getComputedStyle(icon).fontSize);
      const rect = icon.getBoundingClientRect();

      expect(size, `${kind}: theme icon size`).toBeGreaterThan(7);
      expect(rect.height, `${kind}: reserves the icon square`).toBeGreaterThanOrEqual(size - 0.5);
      expect(rect.width, `${kind}: reserves the icon square`).toBeGreaterThanOrEqual(size - 0.5);

      if (icon.localName === 'svg' || icon.localName === 'img') {
        expect(rect.width, `${kind}: takes the theme size`).toBeCloseTo(size, 1);
        expect(rect.height, `${kind}: takes the theme size`).toBeCloseTo(size, 1);
      }
    }
  } finally {
    scope.remove();
  }
}
