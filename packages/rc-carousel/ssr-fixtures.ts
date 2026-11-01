import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-carousel': {
    markup:
      '<rc-carousel navigation pagination aria-label="Photos"><rc-carousel-item>One</rc-carousel-item><rc-carousel-item>Two</rc-carousel-item></rc-carousel>',
  },
  'rc-carousel-item': {
    markup:
      '<rc-carousel aria-label="Photos"><rc-carousel-item>One</rc-carousel-item></rc-carousel>',
  },
} satisfies SsrFixtures;
