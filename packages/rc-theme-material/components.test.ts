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
    ['rc-button', ['--rc-button-bg', '']],
    ['rc-card', ['--rc-card-bg', '']],
    ['rc-chip', ['--rc-chip-block-size', '2rem']],
    ['rc-select', ['display', 'inline']],
    ['rc-segmented-button', ['--rc-segmented-button-segment-min-block-size', '2.5rem']],
    ['rc-switch', ['--rc-switch-track-inline-size', '3.25rem']],
    ['rc-snackbar', ['--rc-snackbar-bg', '']],
    ['rc-combobox', ['display', 'inline']],
    ['rc-bottom-sheet', ['--rc-bottom-sheet-bg', '']],
    ['rc-search-bar', ['display', 'inline']],
    ['rc-textarea', ['--rc-textarea-padding', '1rem']],
    ['rc-markdown-editor', ['--rme-padding', '1rem']],
    ['rc-transfer-list', ['--rc-transfer-list-gap', '1rem']],
    ['rc-app-bar', ['font-family', '']],
    ['rc-fab-menu', ['--rc-fab-menu-bg', '']],
    ['rc-menu', ['display', 'inline']],
    ['rc-menu-button', ['display', 'inline']],
    ['rc-menubar', ['display', 'inline']],
    ['rc-navigation-bar', ['--rc-navigation-bar-bg', '']],
    ['rc-navigation-rail', ['--rc-navigation-rail-bg', '']],
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

    if (expected) {
      expect(value).toBe(expected);
    }
  }
});

test('FAB Material size presets stay in CSS modifier classes', () => {
  const scope = renderScope();
  const fab = document.createElement('rc-fab');
  const fabMenu = document.createElement('rc-fab-menu');

  fab.className = 'rc-fab--large';
  fabMenu.className = 'rc-fab--large';
  scope.append(fab, fabMenu);

  expect(getComputedStyle(fab).getPropertyValue('--rc-fab-size')).toBe('6rem');
  expect(getComputedStyle(fabMenu).getPropertyValue('--rc-fab-menu-size')).toBe('6rem');
});

test('buttons enable Material state layers and pointer ripples', () => {
  const scope = renderScope();
  const button = document.createElement('rc-button');

  scope.append(button);

  const styles = getComputedStyle(button);

  expect(styles.getPropertyValue('--rc-button-hover-state-layer-opacity')).not.toBe('0');
  expect(styles.getPropertyValue('--rc-button-pressed-state-layer-opacity')).not.toBe('0');
  expect(styles.getPropertyValue('--_rc-button-ripple-enabled')).toBe('1');
  expect(styles.getPropertyValue('--_rc-button-ripple-duration')).not.toBe('');
});

test('card heading slots follow the Material title type scale', () => {
  const scope = renderScope();
  const card = document.createElement('rc-card');
  const heading2 = document.createElement('h2');
  const heading3 = document.createElement('h3');

  heading2.slot = 'title';
  heading3.slot = 'title';
  card.append(heading2, heading3);
  scope.append(card);

  expect(getComputedStyle(heading2).fontSize).toBe('22px');
  expect(getComputedStyle(heading2).lineHeight).toBe('28px');
  expect(getComputedStyle(heading3).fontSize).toBe('16px');
  expect(getComputedStyle(heading3).lineHeight).toBe('24px');
});

