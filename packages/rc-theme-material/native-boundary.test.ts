import { afterEach, expect, test } from 'vitest';

import '@rcarls/rc-button/define';
import '@rcarls/rc-card/define';
import '@rcarls/rc-chip/define';
import '@rcarls/rc-adaptive-menu/define';
import '@rcarls/rc-dialog/define';
import '@rcarls/rc-fab/define';
import '@rcarls/rc-fab-menu/define';
import '@rcarls/rc-field/define';
import '@rcarls/rc-menu/define';
import '@rcarls/rc-menu-button/define';
import '@rcarls/rc-navigation-rail/define';
import '@rcarls/rc-popover/define';
import '@rcarls/rc-toolbar/define';

import './theme.css';

const nativeCss = Object.values(
  import.meta.glob<string>('./native.css', { query: '?raw', import: 'default', eager: true }),
)[0]!;

const PROPERTIES = [
  'background-color',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'box-shadow',
  'border-start-start-radius',
  'display',
  'font-family',
  'font-size',
  'font-weight',
  'gap',
  'justify-content',
  'line-height',
  'min-block-size',
  'padding-inline-start',
  'padding-inline-end',
] as const;

const OWNED = `
  <rc-menu><button type="button">Menu item</button></rc-menu>
  <rc-fab><button type="button" aria-label="Create">+</button></rc-fab>
  <rc-menu-button>
    <button slot="trigger" type="button">Menu trigger</button>
    <rc-menu><button type="button">Nested menu item</button></rc-menu>
  </rc-menu-button>
  <rc-navigation-rail><button slot="toggle" type="button" aria-label="Toggle">=</button></rc-navigation-rail>
  <rc-toolbar aria-label="Format"><button type="button">Toolbar button</button></rc-toolbar>
  <rc-chip variant="filter"><label><input type="checkbox">Chip</label></rc-chip>
  <rc-menu><div><button role="menuitem" type="button">Nested menu item</button></div></rc-menu>
`;

let nativeSheet: HTMLStyleElement | undefined;

function loadNative() {
  nativeSheet = document.createElement('style');
  nativeSheet.textContent = nativeCss;
  document.head.append(nativeSheet);
}

function themed(html: string) {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';
  scope.style.pointerEvents = 'none';
  scope.style.setProperty('--rc-motion-effects-duration-fast', '0ms');
  scope.innerHTML = html;
  document.body.append(scope);

  return scope;
}

function styles(root: ParentNode) {
  return Object.fromEntries(
    [...root.querySelectorAll('button, input')].map(($control) => {
      const computed = getComputedStyle($control);
      const name = `${$control.parentElement!.localName} > ${$control.textContent || $control.localName}`;

      return [
        name,
        Object.fromEntries(
          PROPERTIES.map((property) => [property, computed.getPropertyValue(property)]),
        ),
      ];
    }),
  );
}

function stylesById(root: ParentNode, ids: string[]) {
  return Object.fromEntries(
    ids.map((id) => {
      const computed = getComputedStyle(root.querySelector(`#${id}`)!);

      return [
        id,
        Object.fromEntries(
          PROPERTIES.map((property) => [property, computed.getPropertyValue(property)]),
        ),
      ];
    }),
  );
}

