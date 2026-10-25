import { afterEach, expect, test } from 'vitest';

import '@rcarls/rc-button/define';
import '@rcarls/rc-card/define';
import '@rcarls/rc-chip/define';
import '@rcarls/rc-dialog/define';
import '@rcarls/rc-fab/define';
import '@rcarls/rc-menu/define';
import '@rcarls/rc-menu-button/define';
import '@rcarls/rc-navigation-rail/define';
import '@rcarls/rc-toolbar/define';

import './theme.css';

const nativeCss = Object.values(
  import.meta.glob<string>('./native.css', { query: '?raw', import: 'default', eager: true }),
)[0]!;

const PROPERTIES = [
  'background-color',
  'border-top-width',
  'border-start-start-radius',
  'display',
  'font-weight',
  'justify-content',
  'line-height',
  'min-block-size',
  'padding-inline-start',
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
  <rc-button><div><button type="button">Nested owned</button></div></rc-button>
  <rc-chip variant="filter"><label><input type="checkbox">Chip</label></rc-chip>
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
  `);

  await settle();

  for (const id of ['plain', 'card', 'dialog-input']) {
    expect(getComputedStyle(scope.querySelector(`#${id}`)!).minBlockSize, id).toBe('40px');
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
    <rc-toolbar aria-label="Tools"><button type="button" id="shadow-owned">Owned</button></rc-toolbar>
  `;

  await settle();

  expect(getComputedStyle(shadow.querySelector('#shadow-plain')!).minBlockSize).toBe('40px');
  expect(getComputedStyle(shadow.querySelector('#shadow-owned')!).minBlockSize).not.toBe('40px');
});
