import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-transfer-list': {
    markup:
      '<rc-transfer-list><select multiple aria-label="Planets"><option value="venus" selected>Venus</option><option value="mars">Mars</option></select></rc-transfer-list>',
  },
} satisfies SsrFixtures;
