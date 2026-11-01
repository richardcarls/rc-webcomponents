import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-virtual-canvas': {
    markup:
      '<rc-virtual-canvas content-width="2000" content-height="1000" style="inline-size: 400px; block-size: 300px"><canvas width="400" height="300" aria-label="Scene"></canvas></rc-virtual-canvas>',
  },
} satisfies SsrFixtures;
