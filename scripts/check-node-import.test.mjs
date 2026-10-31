import assert from 'node:assert/strict';
import { test } from 'node:test';

import { javascriptSubpaths, specifiersFor } from './check-node-import.mjs';

test('selects export subpaths that resolve to JavaScript', () => {
  const exportsField = {
    '.': { import: { types: './dist/types/index.d.ts', default: './dist/rc-x.js' } },
    './define': { import: { default: './dist/rc-x-define.js' } },
    './react': { types: './src/react.d.ts' },
    './theme.css': './theme.css',
    './components/*.css': './components/*.css',
    './legacy': './dist/legacy.cjs',
  };

  assert.deepEqual(javascriptSubpaths(exportsField), ['.', './define', './legacy']);
});

test('builds bare specifiers for the package root and its subpaths', () => {
  const manifest = {
    name: '@rcarls/rc-x',
    exports: {
      '.': { import: { default: './dist/rc-x.js' } },
      './define': { import: { default: './dist/rc-x-define.js' } },
    },
  };

  assert.deepEqual(specifiersFor(manifest), ['@rcarls/rc-x', '@rcarls/rc-x/define']);
});
