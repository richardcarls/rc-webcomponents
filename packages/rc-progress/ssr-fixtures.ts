import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-progress': {
    markup:
      '<rc-progress><progress value="40" max="100" aria-label="Upload"></progress></rc-progress>',
    morphPending: 'reflects default property values, which a morph removes',
  },
} satisfies SsrFixtures;
