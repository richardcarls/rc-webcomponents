/**
 * Parchment blot definitions for rc-textarea.
 *
 * Uses named imports from parchment (BlockBlot, InlineBlot, EmbedBlot, ScrollBlot).
 * Parchment's MutationObserver integration is suppressed — DOM updates are
 * managed entirely by V2Document.build() on each render frame.
 */
import {
  Registry,
  ScrollBlot,
  BlockBlot,
  InlineBlot,
  EmbedBlot,
} from 'parchment';
import type { MarkDecoration } from './types.ts';

export { Registry };

// ── V2ScrollBlot ─────────────────────────────────────────────────────────────

export class V2ScrollBlot extends ScrollBlot {
  static override blotName = 'v2-scroll';

  constructor(registry: Registry, domNode: HTMLDivElement) {
    super(registry, domNode);
    // Disconnect MutationObserver immediately — we manage all DOM updates ourselves
    this.observer.disconnect();
  }

  // Suppress Parchment's automatic DOM reconciliation
  override update(
    _mutations: MutationRecord[],
    _context: Record<string, unknown>,
  ): void {}
  // Match ScrollBlot's two optimize overloads
  override optimize(context: { [key: string]: unknown }): void;
  override optimize(
    mutations: MutationRecord[],
    context: { [key: string]: unknown },
  ): void;
  override optimize(
    _contextOrMutations?: MutationRecord[] | { [key: string]: unknown },
    _context?: { [key: string]: unknown },
  ): void {}
}

// ── V2BlockBlot ──────────────────────────────────────────────────────────────

export class V2BlockBlot extends BlockBlot {
  static override blotName = 'v2-block';
  static override tagName = 'DIV';
  static override className = 'v2-line';
}

// ── V2InlineBlot ─────────────────────────────────────────────────────────────

type InlineFormats = Pick<
  MarkDecoration,
  | 'className'
  | 'bold'
  | 'italic'
  | 'color'
  | 'background'
  | 'underline'
  | 'underlineColor'
>;

export class V2InlineBlot extends InlineBlot {
  static override blotName = 'v2-inline';
  static override tagName = 'SPAN';
  static override className = 'v2-mark';

  static override create(formats?: InlineFormats): HTMLElement {
    const el = super.create() as HTMLSpanElement;
    if (formats) applyInlineFormats(el, formats);
    return el;
  }
}

/**
 * Apply `MarkDecoration` style properties to a `.v2-mark` span element as
 * inline styles and extra CSS classes. Called by `V2InlineBlot.create()` and
 * by external code that needs to style a span to match a decoration.
 */
export function applyInlineFormats(
  el: HTMLSpanElement,
  formats: InlineFormats,
): void {
  if (formats.className) {
    for (const cls of formats.className.split(/\s+/).filter(Boolean)) {
      el.classList.add(cls);
    }
  }
  if (formats.bold) el.style.fontWeight = 'bold';
  if (formats.italic) el.style.fontStyle = 'italic';
  if (formats.color) el.style.color = formats.color;
  if (formats.background) el.style.backgroundColor = formats.background;
  if (formats.underline) {
    el.style.textDecoration = `${formats.underline} underline`;
    if (formats.underlineColor)
      el.style.textDecorationColor = formats.underlineColor;
  }
}

// ── V2WidgetBlot ─────────────────────────────────────────────────────────────

export class V2WidgetBlot extends EmbedBlot {
  static override blotName = 'v2-widget';
  static override tagName = 'SPAN';
  static override className = 'v2-widget';

  static override create(): HTMLElement {
    const el = super.create() as HTMLSpanElement;
    el.contentEditable = 'false';
    el.setAttribute('aria-hidden', 'true');
    return el;
  }
}

// ── Registry factory ──────────────────────────────────────────────────────────

export function createRegistry(): Registry {
  const registry = new Registry();
  // Register content blots — ScrollBlot is the root, not registered like others
  registry.register(V2BlockBlot, V2InlineBlot, V2WidgetBlot);
  return registry;
}
