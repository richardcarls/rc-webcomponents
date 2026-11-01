import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-search-bar': {
    markup:
      '<rc-search-bar placeholder="Search"><input type="search" aria-label="Search recipes"></rc-search-bar>',
  },
} satisfies SsrFixtures;
