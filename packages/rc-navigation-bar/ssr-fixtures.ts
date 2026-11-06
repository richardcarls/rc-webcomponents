import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-navigation-bar': {
    markup:
      '<nav aria-label="Main"><rc-navigation-bar><a href="/" aria-current="page"><span data-rc-icon aria-hidden="true">R</span><span>Recipes</span></a><a href="/settings"><span data-rc-icon aria-hidden="true">S</span><span>Settings</span></a></rc-navigation-bar></nav>',
  },
} satisfies SsrFixtures;