async function settle() {
  await customElements.whenDefined('rc-toolbar');
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

afterEach(() => {
  nativeSheet?.remove();
  nativeSheet = undefined;
  document.body.replaceChildren();
});

test('native styles leave controls owned by RC wrappers unchanged', async () => {
  const unstyled = themed(OWNED);

  await settle();

  const before = styles(unstyled);

  document.body.replaceChildren();
  loadNative();

  const after = themed(OWNED);

  await settle();
  expect(styles(after)).toEqual(before);
});

test('native styles reach consumer controls inside RC containers', async () => {
  loadNative();

  const scope = themed(`
    <button type="button" id="plain">Plain</button>
    <rc-card><button slot="actions" type="button" id="card">Card action</button></rc-card>
    <rc-dialog><dialog><form><input id="dialog-input" aria-label="Name"></form></dialog></rc-dialog>
    <rc-popover>
      <button slot="trigger" id="popover-trigger" type="button">Open</button>
      <div slot="content"><input id="popover-input" aria-label="Popover field"></div>
    </rc-popover>
    <rc-toolbar aria-label="Format">
      <button id="toolbar-button" type="button">Bold</button>
      <input id="toolbar-input" aria-label="Font size">
      <select id="toolbar-select" aria-label="Heading"><option>One</option></select>
    </rc-toolbar>
  `);

  await settle();

  for (const id of [
    'plain',
    'card',
    'dialog-input',
    'popover-trigger',
    'popover-input',
    'toolbar-button',
    'toolbar-input',
    'toolbar-select',
  ]) {
    expect(getComputedStyle(scope.querySelector(`#${id}`)!).minBlockSize, id).toBe('40px');
  }
});

test('consumer controls change from their baseline when native styles are imported', async () => {
  const markup = `
    <rc-toolbar aria-label="Format">
      <input id="toolbar-input" aria-label="Font size">
      <select id="toolbar-select" aria-label="Heading"><option>One</option></select>
    </rc-toolbar>
    <rc-card><button id="card-action" slot="actions" type="button">Card</button></rc-card>
    <rc-dialog><dialog><input id="dialog-input" aria-label="Dialog field"></dialog></rc-dialog>
    <rc-popover>
      <button slot="trigger" id="popover-trigger" type="button">Open</button>
      <div slot="content"><input id="popover-input" aria-label="Popover field"></div>
    </rc-popover>`;
  const beforeScope = themed(markup);

  await settle();

  const before = stylesById(beforeScope, [
    'toolbar-input',
    'toolbar-select',
    'card-action',
    'dialog-input',
    'popover-trigger',
    'popover-input',
  ]);

  document.body.replaceChildren();
  loadNative();

  const afterScope = themed(markup);

  await settle();

  const after = stylesById(afterScope, Object.keys(before));

  for (const id of Object.keys(before)) {
    expect(after[id], id).not.toEqual(before[id]);
  }
});

test('data-rc-native="off" opts a subtree out', async () => {
  loadNative();

  const scope = themed(`
    <div data-rc-native="off"><button type="button">Third-party</button></div>
    <button type="button" data-rc-native="off">Opted out</button>
  `);

  for (const $button of scope.querySelectorAll('button')) {
    expect(getComputedStyle($button).minBlockSize, $button.textContent!).not.toBe('40px');
  }
});

test('native styles preserve an overflowed adaptive-menu row after its marker is assigned', async () => {
  const markup = `<rc-adaptive-menu max-shown="1" style="--rc-adaptive-menu-item-gap: 17px">
    <button type="button" id="promoted" data-priority="10">Promoted action</button>
    <button type="button" id="overflowed" data-priority="1">Overflow action</button>
  </rc-adaptive-menu>`;
  const unstyled = themed(markup);

  await settle();

  expect(unstyled.querySelector('#promoted')).toHaveAttribute('data-rc-action-promoted');
  expect(unstyled.querySelector('#overflowed')).toHaveAttribute('data-rc-action-overflowed');

  const ids = ['overflowed', 'promoted'];
  const before = stylesById(unstyled, ids);

  document.body.replaceChildren();
  loadNative();

  const styled = themed(markup);

  await settle();

  expect(styled.querySelector('#promoted')).toHaveAttribute('data-rc-action-promoted');
  expect(styled.querySelector('#overflowed')).toHaveAttribute('data-rc-action-overflowed');

  const after = stylesById(styled, ids);

  expect(after.overflowed).toEqual(before.overflowed);
  expect(after.promoted).not.toEqual(before.promoted);
});

test('native styles preserve FAB-menu triggers and grouped field controls', async () => {
  const markup = `
    <rc-fab-menu>
      <button id="fab-trigger" slot="trigger" type="button">Create</button>
    </rc-fab-menu>
    <rc-field>
      <fieldset>
        <legend>Amount</legend>
        <input id="field-input" aria-label="Value">
        <select id="field-select" aria-label="Unit"><option>One</option></select>
      </fieldset>
    </rc-field>`;
  const unstyled = themed(markup);

  await settle();

  const ids = ['fab-trigger', 'field-input', 'field-select'];
  const before = stylesById(unstyled, ids);

  document.body.replaceChildren();
  loadNative();

  const styled = themed(markup);

  await settle();

  expect(stylesById(styled, ids)).toEqual(before);
});

test('native menu protection preserves authored active and current states', async () => {
  const markup = `<rc-menu style="--rc-menu-item-gap: 13px">
    <button id="active" type="button" role="menuitem" data-active>Active</button>
    <button id="current" type="button" role="menuitem" aria-current="true">Current</button>
  </rc-menu>`;
  const unstyled = themed(markup);

  await settle();

  const before = stylesById(unstyled, ['active', 'current']);

  document.body.replaceChildren();
  loadNative();

  const styled = themed(markup);

  await settle();

  expect(stylesById(styled, ['active', 'current'])).toEqual(before);
});

test('native rules stay below unlayered consumer rules', () => {
  loadNative();

  const consumer = document.createElement('style');

  consumer.textContent = '.consumer { border-radius: 3px; }';
  document.head.append(consumer);

  const scope = themed('<button type="button" class="consumer">Consumer</button>');

  expect(getComputedStyle(scope.querySelector('button')!).borderStartStartRadius).toBe('3px');
  consumer.remove();
});

test('a themed shadow root gets native styles and keeps the RC boundary', async () => {
  const host = document.createElement('div');

  host.className = 'rc-theme-material';
  document.body.append(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const sheet = new CSSStyleSheet();

  sheet.replaceSync(nativeCss);
  shadow.adoptedStyleSheets = [sheet];

  shadow.innerHTML = `
    <button type="button" id="shadow-plain">Plain</button>
    <rc-menu><button role="menuitem" type="button" id="shadow-owned">Owned</button></rc-menu>
    <rc-adaptive-menu max-shown="1">
      <button data-priority="10" type="button">Promoted</button>
      <button data-priority="1" type="button" id="shadow-overflowed">Overflow</button>
    </rc-adaptive-menu>
  `;

  await settle();

  expect(getComputedStyle(shadow.querySelector('#shadow-plain')!).minBlockSize).toBe('40px');

  expect(getComputedStyle(shadow.querySelector('#shadow-owned')!).minBlockSize).toBe('48px');
  expect(shadow.querySelector('#shadow-overflowed')).toHaveAttribute('data-rc-action-overflowed');
  expect(getComputedStyle(shadow.querySelector('#shadow-overflowed')!).display).toBe('flex');
});

test('a data-rc-native opt-out on a themed shadow host disables native styles', async () => {
  const host = document.createElement('div');

  host.className = 'rc-theme-material';
  document.body.append(host);

  const shadow = host.attachShadow({ mode: 'open' });
  const sheet = new CSSStyleSheet();

  sheet.replaceSync(nativeCss);
  shadow.adoptedStyleSheets = [sheet];
  shadow.innerHTML = '<button type="button">Opted out</button>';

  await settle();

  const button = shadow.querySelector('button')!;

  expect(getComputedStyle(button).minBlockSize).toBe('40px');
  host.setAttribute('data-rc-native', 'off');
  expect(getComputedStyle(button).minBlockSize).not.toBe('40px');
});
