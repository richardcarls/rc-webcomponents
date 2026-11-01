import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-bottom-sheet': {
    markup:
      '<rc-bottom-sheet><dialog aria-label="Filters"><p>Options</p><button type="button">Done</button></dialog></rc-bottom-sheet>',
  },
} satisfies SsrFixtures;
