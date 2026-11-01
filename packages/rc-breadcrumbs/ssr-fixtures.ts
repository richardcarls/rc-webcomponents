import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-breadcrumbs': {
    markup:
      '<rc-breadcrumbs><nav><ol><li><a href="/">Home</a></li><li><a href="/settings" aria-current="page">Settings</a></li></ol></nav></rc-breadcrumbs>',
  },
} satisfies SsrFixtures;
