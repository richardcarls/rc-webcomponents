import assert from 'node:assert/strict';
import test from 'node:test';

import { applyCssPropertyMetadata } from './cem-css-properties.mjs';

const manifestWith = (cssProperties) => ({
  modules: [{ declarations: [{ tagName: 'rc-example', cssProperties }] }],
});

test('moves a @cssprop JSDoc type into the syntax field', () => {
  const manifest = applyCssPropertyMetadata(
    manifestWith([{ name: '--rc-example-gap', type: { text: '<length-percentage>' } }]),
  );

  assert.deepEqual(manifest.modules[0].declarations[0].cssProperties[0], {
    name: '--rc-example-gap',
    syntax: '<length-percentage>',
  });
});

test('rejects an invalid @cssprop syntax', () => {
  assert.throws(
    () =>
      applyCssPropertyMetadata(
        manifestWith([{ name: '--rc-example-x', type: { text: '2px' } }]),
      ),
    /rc-example --rc-example-x: invalid @cssprop syntax "2px"/,
  );
});

test('fills shared token metadata from the contract without overriding documentation', () => {
  const [documented, bare] = applyCssPropertyMetadata(
    manifestWith([
      { name: '--rc-accent', description: 'Checked track color.' },
      { name: '--rc-control-block-size' },
    ]),
  ).modules[0].declarations[0].cssProperties;

  assert.equal(documented.description, 'Checked track color.');
  assert.equal(documented.syntax, '<color>');
  assert.equal(bare.syntax, '<length-percentage>');
  assert.equal(bare.default, '2.25em');
  assert.match(bare.description, /block size/);
});
