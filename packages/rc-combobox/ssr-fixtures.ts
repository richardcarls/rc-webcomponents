import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-combobox': {
    markup:
      '<rc-combobox placeholder="Search fruit"><select name="fruit" aria-label="Fruit"><option value="apple">Apple</option><option value="banana">Banana</option></select></rc-combobox>',
  },
} satisfies SsrFixtures;
