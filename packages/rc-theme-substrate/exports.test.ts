import { expect, test } from 'vitest';

const componentEntries = [
  'accordion',
  'app-bar',
  'bottom-sheet',
  'button',
  'card',
  'chip',
  'combobox',
  'dialog',
  'disclosure',
  'fab',
  'fab-menu',
  'field',
  'icons',
  'list-item',
  'listbox',
  'markdown-editor',
  'menu',
  'menu-button',
  'menubar',
  'modes',
  'navigation-bar',
  'navigation-rail',
  'popover',
  'range-slider',
  'search-bar',
  'select',
  'segmented-button',
  'slider',
  'snackbar',
  'splitter',
  'switch',
  'textarea',
  'toolbar',
  'tooltip',
  'transfer-list',
  'virtual-canvas',
] as const;

const cssComponentEntries = [
  'button',
  'card',
  'chip',
  'chip-group',
  'disclosure',
  'list',
  'select',
  'textarea',
] as const;

test('all opt-in native CSS component stylesheets can be imported', async () => {
  const imports = import.meta.glob('./css-components/*.css');

  for (const entry of cssComponentEntries) {
    const load = imports[`./css-components/${entry}.css`];

    expect(load, entry).toBeTypeOf('function');
    await load!();
  }

  await import('./css-components.css');
  await import('./native.css');
});

test('every selective component stylesheet can be imported', async () => {
  const imports = import.meta.glob('./components/*.css');

  for (const entry of componentEntries) {
    const load = imports[`./components/${entry}.css`];

    expect(load, entry).toBeTypeOf('function');
    await load();
  }
});
