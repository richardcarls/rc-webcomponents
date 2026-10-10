import type { DecorationInput, RCTextareaPluginAPI } from './types.js';

export interface SourceFoldRange {
  /** First source line hidden by the fold (one-based, inclusive). */
  fromLine: number;
  /** Last source line hidden by the fold (one-based, inclusive). */
  toLine: number;
}

export interface FoldingAction {
  /** Stable identity for the expansion state across plugin updates. */
  key: string;
  /** Name the region and its context; aria-expanded supplies its current state. */
  label: string;
  /** Source lines or a caller-owned panel. The caller renders panel widgets separately. */
  target: SourceFoldRange | HTMLElement;
  /** One-based gutter line. Omit to place the button in the trailing lane. */
  gutterLine?: number;
  /** Source offset for a trailing-lane button; required without gutterLine. */
  offset?: number;
  /** Initial state for a newly seen key. Defaults to true. */
  initiallyExpanded?: boolean;
  /** Add decorative content beside the gutter button. */
  createGutterContent?: ($button: HTMLButtonElement) => HTMLElement;
  /** Refresh the cached gutter content without replacing its focused button. */
  updateGutterContent?: ($content: HTMLElement) => void;
}

export interface FoldingActionControllerOptions {
  /** Render a decorative icon for the current expansion state. */
  createTriggerIcon?: (expanded: boolean) => HTMLElement | null;
}

interface Entry {
  $button: HTMLButtonElement;
  $gutterContent?: HTMLElement;
  target: FoldingAction['target'];
  expanded: boolean;
}

/** Reconcile independent, accessible folding actions without owning their content. */
export class FoldingActionController {
  private readonly entries = new Map<string, Entry>();

  private readonly gutterGroupElements = new Map<number, HTMLElement>();

  private readonly api: RCTextareaPluginAPI;

  private readonly options: FoldingActionControllerOptions;

  constructor(
    api: RCTextareaPluginAPI,
    options: FoldingActionControllerOptions = {},
  ) {
    this.api = api;
    this.options = options;
  }

  private updateIcon(entry: Entry): void {
    const $icon = this.options.createTriggerIcon?.(entry.expanded);

    if ($icon) {
      $icon.setAttribute('aria-hidden', 'true');
      $icon.part.add('fold-icon');
      entry.$button.replaceChildren($icon);
    } else {
      entry.$button.textContent = entry.expanded ? '⌃' : '⌄';
    }
  }

  private applyState(entry: Entry): void {
    entry.$button.setAttribute('aria-expanded', String(entry.expanded));

    if (entry.target instanceof HTMLElement) {
      if (!entry.target.id) {
        entry.target.id = `rc-fold-${crypto.randomUUID()}`;
      }

      entry.$button.setAttribute('aria-controls', entry.target.id);

      if (!entry.expanded && entry.target.contains(this.api.host.shadowRoot?.activeElement ?? null)) {
        entry.$button.focus();
      }

      entry.target.hidden = !entry.expanded;
    } else {
      entry.$button.removeAttribute('aria-controls');
    }

    this.updateIcon(entry);
  }

  /** Return trigger and collapsed-range decorations; callers provide any panel widget. */
  getDecorations(actions: readonly FoldingAction[]): DecorationInput[] {
    const keys = new Set(actions.map((action) => action.key));

    for (const [key, entry] of this.entries) {
      if (!keys.has(key)) {
        this.release(entry);
        this.entries.delete(key);
      }
    }

    const result: DecorationInput[] = [];
    const gutterGroups = new Map<number, HTMLElement[]>();

    for (const action of actions) {
      if (action.gutterLine === undefined && action.offset === undefined) {
        throw new TypeError('A folding action requires a gutterLine or offset.');
      }

      if (!(action.target instanceof HTMLElement) &&
          (action.gutterLine === undefined || action.target.fromLine < 2 ||
            action.target.fromLine <= action.gutterLine ||
            action.target.toLine < action.target.fromLine)) {
        throw new RangeError('A source fold requires a gutter anchor before its hidden lines.');
      }

      let entry = this.entries.get(action.key);

      if (!entry) {
        const $button = document.createElement('button');

        $button.type = 'button';
        $button.className = 'fold-action-trigger';
        $button.part.add('fold-trigger');

        entry = {
          $button,
          target: action.target,
          expanded: action.initiallyExpanded ?? true,
        };

        this.entries.set(action.key, entry);

        $button.addEventListener('click', () => {
          entry!.expanded = !entry!.expanded;
          this.applyState(entry!);
          this.api.scheduleUpdate();
        });
      }

      entry.target = action.target;
      entry.$button.setAttribute('aria-label', action.label);

      this.applyState(entry);

      if (action.gutterLine !== undefined) {
        entry.$gutterContent ??= action.createGutterContent?.(entry.$button) ?? entry.$button;
        action.updateGutterContent?.(entry.$gutterContent);

        const group = gutterGroups.get(action.gutterLine) ?? [];

        group.push(entry.$gutterContent);
        gutterGroups.set(action.gutterLine, group);
      } else {
        result.push({
          type: 'widget', offset: action.offset!, side: 'after',
          key: `fold-trigger:${action.key}`, layout: 'trailing', accessible: true,
          create: () => entry!.$button,
        });
      }

      if (!(action.target instanceof HTMLElement) && !entry.expanded &&
          action.target.toLine >= action.target.fromLine) {
        result.push({
          type: 'fold', fromLine: action.target.fromLine, toLine: action.target.toLine,
          reveal: () => {
            entry!.expanded = true;
            this.applyState(entry!);
            this.api.scheduleUpdate();
          },
        });
      }
    }

    for (const line of this.gutterGroupElements.keys()) {
      if (!gutterGroups.has(line)) {
        this.gutterGroupElements.delete(line);
      }
    }

    for (const [line, contents] of gutterGroups) {
      let $group = this.gutterGroupElements.get(line);

      if (!$group) {
        $group = document.createElement('span');
        this.gutterGroupElements.set(line, $group);
      }

      $group.className = contents.length > 1 ? 'fold-action-group' : 'fold-action-single';

      if (contents.length !== $group.children.length ||
          contents.some((content, index) => $group.children[index] !== content)) {
        $group.replaceChildren(...contents);
      }

      result.push({ type: 'line', line, gutterContent: $group,
        gutterAccessible: true, gutterLineNumber: true });
    }

    return result;
  }

  /** Get expansion state for an existing key. */
  isExpanded(key: string): boolean | undefined {
    return this.entries.get(key)?.expanded;
  }

  /** Discard expansion state and return focus before removing a focused control. */
  clear(): void {
    for (const entry of this.entries.values()) {
      this.release(entry);
    }

    this.entries.clear();
    this.gutterGroupElements.clear();
  }

  private release(entry: Entry): void {
    const $active = this.api.host.shadowRoot?.activeElement;

    if ($active === entry.$button || entry.target instanceof HTMLElement &&
        entry.target.contains($active ?? null)) {
      this.api.host.shadowRoot?.querySelector<HTMLElement>('[part="editor"]')?.focus();
    }
  }
}
