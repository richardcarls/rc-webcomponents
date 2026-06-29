import { afterEach, expect, test } from 'vitest';

import './components.css';

class BlockHostElement extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = ':host { display: block; }';
    shadowRoot.append(style);
  }
}

class BlockHostElementAlt extends BlockHostElement {}

customElements.get('rc-slider') || customElements.define('rc-slider', BlockHostElement);
customElements.get('rc-range-slider') || customElements.define('rc-range-slider', BlockHostElementAlt);

afterEach(() => {
  document.body.replaceChildren();
});

function renderScope(): HTMLElement {
  const scope = document.createElement('div');
  scope.className = 'rc-theme-substrate';
  document.body.append(scope);
  return scope;
}

function renderPart(scope: HTMLElement, tagName: string, partName: string): HTMLElement {
  const host = document.createElement(tagName);
  const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  const part = document.createElement('div');

  part.setAttribute('part', partName);
  shadowRoot.append(part);
  scope.append(host);

  return part;
}

test('aggregate component styles cover the reference styling surface', () => {
  const scope = renderScope();
  const expectations = new Map<string, [string, string]>([
    ['rc-listbox', ['display', 'block']],
    ['rc-select', ['display', 'inline-block']],
    ['rc-combobox', ['display', 'inline-block']],
    ['rc-search-bar', ['display', 'inline-block']],
    ['rc-textarea', ['--rc-textarea-padding', '0.75rem']],
    ['rc-markdown-editor', ['--rme-padding', '0.75rem']],
    ['rc-transfer-list', ['--rc-transfer-list-gap', '1rem']],
    ['rc-app-bar', ['font-family', '']],
    ['rc-menu', ['display', 'inline-block']],
    ['rc-menu-button', ['display', 'inline-block']],
    ['rc-menubar', ['display', 'inline-block']],
    ['rc-toolbar', ['display', 'inline-block']],
    ['rc-slider', ['display', 'block']],
    ['rc-range-slider', ['display', 'block']],
    ['rc-splitter', ['--rc-splitter-separator-color', '']],
    ['rc-disclosure', ['display', 'block']],
    ['rc-accordion', ['display', 'grid']],
    ['rc-virtual-canvas', ['overflow', 'hidden']],
  ]);

  for (const [tagName, [property, expected]] of expectations) {
    const element = document.createElement(tagName);
    scope.append(element);
    const value = getComputedStyle(element).getPropertyValue(property);
    expect(value, `${tagName} ${property}`).not.toBe('');
    if (expected) expect(value).toBe(expected);
  }
});

test('contextual styles do not style unrelated native buttons', () => {
  const scope = renderScope();
  const button = document.createElement('button');
  scope.append(button);

  expect(getComputedStyle(button).borderRadius).toBe('0px');
});

test('app bars stack above adjacent themed content for anchored popups', () => {
  const scope = renderScope();
  const appBar = document.createElement('rc-app-bar');
  scope.append(appBar);

  expect(getComputedStyle(appBar).position).toBe('relative');
  expect(getComputedStyle(appBar).zIndex).toBe('1');
});

test('menu button trigger keeps a default button background token', () => {
  const scope = renderScope();
  const menuButton = document.createElement('rc-menu-button');
  scope.append(menuButton);

  const styles = getComputedStyle(menuButton);

  expect(styles.getPropertyValue('--rc-menu-button-trigger-background').trim()).toBe(
    'ButtonFace',
  );
});

test('splitter keeps default geometry and only adds themed color tokens', () => {
  const scope = renderScope();
  const splitter = document.createElement('rc-splitter');
  scope.append(splitter);

  const styles = getComputedStyle(splitter);

  expect(styles.getPropertyValue('--rc-splitter-separator-size')).toBe('');
  expect(styles.getPropertyValue('--rc-splitter-separator-color')).not.toBe('');
  expect(styles.getPropertyValue('--rc-splitter-handle-color')).not.toBe('');
});

