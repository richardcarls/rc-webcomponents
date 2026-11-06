import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-navigation-rail': {
    markup:
      '<nav aria-label="Main"><rc-navigation-rail><a href="/" aria-current="page"><span data-rc-icon aria-hidden="true">R</span><span>Recipes</span></a></rc-navigation-rail></nav>',
  },
} satisfies SsrFixtures;
