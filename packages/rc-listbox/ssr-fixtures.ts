import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-listbox': {
    markup:
      '<rc-listbox aria-label="Fruit"><option value="apple">Apple</option><option value="banana">Banana</option></rc-listbox>',
    morphPending: 'writes state attributes on its host or children, which a morph removes',
  },
} satisfies SsrFixtures;
