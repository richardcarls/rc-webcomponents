import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-dialog': {
    markup:
      '<rc-dialog><dialog aria-label="Hello"><p>Dialog content.</p><button type="button">Close</button></dialog></rc-dialog>',
    morphPending: 'renders into its light DOM, which a morph replaces',
  },
} satisfies SsrFixtures;
