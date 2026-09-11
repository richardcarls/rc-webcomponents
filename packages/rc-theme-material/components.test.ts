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
    ['rc-scroller', ['--rc-scroller-content-max-inline-size', '75rem']],
    ['rc-carousel', ['--rc-carousel-color', '']],
    ['rc-carousel-item', ['--rc-carousel-item-border-radius', '']],
    ['rc-list', ['--rc-list-padding-inline', '1rem']],
    ['rc-chip', ['--rc-chip-block-size', '2rem']],
    ['rc-chip-group', ['--rc-chip-group-column-gap', '0.5rem']],
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
    ['rc-adaptive-menu', ['--rc-adaptive-menu-trigger-block-size', '2.5rem']],
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

test('icons follow Material sizes by component context', () => {
  const scope = renderScope();
  const labeledButton = document.createElement('rc-button');
  const labeledIcon = document.createElement('span');
  const iconButton = document.createElement('rc-button');
  const iconButtonIcon = document.createElement('span');
  const navigationIcon = document.createElement('span');
  const chipIcon = document.createElement('span');

  labeledIcon.dataset.rcButtonIcon = '';
  iconButton.setAttribute('icon-only', '');
  iconButtonIcon.dataset.rcButtonIcon = '';
  navigationIcon.dataset.rcNavigationIcon = '';
  chipIcon.dataset.rcChipIcon = '';
  labeledButton.append(labeledIcon);
  iconButton.append(iconButtonIcon);
  scope.append(labeledButton, iconButton, navigationIcon, chipIcon);

  expect(getComputedStyle(labeledIcon).fontSize).toBe('18px');
  expect(getComputedStyle(iconButtonIcon).fontSize).toBe('24px');
  expect(getComputedStyle(navigationIcon).fontSize).toBe('24px');
  expect(getComputedStyle(chipIcon).fontSize).toBe('18px');
});

test('unmarked icon-button content receives the Material icon size', () => {
  const $scope = renderScope();
  const $host = document.createElement('rc-button');
  const $button = document.createElement('button');
  const $icon = document.createElement('span');

  $host.setAttribute('icon-only', '');
  $button.append($icon);
  $host.append($button);
  $scope.append($host);

  expect(getComputedStyle($icon).fontSize).toBe('24px');
  expect(getComputedStyle($icon).lineHeight).toBe('24px');
});

test.each([
  ['default', '', '2.5rem', '2.5rem', '1.5rem'],
  ['extra-small', 'rc-button--extra-small', '2rem', '2rem', '1.25rem'],
  ['medium', 'rc-button--medium', '3.5rem', '3.5rem', '1.5rem'],
  ['large', 'rc-button--large', '6rem', '6rem', '2rem'],
  ['extra-large', 'rc-button--extra-large', '8.5rem', '8.5rem', '2.5rem'],
])(
  'Material %s icon-button size sets its container and icon geometry',
  (_size, className, blockSize, inlineSize, iconSize) => {
    const $scope = renderScope();
    const $button = document.createElement('rc-button');

    $button.setAttribute('icon-only', '');
    $button.className = className;
    $scope.append($button);

    const styles = getComputedStyle($button);

    expect(styles.getPropertyValue('--rc-button-block-size')).toBe(blockSize);
    expect(styles.getPropertyValue('--rc-button-icon-size')).toBe(inlineSize);
    expect(styles.getPropertyValue('--rc-icon-button-icon-font-size')).toBe(iconSize);
  },
);

test.each([
  ['', 'rc-button--narrow', '2rem'],
  ['', 'rc-button--wide', '3.25rem'],
  ['rc-button--extra-small', 'rc-button--narrow', '1.75rem'],
  ['rc-button--extra-small', 'rc-button--wide', '2.5rem'],
  ['rc-button--medium', 'rc-button--narrow', '3rem'],
  ['rc-button--medium', 'rc-button--wide', '4.5rem'],
  ['rc-button--large', 'rc-button--narrow', '4rem'],
  ['rc-button--large', 'rc-button--wide', '8rem'],
  ['rc-button--extra-large', 'rc-button--narrow', '6.5rem'],
  ['rc-button--extra-large', 'rc-button--wide', '11.5rem'],
])(
  'Material icon-button classes %s %s set inline size to %s',
  (sizeClass, widthClass, inlineSize) => {
    const $scope = renderScope();
    const $button = document.createElement('rc-button');

    $button.setAttribute('icon-only', '');
    $button.className = `${sizeClass} ${widthClass}`.trim();
    $scope.append($button);

    expect(getComputedStyle($button).getPropertyValue('--rc-button-icon-size')).toBe(inlineSize);
  },
);

