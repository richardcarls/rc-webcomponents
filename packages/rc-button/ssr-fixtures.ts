import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-button': {
    markup: '<rc-button><button type="button">Save</button></rc-button>',
  },
} satisfies SsrFixtures;
