import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import { rcCssLiteralMinify } from '../../vite.shared.ts';

export default defineConfig({
  plugins: [
    ...rcCssLiteralMinify(),
    dts({
      outDir: 'dist/types',
      entryRoot: resolve(__dirname, '../..'),
      exclude: ['src/**/*.test.ts', 'src/**/test-helpers.ts'],
    }),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: {
        'rc-list': resolve(__dirname, 'src/index.ts'),
        'rc-list-define': resolve(__dirname, 'src/define.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^@?lit(-\w+)?($|\/.+)/, /^@rcarls\/.+/],
    },
  },
});
