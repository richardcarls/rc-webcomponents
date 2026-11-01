import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-card': {
    markup: '<rc-card><h2 slot="title">Plan</h2><p>Details</p></rc-card>',
  },
} satisfies SsrFixtures;
