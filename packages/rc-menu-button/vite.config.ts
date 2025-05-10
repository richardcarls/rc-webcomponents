import { resolve } from 'path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ outDir: 'dist/types' })],
  publicDir: resolve(__dirname, '../../demo-shared'),
  build: {
    sourcemap: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'rc-menu-button',
      fileName: 'rc-menu-button',
    },
    rollupOptions: {
      // Exclude lit packages from bundling
      external: [/^@?lit(-\w+)?($|\/.+)/, /^@rcarls\/.+/],
    },
  },
});
