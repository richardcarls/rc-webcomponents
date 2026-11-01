import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-app-bar': {
    markup:
      '<rc-app-bar><button slot="leading" type="button" aria-label="Back">&larr;</button><h1>Inbox</h1><button slot="trailing" type="button">Edit</button></rc-app-bar>',
  },
} satisfies SsrFixtures;
