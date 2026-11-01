import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-splitter': {
    markup:
      '<rc-splitter style="inline-size: 600px; block-size: 300px"><div>Primary</div><div slot="secondary">Secondary</div></rc-splitter>',
    morphPending: 'reflects default property values, which a morph removes',
  },
} satisfies SsrFixtures;
