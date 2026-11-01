import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-popover': {
    markup:
      '<rc-popover><button slot="trigger" type="button" popovertarget="help" aria-haspopup="dialog">Help</button><section slot="content" id="help" popover role="dialog" aria-label="Help"><p>Details</p></section></rc-popover>',
    morphPending: 'rewrites popover and popovertarget, which a morph restores',
  },
} satisfies SsrFixtures;
