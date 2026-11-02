import { afterEach, expect, test } from 'vitest';
import { commands } from 'vitest/browser';

// Type-only: declares the renderOnServer browser command.
import type {} from '../../../test-helpers/ssr-command.js';
import type { SsrFixtures } from '../../../test-helpers/ssr-fixtures.js';

/*
 * The per-package server-render hydration audit. Every element has a fixture
 * in its package's ssr-fixtures.ts. Each fixture is rendered by Lit's server
 * renderer in Node, then loaded as a page in its own iframe: the browser
 * parses the declarative shadow roots, and only afterwards does a module
 * script load Lit's hydration support and the package's definitions, the
 * order a server-rendered page uses. The element must hydrate without errors
 * and end with the same shadow DOM a client render produces. A real document
 * parse matters: Chromium does not upgrade elements nested in a declarative
 * shadow root parsed by element.setHTMLUnsafe().
 */
const fixtureModules = import.meta.glob<{ default: SsrFixtures }>('../../*/ssr-fixtures.ts', {
  eager: true,
});
const manifests = import.meta.glob<{
  modules: { declarations?: { customElement?: boolean; tagName?: string }[] }[];
}>('../../*/dist/custom-elements.json', { eager: true, import: 'default' });

const packageOf = (path: string) => /\/(rc-[^/]+)\//.exec(path)?.[1] ?? '';

const fixtures = Object.entries(fixtureModules).flatMap(([path, module]) =>
  Object.entries(module.default).map(([tag, fixture]) => ({
    tag,
    pkg: packageOf(path),
    ...fixture,
  })),
);

// WebKit's srcdoc module loader needs a full URL, including the test server's origin.
const ROOT = new URL(import.meta.url).pathname.replace(/packages\/rc-webcomponents\/src\/.*$/, '');

// A page URL base also keeps Vite from rewriting this as an asset import.
const moduleUrl = (path: string) => new URL(`/@fs${ROOT}${path}`, window.location.href).href;
const HYDRATE_SUPPORT = moduleUrl('test-helpers/ssr-hydrate-entry.ts');

interface PageResult {
  errors: string[];
  serverShadow: boolean;
  definedBeforeScript: boolean;
  sameShadow: boolean;
  hydrated: string;
  rendered: string;
}

let $frame: HTMLIFrameElement | undefined;

afterEach(() => {
  $frame?.remove();
  $frame = undefined;
});

async function loadPage(
  tag: string,
  pkg: string,
  markup: string,
  html: string,
): Promise<PageResult> {
  const define = moduleUrl(`packages/rc-webcomponents/dist/${pkg}/define.js`);

  $frame = document.createElement('iframe');

  $frame.srcdoc = `<!doctype html><html lang="en"><body>${html}<script type="module">
    const errors = [];
    const report = (message) => errors.push(String(message));
    addEventListener('error', (event) => report(event.message));
    addEventListener('unhandledrejection', (event) => report(event.reason));
    const consoleError = console.error;
    console.error = (...args) => { report(args.join(' ')); consoleError(...args); };
    const host = document.querySelector('${tag}');
    const shadow = host.shadowRoot;
    const definedBeforeScript = host.matches(':defined');
    let hydrated = '';
    let rendered = '';
    // Serializes a shadow tree with sorted attributes. Generated ids, the
    // server's inline styles, and Lit's markers differ by design.
    const serialize = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent.replace(/\\s+/g, ' ');
      if (node.nodeType !== Node.ELEMENT_NODE || node.localName === 'style') return '';
      const attributes = [...node.attributes]
        .map(({ name, value }) => [
          name,
          /^(id|for|aria-[a-z]+)$/.test(name) && /\\d/.test(value)
            ? 'id'
            : name === 'style'
              ? value.replace(/;\\s*$/, '').replace(/;\\s*/g, '; ')
              : name === 'class'
                ? value.split(/\\s+/).filter(Boolean).sort().join(' ')
                : value,
        ])
        // The server writes an input's empty .value binding as value="".
        .filter(([name, value]) => !(node.localName === 'input' && name === 'value' && value === ''))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, value]) => ' ' + name + '="' + value + '"')
        .join('');
      const children = [...node.childNodes].map(serialize).join('');
      return '<' + node.localName + attributes + '>' + children + '</' + node.localName + '>';
    };
    const normalize = (root) =>
      root ? [...root.childNodes].map(serialize).join('').replace(/\\s+/g, ' ').trim() : '';
    const settle = async (element) => {
      await element.updateComplete;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await element.updateComplete;
    };
    try {
      await import('${HYDRATE_SUPPORT}');
      await import('${define}');
      await settle(host);
      hydrated = normalize(host.shadowRoot);
      // A client render of the same markup, in the same place, to compare against.
      const fresh = document.createElement('template');
      fresh.innerHTML = ${JSON.stringify(markup)};
      const copy = fresh.content.firstElementChild;
      document.body.firstElementChild.replaceWith(copy);
      const copyHost = copy.matches('${tag}') ? copy : copy.querySelector('${tag}');
      await settle(copyHost);
      rendered = normalize(copyHost.shadowRoot);
    } catch (error) {
      report(error);
    }
    window.__page = { errors, serverShadow: shadow !== null, definedBeforeScript, sameShadow: host.shadowRoot === shadow, hydrated, rendered };
  </script></body></html>`;

  document.body.append($frame);

  const win = $frame.contentWindow as Window & { __page?: PageResult };

  for (let attempt = 0; attempt < 200 && !win.__page; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  if (!win.__page) {
    throw new Error(`${tag}: the page script did not finish.`);
  }

  return win.__page;
}

test('every element has a server-render hydration fixture', () => {
  const tags = Object.values(manifests).flatMap((manifest) =>
    manifest.modules
      .flatMap((module) => module.declarations ?? [])
      .filter((declaration) => declaration.customElement && declaration.tagName)
      .map((declaration) => declaration.tagName!),
  );
  const covered = new Set(fixtures.map((fixture) => fixture.tag));

  expect(tags.length).toBeGreaterThan(40);
  expect(tags.filter((tag) => !covered.has(tag))).toEqual([]);
});

for (const { tag, pkg, markup, pending } of fixtures) {
  const run = pending ? test.fails : test;

  run(
    `${tag} hydrates its server-rendered markup${pending ? ` (pending: ${pending})` : ''}`,
    async () => {
      const html = await commands.renderOnServer(markup);
      const page = await loadPage(tag, pkg, markup, html);

      expect(page.definedBeforeScript).toBe(false);
      expect(page.errors).toEqual([]);

      if (page.serverShadow) {
        // Hydration reuses the server shadow root instead of rendering a new one.
        expect(page.sameShadow).toBe(true);
        // Hydration keeps the server's values, so they must match a client render.
        expect(page.hydrated).toBe(page.rendered);
      }
    },
  );
}
