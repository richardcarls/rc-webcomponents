import { afterEach, expect, test } from 'vitest';

import { defineLightDomBaseStyles, registeredLightDomBaseStyles } from './lightDomBaseStyles.js';

const CSS = '@layer rc-base { rc-test-base { display: block; } }';

afterEach(() => {
  for (const $style of document.querySelectorAll('[data-rc-light-dom-base^="rc-test-"]')) {
    $style.remove();
  }
});

function baseStyles(root: ParentNode, name: string): Element[] {
  return [...root.querySelectorAll(`[data-rc-light-dom-base="${name}"]`)];
}

test('registers the stylesheet when the module defines it', () => {
  defineLightDomBaseStyles('rc-test-registry', CSS);

  expect(registeredLightDomBaseStyles().get('rc-test-registry')).toBe(CSS);
});

test('installs one stylesheet per document', () => {
  const ensure = defineLightDomBaseStyles('rc-test-document', CSS);

  ensure(document);
  ensure(document);

  const $styles = baseStyles(document.head, 'rc-test-document');

  expect($styles).toHaveLength(1);
  expect($styles[0]?.textContent).toBe(CSS);
});

test('installs into each shadow root separately', () => {
  const ensure = defineLightDomBaseStyles('rc-test-shadow', CSS);
  const first = document.createElement('div').attachShadow({ mode: 'open' });
  const second = document.createElement('div').attachShadow({ mode: 'open' });

  ensure(first);
  ensure(second);
  ensure(first);

  expect(baseStyles(first, 'rc-test-shadow')).toHaveLength(1);
  expect(baseStyles(second, 'rc-test-shadow')).toHaveLength(1);
});

test('skips a root that already links the stylesheet by name or as part of "all"', () => {
  const ensureNamed = defineLightDomBaseStyles('rc-test-linked', CSS);
  const ensureAll = defineLightDomBaseStyles('rc-test-all', CSS);
  const named = document.createElement('div').attachShadow({ mode: 'open' });
  const all = document.createElement('div').attachShadow({ mode: 'open' });

  named.innerHTML = '<link rel="stylesheet" data-rc-light-dom-base="rc-other rc-test-linked">';
  all.innerHTML = '<link rel="stylesheet" data-rc-light-dom-base="all">';

  ensureNamed(named);
  ensureAll(all);

  expect(baseStyles(named, 'rc-test-linked')).toHaveLength(0);
  expect(baseStyles(all, 'rc-test-all')).toHaveLength(0);
});

test('ignores nodes that are not a document or shadow root', () => {
  const ensure = defineLightDomBaseStyles('rc-test-detached', CSS);
  const $detached = document.createElement('div');

  ensure($detached);

  expect($detached.childElementCount).toBe(0);
  expect(baseStyles(document, 'rc-test-detached')).toHaveLength(0);
});
