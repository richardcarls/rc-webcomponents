import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-adaptive-menu': {
    markup:
      '<rc-adaptive-menu label="Document actions" max-shown="2"><button type="button" data-rc-action-priority="30"><span data-rc-label>Favorite</span></button><button type="button" data-rc-action-priority="20"><span data-rc-label>Edit</span></button><button type="button" slot="overflow"><span data-rc-label>Delete</span></button></rc-adaptive-menu>',
  },
} satisfies SsrFixtures;
