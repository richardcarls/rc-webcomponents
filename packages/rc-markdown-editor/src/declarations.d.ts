// Type declaration for the optional peer dependency.
// The package may or may not be installed at runtime; the dynamic import in
// rc-text-editor.ts handles the absent-package case gracefully.
declare module '@rcarls/rc-textarea-plugin-markdown' {
  import type { RCTextareaPlugin } from '@rcarls/rc-textarea';

  export const markdownPlugin: RCTextareaPlugin & {
    getPreviewHtml(value: string): string;
  };

  export function createMarkdownPlugin(): RCTextareaPlugin & {
    getPreviewHtml(value: string): string;
  };

  export function getMarkdownPreviewHtml(value: string): string;
}
