import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-slider': {
    markup:
      '<rc-slider><input type="range" min="0" max="100" value="40" aria-label="Volume"></rc-slider>',
  },
} satisfies SsrFixtures;
