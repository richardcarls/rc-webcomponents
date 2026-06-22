/**
 * Parchment blot definitions for rc-textarea.
 *
 * Uses named imports from parchment (BlockBlot, InlineBlot, EmbedBlot, ScrollBlot).
 * Parchment's MutationObserver integration is suppressed — DOM updates are
 * managed entirely by RCDocument.build() on each render frame.
 *
 * @see https://github.com/quilljs/parchment
 */
import { Registry, ScrollBlot, BlockBlot, InlineBlot, EmbedBlot } from 'parchment';
import type { MarkDecoration } from './types.ts';

export { Registry };

export class RCScrollBlot extends ScrollBlot {
  static override blotName = 'rc-scroll';

  constructor(registry: Registry, domNode: HTMLDivElement) {
    super(registry, domNode);

    // Disconnect MutationObserver immediately — we manage all DOM updates ourselves
    this.observer.disconnect();
  }

  // Suppress Parchment's automatic DOM reconciliation
  override update(_mutations: MutationRecord[], _context: Record<string, unknown>): void {}

  // Match ScrollBlot's two optimize overloads
  override optimize(context: { [key: string]: unknown }): void;
  override optimize(mutations: MutationRecord[], context: { [key: string]: unknown }): void;
  override optimize(
    _contextOrMutations?: MutationRecord[] | { [key: string]: unknown },
    _context?: { [key: string]: unknown },
  ): void {}
}

export class RCBlockBlot extends BlockBlot {
  static override blotName = 'rc-block';
  static override tagName = 'DIV';
  static override className = 'line';
}

type InlineFormats = Pick<
  MarkDecoration,
  'className' | 'bold' | 'italic' | 'color' | 'background' | 'underline' | 'underlineColor'
>;

export class RCInlineBlot extends InlineBlot {
  static override blotName = 'rc-inline';
  static override tagName = 'SPAN';
  static override className = 'mark';

  static override create(formats?: InlineFormats): HTMLElement {
    const $el = super.create() as HTMLSpanElement;

    if (formats) {
      applyInlineFormats($el, formats);
    }

    return $el;
  }
}

/**
 * Apply `MarkDecoration` style properties to a `.mark` span element as
 * inline styles and extra CSS classes. Called by `RCInlineBlot.create()` and
 * by external code that needs to style a span to match a decoration.
 */
export function applyInlineFormats($el: HTMLSpanElement, formats: InlineFormats): void {
  if (formats.className) {
    for (const cls of formats.className.split(/\s+/).filter(Boolean)) {
      $el.classList.add(cls);
    }
  }

  if (formats.bold) {
    $el.style.fontWeight = 'bold';
  }

  if (formats.italic) {
    $el.style.fontStyle = 'italic';
  }

  if (formats.color) {
    $el.style.color = formats.color;
  }

  if (formats.background) {
    $el.style.backgroundColor = formats.background;
  }

  if (formats.underline) {
    $el.style.textDecoration = `${formats.underline} underline`;

    if (formats.underlineColor) {
      $el.style.textDecorationColor = formats.underlineColor;
    }
  }
}

export class RCWidgetBlot extends EmbedBlot {
  static override blotName = 'rc-widget';
  static override tagName = 'SPAN';
  static override className = 'widget';

  static override create(): HTMLElement {
    const $el = super.create() as HTMLSpanElement;

    $el.contentEditable = 'false';
    $el.setAttribute('aria-hidden', 'true');

    return $el;
  }
}

export function createRegistry(): Registry {
  const registry = new Registry();

  // Register content blots — ScrollBlot is the root, not registered like others
  registry.register(RCBlockBlot, RCInlineBlot, RCWidgetBlot);

  return registry;
}
