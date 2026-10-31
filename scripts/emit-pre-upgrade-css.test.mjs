import assert from 'node:assert/strict';
import { test } from 'node:test';

import { hostDisplay, preUpgradeCss } from './emit-pre-upgrade-css.mjs';

test('reads display from the unconditional :host rule only', () => {
  assert.equal(hostDisplay(':host{color:red;display:inline-grid}'), 'inline-grid');
  assert.equal(hostDisplay(':host([hidden]){display:none}:host{display:block}'), 'block');
  assert.equal(hostDisplay(':host{color:red}.root{display:grid}'), undefined);
  assert.equal(hostDisplay(':host{display:block!important}'), 'block');
});

test('groups tags by display and leaves out inline and none', () => {
  const css = preUpgradeCss(
    new Map([
      ['rc-card', 'grid'],
      ['rc-app-bar', 'block'],
      ['rc-list', 'block'],
      ['rc-snackbar', 'none'],
      ['rc-inline', 'inline'],
    ]),
  );

  assert.match(css, /:is\(rc-app-bar, rc-list\):not\(:defined\) \{\n {4}display: block;/);
  assert.match(css, /:is\(rc-card\):not\(:defined\) \{\n {4}display: grid;/);
  assert.doesNotMatch(css, /rc-snackbar|rc-inline/);
  assert.match(css, /^@layer rc-base \{$/m);
});
