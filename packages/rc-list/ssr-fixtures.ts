import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-list': {
    markup:
      '<rc-list aria-label="Steps"><rc-list-item>Heat the oven</rc-list-item><rc-list-item>Mix</rc-list-item></rc-list>',
    morphPending: 'writes state attributes on its host or children, which a morph removes',
  },
  'rc-list-item': {
    markup:
      '<rc-list aria-label="Steps"><rc-list-item><span slot="leading" aria-hidden="true">1</span>Heat the oven<span slot="trailing">5 min</span></rc-list-item></rc-list>',
    morphPending: 'writes state attributes on its host or children, which a morph removes',
  },
} satisfies SsrFixtures;
