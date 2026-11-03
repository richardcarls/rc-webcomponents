import '@rcarls/rc-textarea/define';
import { RCEditorToolbar } from './rc-editor-toolbar.js';
import { RCMarkdownEditor } from './rc-markdown-editor.js';

customElements.get('rc-editor-toolbar') ??
  customElements.define('rc-editor-toolbar', RCEditorToolbar);

customElements.get('rc-markdown-editor') ??
  customElements.define('rc-markdown-editor', RCMarkdownEditor);
