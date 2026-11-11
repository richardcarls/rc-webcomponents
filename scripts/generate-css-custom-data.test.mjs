import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCustomData, collectComponentProperties } from './generate-css-custom-data.mjs';

const tokens = {
  '--rc-accent': { default: 'Highlight', syntax: '<color>', description: 'Accent color.' },
};
const manifests = [
  {
    modules: [
      {
        declarations: [
          {
            tagName: 'rc-switch',
            cssProperties: [
              {
                name: '--rc-switch-track-size',
                syntax: '<length>',
                default: '2em',
                description: 'Track size.',
              },
              { name: '--rc-accent', description: 'Checked track color.' },
            ],
          },
        ],
      },
    ],
  },
];

test('lists shared tokens once with their contract metadata and readers', () => {
  const data = buildCustomData(
    tokens,
    collectComponentProperties(manifests),
    new Map([['--rc-accent', ['rc-button', 'rc-switch']]]),
  );
  const accent = data.properties.filter((property) => property.name === '--rc-accent');

  assert.equal(data.version, 1.1);
  assert.equal(accent.length, 1);

  assert.equal(
    accent[0].description.value,
    'Accent color.\n\nSyntax: `<color>`\n\nDefault: `Highlight`\n\nRead by: `<rc-button>`, `<rc-switch>`',
  );
});

test('documents component properties with their syntax, default, and element', () => {
  const data = buildCustomData(tokens, collectComponentProperties(manifests));
  const track = data.properties.find((property) => property.name === '--rc-switch-track-size');

  assert.equal(
    track.description.value,
    'Track size.\n\nSyntax: `<length>`\n\nDefault: `2em`\n\nRead by: `<rc-switch>`',
  );

  assert.deepEqual(
    data.properties.map((property) => property.name),
    ['--rc-accent', '--rc-switch-track-size'],
  );
});
