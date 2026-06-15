import { expect, test } from 'vitest';

const componentEntries = [
  'accordion',
  'app-bar',
  'combobox',
  'dialog',
  'disclosure',
  'listbox',
  'markdown-editor',
  'menu',
  'menu-button',
  'menubar',
  'range-slider',
  'search-bar',
  'select',
  'slider',
  'splitter',
  'textarea',
  'toolbar',
  'transfer-list',
  'virtual-canvas',
] as const;

test('every selective component stylesheet can be imported', async () => {
  const imports = import.meta.glob('./components/*.css');

  for (const entry of componentEntries) {
    const load = imports[`./components/${entry}.css`];
    expect(load, entry).toBeTypeOf('function');
    await load();
  }
});
