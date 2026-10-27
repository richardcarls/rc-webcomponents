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
        'rc-navigation-bar': resolve(__dirname, 'src/index.ts'),
        'rc-navigation-bar-define': resolve(__dirname, 'src/define.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^@?lit(-\w+)?($|\/.+)/, /^@rcarls\/.+/],
    },
  },
});
