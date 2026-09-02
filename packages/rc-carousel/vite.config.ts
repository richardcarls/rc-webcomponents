import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ outDir: 'dist/types' })],
  build: {
    sourcemap: true,
    lib: {
      entry: {
        'rc-carousel': resolve(__dirname, 'src/index.ts'),
        'rc-carousel-define': resolve(__dirname, 'src/define.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^@?lit(-\w+)?($|\/.+)/, /^@rcarls\/.+/],
    },
  },
});
