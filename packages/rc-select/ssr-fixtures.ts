import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-select': {
    markup:
      '<rc-select><select aria-label="Status"><option>Draft</option><option>Published</option></select></rc-select>',
  },
} satisfies SsrFixtures;
