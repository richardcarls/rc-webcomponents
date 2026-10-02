import type { DecorationInput, RCTextareaPluginAPI } from './types.js';

export interface LineDisclosure {
  /** Identify this disclosure independently of decoration IDs. */
  key: string;

  /** Anchor the disclosure after this zero-based source offset. */
  offset: number;

  /** Place the trigger in this one-based gutter line instead of the trailing lane. */
  gutterLine?: number;

  /** Wrap the gutter trigger with supplementary, non-interactive content. */
  createGutterContent?: ($button: HTMLButtonElement) => HTMLElement;

  /** Refresh the cached gutter wrapper without moving its focused button. */
  updateGutterContent?: ($gutterContent: HTMLElement) => void;

  /** Name the disclosure button, including its line context. */
  label: string;

  /** Change this token when panel content must be recreated. */
  revision: string;

  /** Create non-editable panel content when the revision changes. */
  createContent: () => HTMLElement;
}

interface DisclosureEntry {
  $button: HTMLButtonElement;
  $panel: HTMLDivElement;
  $gutterContent?: HTMLElement;
  revision: string;
}

export interface LineDisclosureControllerOptions {
  /** Render a custom decorative icon for the collapsed or expanded trigger. */
  createTriggerIcon?: (expanded: boolean) => HTMLElement | null;
}

/** Manage independent, initially collapsed line disclosures without changing editor text.
 *
 * @example
 * const disclosures = new LineDisclosureController(api);
 * api.setDecorations(disclosures.getDecorations([{
 *   key: 'hint', offset: api.value.length, label: 'Line information',
 *   revision: '1', createContent: () => document.createElement('p'),
 * }]));
 * // Call disclosures.clear() on source changes and plugin destruction.
 */
export class LineDisclosureController {
  private readonly entries = new Map<string, DisclosureEntry>();

  private readonly api: RCTextareaPluginAPI;

  private readonly createTriggerIcon?: (expanded: boolean) => HTMLElement | null;

  /** Bind disclosures to the editor, optionally replacing the default text chevron. */
  constructor(api: RCTextareaPluginAPI, options?: LineDisclosureControllerOptions) {
    this.api = api;
    this.createTriggerIcon = options?.createTriggerIcon;
  }

  private updateTriggerIcon($button: HTMLButtonElement, expanded: boolean): void {
    const $icon = this.createTriggerIcon?.(expanded);

    if ($icon) {
      $icon.setAttribute('aria-hidden', 'true');
      $button.replaceChildren($icon);
    } else {
      $button.textContent = expanded ? '⌃' : '⌄';
    }
  }

  /** Reconcile disclosures and return accessible controls and block widgets.
   * Removed keys lose expansion state. Stable revisions retain panel DOM and focus.
   */
  getDecorations(disclosures: readonly LineDisclosure[]): DecorationInput[] {
    const keys = new Set(disclosures.map((disclosure) => disclosure.key));

    for (const [key, entry] of this.entries) {
      if (!keys.has(key)) {
        this.release(entry);
        this.entries.delete(key);
      }
    }

    return disclosures.flatMap((disclosure): DecorationInput[] => {
      let entry = this.entries.get(disclosure.key);

      if (entry && (entry.$gutterContent !== undefined) !== (disclosure.gutterLine !== undefined)) {
        this.release(entry);
        this.entries.delete(disclosure.key);
        entry = undefined;
      }

      if (!entry) {
        const $button = document.createElement('button');
        const $panel = document.createElement('div');

        $button.type = 'button';
        $button.className = 'line-disclosure-trigger';
        $button.setAttribute('aria-expanded', 'false');
        this.updateTriggerIcon($button, false);
        $panel.id = `rc-disclosure-${crypto.randomUUID()}`;
        $panel.className = 'line-disclosure-panel';
        $panel.hidden = true;
        $button.setAttribute('aria-controls', $panel.id);

        $button.addEventListener('click', () => {
          if (!$panel.hidden && $panel.contains(this.api.host.shadowRoot?.activeElement ?? null)) {
            $button.focus();
          }

          $panel.hidden = !$panel.hidden;
          $button.setAttribute('aria-expanded', String(!$panel.hidden));
          this.updateTriggerIcon($button, !$panel.hidden);
          this.api.scheduleUpdate();
        });

        entry = { $button, $panel, revision: disclosure.revision };

        if (disclosure.gutterLine !== undefined) {
          entry.$gutterContent = disclosure.createGutterContent?.($button) ?? $button;
        }

        $panel.append(disclosure.createContent());
        this.entries.set(disclosure.key, entry);
      } else if (entry.revision !== disclosure.revision) {
        if (entry.$panel.contains(this.api.host.shadowRoot?.activeElement ?? null)) {
          entry.$button.focus();
        }

        entry.$panel.replaceChildren(disclosure.createContent());
        entry.revision = disclosure.revision;

      }

      entry.$button.setAttribute('aria-label', disclosure.label);

      if (entry.$gutterContent) {
        disclosure.updateGutterContent?.(entry.$gutterContent);
      }

      const { $button, $panel } = entry;

      const trigger: DecorationInput[] = disclosure.gutterLine === undefined ? [{
        type: 'widget', offset: disclosure.offset, side: 'after',
        key: `disclosure-trigger:${$panel.id}`, layout: 'trailing', accessible: true,
        create: () => $button,
      }] : [{
        type: 'line', line: disclosure.gutterLine,
        gutterContent: entry.$gutterContent,
        gutterAccessible: true,
        gutterLineNumber: true,
      }];

      return [
        ...trigger,
        {
          type: 'widget', offset: disclosure.offset, side: 'after',
          key: `disclosure-panel:${$panel.id}`, layout: 'block', accessible: true,
          create: () => $panel,
        },
      ];
    });
  }

  /** Discard all expansion state and return focus before removing a focused control. */
  clear(): void {
    for (const entry of this.entries.values()) {
      this.release(entry);
    }

    this.entries.clear();
  }

  private release(entry: DisclosureEntry): void {
    const $active = this.api.host.shadowRoot?.activeElement;

    if ($active === entry.$button || entry.$panel.contains($active ?? null)) {
      this.api.host.shadowRoot?.querySelector<HTMLElement>('[part="editor"]')?.focus();
    }
  }

}
