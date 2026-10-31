import { afterEach, expect, test } from 'vitest';
import { commands } from 'vitest/browser';

// Type-only: declares the renderOnServer browser command.
import type {} from '../../../test-helpers/ssr-command.js';

/*
 * Each fixture is rendered by Lit's server renderer in Node, then loaded as a
 * page in its own iframe: the browser parses the declarative shadow roots,
 * and only afterwards does a module script load Lit's hydration support and
 * the element definitions, the order a server-rendered page uses. An element
 * that renders differently in the browser than on the server fails hydration,
 * which Lit reports as an error. A real document parse matters: Chromium does
 * not upgrade elements nested in a declarative shadow root parsed by
 * element.setHTMLUnsafe().
 */
// Each element listed here is verified to hydrate to the same shadow DOM a
// client render produces. rc-field is not yet: it derives slot and value state
// from its native child before its first update.
const fixtures: Record<string, string> = {
  'rc-button': '<rc-button><button type="button">Save</button></rc-button>',
  'rc-card': '<rc-card><h2 slot="title">Plan</h2><p>Details</p></rc-card>',
  'rc-chip': '<rc-chip><button type="button">Tag</button></rc-chip>',
  'rc-progress':
    '<rc-progress><progress value="40" max="100" aria-label="Upload"></progress></rc-progress>',
  'rc-switch':
    '<rc-switch><input type="checkbox" role="switch" aria-label="Notifications"></rc-switch>',
  'rc-navigation-rail':
    '<rc-navigation-rail><nav aria-label="Main"><a href="/" aria-current="page">Home</a></nav></rc-navigation-rail>',
  'rc-app-bar': '<rc-app-bar><h1>Title</h1></rc-app-bar>',
  'rc-select':
    '<rc-select><select aria-label="Status"><option>Draft</option><option>Published</option></select></rc-select>',
};

// The page loads modules through the test server's /@fs route by absolute path.
const ROOT = new URL(import.meta.url).pathname.replace(/packages\/rc-webcomponents\/src\/.*$/, '');
const moduleUrl = (path: string) => `/@fs${ROOT}${path}`;
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

async function loadPage(tag: string, markup: string, html: string): Promise<{ page: PageResult }> {
  const define = moduleUrl(`packages/rc-webcomponents/dist/${tag}/define.js`);

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
    try {
      await import('${HYDRATE_SUPPORT}');
      await import('${define}');
      await host.updateComplete;
      // A client-rendered copy of the same markup, to compare against.
      const fresh = document.createElement('template');
      fresh.innerHTML = ${JSON.stringify(markup)};
      const copy = fresh.content.firstElementChild;
      document.body.append(copy);
      await copy.updateComplete;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const normalize = (root) => root.innerHTML.replace(/<!--[^]*?-->/g, '').replace(/<style>[^]*?<\\/style>/g, '').replace(/\\bid="rc-[a-z]+-\\d+/g, 'id="rc-id').replace(/\\s+/g, ' ').trim();
      hydrated = normalize(host.shadowRoot);
      rendered = normalize(copy.shadowRoot);
      copy.remove();
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

  return { page: win.__page };
}

for (const [tag, markup] of Object.entries(fixtures)) {
  test(`${tag} hydrates its server-rendered shadow root`, async () => {
    const html = await commands.renderOnServer(markup);
    const { page } = await loadPage(tag, markup, html);

    expect(page.serverShadow, 'the server output attaches a declarative shadow root').toBe(true);
    expect(page.definedBeforeScript).toBe(false);
    // Hydration reuses the server shadow root instead of rendering a new one.
    expect(page.sameShadow).toBe(true);
    expect(page.errors).toEqual([]);
    // Hydration keeps the server's values, so they must match a client render.
    expect(page.hydrated).toBe(page.rendered);
  });
}
