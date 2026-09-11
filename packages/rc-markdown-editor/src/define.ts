import '@rcarls/rc-textarea/define';

import { RcEditorToolbar } from './rc-editor-toolbar.js';
import { RcMarkdownEditor } from './rc-markdown-editor.js';

customElements.get('rc-editor-toolbar') ??
  customElements.define('rc-editor-toolbar', RcEditorToolbar);
customElements.get('rc-markdown-editor') ??
  customElements.define('rc-markdown-editor', RcMarkdownEditor);
