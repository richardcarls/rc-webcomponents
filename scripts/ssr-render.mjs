/**
 * Renders markup with Lit's server renderer and prints the HTML, with
 * declarative shadow DOM for every shadow-DOM element. Reads the markup from
 * stdin so tests can render arbitrary fixtures. Runs in its own process so the
 * server DOM shim never leaks into the caller.
 *
 *   echo '<rc-button><button>Save</button></rc-button>' | node scripts/ssr-render.mjs
 */
import { render } from '@lit-labs/ssr';
import { collectResultSync } from '@lit-labs/ssr/lib/render-result.js';
import { html, unsafeStatic } from 'lit/static-html.js';
import { text } from 'node:stream/consumers';

await import('@rcarls/rc-webcomponents/define');

const markup = await text(process.stdin);

process.stdout.write(collectResultSync(render(html`${unsafeStatic(markup)}`)));
