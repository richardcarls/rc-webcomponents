module.exports = {
  globs: ['packages/*/src/*.ts'],
  exclude: [
    '**/*.test.ts',
    '**/*.styles.ts',
    'packages/rc-textarea/src/blots.ts',
    'packages/rc-common/src/*.ts',
    'packages/rc-webcomponents/src/*.ts',
  ],
  litelement: true,
  outdir: 'dist',
};
