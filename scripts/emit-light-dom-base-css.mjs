/**
 * Writes a package's light-DOM base stylesheet to `dist/base.css`.
 *
 * Run from a package directory after `vite build`. It imports the built main
 * entry in Node (every package must import without a DOM; see
 * check-node-import.mjs), then reads the stylesheet the package registered
 * through rc-common's `defineLightDomBaseStyles`. The static file carries the
 * exact CSS the element injects at runtime, so a server-rendered page can link
 * it and get structural layout before the element upgrades.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** The header written above the CSS, naming the attribute that skips runtime injection. */
export function baseCssFile(name, css) {
  return (
    `/* ${name} light-DOM base styles. Link with data-rc-light-dom-base="${name}" ` +
    'to skip the runtime copy. */\n' +
    `${css.trim()}\n`
  );
}

async function main() {
  const directory = process.cwd();
  const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
  const tag = basename(directory);
  const entry = manifest.exports?.['.']?.import?.default;

  if (!entry) {
    throw new Error(`${manifest.name}: no "." import entry to read base styles from.`);
  }

  const common = await import('@rcarls/rc-common');

  await import(pathToFileURL(resolve(directory, entry)).href);

  const css = common.registeredLightDomBaseStyles().get(tag);

  if (!css) {
    throw new Error(`${manifest.name}: the built entry registers no ${tag} light-DOM base styles.`);
  }

  writeFileSync(join(directory, 'dist/base.css'), baseCssFile(tag, css));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