test.each([
  ['rc-button--narrow', '0.5rem'],
  ['rc-button--extra-small rc-button--narrow', '0.625rem'],
])(
  'Material narrow icon-button classes %s default a trailing touch-target overlap of %s',
  (className, overlap) => {
    const $scope = renderScope();
    const $button = document.createElement('rc-button');

    $button.setAttribute('icon-only', '');
    $button.className = className;
    $scope.append($button);

    expect(
      getComputedStyle($button).getPropertyValue('--rc-button-touch-target-overlap-inline-end'),
    ).toBe(overlap);

    expect(
      getComputedStyle($button).getPropertyValue('--rc-button-touch-target-overlap-inline-start'),
    ).toBe('');
  },
);

test('Material medium/large/extra-large narrow icon-buttons default no touch-target overlap', () => {
  const $scope = renderScope();
  const $button = document.createElement('rc-button');

  $button.setAttribute('icon-only', '');
  $button.className = 'rc-button--medium rc-button--narrow';
  $scope.append($button);

  expect(
    getComputedStyle($button).getPropertyValue('--rc-button-touch-target-overlap-inline-end'),
  ).toBe('0px');
});

test('Material narrow rc-menu-button trigger defaults a trailing touch-target overlap', () => {
  const $scope = renderScope();
  const $menuButton = document.createElement('rc-menu-button');

  $menuButton.setAttribute('icon-only', '');
  $menuButton.className = 'rc-menu-button--narrow';
  $scope.append($menuButton);

  expect(
    getComputedStyle($menuButton).getPropertyValue(
      '--rc-menu-button-touch-target-overlap-inline-end',
    ),
  ).toBe('0.5rem');
});

