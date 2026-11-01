import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-pagination': {
    markup:
      '<rc-pagination total="3" page="2"><nav><ul><li><a href="?page=1" data-rc-page="1">1</a></li><li><a href="?page=2" data-rc-page="2" aria-current="page">2</a></li><li><a href="?page=3" data-rc-page="3">3</a></li></ul></nav></rc-pagination>',
  },
} satisfies SsrFixtures;
