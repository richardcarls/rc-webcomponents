import type { SsrFixtures } from '../../test-helpers/ssr-fixtures.js';

/** Server-render hydration fixtures; see test-helpers/ssr-fixtures.ts. */
export default {
  'rc-markdown-editor': {
    markup:
      '<rc-markdown-editor><textarea aria-label="Notes"># Title</textarea></rc-markdown-editor>',
  },
  'rc-editor-toolbar': {
    markup: '<rc-editor-toolbar></rc-editor-toolbar>',
    pending:
      'internal to rc-markdown-editor, which hydrates it; standalone, the client renders ' +
      'nothing until the editor configures it, while the server renders the default toolbar',
    morphPending: 'renders into its light DOM, which a morph replaces',
  },
} satisfies SsrFixtures;
