import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'vite';

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(docsRoot, '..');
const entry = join(repoRoot, 'packages', 'rc-webcomponents', 'src', 'define.ts');
const outDir = join(docsRoot, 'static', 'rc-webcomponents-dist');
const materialThemeEntry = join(repoRoot, 'packages', 'rc-theme-material', 'theme.css');
const materialThemeOutDir = join(docsRoot, 'static', 'rc-theme-material');
const materialThemeOutFile = join(materialThemeOutDir, 'theme.css');
const substrateThemeEntry = join(repoRoot, 'packages', 'rc-theme-substrate', 'theme.css');
const substrateThemeOutDir = join(docsRoot, 'static', 'rc-theme-substrate');
const substrateThemeOutFile = join(substrateThemeOutDir, 'theme.css');

if (!existsSync(entry)) {
  throw new Error(`Missing ${entry}.`);
}

if (!existsSync(materialThemeEntry)) {
  throw new Error(`Missing ${materialThemeEntry}.`);
}

if (!existsSync(substrateThemeEntry)) {
  throw new Error(`Missing ${substrateThemeEntry}.`);
}

function inlineCssImports(filePath, seen = new Set()) {
  const resolvedPath = resolve(filePath);
  if (seen.has(resolvedPath)) {
    return '';
  }

  seen.add(resolvedPath);

  return readFileSync(resolvedPath, 'utf8').replace(
    /@import\s+['"](.+?)['"];/g,
    (_match, importPath) => inlineCssImports(resolve(dirname(resolvedPath), importPath), seen),
  );
}

await build({
  configFile: false,
  logLevel: 'warn',
  build: {
    emptyOutDir: true,
    lib: {
      entry,
      formats: ['es'],
      fileName: () => 'rc-webcomponents-define.js',
    },
    outDir,
    sourcemap: true,
    target: 'es2022',
  },
  resolve: {
    dedupe: ['lit', '@lit/reactive-element'],
  },
});

console.log(`Built docs custom-element bundle -> ${outDir}`);

mkdirSync(materialThemeOutDir, { recursive: true });
writeFileSync(materialThemeOutFile, inlineCssImports(materialThemeEntry));

console.log(`Built docs Material theme CSS -> ${materialThemeOutFile}`);

mkdirSync(substrateThemeOutDir, { recursive: true });
writeFileSync(substrateThemeOutFile, inlineCssImports(substrateThemeEntry));

console.log(`Built docs Substrate theme CSS -> ${substrateThemeOutFile}`);
