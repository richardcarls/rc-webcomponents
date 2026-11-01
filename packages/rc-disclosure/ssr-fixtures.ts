import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-disclosure': {
    markup:
      '<rc-disclosure><details><summary>Shipping</summary><p>Two days.</p></details></rc-disclosure>',
  },
} satisfies SsrFixtures;
