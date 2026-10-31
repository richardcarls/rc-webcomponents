import { readdirSync } from 'node:fs';
import { resolve } from 'path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const components = Object.fromEntries(
  readdirSync(resolve(__dirname, 'src/components'))
    .filter((name) => name.endsWith('.ts'))
    .map((name) => [
      `components/${name.replace(/\.ts$/, '')}`,
      resolve(__dirname, 'src/components', name),
    ]),
);

export default defineConfig({
  plugins: [
    dts({
      outDir: 'dist/types',
      entryRoot: resolve(__dirname, 'src'),
      exclude: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: { index: resolve(__dirname, 'src/index.ts'), ...components },
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^react($|\/)/, /^@lit\/react/, /^@?lit(-\w+)?($|\/.+)/, /^@rcarls\/.+/],
      output: {
        // Every module here is a React client component. Rollup drops
        // module-level directives while bundling, so the build restores it.
        banner: "'use client';",
      },
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return;
        }

        warn(warning);
      },
    },
  },
});
