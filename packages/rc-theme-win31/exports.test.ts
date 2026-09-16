import { expect, test } from 'vitest';

const componentEntries = [
  'accordion',
  'adaptive-menu',
  'app-bar',
  'bottom-sheet',
  'button',
  'card',
  'carousel',
  'chip',
  'chip-group',
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
  'progress',
  'range-slider',
  'scroller',
  'search-bar',
  'segmented-button',
  'select',
  'slider',
  'snackbar',
  'splitter',
  'switch',
  'textarea',
  'toolbar',
  'transfer-list',
  'virtual-canvas',
] as const;

test('every selective component stylesheet can be imported', async () => {
  const imports = import.meta.glob('./components/*.css');

  for (const entry of componentEntries) {
    const path = `./components/${entry}.css`;

    expect(imports[path], `missing ${path}`).toBeTypeOf('function');
    await expect(imports[path]!()).resolves.toBeDefined();
  }
});

test('the component entry list and the component directory agree', () => {
  const found = Object.keys(import.meta.glob('./components/*.css'))
    .map((path) => path.replace('./components/', '').replace('.css', ''))
    .sort();

  expect(found).toEqual([...componentEntries].sort());
});

test('every component stylesheet is reachable from components.css', async () => {
  const entry = Object.values(
    import.meta.glob('./components.css', { query: '?raw', import: 'default', eager: true }),
  )[0] as string;

  for (const name of componentEntries) {
    expect(entry, `components.css does not import ${name}`).toContain(
      `@import './components/${name}.css';`,
    );
  }
});
