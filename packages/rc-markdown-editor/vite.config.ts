import { resolve } from 'path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ outDir: 'dist/types' })],

  // Exclude 'development' condition to prevent micromark from resolving
  // to its /dev/ entry, which imports `debug` via a Yarn Berry PnP virtual
  // path that esbuild cannot read on Windows.
  resolve: {
    conditions: ['import', 'module', 'browser', 'default'],
  },

  // Exclude bundled deps from esbuild pre-bundling — they are served via
  // Vite's Rollup transform instead, which uses the PnP-patched Node.js
  // resolver and avoids the virtual-path issue.
  optimizeDeps: {
    exclude: ['micromark', 'mdast-util-from-markdown', 'unist-util-visit', 'turndown'],
  },

  publicDir: process.env.NODE_ENV === 'production' ? false : resolve(__dirname, 'public'),
  build: {
    sourcemap: true,
    lib: {
      entry: {
        'rc-markdown-editor': resolve(__dirname, 'src/index.ts'),
        'rc-markdown-editor-define': resolve(__dirname, 'src/define.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      // Lit and rc-* packages are external; micromark/turndown/mdast are bundled.
      external: [/^@?lit(-\w+)?($|\/.+)/, /^@rcarls\/.+/],
    },
  },
});
