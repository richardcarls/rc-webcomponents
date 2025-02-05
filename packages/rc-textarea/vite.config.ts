import { resolve } from 'path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ outDir: 'dist/types' })],
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'rc-textarea',
      fileName: 'rc-textarea',
    },
    rollupOptions: {
      // Exclude lit packages from bundling; bundle parchment
      external: [/^@?lit(-\w+)?($|\/.+)/],
    },
  },
});
