import { cssPropertiesPlugin } from '../../scripts/cem-css-properties.mjs';

export default {
  exclude: ['**/*.test.ts', '**/*.styles.ts'],
  globs: ['src/*.ts'],
  litelement: true,
  outdir: 'dist',
  plugins: [cssPropertiesPlugin()],
};
