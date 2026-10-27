import { resolve } from 'path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import { rcCssLiteralMinify } from '../../vite.shared.ts';

export default defineConfig({
  plugins: [
    ...rcCssLiteralMinify(),
    dts({
      outDir: 'dist/types',
      entryRoot: resolve(__dirname, 'src'),
      exclude: ['src/**/*.test.ts', 'src/**/test-helpers.ts'],
    }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: { 'rc-textarea-adapters': resolve(__dirname, 'src/index.ts') },
      formats: ['es'],
    },
    rollupOptions: {
      // Externalize rc-textarea and all optional peer deps
      external: [/^@rcarls\//, /^@lezer\//, /^unified$/, /^unist$/, /^shiki$/],
    },
  },
});