test('bottom sheets preserve the drag handle geometry and style authored actions', () => {
  const scope = renderScope();
  const sheet = document.createElement('rc-bottom-sheet');
  const dialog = document.createElement('dialog');
  const handle = document.createElement('button');
  const action = document.createElement('button');
  const chip = document.createElement('rc-chip');
  const chipButton = document.createElement('button');

  scope.style.setProperty('--md-sys-color-primary', 'rgb(1, 2, 3)');
  handle.dataset.rcBottomSheetHandle = '';
  action.textContent = 'Done';
  chipButton.textContent = 'Vegetarian';
  chip.append(chipButton);
  dialog.append(handle, action, chip);
  sheet.append(dialog);
  scope.append(sheet);

  const dialogStyles = getComputedStyle(dialog);
  const handleStyles = getComputedStyle(handle);
  const handleIndicatorStyles = getComputedStyle(handle, '::before');
  const actionStyles = getComputedStyle(action);
  const chipButtonStyles = getComputedStyle(chipButton);

  expect(dialogStyles.maxInlineSize).toBe('640px');
  expect(handleStyles.inlineSize).toBe('100%');
  expect(handleStyles.minBlockSize).toBe('48px');
  expect(handleIndicatorStyles.inlineSize).toBe('32px');
  expect(handleIndicatorStyles.blockSize).toBe('4px');
  expect(handleIndicatorStyles.borderRadius).not.toBe('0px');
  expect(actionStyles.minBlockSize).toBe('40px');
  expect(actionStyles.paddingInlineStart).toBe('24px');
  expect(actionStyles.backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(actionStyles.color).toBe('rgb(1, 2, 3)');
  expect(chipButtonStyles.paddingInlineStart).not.toBe('24px');

  expect(
    getComputedStyle(chip).getPropertyValue('--rc-chip-pressed-state-layer-opacity').trim(),
  ).not.toBe('');

  expect(getComputedStyle(sheet).getPropertyValue('--rc-bottom-sheet-snap-duration').trim()).toBe(
    '500ms',
  );

  expect(getComputedStyle(sheet).getPropertyValue('--rc-bottom-sheet-snap-easing').trim()).not.toBe(
    '',
  );
});

test('segmented buttons flatten native fieldset chrome for themed segments', () => {
  const scope = renderScope();
  const segmentedButton = document.createElement('rc-segmented-button');

  scope.append(segmentedButton);

  const styles = getComputedStyle(segmentedButton);

  expect(styles.getPropertyValue('--_rc-segmented-button-fieldset-border')).toBe('0');
  expect(styles.getPropertyValue('--_rc-segmented-button-legend-position')).toBe('absolute');
  expect(styles.getPropertyValue('--_rc-segmented-button-radio-opacity')).toBe('0');
});

test('switches retain Material geometry under flex pressure', () => {
  const scope = renderScope();
  const row = document.createElement('div');
  const label = document.createElement('span');
  const switchElement = document.createElement('rc-switch');

  row.style.display = 'flex';
  row.style.inlineSize = '1px';
  label.textContent = 'A settings label that consumes the available inline space';
  row.append(label, switchElement);
  scope.append(row);

  const styles = getComputedStyle(switchElement);

  expect(styles.minInlineSize).toBe('52px');
  expect(styles.minBlockSize).toBe('32px');
  expect(styles.flexShrink).toBe('0');
  expect(switchElement.getBoundingClientRect().width).toBe(52);
});

test('app bar Material size presets stay in CSS modifier classes', () => {
  const scope = renderScope();
  const appBar = document.createElement('rc-app-bar');

  appBar.className = 'rc-app-bar--large';
  scope.append(appBar);

  expect(getComputedStyle(appBar).getPropertyValue('--rc-app-bar-expanded-padding-block')).toBe(
    '1.25rem',
  );
});

test('navigation surfaces receive Material 3 dimensions', () => {
  const scope = renderScope();
  const bar = document.createElement('rc-navigation-bar');
  const rail = document.createElement('rc-navigation-rail');

  scope.append(bar, rail);

  const barStyles = getComputedStyle(bar);
  const railStyles = getComputedStyle(rail);

  expect(barStyles.getPropertyValue('--rc-navigation-bar-block-size')).toContain('5rem');
  expect(barStyles.getPropertyValue('--rc-navigation-bar-item-min-block-size')).toBe('5rem');
  expect(barStyles.getPropertyValue('--rc-navigation-bar-indicator-bg')).not.toBe('');
  expect(barStyles.getPropertyValue('--rc-navigation-bar-focus-ring')).not.toBe('');

  expect(railStyles.getPropertyValue('--rc-navigation-rail-inline-size')).toBe('5rem');
  expect(railStyles.getPropertyValue('--rc-navigation-rail-expanded-inline-size')).toBe('16rem');
  expect(railStyles.getPropertyValue('--rc-navigation-rail-item-padding-inline')).toBe('0.5rem');

  expect(railStyles.getPropertyValue('--rc-navigation-rail-expanded-item-padding-inline')).toBe(
    '0.5rem',
  );

  expect(railStyles.getPropertyValue('--rc-navigation-rail-indicator-bg')).not.toBe('');
  expect(railStyles.getPropertyValue('--rc-navigation-rail-toggle-inline-offset')).toBe('1rem');
  expect(railStyles.getPropertyValue('--rc-navigation-rail-focus-ring')).not.toBe('');
});

test('navigation rail header FABs have no elevation', () => {
  const scope = renderScope();
  const rail = document.createElement('rc-navigation-rail');
  const fab = document.createElement('rc-fab');

  fab.slot = 'header';
  rail.append(fab);
  scope.append(rail);

  const styles = getComputedStyle(fab);

  expect(styles.getPropertyValue('--rc-fab-shadow')).toBe('none');
  expect(styles.getPropertyValue('--rc-fab-shadow-hover')).toBe('none');
  expect(styles.getPropertyValue('--rc-fab-shadow-active')).toBe('none');
});

test('icon consumers share the theme icon-font convention', () => {
  const scope = renderScope();
  const bar = document.createElement('rc-navigation-bar');
  const rail = document.createElement('rc-navigation-rail');
  const button = document.createElement('rc-button');
  const listIcon = document.createElement('span');
  const barIcon = document.createElement('span');
  const railIcon = document.createElement('span');
  const buttonIcon = document.createElement('span');

  button.setAttribute('icon-only', '');
  barIcon.dataset.rcNavigationIcon = '';
  railIcon.dataset.rcNavigationIcon = '';
  buttonIcon.dataset.rcButtonIcon = '';
  listIcon.dataset.rcIcon = '';
  bar.append(barIcon);
  rail.append(railIcon);
  button.append(buttonIcon);
  scope.append(bar, rail, button, listIcon);

  expect(getComputedStyle(buttonIcon).fontSize).toBe('24px');
  expect(getComputedStyle(buttonIcon).lineHeight).toBe('40px');
  expect(getComputedStyle(listIcon).lineHeight).toBe('24px');
  expect(getComputedStyle(barIcon).lineHeight).toBe('32px');
  expect(getComputedStyle(railIcon).lineHeight).toBe('32px');

  bar.style.setProperty('--rc-icon-font-line-height', '1');
  expect(getComputedStyle(barIcon).lineHeight).toBe('24px');
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

  expect(styles.getPropertyValue('--rc-listbox-option-gap')).toBe('1rem');
  expect(styles.getPropertyValue('--rc-listbox-option-min-block-size')).toBe('3rem');
  expect(styles.getPropertyValue('--rc-listbox-option-padding-block')).toBe('0');
  expect(styles.getPropertyValue('--rc-listbox-selected-bg')).not.toBe('');
});

test('authored list item classes receive the shared Material token contract', () => {
  const scope = renderScope();
  const list = document.createElement('ul');
  const item = document.createElement('li');
  const body = document.createElement('span');
  const headline = document.createElement('span');
  const supporting = document.createElement('span');

  list.className = 'rc-list';
  item.className = 'rc-list-item';
  body.className = 'rc-list-item__body';
  headline.className = 'rc-list-item__headline';
  supporting.className = 'rc-list-item__supporting';
  headline.textContent = 'Headline';
  supporting.textContent = 'Supporting';
  body.append(headline, supporting);
  item.append(body);
  list.append(item);
  scope.append(list);

  const itemStyles = getComputedStyle(item);

  expect(itemStyles.display).toBe('flex');
  expect(itemStyles.minBlockSize).toBe('48px');
  expect(itemStyles.gap).toBe('16px');
  expect(getComputedStyle(list).listStyleType).toBe('none');
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

    expect(styles.getPropertyValue('--rc-listbox-option-gap')).toBe('1rem');
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
  expect(styles.getPropertyValue('--rc-menu-button-indicator-color')).not.toBe('');
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
