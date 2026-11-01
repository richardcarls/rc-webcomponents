import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-range-slider': {
    markup:
      '<rc-range-slider aria-label="Price range"><input type="range" min="0" max="100" value="20" aria-label="Minimum"><input type="range" min="0" max="100" value="80" aria-label="Maximum"></rc-range-slider>',
    morphPending:
      'reflects default property values and writes state attributes, which a morph removes',
  },
} satisfies SsrFixtures;
