import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { listComponentPackages } from './aggregate-packages.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const AGGREGATE_ROOT = join(ROOT, 'packages', 'rc-webcomponents');
const AGGREGATE_SRC = join(AGGREGATE_ROOT, 'src');
const MANIFEST_PATH = join(AGGREGATE_ROOT, 'package.json');

/**
 * Every generated define entry registers an element, so none of them may be
 * dropped as unused side-effect-free code.
 */
export const aggregateSideEffects = [
  './dist/rc-webcomponents-define.js',
  './dist/*/define.js',
  './themes/*.css',
];

/** Export conditions mirror the per-package `.` and `./define` shape. */
export function exportEntry(directory, entry) {
  return {
    import: {
      types: `./dist/types/${directory}/${entry}.d.ts`,
      default: `./dist/${directory}/${entry}.js`,
    },
  };
}

/** Source for one generated per-component entry. */
export function componentSource(manifest, entry) {
  return entry === 'define'
    ? `import '${manifest.name}/define';\n\nexport * from './index.js';\n`
    : `export * from '${manifest.name}';\n`;
}

/** Sources for the collection-wide `.` and `./define` entries. */
export function aggregateSources(components) {
  const classExports = components.map(({ manifest }) => `export * from '${manifest.name}';`);
  const defineImports = components
    .filter(({ manifest }) => manifest.exports?.['./define'])
    .map(({ manifest }) => `import '${manifest.name}/define';`);

  return {
    index: `${classExports.join('\n')}\n`,
    define: `${defineImports.join('\n')}\n\nexport * from './index.js';\n`,
  };
}

/**
 * A key is ours if it both looks like a component subpath and still matches the
 * exact entry we would emit for it. Detecting this by shape rather than by the
 * current package list means a removed component's subpath is dropped instead
 * of lingering as a target that no longer builds.
 */
export function isGeneratedExport(key, value) {
  const match = /^\.\/([^/]+)(?:\/(define))?$/.exec(key);

  if (!match) {
    return false;
  }

  const [, directory, define] = match;

  return JSON.stringify(value) === JSON.stringify(exportEntry(directory, define ?? 'index'));
}

/** Hand-authored export keys are preserved; generated subpaths are rebuilt. */
export function buildExportMap(existingExports, components) {
  const exports = {};

  for (const [key, value] of Object.entries(existingExports)) {
    if (!isGeneratedExport(key, value)) {
      exports[key] = value;
    }
  }

  for (const { directory, manifest } of components) {
    exports[`./${directory}`] = exportEntry(directory, 'index');

    if (manifest.exports?.['./define']) {
      exports[`./${directory}/define`] = exportEntry(directory, 'define');
    }
  }

  return exports;
}

function buildFiles(components) {
  const files = new Map();

  for (const { directory, manifest } of components) {
    files.set(join(AGGREGATE_SRC, directory, 'index.ts'), componentSource(manifest, 'index'));

    if (manifest.exports?.['./define']) {
      files.set(join(AGGREGATE_SRC, directory, 'define.ts'), componentSource(manifest, 'define'));
    }
  }

  const sources = aggregateSources(components);

  files.set(join(AGGREGATE_SRC, 'index.ts'), sources.index);
  files.set(join(AGGREGATE_SRC, 'define.ts'), sources.define);

  return files;
}

function buildManifest(components) {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

  manifest.exports = buildExportMap(manifest.exports, components);
  manifest.sideEffects = aggregateSideEffects;

  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function staleDirectories(components) {
  const expected = new Set(components.map(({ directory }) => directory));

  return readdirSync(AGGREGATE_SRC, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !expected.has(entry.name))
    .map((entry) => join(AGGREGATE_SRC, entry.name));
}

export function generateAggregateExports({ check = false } = {}) {
  const components = listComponentPackages(ROOT);
  const files = buildFiles(components);
  const manifest = buildManifest(components);
  const drift = [];

  for (const [path, contents] of files) {
    const current = existsSync(path) ? readFileSync(path, 'utf8') : undefined;

    if (current === contents) {
      continue;
    }

    drift.push(current === undefined ? `missing ${path}` : `stale ${path}`);

    if (!check) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, contents);
    }
  }

  if (readFileSync(MANIFEST_PATH, 'utf8') !== manifest) {
    drift.push(`stale ${MANIFEST_PATH}`);

    if (!check) {
      writeFileSync(MANIFEST_PATH, manifest);
    }
  }

  for (const path of staleDirectories(components)) {
    drift.push(`orphaned ${path}`);

    if (!check) {
      rmSync(path, { recursive: true, force: true });
    }
  }

  return { componentCount: components.length, drift };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const check = process.argv.includes('--check');
  const { componentCount, drift } = generateAggregateExports({ check });

  if (check && drift.length > 0) {
    console.error(
      ['Aggregate exports are out of date. Run `yarn codegen:aggregate`.', ...drift].join('\n'),
    );

    process.exitCode = 1;
  } else if (check) {
    console.log(`Aggregate exports are up to date (${componentCount} component packages).`);
  } else {
    console.log(
      `Generated aggregate exports for ${componentCount} component packages (${drift.length} file(s) changed).`,
    );
  }
}
