/*
 * With @lit-labs/ssr-react's createElement patch, React server rendering
 * outputs each element's declarative shadow root, for wrappers and for plain
 * tags created through React.createElement. Run after the build.
 */
import '@lit-labs/ssr-react/enable-lit-ssr.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { renderToString } from 'react-dom/server';

const h = (...args) => React.createElement(...args);
const { RCButton } = await import('@rcarls/rc-react/rc-button');
const { RCSelect } = await import('@rcarls/rc-react/rc-select');

await import('@rcarls/rc-webcomponents/rc-card/define');

test('a wrapper renders its declarative shadow root', () => {
  const html = renderToString(h(RCButton, null, h('button', { type: 'button' }, 'Save')));

  assert.match(html, /^<rc-button><template shadowroot="open" shadowrootmode="open">/);
  assert.match(html, /<button type="button">Save<\/button><\/rc-button>$/);
});

test('a wrapper renders element properties on the server', () => {
  const html = renderToString(
    h(RCSelect, { popupMode: 'dialog' }, h('select', { 'aria-label': 'Status' })),
  );

  assert.match(html, /<rc-select[^>]* popup-mode="dialog"/);
  assert.doesNotMatch(html, /_\$litProps\$/);
});

test('a plain tag created through React.createElement renders its shadow root', () => {
  const html = renderToString(h('rc-card', null, h('h2', { slot: 'title' }, 'Plan')));

  assert.match(html, /^<rc-card[^>]*><template shadowroot="open" shadowrootmode="open">/);
});
