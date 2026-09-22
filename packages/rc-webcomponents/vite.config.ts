import { existsSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const srcRoot = resolve(__dirname, 'src');

/**
 * Per-component entries written by `yarn codegen:aggregate`. Each one emits a
 * thin re-export shim so consumers can import a single component from this
 * package without pulling in the whole collection.
 */
const componentEntries = Object.fromEntries(
  readdirSync(srcRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap(({ name }) =>
      ['index', 'define']
        .map((entry) => [`${name}/${entry}`, resolve(srcRoot, name, `${entry}.ts`)])
        .filter(([, path]) => existsSync(path)),
    ),
);

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: {
        'rc-webcomponents': resolve(__dirname, 'src/index.ts'),
        'rc-webcomponents-define': resolve(__dirname, 'src/define.ts'),
        ...componentEntries,
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^@?lit(-\w+)?($|\/.+)/, /^@rcarls\/.+/],
    },
  },
  plugins: [
    dts({
      outDir: 'dist/types',
      entryRoot: resolve(__dirname, 'src'),
      exclude: ['src/**/*.test.ts', 'src/**/test-helpers.ts'],
    }),
  ],
});
