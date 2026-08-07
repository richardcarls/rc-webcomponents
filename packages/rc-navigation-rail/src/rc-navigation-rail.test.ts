import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';
import './define';
import type { RCNavigationRail } from './rc-navigation-rail';

import { navigationRailStyles } from './rc-navigation-rail.styles';

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

test('keeps consumer-authored links and slot content connected', async () => {
  const screen = render(html`
    <rc-navigation-rail data-testid="host">
      <strong slot="header" data-testid="brand">Brand</strong>
      <a href="/recipes" data-testid="recipes" data-router-link aria-current="page">Recipes</a>
      <a href="/settings">Settings</a>
      <button slot="footer" type="button" data-testid="footer">More</button>
    </rc-navigation-rail>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationRail;
  const recipes = (await screen.getByTestId('recipes').element()) as HTMLAnchorElement;

  await host.updateComplete;

  expect(recipes.isConnected).toBe(true);
  expect(recipes.getAttribute('href')).toBe('/recipes');
  expect(recipes.hasAttribute('data-router-link')).toBe(true);
  expect((await screen.getByTestId('brand').element()).isConnected).toBe(true);
  expect((await screen.getByTestId('footer').element()).isConnected).toBe(true);
});

test('hides empty optional regions', async () => {
  const screen = render(html`
    <rc-navigation-rail data-testid="host">
      <a href="/recipes">Recipes</a>
    </rc-navigation-rail>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationRail;

  await host.updateComplete;

  expect(host.shadowRoot?.querySelector('#toggle-wrap')?.hasAttribute('hidden')).toBe(true);
  expect(host.shadowRoot?.querySelector('#header')?.hasAttribute('hidden')).toBe(true);
  expect(host.shadowRoot?.querySelector('#footer')?.hasAttribute('hidden')).toBe(true);
});

test('centers header content on the inline axis while collapsed and expanded', async () => {
  const screen = render(html`
    <rc-navigation-rail data-testid="host">
      <span slot="header">Header</span>
      <a href="/recipes">Recipes</a>
    </rc-navigation-rail>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationRail;

  await host.updateComplete;

  const header = host.shadowRoot?.querySelector<HTMLElement>('#header');

  expect(getComputedStyle(header!).alignItems).toBe('center');

  host.expanded = true;
  await host.updateComplete;

  expect(getComputedStyle(header!).alignItems).toBe('center');
});

test('has no automated accessibility violations while collapsed and expanded', async () => {
  const screen = render(html`
    <rc-navigation-rail data-testid="host" label="Main navigation">
      <button slot="toggle" type="button" aria-label="Toggle navigation">Menu</button>
      <a href="/recipes" aria-current="page">Recipes</a>
      <a href="/settings">Settings</a>
    </rc-navigation-rail>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationRail;

  await host.updateComplete;
  await expectNoA11yViolations(host);

  host.expanded = true;
  await host.updateComplete;
  await expectNoA11yViolations(host);
});

test('positions the indicator on the aria-current link target', async () => {
  const screen = render(html`
    <rc-navigation-rail data-testid="host">
      <a href="/recipes" aria-current="page">
        <span
          data-rc-navigation-icon
          style="display: inline-block; inline-size: 56px; block-size: 32px;"
          >R</span
        >
        <span>Recipes</span>
      </a>
      <a href="/settings">Settings</a>
    </rc-navigation-rail>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationRail;

  await host.updateComplete;
  await nextFrame();

  const indicator = host.shadowRoot?.querySelector<HTMLElement>('#indicator');

  expect(host.hasAttribute('has-active')).toBe(true);
  expect(indicator?.hasAttribute('hidden')).toBe(false);
  expect(indicator?.style.inlineSize).toBe('56px');
  expect(indicator?.style.blockSize).toBe('32px');
});

test('supports custom active and indicator target selectors', async () => {
  const screen = render(html`
    <rc-navigation-rail
      data-testid="host"
      active-selector="a.router-active"
      indicator-target="[data-pill]"
    >
      <a href="/recipes" class="router-active">
        <span data-pill style="display: inline-block; inline-size: 96px; block-size: 40px;"
          >Recipes</span
        >
      </a>
      <a href="/settings">Settings</a>
    </rc-navigation-rail>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationRail;

  await host.updateComplete;
  await nextFrame();

  const indicator = host.shadowRoot?.querySelector<HTMLElement>('#indicator');

  await vi.waitFor(() => expect(indicator?.style.inlineSize).toBe('96px'));
  expect(indicator?.style.blockSize).toBe('40px');
});

test('updates the indicator when active target geometry changes', async () => {
  const screen = render(html`
    <rc-navigation-rail data-testid="host">
      <a href="/recipes" aria-current="page">
        <span
          data-rc-navigation-icon
          data-testid="target"
          style="display: inline-block; inline-size: 56px; block-size: 32px;"
          >R</span
        >
        <span>Recipes</span>
      </a>
      <a href="/settings">Settings</a>
    </rc-navigation-rail>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationRail;
  const target = (await screen.getByTestId('target').element()) as HTMLElement;

  await host.updateComplete;
  await nextFrame();

  target.style.blockSize = '56px';
  await nextFrame();
  await nextFrame();

  const indicator = host.shadowRoot?.querySelector<HTMLElement>('#indicator');

  expect(indicator?.style.blockSize).toBe('56px');
});

test('supports default-expanded before controlled writes', async () => {
  const screen = render(html`
    <rc-navigation-rail data-testid="host" default-expanded>
      <a href="/recipes">Recipes</a>
    </rc-navigation-rail>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationRail;

  await host.updateComplete;

  expect(host.expanded).toBe(true);
  expect(host.hasAttribute('expanded')).toBe(true);
});

test('slotted native toggle stays connected and reflects expanded state', async () => {
  const toggleSpy = vi.fn();
  const screen = render(html`
    <rc-navigation-rail data-testid="host" @rc-navigation-rail-toggle=${toggleSpy}>
      <button slot="toggle" data-testid="toggle" type="button" aria-label="Toggle navigation">
        <span data-rc-navigation-expand-icon>Menu</span>
        <span data-rc-navigation-collapse-icon>Close</span>
      </button>
      <a href="/recipes">Recipes</a>
    </rc-navigation-rail>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationRail;
  const $button = (await screen.getByTestId('toggle').element()) as HTMLButtonElement;

  await host.updateComplete;

  expect($button.isConnected).toBe(true);
  expect($button.getAttribute('aria-expanded')).toBe('false');

  expect($button.querySelector<HTMLElement>('[data-rc-navigation-expand-icon]')?.hidden).toBe(
    false,
  );

  expect($button.querySelector<HTMLElement>('[data-rc-navigation-collapse-icon]')?.hidden).toBe(
    true,
  );

  $button.click();

  await host.updateComplete;

  expect(host.expanded).toBe(true);
  expect($button.getAttribute('aria-expanded')).toBe('true');
  expect($button.querySelector<HTMLElement>('[data-rc-navigation-expand-icon]')?.hidden).toBe(true);

  expect($button.querySelector<HTMLElement>('[data-rc-navigation-collapse-icon]')?.hidden).toBe(
    false,
  );

  expect(toggleSpy).toHaveBeenCalledTimes(1);
  expect(toggleSpy.mock.calls[0]?.[0].detail.expanded).toBe(true);
});

test('coordinates selected state with an rc-button toggle wrapper', async () => {
  const screen = render(html`
    <rc-navigation-rail data-testid="host">
      <rc-button slot="toggle" data-testid="toggle">
        <button type="button" aria-label="Toggle navigation">Menu</button>
      </rc-button>
      <a href="/recipes">Recipes</a>
    </rc-navigation-rail>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationRail;
  const $toggle = await screen.getByTestId('toggle').element();
  const $button = $toggle.querySelector('button');

  await host.updateComplete;

  expect($toggle.hasAttribute('selected')).toBe(false);

  $button?.click();
  await host.updateComplete;

  expect(host.expanded).toBe(true);
  expect($toggle.hasAttribute('selected')).toBe(true);
});

test('host property writes are silent', async () => {
  const toggleSpy = vi.fn();
  const screen = render(html`
    <rc-navigation-rail data-testid="host" @rc-navigation-rail-toggle=${toggleSpy}>
      <a href="/recipes">Recipes</a>
    </rc-navigation-rail>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationRail;

  await host.updateComplete;

  host.expanded = true;
  await host.updateComplete;

  expect(host.expanded).toBe(true);
  expect(toggleSpy).not.toHaveBeenCalled();
});

test('ignores clicks outside the slotted native toggle button', async () => {
  const screen = render(html`
    <rc-navigation-rail data-testid="host">
      <span slot="toggle" data-testid="toggle">Menu</span>
      <a href="/recipes">Recipes</a>
    </rc-navigation-rail>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationRail;
  const toggle = await screen.getByTestId('toggle').element();

  await host.updateComplete;
  toggle.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  await host.updateComplete;

  expect(host.expanded).toBe(false);
});

test('snaps rail and indicator animation under reduced motion', () => {
  expect(navigationRailStyles.cssText).toContain('@media (prefers-reduced-motion: reduce)');
  expect(navigationRailStyles.cssText).toContain('transition-duration: 0s');
});
