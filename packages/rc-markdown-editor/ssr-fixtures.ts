import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-markdown-editor': {
    markup:
      '<rc-markdown-editor><textarea aria-label="Notes"># Title</textarea></rc-markdown-editor>',
  },
  'rc-editor-toolbar': {
    markup: '<rc-editor-toolbar></rc-editor-toolbar>',
  },
} satisfies SsrFixtures;
