import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-toolbar': {
    markup:
      '<rc-toolbar label="Formatting"><button type="button">Bold</button><button type="button">Italic</button></rc-toolbar>',
  },
} satisfies SsrFixtures;
