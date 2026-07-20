import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';
import './define';
import type { RCNavigationBar } from './rc-navigation-bar';

import { navigationBarStyles } from './rc-navigation-bar.styles';

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

test('keeps consumer-authored links connected with author attributes intact', async () => {
  const screen = render(html`
    <rc-navigation-bar data-testid="host">
      <a href="/recipes" data-testid="recipes" data-router-link aria-current="page">
        <span data-rc-navigation-icon>R</span>
        <span>Recipes</span>
      </a>
      <a href="/settings" target="_self">Settings</a>
    </rc-navigation-bar>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationBar;
  const recipes = (await screen.getByTestId('recipes').element()) as HTMLAnchorElement;

  await host.updateComplete;

  expect(recipes.isConnected).toBe(true);
  expect(recipes.getAttribute('href')).toBe('/recipes');
  expect(recipes.hasAttribute('data-router-link')).toBe(true);
  expect(recipes.getAttribute('aria-current')).toBe('page');
});

test('has no automated accessibility violations with a current page link', async () => {
  const screen = render(html`
    <rc-navigation-bar data-testid="host" label="Main navigation">
      <a href="/recipes" aria-current="page">Recipes</a>
      <a href="/settings">Settings</a>
    </rc-navigation-bar>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationBar;

  await host.updateComplete;

  await expectNoA11yViolations(host);
});

test('positions the indicator on the aria-current link target', async () => {
  const screen = render(html`
    <rc-navigation-bar data-testid="host" style="display: block; inline-size: 240px;">
      <a href="/recipes" aria-current="page">
        <span
          data-rc-navigation-icon
          style="display: inline-block; inline-size: 48px; block-size: 32px;"
          >R</span
        >
        <span>Recipes</span>
      </a>
      <a href="/settings">
        <span
          data-rc-navigation-icon
          style="display: inline-block; inline-size: 48px; block-size: 32px;"
          >S</span
        >
        <span>Settings</span>
      </a>
    </rc-navigation-bar>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationBar;

  await host.updateComplete;
  await nextFrame();

  const indicator = host.shadowRoot?.querySelector<HTMLElement>('#indicator');

  expect(host.hasAttribute('has-active')).toBe(true);
  expect(indicator?.hasAttribute('hidden')).toBe(false);
  expect(indicator?.style.inlineSize).toBe('48px');
  expect(indicator?.style.blockSize).toBe('32px');
});

test('updates the indicator when aria-current moves between links', async () => {
  const screen = render(html`
    <rc-navigation-bar data-testid="host" style="display: block; inline-size: 240px;">
      <a href="/recipes" data-testid="recipes" aria-current="page">
        <span
          data-rc-navigation-icon
          style="display: inline-block; inline-size: 40px; block-size: 32px;"
          >R</span
        >
        <span>Recipes</span>
      </a>
      <a href="/settings" data-testid="settings">
        <span
          data-rc-navigation-icon
          style="display: inline-block; inline-size: 64px; block-size: 32px;"
          >S</span
        >
        <span>Settings</span>
      </a>
    </rc-navigation-bar>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationBar;
  const recipes = await screen.getByTestId('recipes').element();
  const settings = await screen.getByTestId('settings').element();

  await host.updateComplete;
  await nextFrame();

  recipes.removeAttribute('aria-current');
  settings.setAttribute('aria-current', 'page');
  await nextFrame();
  await nextFrame();

  const indicator = host.shadowRoot?.querySelector<HTMLElement>('#indicator');

  expect(indicator?.style.inlineSize).toBe('64px');
});

test('updates the indicator when active target geometry changes', async () => {
  const screen = render(html`
    <rc-navigation-bar data-testid="host" style="display: block; inline-size: 240px;">
      <a href="/recipes" aria-current="page">
        <span
          data-rc-navigation-icon
          data-testid="target"
          style="display: inline-block; inline-size: 40px; block-size: 32px;"
          >R</span
        >
        <span>Recipes</span>
      </a>
      <a href="/settings">Settings</a>
    </rc-navigation-bar>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationBar;
  const target = (await screen.getByTestId('target').element()) as HTMLElement;

  await host.updateComplete;
  await nextFrame();

  target.style.inlineSize = '72px';
  await nextFrame();
  await nextFrame();

  const indicator = host.shadowRoot?.querySelector<HTMLElement>('#indicator');

  expect(indicator?.style.inlineSize).toBe('72px');
});

test('supports custom active and indicator target selectors', async () => {
  const screen = render(html`
    <rc-navigation-bar
      data-testid="host"
      active-selector="a.router-active"
      indicator-target="[data-pill]"
      style="display: block; inline-size: 240px;"
    >
      <a href="/recipes" class="router-active">
        <span data-pill style="display: inline-block; inline-size: 72px; block-size: 28px;"
          >Recipes</span
        >
      </a>
      <a href="/settings">Settings</a>
    </rc-navigation-bar>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationBar;

  await host.updateComplete;
  await nextFrame();

  const indicator = host.shadowRoot?.querySelector<HTMLElement>('#indicator');

  await vi.waitFor(() => expect(indicator?.hasAttribute('hidden')).toBe(false));
  expect(indicator?.style.inlineSize).toBe('72px');
  expect(indicator?.style.blockSize).toBe('28px');
});

test('hides the indicator when no link is current', async () => {
  const screen = render(html`
    <rc-navigation-bar data-testid="host">
      <a href="/recipes">Recipes</a>
      <a href="/settings">Settings</a>
    </rc-navigation-bar>
  `);
  const host = (await screen.getByTestId('host').element()) as RCNavigationBar;

  await host.updateComplete;
  await nextFrame();

  const indicator = host.shadowRoot?.querySelector<HTMLElement>('#indicator');

  expect(host.hasAttribute('has-active')).toBe(false);
  expect(indicator?.hasAttribute('hidden')).toBe(true);
});

test('snaps indicator animation under reduced motion', () => {
  expect(navigationBarStyles.cssText).toContain('@media (prefers-reduced-motion: reduce)');
  expect(navigationBarStyles.cssText).toContain('transition-duration: 0s');
});
