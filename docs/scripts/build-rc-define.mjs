import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'vite';

const docsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(docsRoot, '..');
const entry = join(repoRoot, 'packages', 'rc-webcomponents', 'src', 'define.ts');
const outDir = join(docsRoot, 'static', 'rc-webcomponents-dist');
const themePackages = ['rc-theme-material', 'rc-theme-substrate', 'rc-theme-win31'].map((name) => ({
  name,
  entry: join(repoRoot, 'packages', name, 'theme.css'),
  outDir: join(docsRoot, 'static', name),
  outFile: join(docsRoot, 'static', name, 'theme.css'),
}));

if (!existsSync(entry)) {
  throw new Error(`Missing ${entry}.`);
}

for (const theme of themePackages) {
  if (!existsSync(theme.entry)) {
    throw new Error(`Missing ${theme.entry}.`);
  }
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

for (const theme of themePackages) {
  mkdirSync(theme.outDir, { recursive: true });
  writeFileSync(theme.outFile, inlineCssImports(theme.entry));

  console.log(`Built docs theme CSS -> ${theme.outFile}`);
}
