import { RcEditorToolbar } from './rc-editor-toolbar.ts';
import { RcTextEditor } from './rc-text-editor.ts';

customElements.get('rc-editor-toolbar') ?? customElements.define('rc-editor-toolbar', RcEditorToolbar);
customElements.get('rc-text-editor') ?? customElements.define('rc-text-editor', RcTextEditor);
