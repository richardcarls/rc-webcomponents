import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-snackbar': {
    markup: '<rc-snackbar></rc-snackbar>',
    morphPending: 'reflects default property values, which a morph removes',
  },
} satisfies SsrFixtures;
