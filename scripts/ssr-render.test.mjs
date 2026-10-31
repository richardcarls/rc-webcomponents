import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const manifest = JSON.parse(readFileSync('dist/custom-elements.json', 'utf8'));
const tags = manifest.modules
  .flatMap((module) => module.declarations ?? [])
  .filter((declaration) => declaration.customElement && declaration.tagName)
  .map((declaration) => declaration.tagName);

const renderOnServer = (markup) =>
  execFileSync(process.execPath, ['scripts/ssr-render.mjs'], { input: markup, encoding: 'utf8' });

test('every element renders with the Lit server renderer', () => {
  assert.ok(tags.length > 40);

  const html = renderOnServer(tags.map((tag) => `<${tag}></${tag}>`).join(''));

  for (const tag of tags) {
    assert.match(html, new RegExp(`<${tag}[\\s>]`), tag);
  }
});

test('shadow-DOM elements render a declarative shadow root', () => {
  const html = renderOnServer('<rc-button><button type="button">Save</button></rc-button>');

  assert.match(html, /<rc-button[^>]*><template shadowroot="open" shadowrootmode="open">/);
  assert.match(html, /<button type="button">Save<\/button><\/rc-button>/);
});
