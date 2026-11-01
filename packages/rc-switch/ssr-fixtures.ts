import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-switch': {
    markup:
      '<rc-switch><input type="checkbox" role="switch" aria-label="Notifications"></rc-switch>',
  },
} satisfies SsrFixtures;
