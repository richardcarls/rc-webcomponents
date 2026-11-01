import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-adaptive-menu': {
    markup:
      '<rc-adaptive-menu label="Document actions" max-shown="2"><button type="button" data-priority="30"><span data-rc-menu-label>Favorite</span></button><button type="button" data-priority="20"><span data-rc-menu-label>Edit</span></button><button type="button" slot="overflow"><span data-rc-menu-label>Delete</span></button></rc-adaptive-menu>',
  },
} satisfies SsrFixtures;
