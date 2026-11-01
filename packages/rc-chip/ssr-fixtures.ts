import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-chip': {
    markup: '<rc-chip><button type="button">Tag</button></rc-chip>',
    morphPending: 'reflects default property values, which a morph removes',
  },
} satisfies SsrFixtures;
