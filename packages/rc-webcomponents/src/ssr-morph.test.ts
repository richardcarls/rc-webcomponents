import { Idiomorph } from 'idiomorph';
import type { ReactiveElement } from 'lit';
import { afterEach, expect, test } from 'vitest';

import type { SsrFixtures } from '../../../test-helpers/ssr-fixtures.js';

/*
 * The DOM-morph audit. Turbo 8 page refreshes, Livewire, htmx with idiomorph,
 * and Blazor's enhanced navigation update a page by diffing the live DOM
 * against freshly server-rendered HTML. The server HTML is the author's
 * markup, without the attributes an element wrote after it upgraded, so a
 * morph removes them from the host and its light DOM. Shadow roots are not
 * touched. Each element must recover: after its fixture's markup is morphed
 * onto an upgraded copy of itself, the light DOM must carry the same
 * attributes and elements as before the morph.
 */
const fixtureModules = import.meta.glob<{ default: SsrFixtures }>('../../*/ssr-fixtures.ts', {
  eager: true,
});

const packageOf = (path: string) => /\/(rc-[^/]+)\//.exec(path)?.[1] ?? '';

const fixtures = Object.entries(fixtureModules).flatMap(([path, module]) =>
  Object.entries(module.default).map(([tag, fixture]) => ({
    tag,
    pkg: packageOf(path),
    ...fixture,
  })),
);

const ROOT = new URL(import.meta.url).pathname.replace(/packages\/rc-webcomponents\/src\/.*$/, '');
const defineUrl = (pkg: string) => `/@fs${ROOT}packages/rc-webcomponents/dist/${pkg}/define.js`;

let $container: HTMLElement | undefined;

afterEach(() => {
  $container?.remove();
  $container = undefined;
});

async function settle(rerender = false): Promise<void> {
  const hosts = [...($container?.querySelectorAll('*') ?? [])].filter(
    (element): element is ReactiveElement => 'updateComplete' in element,
  );

  if (rerender) {
    // A later update must still work, which it cannot if the morph removed
    // the markers Lit renders into an element's light DOM.
    hosts.forEach((host) => host.requestUpdate());
  }

  await Promise.all(hosts.map((host) => host.updateComplete));
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await Promise.all(hosts.map((host) => host.updateComplete));
}

/**
 * Generated ids differ between renders by design, but a missing id still
 * shows. Inline declarations are sorted, since their order carries no meaning.
 */
const normalizeValue = (name: string, value: string) => {
  if (name === 'style') {
    return value
      .split(';')
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .sort()
      .join('; ');
  }

  return /^(id|for|aria-[a-z]+)$/.test(name) && /\d/.test(value) ? 'id' : value;
};

/**
 * Lists the light DOM of the container as `path name="value"` entries, one per
 * element and attribute, skipping inline styles, which runtime measurement
 * may write.
 */
function lightDom($root: Element, path = ''): string[] {
  return [...$root.children].flatMap(($child, index) => {
    if ($child.localName === 'style' || $child.localName === 'template') {
      return [];
    }

    const childPath = `${path}/${$child.localName}[${index}]`;
    const attributes = [...$child.attributes].map(
      ({ name, value }) => `${childPath} ${name}="${normalizeValue(name, value)}"`,
    );

    return [childPath, ...attributes, ...lightDom($child, childPath)];
  });
}

for (const { tag, pkg, markup, morphPending } of fixtures) {
  const run = morphPending ? test.fails : test;

  run(
    `${tag} recovers its state after a DOM morph${morphPending ? ` (pending: ${morphPending})` : ''}`,
    async () => {
      const errors: string[] = [];
      const onError = (event: ErrorEvent) => errors.push(event.message);

      addEventListener('error', onError);

      try {
        await import(/* @vite-ignore */ defineUrl(pkg));

        $container = document.createElement('div');
        $container.innerHTML = markup;
        document.body.append($container);
        await settle();

        const $host = $container.querySelector(tag);
        const before = lightDom($container);

        await Idiomorph.morph($container, markup, { morphStyle: 'innerHTML' });
        await settle(true);

        const after = lightDom($container);
        const differences = [
          ...before.filter((entry) => !after.includes(entry)).map((entry) => `lost ${entry}`),
          ...after.filter((entry) => !before.includes(entry)).map((entry) => `gained ${entry}`),
        ];

        // A morph keeps matching nodes, so the element must not be replaced.
        expect($container.querySelector(tag)).toBe($host);

        // Named one per line, so a failure lists every attribute at once.
        if (differences.length > 0) {
          expect.fail(differences.join('\n'));
        }

        expect(errors).toEqual([]);
      } finally {
        removeEventListener('error', onError);
      }
    },
  );
}
