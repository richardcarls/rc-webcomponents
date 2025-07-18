import { resolve } from 'path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: {
        'rc-webcomponents': resolve(__dirname, 'src/index.ts'),
        'rc-webcomponents-define': resolve(__dirname, 'src/define.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^@?lit(-\w+)?($|\/.+)/, /^@rcarls\/.+/],
    },
  },
  plugins: [dts({ outDir: 'dist/types' })],
});