test('contextual toolbar controls receive Substrate state styling', () => {
  const scope = renderScope();
  const toolbar = document.createElement('rc-toolbar');
  const button = document.createElement('button');

  button.setAttribute('aria-pressed', 'true');
  toolbar.append(button);
  scope.append(toolbar);

  expect(getComputedStyle(button).borderRadius).not.toBe('0px');
  expect(getComputedStyle(button).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  expect(getComputedStyle(button).display).toBe('inline-flex');
  expect(getComputedStyle(button).alignItems).toBe('center');
  expect(getComputedStyle(button).justifyContent).toBe('center');
});

test('search bar keeps the field focus ring off the nested native input', () => {
  const scope = renderScope();
  const searchBar = document.createElement('rc-search-bar');
  const input = document.createElement('input');

  input.type = 'search';
  searchBar.append(input);
  scope.append(searchBar);
  input.focus();

  expect(getComputedStyle(input).outlineStyle).toBe('none');
});

test('horizontal sliders keep their block layout so tracks do not collapse', () => {
  const scope = renderScope();
  const slider = document.createElement('rc-slider');
  const rangeSlider = document.createElement('rc-range-slider');

  scope.style.inlineSize = '360px';
  scope.append(slider, rangeSlider);

  expect(getComputedStyle(slider).display).toBe('block');
  expect(getComputedStyle(rangeSlider).display).toBe('block');
  expect(slider.getBoundingClientRect().width).toBeGreaterThan(300);
  expect(rangeSlider.getBoundingClientRect().width).toBeGreaterThan(300);
});

test('range slider thumb effects do not override component positioning transforms', () => {
  const scope = renderScope();
  const thumb = renderPart(scope, 'rc-range-slider', 'thumb');

  expect(getComputedStyle(thumb).transform).toBe('none');
  expect(getComputedStyle(thumb).scale).toBe('none');
});

test('embedded listbox parts receive Substrate listbox option tokens', () => {
  const scope = renderScope();
  const parts = [
    renderPart(scope, 'rc-select', 'listbox'),
    renderPart(scope, 'rc-combobox', 'listbox'),
    renderPart(scope, 'rc-transfer-list', 'listbox'),
  ];

  for (const part of parts) {
    const styles = getComputedStyle(part);

    expect(styles.getPropertyValue('--rc-listbox-option-gap')).not.toBe('');
    expect(styles.getPropertyValue('--rc-listbox-selected-bg')).not.toBe('');
  }
});

test('disclosure and accordion styles keep native details as the styled surface', () => {
  const scope = renderScope();
  const disclosure = document.createElement('rc-disclosure');
  const accordion = document.createElement('rc-accordion');

  disclosure.innerHTML = `
    <details open>
      <summary>Details</summary>
      <div><p>Expanded content</p></div>
    </details>
  `;
  accordion.innerHTML = `
    <details>
      <summary>Direct item</summary>
      <div><p>Direct content</p></div>
    </details>
  `;
  scope.append(disclosure, accordion);

  const disclosureDetails = disclosure.querySelector('details');
  const disclosureContent = disclosure.querySelector('details > div');
  const accordionSummary = accordion.querySelector('summary');
  const accordionContent = accordion.querySelector('details > div');

  expect(disclosureDetails).not.toBeNull();
  expect(disclosureContent).not.toBeNull();
  expect(accordionSummary).not.toBeNull();
  expect(accordionContent).not.toBeNull();
  expect(getComputedStyle(disclosureDetails!).borderRadius).not.toBe('0px');
  expect(getComputedStyle(accordionSummary!).minBlockSize).toBe('44px');
  expect(getComputedStyle(accordionSummary!, '::after').borderBlockStartWidth).toBe('2px');
  expect(getComputedStyle(accordionContent!).display).toBe('flow-root');
  expect(getComputedStyle(accordionContent!).paddingInlineStart).toBe('14px');
  expect(getComputedStyle(accordionContent!).paddingBlockEnd).toBe('0px');
});
