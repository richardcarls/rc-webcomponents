import type { RCTextareaPlugin, MarkDecoration, DecorationInput } from '@rcarls/rc-textarea';

/** Minimal structural shape of a unist `Node` (shared by mdast, hast, etc.). */
interface UnistNode {
  type: string;
  position?: {
    start: { offset?: number };
    end: { offset?: number };
  };
  children?: UnistNode[];
}

/** Minimal structural shape of a unified `Processor`. */
interface UnifiedProcessor {
  parse(value: string): UnistNode;
}

function visit(node: UnistNode, visitor: (n: UnistNode) => void): void {
  visitor(node);
  if (node.children) {
    for (const child of node.children) visit(child, visitor);
  }
}

/**
 * Create an `rc-textarea` plugin that uses a unified processor (e.g. `remark-parse` for
 * Markdown, `rehype-parse` for HTML) to produce syntax decorations.
 *
 * Node `position.start.offset` / `position.end.offset` values are absolute character offsets,
 * identical to rc-textarea's coordinate space — no conversion is needed.
 *
 * ```ts
 * import { unified } from 'unified';
 * import remarkParse from 'remark-parse';
 * import { createUnifiedPlugin } from '@rcarls/rc-textarea-adapters';
 *
 * const processor = unified().use(remarkParse);
 *
 * editor.usePlugin(createUnifiedPlugin(processor, {
 *   strong:     { bold: true },
 *   emphasis:   { italic: true },
 *   inlineCode: { className: 'md-inline-code' },
 *   heading:    { bold: true, color: 'var(--color-heading)' },
 * }));
 * ```
 */
export function createUnifiedPlugin(
  processor: UnifiedProcessor,
  nodeTypeToStyle: Record<string, Omit<MarkDecoration, 'id' | 'type' | 'from' | 'to'>>,
): RCTextareaPlugin {
  return {
    update(value, api) {
      const tree = processor.parse(value);
      const decorations: DecorationInput[] = [];
      visit(tree, (node) => {
        const style = nodeTypeToStyle[node.type];
        const start = node.position?.start.offset;
        const end = node.position?.end.offset;
        if (style && start !== undefined && end !== undefined) {
          decorations.push({ type: 'mark', from: start, to: end, ...style });
        }
      });
      api.setDecorations(decorations);
    },
  };
}
