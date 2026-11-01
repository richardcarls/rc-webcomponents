import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-field': {
    markup:
      '<rc-field><label slot="label" for="name">Name</label><input id="name" name="name"></rc-field>',
    morphPending: 'writes state attributes on its host or children, which a morph removes',
  },
} satisfies SsrFixtures;
