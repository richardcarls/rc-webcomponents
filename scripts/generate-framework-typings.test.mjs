import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectElements, reactTypings, solidTypings } from './generate-framework-typings.mjs';

const manifest = {
  modules: [
    {
      path: 'packages/rc-thing/src/rc-thing.ts',
      declarations: [
        {
          customElement: true,
          tagName: 'rc-thing',
          name: 'RCThing',
          attributes: [
            { name: 'popup-mode', fieldName: 'popupMode' },
            { name: 'open' },
            { name: 'group-name' },
          ],
          members: [
            { kind: 'field', name: 'popupMode' },
            { kind: 'field', name: 'open' },
            { kind: 'field', name: 'options' },
            { kind: 'field', name: 'selected', readonly: true },
            { kind: 'field', name: '_internal' },
            { kind: 'field', name: 'cache', privacy: 'protected' },
          ],
          events: [{ name: 'rc-thing-change' }, { name: 'CHANGE_EVENT' }],
          cssProperties: [{ name: '--rc-thing-gap' }],
        },
      ],
    },
    { path: 'scripts/other.mjs', declarations: [{ customElement: true, tagName: 'x-other' }] },
  ],
};

test('collects public writable properties, attributes, and kebab-case events', () => {
  const [element] = collectElements(manifest);

  assert.equal(element.packageName, '@rcarls/rc-thing');

  assert.deepEqual(element.properties, ['open', 'options', 'popupMode']);

  assert.deepEqual(element.attributes, [
    { name: 'group-name', field: undefined },
    { name: 'open', field: 'open' },
    { name: 'popup-mode', field: 'popupMode' },
  ]);

  assert.deepEqual(element.events, ['rc-thing-change']);
});

test('writes typed props, event handlers, and CSS properties for each framework', () => {
  const elements = collectElements(manifest);
  const react = reactTypings(elements);
  const solid = solidTypings(elements);

  assert.match(react, /import type \{ RCThing \} from '@rcarls\/rc-thing';/);
  assert.match(react, /'popup-mode'\?: RCAttribute<RCThing\['popupMode'\]>;/);
  assert.match(react, /'group-name'\?: string;/);
  assert.match(react, /'rc-thing-change'/);
  assert.match(react, /'--rc-thing-gap'\?: string \| number;/);
  assert.match(solid, /'prop:options'\?: RCThing\['options'\];/);
  assert.match(solid, /\[Event in Events as `on:\$\{Event\}`\]/);
});
