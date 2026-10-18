import { resolve } from 'path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import { rcCssLiteralMinify } from '../../vite.shared.ts';

export default defineConfig({
  plugins: [
    ...rcCssLiteralMinify(),
    dts({
      outDir: 'dist/types',
      entryRoot: resolve(__dirname, 'src'),
      exclude: ['src/**/*.test.ts', 'src/**/test-helpers.ts'],
    }),
  ],
  publicDir: process.env.NODE_ENV === 'production' ? false : resolve(__dirname, 'public'),
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'rc-common',
      fileName: 'rc-common',
    },
    rollupOptions: {
      // Exclude lit packages from bundling
      external: [/^@?lit(-\w+)?($|\/.+)/],
      output: [
        {
          // One file per source module, so a consumer's bundler can split
          // rc-common between initial and lazily loaded chunks instead of
          // keeping every used export in one shared module.
          format: 'es',
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: ({ name }) => (name === 'index' ? 'rc-common.js' : 'modules/[name].js'),
        },
        {
          format: 'umd',
          name: 'rc-common',
          entryFileNames: 'rc-common.umd.cjs',
          // UMD global names for the externalized lit submodules. Nothing
          // actually consumes this UMD build via <script>-tag globals (the
          // package's "main" points here only for CJS require() interop), so
          // these names just need to be stable and unique, silencing Rollup's
          // "No name was provided... guessing" warning.
          globals: {
            lit: 'lit',
            'lit/directive.js': 'litDirective',
            'lit/async-directive.js': 'litAsyncDirective',
            'lit/decorators.js': 'litDecorators',
            'lit/directives/if-defined.js': 'litIfDefined',
          },
        },
      ],
    },
  },
});
