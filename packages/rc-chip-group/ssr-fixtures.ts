import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-chip-group': {
    markup:
      '<rc-chip-group kind="assist" label="Actions"><rc-chip><button type="button">One</button></rc-chip><rc-chip><button type="button">Two</button></rc-chip></rc-chip-group>',
    morphPending: 'writes state attributes on its host or children, which a morph removes',
  },
} satisfies SsrFixtures;
