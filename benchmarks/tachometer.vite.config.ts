import { existsSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

import { rcCssLiteralMinify } from '../vite.shared.ts';

/*
 * Builds benchmarks/tachometer.html against one tree of package sources:
 * HEAD's `packages/` by default, or a base commit's exported `packages/`
 * (RC_BENCH_PACKAGES). Both variants compile from source with the same
 * plugins and the same scenario code, so only the packages differ.
 */
const ROOT = resolve(__dirname, '..');
const HEAD_PACKAGES = resolve(ROOT, 'packages');
const packages = resolve(process.env.RC_BENCH_PACKAGES ?? HEAD_PACKAGES);
const outDir = resolve(
  process.env.RC_BENCH_OUT_DIR ?? resolve(ROOT, '.performance/tachometer/pages/head'),
);

function isBareSpecifier(source: string): boolean {
  return !source.startsWith('.') && !source.startsWith('/') && !source.startsWith('\0');
}

function packageSources(): Plugin {
  return {
    name: 'rc-benchmark-package-sources',
    enforce: 'pre',
    async resolveId(source, importer, options) {
      const match = /^@rcarls\/(rc-[\w-]+)(?:\/(define))?$/.exec(source);

      if (match) {
        const file = resolve(packages, match[1], 'src', `${match[2] ?? 'index'}.ts`);

        if (!existsSync(file)) {
          throw new Error(`No source for ${source} at ${file}.`);
        }

        return file;
      }

      // Third-party imports from base sources resolve as if HEAD imported
      // them, so both variants share one copy of Lit and its peers.
      if (
        importer &&
        packages !== HEAD_PACKAGES &&
        importer.startsWith(packages + sep) &&
        isBareSpecifier(source)
      ) {
        return this.resolve(source, HEAD_PACKAGES + importer.slice(packages.length), {
          ...options,
          skipSelf: true,
        });
      }

      return null;
    },
  };
}

export default defineConfig({
  root: ROOT,
  base: './',
  logLevel: 'warn',
  plugins: [packageSources(), ...rcCssLiteralMinify()],
  resolve: { dedupe: ['lit', '@lit/reactive-element'] },
  build: {
    outDir,
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: { input: resolve(ROOT, 'benchmarks/tachometer.html') },
  },
});
