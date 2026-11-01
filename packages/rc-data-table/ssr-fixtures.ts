import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-data-table': {
    markup:
      '<rc-data-table sort-key="name"><table><caption>Plants</caption><thead><tr><th scope="col" data-rc-sort-key="name"><button type="button">Name</button></th></tr></thead><tbody><tr><td>Aster</td></tr></tbody></table></rc-data-table>',
  },
} satisfies SsrFixtures;
