/*
 * Server-renders every built wrapper in Node, without a DOM, the way a React
 * framework renders client components on the server. Run after the build:
 * `yarn test:react-ssr`.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const subpaths = Object.keys(manifest.exports).filter((key) => key.startsWith('./rc-'));

test('every wrapper renders its tag on the server', async () => {
  assert.ok(subpaths.length > 0);

  for (const subpath of subpaths) {
    const module = await import(`@rcarls/rc-react/${subpath.slice(2)}`);

    for (const [name, Component] of Object.entries(module)) {
      const html = renderToString(createElement(Component, null, 'content'));

      assert.match(html, /^<rc-[a-z-]+[\s>]/, `${subpath} ${name}`);
      assert.match(html, /content/, `${subpath} ${name} keeps its children`);
    }
  }
});

test('the server markup carries attributes but not event handlers', async () => {
  const { RcSelect } = await import('@rcarls/rc-react/rc-select');
  const html = renderToString(
    createElement(
      RcSelect,
      { 'popup-mode': 'dialog', onRcSelectChange() {} },
      createElement('select', { name: 'status' }),
    ),
  );

  assert.equal(html, '<rc-select popup-mode="dialog"><select name="status"></select></rc-select>');
});

test('RcRegister renders nothing on the server', async () => {
  const { RcRegister } = await import('@rcarls/rc-react');

  assert.equal(renderToString(createElement(RcRegister, { tags: ['rc-card'] })), '');
});
