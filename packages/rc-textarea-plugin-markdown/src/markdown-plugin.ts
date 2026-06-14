import { fromMarkdown } from 'mdast-util-from-markdown';
import { visit } from 'unist-util-visit';
import { micromark } from 'micromark';

import type { RCTextareaPlugin, RCTextareaPluginAPI, DecorationInput } from '@rcarls/rc-textarea';

/** Minimal shape of a unist node as used by visit(). */
interface VisitNode {
  type: string;
  position?: {
    start: { offset?: number };
    end: { offset?: number };
  };
}


/** Decoration styles applied per MDAST node type. */
const DECORATION_MAP: Record<string, Partial<Omit<DecorationInput, 'type' | 'from' | 'to'>>> = {
  heading:    { bold: true, className: 'rte-heading' },
  emphasis:   { italic: true },
  strong:     { bold: true },
  inlineCode: { className: 'rte-code' },
  link:       { underline: 'solid', className: 'rte-link' },
  blockquote: { className: 'rte-blockquote' },
};

/** Render a markdown string to safe HTML using micromark (no raw HTML passthrough). */
export function getMarkdownPreviewHtml(value: string): string {
  return micromark(value);
}

function buildPlugin(): RCTextareaPlugin & { getPreviewHtml(value: string): string } {
  return {
    getPreviewHtml: getMarkdownPreviewHtml,

    update(value: string, api: RCTextareaPluginAPI): void {
      const tree = fromMarkdown(value);
      const decorations: DecorationInput[] = [];

      visit(tree, (node: VisitNode) => {
        const style = DECORATION_MAP[node.type];
        const start = node.position?.start.offset;
        const end = node.position?.end.offset;

        if (style !== undefined && start !== undefined && end !== undefined) {
          decorations.push({ type: 'mark', from: start, to: end, ...style } as DecorationInput);
        }
      });

      api.setDecorations(decorations);
    },
  };
}

/** Singleton markdown plugin. Use when a single instance is sufficient. */
export const markdownPlugin = buildPlugin();

/** Factory for cases where multiple independent instances are needed. */
export function createMarkdownPlugin(): RCTextareaPlugin & {
  getPreviewHtml(value: string): string;
} {
  return buildPlugin();
}
