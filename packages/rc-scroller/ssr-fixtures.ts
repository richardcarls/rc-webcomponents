import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-scroller': {
    markup:
      '<rc-scroller role="region" aria-label="Recipes"><article>Apple pie</article></rc-scroller>',
    morphPending: 'reflects default property values, which a morph removes',
  },
} satisfies SsrFixtures;
