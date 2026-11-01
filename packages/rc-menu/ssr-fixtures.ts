import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-menu': {
    markup:
      '<rc-menu label="File"><button type="button">New</button><button type="button">Open</button></rc-menu>',
  },
} satisfies SsrFixtures;
