import assert from 'node:assert/strict';
import test from 'node:test';

import {
  aggregateSideEffects,
  aggregateSources,
  buildExportMap,
  componentSource,
  exportEntry,
} from './generate-aggregate-exports.mjs';

const components = [
  { directory: 'rc-button', manifest: { name: '@rcarls/rc-button', exports: { './define': {} } } },
  { directory: 'rc-common-ish', manifest: { name: '@rcarls/rc-common-ish', exports: {} } },
];

const handAuthoredExports = {
  '.': { import: { default: './dist/rc-webcomponents.js' } },
  './themes/base.css': './themes/base.css',
};

test('export entries point at the per-component build output', () => {
  assert.deepEqual(exportEntry('rc-button', 'define'), {
    import: {
      types: './dist/types/rc-button/define.d.ts',
      default: './dist/rc-button/define.js',
    },
  });
});

test('component sources re-export the standalone package', () => {
  assert.equal(
    componentSource({ name: '@rcarls/rc-button' }, 'index'),
    "export * from '@rcarls/rc-button';\n",
  );

  assert.equal(
    componentSource({ name: '@rcarls/rc-button' }, 'define'),
    "import '@rcarls/rc-button/define';\n\nexport * from './index.js';\n",
  );
});

test('packages without a define entry get no define subpath', () => {
  const exports = buildExportMap(handAuthoredExports, components);

  assert.ok(exports['./rc-button/define']);
  assert.ok(exports['./rc-common-ish']);
  assert.equal(exports['./rc-common-ish/define'], undefined);
});

test('hand-authored export keys survive regeneration', () => {
  const exports = buildExportMap(handAuthoredExports, components);

  assert.deepEqual(exports['.'], handAuthoredExports['.']);
  assert.equal(exports['./themes/base.css'], './themes/base.css');
});

test('regenerating is idempotent and drops removed components', () => {
  const once = buildExportMap(handAuthoredExports, components);
  const twice = buildExportMap(once, components);

  assert.deepEqual(twice, once);

  const withoutButton = buildExportMap(once, components.slice(1));

  assert.equal(withoutButton['./rc-button'], undefined);
  assert.equal(withoutButton['./rc-button/define'], undefined);
});

test('collection entries cover every component and only define what registers', () => {
  const sources = aggregateSources(components);

  assert.equal(
    sources.index,
    "export * from '@rcarls/rc-button';\nexport * from '@rcarls/rc-common-ish';\n",
  );

  assert.equal(
    sources.define,
    "import '@rcarls/rc-button/define';\n\nexport * from './index.js';\n",
  );
});

test('generated define output is marked side-effectful', () => {
  assert.ok(aggregateSideEffects.includes('./dist/*/define.js'));
});
