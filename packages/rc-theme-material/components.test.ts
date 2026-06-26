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
    ['rc-splitter', ['--rc-splitter-separator-size', '0.5rem']],
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

test('listbox selected options use the selection token contract', () => {
  const scope = renderScope();
  const listbox = document.createElement('rc-listbox');
  const option = document.createElement('li');

  scope.style.setProperty('--rc-listbox-selected-bg', 'rgb(1, 2, 3)');
  scope.style.setProperty('--rc-listbox-selected-color', 'rgb(4, 5, 6)');
  option.setAttribute('role', 'option');
  option.setAttribute('aria-selected', 'true');
  listbox.append(option);
  scope.append(listbox);

  const styles = getComputedStyle(option);

  expect(styles.backgroundColor).toBe('rgb(1, 2, 3)');
  expect(styles.color).toBe('rgb(4, 5, 6)');
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
