import { afterEach, expect, test } from 'vitest';

import '@rcarls/rc-adaptive-menu/define';
import '@rcarls/rc-button/define';
import '@rcarls/rc-card/define';
import '@rcarls/rc-chip/define';
import '@rcarls/rc-dialog/define';
import '@rcarls/rc-fab-menu/define';
import '@rcarls/rc-field/define';
import '@rcarls/rc-menu/define';
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
  'line-height',
  'min-block-size',
  'padding-inline-start',
  'padding-inline-end',
] as const;

const OWNED = `
  <rc-button><button id="owned" type="button">Owned</button></rc-button>
  <rc-chip variant="filter"><label><input id="chip-input" type="checkbox">Chip</label></rc-chip>
  <rc-menu><button id="menu-row" role="menuitem" type="button">Menu row</button></rc-menu>
  <rc-navigation-rail><button id="rail-toggle" slot="toggle" type="button">Toggle</button></rc-navigation-rail>
`;

let nativeSheet: HTMLStyleElement | undefined;

function loadNative(): void {
  nativeSheet = document.createElement('style');
  nativeSheet.textContent = nativeCss;
  document.head.append(nativeSheet);
}

function themed(content: string): HTMLElement {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-substrate';
  scope.innerHTML = content;
  document.body.append(scope);

  return scope;
}

async function settle(): Promise<void> {
  await customElements.whenDefined('rc-toolbar');
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

function styleSnapshot(scope: ParentNode, ids: string[]): Record<string, Record<string, string>> {
  return Object.fromEntries(
    ids.map((id) => {
      const computed = getComputedStyle(scope.querySelector(`#${id}`)!);

      return [
        id,
        Object.fromEntries(
          PROPERTIES.map((property) => [property, computed.getPropertyValue(property)]),
        ),
      ];
    }),
  );
}

afterEach(() => {
  nativeSheet?.remove();
  nativeSheet = undefined;
  document.body.replaceChildren();
});

test('native styles preserve owned controls while styling consumer controls in layout containers', async () => {
  const unstyled = themed(OWNED);

  await settle();

  const beforeOwned = styleSnapshot(unstyled, ['owned', 'chip-input', 'menu-row', 'rail-toggle']);

  document.body.replaceChildren();
  loadNative();

  const styled = themed(`${OWNED}
    <rc-toolbar aria-label="Format">
      <input id="toolbar-input" aria-label="Toolbar input">
      <select id="toolbar-select" aria-label="Heading"><option>One</option></select>
    </rc-toolbar>
    <rc-card><button id="card-action" slot="actions" type="button">Card</button></rc-card>
    <rc-dialog><dialog><input id="dialog-input" aria-label="Dialog field"></dialog></rc-dialog>
    <rc-popover>
      <button slot="trigger" type="button">Open</button>
      <div slot="content"><input id="popover-input" aria-label="Popover field"></div>
    </rc-popover>`);

  await settle();

  expect(styleSnapshot(styled, ['owned', 'chip-input', 'menu-row', 'rail-toggle'])).toEqual(
    beforeOwned,
  );

  for (const id of [
    'toolbar-input',
    'toolbar-select',
    'card-action',
    'dialog-input',
    'popover-input',
  ]) {
    const computed = getComputedStyle(styled.querySelector(`#${id}`)!);

    expect(computed.minBlockSize, id).not.toBe('0px');
  }
});

test('native opt-out and adaptive overflow rows remain unchanged across the native import', async () => {
  const markup = `
    <div data-rc-native="off"><button id="opted-out" type="button">Third-party</button></div>
    <rc-adaptive-menu max-shown="1" style="--rc-adaptive-menu-item-gap: 17px">
      <button id="promoted" data-priority="10" type="button">Promoted</button>
      <button id="overflowed" data-priority="1" type="button">Overflow</button>
    </rc-adaptive-menu>`;
  const unstyled = themed(markup);

  await settle();

  expect(unstyled.querySelector('#promoted')).toHaveAttribute('data-rc-action-promoted');
  expect(unstyled.querySelector('#overflowed')).toHaveAttribute('data-rc-action-overflowed');

  const ids = ['opted-out', 'overflowed', 'promoted'];
  const before = styleSnapshot(unstyled, ids);

  document.body.replaceChildren();
  loadNative();

  const styled = themed(markup);

  await settle();

  expect(styled.querySelector('#promoted')).toHaveAttribute('data-rc-action-promoted');
  expect(styled.querySelector('#overflowed')).toHaveAttribute('data-rc-action-overflowed');

  const after = styleSnapshot(styled, ids);

  expect(after['opted-out']).toEqual(before['opted-out']);
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
  const before = styleSnapshot(unstyled, ids);

  document.body.replaceChildren();
  loadNative();

  const styled = themed(markup);

  await settle();

  expect(styleSnapshot(styled, ids)).toEqual(before);
});

test('native menu protection preserves authored active and current states', async () => {
  const markup = `<rc-menu style="--rc-menu-item-gap: 13px">
    <button id="active" type="button" role="menuitem" data-active>Active</button>
    <button id="current" type="button" role="menuitem" aria-current="true">Current</button>
  </rc-menu>`;
  const unstyled = themed(markup);

  await settle();

  const before = styleSnapshot(unstyled, ['active', 'current']);

  document.body.replaceChildren();
  loadNative();

  const styled = themed(markup);

  await settle();

  expect(styleSnapshot(styled, ['active', 'current'])).toEqual(before);
});

test('a data-rc-native opt-out on a themed shadow host disables native styles', async () => {
  const host = document.createElement('div');

  host.className = 'rc-theme-substrate';
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

test('consumer controls change from their baseline when native styles are imported', async () => {
  const markup = `
    <rc-toolbar aria-label="Format">
      <input id="toolbar-input" aria-label="Toolbar input">
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

  const ids = [
    'toolbar-input',
    'toolbar-select',
    'card-action',
    'dialog-input',
    'popover-trigger',
    'popover-input',
  ];
  const before = styleSnapshot(beforeScope, ids);

  document.body.replaceChildren();
  loadNative();

  const afterScope = themed(markup);

  await settle();

  const after = styleSnapshot(afterScope, ids);

  for (const id of ids) {
    expect(after[id], id).not.toEqual(before[id]);
  }
});
