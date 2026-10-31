/**
 * Imports every built JavaScript entry point of every workspace package in
 * Node, with no DOM, and fails if any import throws. Server frameworks
 * evaluate client modules while rendering (a React client component, a Lit
 * server render), so a package that touches `document`, `window`, or another
 * browser-only global at module scope breaks the server build even when its
 * elements only ever run in the browser.
 *
 * Each package is imported in its own Node process so one package's globals
 * cannot hide another's failure. Run the root build first: this reads `dist/`.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const packagesRoot = join(root, 'packages');

/** Export subpaths that resolve to JavaScript through an `import` or `default` condition. */
export function javascriptSubpaths(exportsField) {
  if (!exportsField || typeof exportsField !== 'object') {
    return [];
  }

  return Object.entries(exportsField)
    .filter(([subpath, target]) => !subpath.includes('*') && resolvesToJavaScript(target))
    .map(([subpath]) => subpath);
}

function resolvesToJavaScript(target) {
  if (typeof target === 'string') {
    return /\.(?:m?js|cjs)$/.test(target);
  }

  if (!target || typeof target !== 'object') {
    return false;
  }

  const branch = target.import ?? target.default;

  return branch === undefined ? false : resolvesToJavaScript(branch);
}

export function specifiersFor(manifest) {
  return javascriptSubpaths(manifest.exports).map((subpath) =>
    subpath === '.' ? manifest.name : `${manifest.name}/${subpath.replace(/^\.\//, '')}`,
  );
}

function importInIsolation(specifiers) {
  const source = specifiers
    .map((specifier) => `await import(${JSON.stringify(specifier)});`)
    .join('\n');

  execFileSync(process.execPath, ['--input-type=module', '--eval', source], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function main() {
  const failures = [];
  let checked = 0;

  for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const manifest = JSON.parse(
      readFileSync(join(packagesRoot, entry.name, 'package.json'), 'utf8'),
    );

    if (manifest.private) {
      continue;
    }

    for (const specifier of specifiersFor(manifest)) {
      checked += 1;

      try {
        importInIsolation([specifier]);
      } catch (error) {
        const output = `${error.stderr ?? ''}`.trim().split('\n');
        const reason =
          output.find((line) => /^\w*Error\b/.test(line.trim())) ?? output.at(-1) ?? error.message;

        failures.push(`${specifier}: ${reason.trim()}`);
      }
    }
  }

  if (failures.length > 0) {
    console.error(`${failures.length} of ${checked} entry points fail to import in Node:`);

    for (const failure of failures) {
      console.error(`  ${failure}`);
    }

    process.exitCode = 1;

    return;
  }

  console.log(`Imported ${checked} entry points in Node without a DOM.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
