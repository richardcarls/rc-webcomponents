import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-virtual-scroller': {
    markup: '<rc-virtual-scroller count="100" item-size="40"><ul></ul></rc-virtual-scroller>',
  },
} satisfies SsrFixtures;
