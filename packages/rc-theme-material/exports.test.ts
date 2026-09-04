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
  'icons',
  'list-item',
  'listbox',
  'fab-menu',
  'markdown-editor',
  'menu',
  'menu-button',
  'menubar',
  'navigation-bar',
  'navigation-rail',
  'range-slider',
  'scroller',
  'search-bar',
  'select',
  'segmented-button',
  'slider',
  'snackbar',
  'splitter',
  'switch',
  'textarea',
  'toolbar',
  'transfer-list',
  'virtual-canvas',
] as const;

test('all selective, utility, and aggregate Material stylesheets can be imported', async () => {
  const imports = import.meta.glob('./components/*.css');

  for (const entry of componentEntries) {
    const load = imports[`./components/${entry}.css`];

    expect(load, entry).toBeTypeOf('function');
    await load();
  }

  await import('./state-layer.css');
  await import('./bridge.css');
  await import('./defaults.css');
  await import('./theme.css');
});
