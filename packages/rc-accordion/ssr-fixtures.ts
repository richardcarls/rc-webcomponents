import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-accordion': {
    markup:
      '<rc-accordion><details><summary>One</summary><p>First</p></details><details><summary>Two</summary><p>Second</p></details></rc-accordion>',
  },
} satisfies SsrFixtures;
