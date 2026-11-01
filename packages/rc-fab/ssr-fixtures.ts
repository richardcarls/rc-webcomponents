import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-fab': {
    markup:
      '<rc-fab><button type="button" aria-label="Create"><span aria-hidden="true">+</span></button></rc-fab>',
  },
} satisfies SsrFixtures;
