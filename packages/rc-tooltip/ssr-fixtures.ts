import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-tooltip': {
    markup:
      '<rc-tooltip><button slot="trigger" type="button">Save</button><span slot="content">Saves the document.</span></rc-tooltip>',
  },
} satisfies SsrFixtures;
