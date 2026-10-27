import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table';
import { visit } from 'unist-util-visit';
import { micromark } from 'micromark';
import { gfmTable, gfmTableHtml } from 'micromark-extension-gfm-table';

import {
  type RCTextarea,
  type RCTextareaPlugin,
  type RCTextareaPluginAPI,
  type DecorationInput,
} from '@rcarls/rc-textarea';
import {
  FoldingActionController,
  type FoldingAction,
  type FoldingActionControllerOptions,
} from '@rcarls/rc-textarea/folding';

/** Text of the Markdown plugin's fold toggles. */
export interface MarkdownPluginMessages {
  /** Name of a foldable block from its MDAST type, such as `Heading level 2` or `code`. */
  block: (type: string, depth?: number) => string;
  /** Accessible name of a fold toggle. */
  fold: (block: string, line: number, title: string) => string;
}

export const DEFAULT_MARKDOWN_PLUGIN_MESSAGES: Readonly<MarkdownPluginMessages> = Object.freeze({
  block: (type: string, depth?: number) => (type === 'heading' ? `Heading level ${depth}` : type),
  fold: (block: string, line: number, title: string) => `${block} at line ${line}: ${title}`,
});

/** Options for the Markdown plugin. */
export interface MarkdownPluginOptions {
  /** Visual options for the folding actions. */
  folding?: FoldingActionControllerOptions;
  /**
   * Fold toggle text overrides, for a non-English interface. The plugin has no
   * element of its own, so it reads no `lang` and no registered messages.
   */
  messages?: Partial<MarkdownPluginMessages>;
}

/** Minimal shape of a unist node as used by visit(). */
interface VisitNode {
  type: string;
  position?: {
    start: { offset?: number; line: number };
    end: { offset?: number; line: number };
  };
}

const TABLE_SYNTAX = gfmTable();
const TABLE_AST = gfmTableFromMarkdown();

/** Decoration styles applied per MDAST node type. */
const DECORATION_MAP: Record<string, Partial<Omit<DecorationInput, 'type' | 'from' | 'to'>>> = {
  heading: { bold: true, className: 'rte-heading' },
  emphasis: { italic: true },
  strong: { bold: true },
  inlineCode: { className: 'rte-code' },
  link: { underline: 'solid', className: 'rte-link' },
  blockquote: { className: 'rte-blockquote' },
};

/** Render a markdown string to safe HTML using micromark (no raw HTML passthrough). */
export function getMarkdownPreviewHtml(value: string): string {
  return micromark(value, {
    extensions: [TABLE_SYNTAX],
    htmlExtensions: [gfmTableHtml()],
  });
}

function buildPlugin(options: MarkdownPluginOptions = {}): RCTextareaPlugin & {
  getPreviewHtml(value: string): string;
} {
  const messages = { ...DEFAULT_MARKDOWN_PLUGIN_MESSAGES, ...options.messages };
  let folding: FoldingActionController | null = null;
  let host: RCTextarea | null = null;
  let enabledGutter = false;

  return {
    getPreviewHtml: getMarkdownPreviewHtml,

    mount(api: RCTextareaPluginAPI): void {
      host = api.host as RCTextarea;
      enabledGutter = !host.gutter && !host.lineNumbers;

      if (enabledGutter) {
        host.gutter = true;
      }

      folding = new FoldingActionController(api, options.folding);
    },

    destroy(): void {
      folding?.clear();
      folding = null;

      if (host && enabledGutter) {
        host.gutter = false;
      }

      host = null;
      enabledGutter = false;
    },

    update(value: string, api: RCTextareaPluginAPI): void {
      const tree = fromMarkdown(value, {
        extensions: [TABLE_SYNTAX],
        mdastExtensions: [TABLE_AST],
      });
      const decorations: DecorationInput[] = [];
      const actions: FoldingAction[] = [];
      const lines = value.split('\n');
      const keyCounts = new Map<string, number>();

      const addFold = (node: VisitNode, block: string, fromLine: number, toLine: number): void => {
        const line = node.position?.start.line;

        if (line === undefined || fromLine > toLine) {
          return;
        }

        const title = lines[line - 1]?.trim() ?? '';
        // Keys stay in English-free MDAST terms so a fold survives a locale change.
        const depth = 'depth' in node ? `${node.depth as number}` : '';
        const baseKey = `${node.type}${depth}:${title}`;
        const occurrence = keyCounts.get(baseKey) ?? 0;

        keyCounts.set(baseKey, occurrence + 1);

        actions.push({
          key: `${baseKey}:${occurrence}`,
          gutterLine: line,
          label: messages.fold(block, line, title),
          target: { fromLine, toLine },
        });
      };

      const headings = tree.children.filter((node) => node.type === 'heading');

      for (const [index, heading] of headings.entries()) {
        const fromLine = (heading.position?.end.line ?? 0) + 1;
        let toLine = lines.length;

        for (const later of headings.slice(index + 1)) {
          if (later.depth <= heading.depth) {
            toLine = (later.position?.start.line ?? toLine + 1) - 1;

            break;
          }
        }

        addFold(heading, messages.block('heading', heading.depth), fromLine, toLine);
      }

      visit(tree, (node: VisitNode) => {
        const style = DECORATION_MAP[node.type];
        const start = node.position?.start.offset;
        const end = node.position?.end.offset;

        if (style !== undefined && start !== undefined && end !== undefined) {
          decorations.push({ type: 'mark', from: start, to: end, ...style } as DecorationInput);
        }

        if (node.position && ['list', 'code', 'blockquote', 'table'].includes(node.type)) {
          addFold(
            node,
            messages.block(node.type),
            node.position.start.line + 1,
            node.position.end.line,
          );
        }
      });

      api.setDecorations([...decorations, ...(folding?.getDecorations(actions) ?? [])]);
    },
  };
}

/** Singleton markdown plugin. Use when a single instance is sufficient. */
export const markdownPlugin = buildPlugin();

/** Factory for cases where multiple independent instances are needed. */
export function createMarkdownPlugin(options: MarkdownPluginOptions = {}): RCTextareaPlugin & {
  getPreviewHtml(value: string): string;
} {
  return buildPlugin(options);
}
