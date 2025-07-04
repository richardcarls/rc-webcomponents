import { resolve } from 'path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'rc-webcomponents',
      fileName: 'rc-webcomponents',
    },
    rollupOptions: {
      external: [/^@?lit(-\w+)?($|\/.+)/],
    },
  },
  plugins: [dts({ outDir: 'dist/types' })],
});
