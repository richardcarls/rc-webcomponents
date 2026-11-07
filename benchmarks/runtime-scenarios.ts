import type { LitElement } from 'lit';

import type { RCAdaptiveMenu } from '@rcarls/rc-adaptive-menu';
import type { RCAppBar } from '@rcarls/rc-app-bar';
import type { RCCarousel } from '@rcarls/rc-carousel';
import type { RCCombobox } from '@rcarls/rc-combobox';
import type { RCMenuButton } from '@rcarls/rc-menu-button';
import type { RCSelect } from '@rcarls/rc-select';
import type { RCScroller } from '@rcarls/rc-scroller';
import type { RCTextarea } from '@rcarls/rc-textarea';
import '@rcarls/rc-adaptive-menu/define';
import '@rcarls/rc-app-bar/define';
import '@rcarls/rc-button/define';
import '@rcarls/rc-carousel/define';
import '@rcarls/rc-combobox/define';
import '@rcarls/rc-menu-button/define';
import '@rcarls/rc-menu/define';
import '@rcarls/rc-page-turner/define';
import '@rcarls/rc-select/define';
import '@rcarls/rc-scroller/define';
import '@rcarls/rc-textarea/define';
import { $root, createPageTurner, nextFrame, options, resetRoot, settle } from './shared';

// Runtime scenarios, timed one per page load by Tachometer against the base
// commit (scripts/benchmark-compare.mjs).

async function createButtons(): Promise<void> {
  resetRoot();

  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 100; index += 1) {
    const host = document.createElement('rc-button');
    const button = document.createElement('button');

    button.textContent = `Action ${index}`;
    host.append(button);
    fragment.append(host);
  }

  $root.append(fragment);
  await Promise.all(Array.from($root.children, (element) => settle(element)));
}

async function createSelects(): Promise<void> {
  resetRoot();

  const fragment = document.createDocumentFragment();

  for (let index = 0; index < 50; index += 1) {
    const host = document.createElement('rc-select');

    host.innerHTML = `<select aria-label="Choice ${index}">${options(20)}</select>`;
    fragment.append(host);
  }

  $root.append(fragment);
  await Promise.all(Array.from($root.children, (element) => settle(element)));
}

async function mountRouteComponentBatch(): Promise<void> {
  resetRoot();

  const fragment = document.createDocumentFragment();
  const hosts: LitElement[] = [];

  for (let index = 0; index < 40; index += 1) {
    const host = document.createElement('rc-scroller') as RCScroller;

    host.style.blockSize = '6rem';
    host.innerHTML = `<div style="block-size: 12rem">Scrollable ${index}</div>`;
    hosts.push(host);
    fragment.append(host);
  }

  for (let index = 0; index < 30; index += 1) {
    const host = document.createElement('rc-carousel') as RCCarousel;

    host.setAttribute('aria-label', `Carousel ${index}`);

    host.innerHTML = `
      <rc-carousel-item>One</rc-carousel-item>
      <rc-carousel-item>Two</rc-carousel-item>
      <rc-carousel-item>Three</rc-carousel-item>
    `;

    hosts.push(host);
    fragment.append(host);
  }

  for (let index = 0; index < 20; index += 1) {
    const host = document.createElement('rc-menu-button') as RCMenuButton;

    host.innerHTML = `
      <button slot="trigger">Menu ${index}</button>
      <rc-menu label="Menu ${index}"><button>Action</button></rc-menu>
    `;

    hosts.push(host);
    fragment.append(host);
  }

  for (let index = 0; index < 10; index += 1) {
    const host = document.createElement('rc-app-bar') as RCAppBar;

    host.textContent = `Title ${index}`;
    hosts.push(host);
    fragment.append(host);
  }

  for (let index = 0; index < 10; index += 1) {
    const host = document.createElement('rc-select') as RCSelect;

    host.innerHTML = `<select aria-label="Choice ${index}">${options(5)}</select>`;
    hosts.push(host);
    fragment.append(host);
  }

  $root.append(fragment);
  await Promise.all(hosts.map((host) => settle(host)));
  await nextFrame();
}

async function openAndFilterCombobox(): Promise<void> {
  resetRoot();

  const host = document.createElement('rc-combobox') as RCCombobox;

  host.innerHTML = `<select aria-label="Large choice set">${options(1000)}</select>`;
  $root.append(host);
  await settle(host);

  host.openPopup();
  await settle(host);

  const input = host.renderRoot.querySelector<HTMLInputElement>('#trigger');

  if (!input) {
    throw new Error('Combobox trigger was not rendered.');
  }

  input.value = 'Option 99';
  input.dispatchEvent(new InputEvent('input', { bubbles: true }));
  await settle(host);
  host.closePopup(false);
}

async function renderLargeTextarea(): Promise<void> {
  resetRoot();

  const host = document.createElement('rc-textarea') as RCTextarea;
  const textarea = document.createElement('textarea');
  const lines = Array.from(
    { length: 1000 },
    (_, index) => `${index}: const value = ${index}; ${index % 8 === 0 ? 'TODO revisit' : ''}`,
  );

  textarea.setAttribute('aria-label', 'Benchmark source');
  host.append(textarea);
  host.addPattern({ pattern: /TODO/g, className: 'benchmark-todo' });
  host.value = lines.join('\n');
  $root.append(host);
  await settle(host);

  host.value += '\n1001: TODO final edit';
  await settle(host);
}

async function updateAdaptiveMenu(): Promise<void> {
  resetRoot();

  const host = document.createElement('rc-adaptive-menu') as RCAdaptiveMenu;

  host.setAttribute('label', 'Benchmark actions');

  for (let index = 0; index < 50; index += 1) {
    const button = document.createElement('button');

    button.textContent = `Action ${index}`;
    host.append(button);
  }

  $root.append(host);
  await settle(host);

  for (const maximum of [5, 20, 1, 50, 3]) {
    host.maxShown = maximum;
    await host.updateComplete;
  }

  await nextFrame();
}

async function settleAnchoredPopup(): Promise<void> {
  resetRoot();

  const host = document.createElement('rc-select') as RCSelect;

  host.innerHTML = `<select aria-label="Anchored choice">${options(20)}</select>`;
  $root.append(host);
  await settle(host);
  host.openPopup();
  await settle(host);

  host.style.translate = '1px 1px';
  window.dispatchEvent(new Event('resize'));

  for (let frame = 0; frame < 12; frame += 1) {
    await nextFrame();
  }

  host.closePopup(false);
}

async function mountPageTurner(): Promise<void> {
  resetRoot();

  const turner = createPageTurner(30);

  $root.append(turner);
  await settle(turner);
}

export const runtimeScenarios: Record<string, () => Promise<void>> = {
  create100Buttons: createButtons,
  create50Selects: createSelects,
  mount220RouteComponents: mountRouteComponentBatch,
  filter1000OptionCombobox: openAndFilterCombobox,
  render1000LineTextarea: renderLargeTextarea,
  update50ActionAdaptiveMenu: updateAdaptiveMenu,
  settleAnchoredPopup,
  mount30PagePageTurner: mountPageTurner,
};
