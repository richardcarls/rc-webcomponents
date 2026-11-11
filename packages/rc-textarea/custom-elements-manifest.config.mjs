import { cssPropertiesPlugin } from '../../scripts/cem-css-properties.mjs';

export default {
  globs: ['src/*.ts'],
  exclude: ['**/*.test.ts', '**/*.styles.ts', 'src/blots.ts'],
  litelement: true,
  outdir: 'dist',
  plugins: [cssPropertiesPlugin()],
};
