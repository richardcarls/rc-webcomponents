import { html } from 'lit';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-lit';

import { findNearestScrollAncestor } from './findNearestScrollAncestor.js';

test('finds a scroll ancestor across open and closed shadow roots', () => {
  const screen = render(html`<div style="overflow:auto"><div></div></div>`);
  const $port = screen.container.firstElementChild!;
  const $shell = $port.firstElementChild!;
  const $inner = document.createElement('div');
  const $leaf = document.createElement('span');

  $shell.attachShadow({ mode: 'open' }).append($inner);
  $inner.attachShadow({ mode: 'closed' }).append($leaf);
  expect(findNearestScrollAncestor($leaf)).toBe($port);
});

test('follows assigned slots into the actual scrolling wrapper', () => {
  const screen = render(html`<div><span></span></div>`);
  const $shell = screen.container.firstElementChild!;
  const $leaf = $shell.firstElementChild!;
  const $port = document.createElement('div');

  $port.style.overflow = 'auto';
  $port.append(document.createElement('slot'));
  $shell.attachShadow({ mode: 'open' }).append($port);
  expect(findNearestScrollAncestor($leaf)).toBe($port);
});

test('skips the element itself and uses its owner document as fallback', () => {
  const $leaf = document.createElement('div');

  $leaf.style.overflow = 'auto';
  expect(findNearestScrollAncestor($leaf)).toBe(document.scrollingElement);
});
