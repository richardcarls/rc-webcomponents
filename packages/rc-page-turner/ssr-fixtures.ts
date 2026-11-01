import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-page-turner': {
    markup:
      '<rc-page-turner navigation aria-label="Steps"><rc-page-turner-page><h2>One</h2></rc-page-turner-page><rc-page-turner-page><h2>Two</h2></rc-page-turner-page></rc-page-turner>',
  },
  'rc-page-turner-page': {
    markup:
      '<rc-page-turner aria-label="Steps"><rc-page-turner-page><h2>One</h2></rc-page-turner-page></rc-page-turner>',
  },
} satisfies SsrFixtures;
