import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-fab-menu': {
    markup:
      '<rc-fab-menu><button slot="trigger" type="button" aria-label="Create"><span aria-hidden="true">+</span></button><rc-menu label="Create"><button type="button">Recipe</button></rc-menu></rc-fab-menu>',
    morphPending: 'writes state attributes on its host or children, which a morph removes',
  },
} satisfies SsrFixtures;