test('Material rc-adaptive-menu defaults a trailing touch-target overlap for its overflow trigger', () => {
  const $scope = renderScope();
  const $adaptiveMenu = document.createElement('rc-adaptive-menu');

  $scope.append($adaptiveMenu);

  expect(
    getComputedStyle($adaptiveMenu).getPropertyValue(
      '--rc-adaptive-menu-touch-target-overlap-inline-end',
    ),
  ).toBe('0.5rem');
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
  expect(styles.getPropertyValue('--rc-button-disabled-opacity')).toBe('0.38');
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
  const handleGroup = document.createElement('div');
  const handle = document.createElement('button');
  const action = document.createElement('button');
  const chip = document.createElement('rc-chip');
  const chipButton = document.createElement('button');

  scope.style.setProperty('--md-sys-color-primary', 'rgb(1, 2, 3)');
  handle.dataset.rcBottomSheetHandle = '';
  handleGroup.append(handle);
  action.textContent = 'Done';
  action.disabled = true;
  chipButton.textContent = 'Vegetarian';
  chip.append(chipButton);
  dialog.append(handleGroup, action, chip);
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
  expect(actionStyles.opacity).toBe('0.38');
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

test('dialog fallback styles bare buttons without crossing custom control wrappers', () => {
  const scope = renderScope();
  const host = document.createElement('rc-dialog');
  const dialog = document.createElement('dialog');
  const actions = document.createElement('footer');
  const bare = document.createElement('button');
  const wrapper = document.createElement('rc-theme-test-control');
  const wrapped = document.createElement('button');

  if (!customElements.get('rc-theme-test-control')) {
    customElements.define('rc-theme-test-control', class extends HTMLElement {});
  }

  bare.textContent = 'Save';
  wrapped.textContent = 'Delete';
  wrapper.append(wrapped);
  actions.append(bare, wrapper);
  dialog.append(actions);
  host.append(dialog);
  scope.append(host);

  expect(getComputedStyle(bare).minBlockSize).toBe('40px');
  expect(getComputedStyle(bare).paddingInlineStart).toBe('24px');
  expect(getComputedStyle(bare).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(getComputedStyle(wrapped).minBlockSize).not.toBe('40px');
  expect(getComputedStyle(wrapped).paddingInlineStart).not.toBe('24px');
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
  expect(getComputedStyle(buttonIcon).lineHeight).toBe('24px');
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

test('app-bar icon-button styles apply only to direct child controls', () => {
  const $scope = renderScope();
  const $appBar = document.createElement('rc-app-bar');
  const $directButton = document.createElement('button');
  const $buttonHost = document.createElement('rc-button');
  const $nestedButton = document.createElement('button');
  const $titleButton = document.createElement('button');

  $scope.style.padding = '16px';
  $directButton.setAttribute('aria-label', 'Back');
  $directButton.slot = 'leading';
  $nestedButton.setAttribute('aria-label', 'More');
  $buttonHost.slot = 'trailing';
  $buttonHost.append($nestedButton);
  $titleButton.textContent = 'Title action';
  $appBar.append($directButton, $buttonHost, $titleButton);
  $scope.append($appBar);

  expect(getComputedStyle($directButton).inlineSize).toBe('40px');
  expect(getComputedStyle($directButton).blockSize).toBe('40px');
  expect(getComputedStyle($nestedButton).inlineSize).not.toBe('40px');
  expect(getComputedStyle($titleButton).inlineSize).not.toBe('40px');

  const buttonRect = $directButton.getBoundingClientRect();

  expect(
    document.elementFromPoint(buttonRect.left - 2, buttonRect.top + buttonRect.height / 2),
  ).toBe($directButton);
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

test('list elements receive the shared Material token contract', () => {
  const scope = renderScope();
  const list = document.createElement('rc-list');
  const item = document.createElement('rc-list-item');
  const supporting = document.createElement('small');

  item.textContent = 'Headline';
  supporting.textContent = 'Supporting text';
  item.append(supporting);
  list.append(item);
  scope.append(list);

  const listStyles = getComputedStyle(list);

  expect(listStyles.getPropertyValue('--rc-list-padding-inline')).toBe('1rem');
  expect(listStyles.getPropertyValue('--rc-list-leading-gap')).toBe('1rem');
  expect(listStyles.getPropertyValue('--rc-list-item-min-block-size')).toBe('3.5rem');
  expect(listStyles.getPropertyValue('--rc-list-item-selected-background')).not.toBe('');
  expect(getComputedStyle(supporting).display).toBe('block');
  expect(getComputedStyle(supporting).fontSize).toBe('14px');
});

test('segmented Material lists receive expressive grouped-row tokens', () => {
  const scope = renderScope();
  const list = document.createElement('rc-list');
  const item = document.createElement('rc-list-item');

  list.setAttribute('variant', 'segmented');
  item.dataset.rcListPosition = 'only';
  list.append(item);
  scope.append(list);

  expect(getComputedStyle(list).getPropertyValue('--rc-list-row-gap')).toBe('0.125rem');
  expect(getComputedStyle(list).getPropertyValue('--rc-list-padding-inline')).toBe('1rem');
  expect(getComputedStyle(item).getPropertyValue('--rc-list-item-background')).not.toBe('');
  expect(getComputedStyle(item).getPropertyValue('--rc-list-item-border-radius')).not.toBe('');
});

test.each([
  ['filled', 'rc-button--filled'],
  ['tonal', 'rc-button--tonal'],
  ['outlined', 'rc-button--outlined'],
  ['text', 'rc-button--text'],
])('Material %s button modifier exposes its own emphasis token contract', (_variant, className) => {
  const scope = renderScope();
  const button = document.createElement('rc-button');

  button.className = className;
  scope.append(button);

  const styles = getComputedStyle(button);

  expect(styles.getPropertyValue('--rc-button-bg')).not.toBe('');
  expect(styles.getPropertyValue('--rc-button-color')).not.toBe('');
  expect(styles.getPropertyValue('--rc-button-state-layer-bg')).not.toBe('');
});

test.each([
  ['filled', 'rc-button--filled', 'rgb(179, 38, 30)', 'rgb(255, 255, 255)'],
  ['tonal', 'rc-button--tonal', 'rgb(249, 222, 220)', 'rgb(65, 14, 11)'],
  ['outlined', 'rc-button--outlined', 'transparent', 'rgb(179, 38, 30)'],
  ['text', 'rc-button--text', 'transparent', 'rgb(179, 38, 30)'],
])(
  'Material danger %s button maps to the error role contract',
  (_variant, className, background, color) => {
    const scope = renderScope();
    const button = document.createElement('rc-button');

    scope.style.setProperty('--md-sys-color-error', 'rgb(179, 38, 30)');
    scope.style.setProperty('--md-sys-color-on-error', 'rgb(255, 255, 255)');
    scope.style.setProperty('--md-sys-color-error-container', 'rgb(249, 222, 220)');
    scope.style.setProperty('--md-sys-color-on-error-container', 'rgb(65, 14, 11)');
    button.className = className;
    button.dataset.tone = 'danger';
    scope.append(button);

    const styles = getComputedStyle(button);

    expect(styles.getPropertyValue('--rc-button-bg')).toBe(background);
    expect(styles.getPropertyValue('--rc-button-color')).toBe(color);
  },
);

test('adaptive menu receives Material trigger, popup, and row geometry', () => {
  const scope = renderScope();
  const menu = document.createElement('rc-adaptive-menu');
  const nestedMenuAction = document.createElement('rc-menu-button');

  nestedMenuAction.setAttribute('data-rc-action-overflowed', '');
  menu.append(nestedMenuAction);
  scope.append(menu);

  const styles = getComputedStyle(menu);
  const nestedStyles = getComputedStyle(nestedMenuAction);

  expect(styles.getPropertyValue('--rc-adaptive-menu-trigger-inline-size')).toBe('2rem');
  expect(styles.getPropertyValue('--rc-adaptive-menu-trigger-block-size')).toBe('2.5rem');
  expect(styles.getPropertyValue('--rc-adaptive-menu-touch-target-block-size')).toBe('3rem');
  expect(styles.getPropertyValue('--rc-adaptive-menu-trigger-padding')).toBe('0.25rem');
  expect(styles.getPropertyValue('--rc-adaptive-menu-icon-size')).toBe('1.5rem');
  expect(styles.getPropertyValue('--rc-adaptive-menu-item-min-block-size')).toBe('3rem');
  expect(styles.getPropertyValue('--rc-adaptive-menu-item-padding-inline')).toBe('0.75rem');
  expect(styles.getPropertyValue('--rc-adaptive-menu-popup-background')).not.toBe('');
  expect(nestedStyles.getPropertyValue('--rc-menu-button-trigger-block-size')).toBe('3rem');
  expect(nestedStyles.getPropertyValue('--rc-menu-button-icon-size')).toBe('100%');

  nestedMenuAction.removeAttribute('data-rc-action-overflowed');
  nestedMenuAction.setAttribute('data-rc-action-promoted', '');

  expect(
    getComputedStyle(nestedMenuAction).getPropertyValue('--rc-menu-button-indicator-size'),
  ).toBe('0px');
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

test('narrow icon-only menu buttons use the Material small narrow width', () => {
  const $scope = renderScope();
  const $menuButton = document.createElement('rc-menu-button');

  $menuButton.setAttribute('icon-only', '');
  $menuButton.className = 'rc-menu-button--narrow';
  $scope.append($menuButton);

  const styles = getComputedStyle($menuButton);

  expect(styles.getPropertyValue('--rc-menu-button-trigger-block-size')).toBe('2.5rem');
  expect(styles.getPropertyValue('--rc-menu-button-icon-size')).toBe('2rem');
});

test('submenu triggers and menu rows use aligned rectangular geometry', () => {
  const $scope = renderScope();
  const $menu = document.createElement('rc-menu');
  const $submenu = document.createElement('rc-menu-button');
  const $item = document.createElement('button');

  $submenu.setAttribute('role', 'menuitem');
  $item.setAttribute('role', 'menuitem');
  $menu.append($item, $submenu);
  $scope.append($menu);

  const submenuStyles = getComputedStyle($submenu);

  expect(submenuStyles.getPropertyValue('--rc-menu-button-trigger-radius')).toBe('0');
  expect(submenuStyles.paddingInlineStart).toBe('0px');
  expect(submenuStyles.paddingInlineEnd).toBe('0px');
  expect(getComputedStyle($item).borderRadius).toBe('0px');
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
