import { resolve } from 'path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(({ command }) => ({
  plugins: [dts({ outDir: 'dist/types' })],
  publicDir: command === 'serve' ? resolve(__dirname, 'public') : false,
  build: {
    sourcemap: true,
    lib: {
      entry: {
        'rc-accordion': resolve(__dirname, 'src/index.ts'),
        'rc-accordion-define': resolve(__dirname, 'src/define.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^@?lit(-\w+)?($|\/.+)/, /^@rcarls\/.+/],
    },
  },
}));
