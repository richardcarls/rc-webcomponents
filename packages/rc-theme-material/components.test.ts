import { afterEach, expect, test } from 'vitest';

import './components.css';

afterEach(() => {
  document.body.replaceChildren();
});

function renderScope(): HTMLElement {
  const scope = document.createElement('div');
  scope.className = 'rc-theme-material';
  document.body.append(scope);
  return scope;
}

function renderPart(scope: HTMLElement, tagName: string, partName: string): HTMLElement {
  const host = document.createElement(tagName);
  const shadowRoot = host.attachShadow({ mode: 'open' });
  const part = document.createElement('div');

  part.setAttribute('part', partName);
  shadowRoot.append(part);
  scope.append(host);

  return part;
}

test('aggregate component styles cover every visual RC component', () => {
  const scope = renderScope();
  const expectations = new Map<string, [string, string]>([
    ['rc-listbox', ['display', 'block']],
    ['rc-select', ['display', 'inline']],
    ['rc-combobox', ['display', 'inline']],
    ['rc-search-bar', ['display', 'inline']],
    ['rc-textarea', ['--rc-textarea-padding', '1rem']],
    ['rc-markdown-editor', ['--rme-padding', '1rem']],
    ['rc-transfer-list', ['--rc-transfer-list-gap', '1rem']],
    ['rc-app-bar', ['font-family', '']],
    ['rc-menu', ['display', 'inline']],
    ['rc-menu-button', ['display', 'inline']],
    ['rc-menubar', ['display', 'inline']],
    ['rc-toolbar', ['display', 'inline']],
    ['rc-slider', ['display', 'inline']],
    ['rc-range-slider', ['display', 'inline']],
    ['rc-splitter', ['--rc-splitter-separator-size', '1.5rem']],
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
  expect(getComputedStyle(button).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
});

test('contextual toolbar controls receive Material state styling', () => {
  const scope = renderScope();
  const toolbar = document.createElement('rc-toolbar');
  const button = document.createElement('button');
  button.setAttribute('aria-pressed', 'true');
  toolbar.append(button);
  scope.append(toolbar);

  expect(getComputedStyle(button).borderRadius).not.toBe('0px');
  expect(getComputedStyle(button).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
});

test('standalone listbox receives the option token contract', () => {
  const scope = renderScope();
  const listbox = document.createElement('rc-listbox');

  scope.append(listbox);

  const styles = getComputedStyle(listbox);

  expect(styles.getPropertyValue('--rc-listbox-option-gap')).toBe('0.75rem');
  expect(styles.getPropertyValue('--rc-listbox-option-min-block-size')).toBe('3rem');
  expect(styles.getPropertyValue('--rc-listbox-option-padding-block')).toBe('0');
  expect(styles.getPropertyValue('--rc-listbox-selected-bg')).not.toBe('');
});

test('embedded listbox parts receive Material listbox option tokens', () => {
  const scope = renderScope();
  const parts = [
    renderPart(scope, 'rc-select', 'listbox'),
    renderPart(scope, 'rc-combobox', 'listbox'),
    renderPart(scope, 'rc-transfer-list', 'listbox'),
  ];

  for (const part of parts) {
    const styles = getComputedStyle(part);

    expect(styles.getPropertyValue('--rc-listbox-option-gap')).toBe('0.75rem');
    expect(styles.getPropertyValue('--rc-listbox-option-min-block-size')).toBe('3rem');
    expect(styles.getPropertyValue('--rc-listbox-option-padding-block')).toBe('0');
    expect(styles.getPropertyValue('--rc-listbox-selected-bg')).not.toBe('');
  }
});

test('standalone menu receives the Material item token contract', () => {
  const scope = renderScope();
  const menu = document.createElement('rc-menu');

  scope.append(menu);

  const styles = getComputedStyle(menu);

  expect(styles.getPropertyValue('--rc-menu-item-min-block-size')).toBe('3rem');
  expect(styles.getPropertyValue('--rc-menu-item-padding-block')).toBe('0');
  expect(styles.getPropertyValue('--rc-menu-hover-bg')).not.toBe('');
  expect(styles.getPropertyValue('--rc-menu-active-bg')).not.toBe('');
  expect(styles.getPropertyValue('--rc-menu-check-size')).toBe('1.5rem');
  expect(styles.getPropertyValue('--rc-menu-submenu-indicator-color')).not.toBe('');
});

test('menu button receives the Material trigger token contract', () => {
  const scope = renderScope();
  const menuButton = document.createElement('rc-menu-button');

  scope.append(menuButton);

  const styles = getComputedStyle(menuButton);

  expect(styles.getPropertyValue('--rc-menu-button-trigger-background')).toBe('transparent');
  expect(styles.getPropertyValue('--rc-menu-button-trigger-color')).not.toBe('');
  expect(styles.getPropertyValue('--rc-menu-button-trigger-hover-background')).not.toBe('');
  expect(styles.getPropertyValue('--rc-menu-button-trigger-open-background')).not.toBe('');
});

test('menubar receives the Material menu-button item token contract', () => {
  const scope = renderScope();
  const menubar = document.createElement('rc-menubar');

  scope.append(menubar);

  const styles = getComputedStyle(menubar);

  expect(styles.getPropertyValue('--rc-menubar-item-block-size')).toBe('2.5rem');
  expect(styles.getPropertyValue('--rc-menubar-item-padding-inline')).toBe('1rem');
  expect(styles.getPropertyValue('--rc-menubar-item-background')).toBe('transparent');
  expect(styles.getPropertyValue('--rc-menubar-item-open-background')).not.toBe('');
});

test('disclosure styles use Material list headers and card expansion', () => {
  const scope = renderScope();
  const disclosure = document.createElement('rc-disclosure');
  disclosure.innerHTML = `
    <details>
      <summary>Details</summary>
      <p>Expanded content</p>
    </details>
  `;
  scope.append(disclosure);

  const details = disclosure.querySelector('details');
  const summary = disclosure.querySelector('summary');
  const content = disclosure.querySelector('p');
  expect(details).not.toBeNull();
  expect(summary).not.toBeNull();
  expect(content).not.toBeNull();

  const summaryStyle = getComputedStyle(summary!);
  expect(summaryStyle.display).toBe('grid');
  expect(summaryStyle.minBlockSize).toBe('56px');
  expect(summaryStyle.fontSize).not.toBe('');

  const detailsStyle = getComputedStyle(details!);
  expect(detailsStyle.borderRadius).not.toBe('0px');
  expect(detailsStyle.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');

  content!.style.transitionDuration = '0ms';
  details!.open = true;
  expect(getComputedStyle(details!).boxShadow).not.toBe('none');
  expect(getComputedStyle(content!).opacity).toBe('1');
});

test('accordion styles direct and wrapped disclosures as equal-height Material segments', () => {
  const scope = renderScope();
  const accordion = document.createElement('rc-accordion');
  accordion.innerHTML = `
    <details>
      <summary>Direct item</summary>
      <p>Direct content</p>
    </details>
    <rc-disclosure>
      <details>
        <summary>Wrapped item</summary>
        <p>Wrapped content</p>
      </details>
    </rc-disclosure>
  `;
  scope.append(accordion);

  const summaries = accordion.querySelectorAll('summary');
  expect(summaries).toHaveLength(2);

  const firstSummaryStyle = getComputedStyle(summaries[0]!);
  const secondSummaryStyle = getComputedStyle(summaries[1]!);
  expect(firstSummaryStyle.display).toBe('grid');
  expect(secondSummaryStyle.display).toBe('grid');
  expect(firstSummaryStyle.minBlockSize).toBe(secondSummaryStyle.minBlockSize);

  const details = accordion.querySelectorAll('details');
  expect(details).toHaveLength(2);
  expect(getComputedStyle(details[0]!).borderRadius).toBe(
    getComputedStyle(details[1]!).borderRadius,
  );
});
