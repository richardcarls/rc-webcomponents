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
  publicDir: process.env.NODE_ENV === 'production' ? false : resolve(__dirname, 'public'),
  build: {
    sourcemap: true,
    lib: {
      entry: {
        'rc-textarea': resolve(__dirname, 'src/index.ts'),
        'rc-textarea-define': resolve(__dirname, 'src/define.ts'),
        'rc-textarea-folding': resolve(__dirname, 'src/folding.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      // externalize lit and sibling packages; parchment is bundled
      external: [/^@?lit(-\w+)?($|\/.+)/, /^@rcarls\/.+/],
      output: {
        manualChunks(id) {
          if (id.endsWith('/src/folding-action-controller.ts')) {
            return 'folding-action-controller';
          }

          return undefined;
        },
      },
    },
  },
});
