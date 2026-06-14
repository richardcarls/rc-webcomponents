import type { RCTextareaPluginAPI, DecorationInput } from './types.ts';

// ── Public types ──────────────────────────────────────────────────────────────

export interface LineAction {
  id: string;
  label: string;
  /** data-icon attribute — host renders via iconify or similar */
  icon?: string;
  onClick: () => void;
}

export interface LineActionsOptions {
  /** Where to place the inline widget. Default: 'append'. */
  position?: 'append';
  /**
   * Create and return a DOM element for the given icon name (e.g. 'mdi-lock-outline').
   * Called when `action.icon` is set. Return `null` to fall back to text label.
   *
   * @example — iconify web component
   * ```ts
   * createIcon: (name) => {
   *   const el = document.createElement('iconify-icon');
   *   el.setAttribute('icon', name);
   *   return el;
   * }
   * ```
   */
  createIcon?: (iconName: string) => HTMLElement | null;
  /**
   * Full control over button content. Called instead of the default icon/label
   * logic. Use `createIcon` when you only need to swap the icon renderer —
   * `renderButton` is for cases that require full button customisation.
   */
  renderButton?: (action: LineAction, btn: HTMLButtonElement) => void;
}

// ── Styles ────────────────────────────────────────────────────────────────────

// Constructed once at module level and shared across all controller instances —
// zero extra parsing cost per instantiation (Lit adoptedStyleSheets pattern).
const WIDGET_SHEET = new CSSStyleSheet();
WIDGET_SHEET.replaceSync(`
  .rc-line-actions {
    display: inline-flex;
    align-items: center;
    gap: var(--rc-line-actions-gap, 2px);
    margin-left: var(--rc-line-actions-margin-start, 6px);
    vertical-align: middle;
  }
  .rc-line-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--rc-line-action-padding, 1px);
    border: var(--rc-line-action-border, none);
    border-radius: var(--rc-line-action-border-radius, 3px);
    background: var(--rc-line-action-bg, transparent);
    color: var(--rc-line-action-color, inherit);
    font-size: var(--rc-line-action-font-size, 1em);
    cursor: pointer;
    user-select: none;
    line-height: 1;
    opacity: var(--rc-line-action-opacity, 0.4);
    transition: opacity 0.1s;
  }
  .rc-line-action-btn:hover {
    opacity: var(--rc-line-action-hover-opacity, 1);
    background: var(--rc-line-action-hover-bg, transparent);
    color: var(--rc-line-action-hover-color, inherit);
  }
  /* Compact indicator is always fully visible — it's the sole diagnostic signal */
  .rc-line-compact-indicator {
    opacity: var(--rc-line-compact-indicator-opacity, 0.7);
  }
  .rc-line-compact-indicator:hover {
    opacity: 1;
  }
`);

const POPOVER_STYLE_ID = 'rc-line-actions-popover-style';

const POPOVER_STYLES = `
  .rc-line-actions-popover {
    position: fixed;
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: var(--rc-line-actions-gap, 4px);
    padding: 4px 8px;
    background: var(--rc-line-action-bg, Canvas);
    border: var(--rc-line-action-border, 1px solid ButtonBorder);
    border-radius: var(--rc-line-action-border-radius, 4px);
    box-shadow: var(
      --rc-line-action-shadow,
      0 2px 8px color-mix(in srgb, CanvasText 15%, transparent)
    );
  }
  .rc-line-actions-popover .rc-line-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: var(--rc-line-action-padding, 4px 6px);
    border: var(--rc-line-action-border, none);
    border-radius: var(--rc-line-action-border-radius, 3px);
    background: var(--rc-line-action-bg, transparent);
    color: var(--rc-line-action-color, ButtonText);
    font-size: var(--rc-line-action-font-size, 0.85em);
    cursor: pointer;
    user-select: none;
    line-height: 1.4;
    white-space: nowrap;
  }
  .rc-line-actions-popover .rc-line-action-btn:hover {
    background: var(--rc-line-action-hover-bg, ButtonFace);
  }
`;

// ── LineActionsController ─────────────────────────────────────────────────────

/**
 * Helper class for plugins that need to show inline action buttons next to a
 * line, or a floating popover panel anchored to the active line.
 *
 * Instantiate in `mount()`, call `getDecorations()` / `getDecorationsForLines()`
 * from `update()`, and call `destroy()` from the plugin's `destroy()`.
 *
 * @example
 * ```ts
 * editor.usePlugin({
 *   mount(api) {
 *     this._controller = new LineActionsController(api);
 *   },
 *   update(value, api) {
 *     const lineIndex = LineActionsController.getActiveLineIndex(value, api.selectionStart);
 *     const decs = this._controller.getDecorations(lineIndex, myActions, value, 'inline');
 *     api.setDecorations(decs);
 *   },
 *   destroy() { this._controller.destroy(); },
 * });
 * ```
 */
export class LineActionsController {
  private readonly _api: RCTextareaPluginAPI;
  private readonly _options: LineActionsOptions;
  private _popover: HTMLDivElement | null = null;
  private _lastActionsKey = '';
  private readonly _blurHandler: () => void;

  constructor(api: RCTextareaPluginAPI, options?: LineActionsOptions) {
    this._api = api;
    this._options = options ?? {};

    api.adoptStyleSheet(WIDGET_SHEET);

    this._blurHandler = () => this._hidePopover();
    api.host.addEventListener('rc-textarea-blur', this._blurHandler);
  }

  /**
   * Call from plugin's `update()`. Pass the line index, its actions, the full
   * value, and the current render mode.
   *
   * - `'inline'`: returns a `WidgetDecoration[]` to merge into `setDecorations()`.
   * - `'popover'`: returns `[]` and manages a floating panel as a side effect.
   *
   * Passing an empty actions array hides the popover and returns `[]`.
   */
  getDecorations(
    lineIndex: number,
    actions: LineAction[],
    value: string,
    renderMode: 'inline' | 'popover',
  ): DecorationInput[] {
    if (renderMode === 'popover') {
      if (actions.length === 0) {
        this._hidePopover();
      } else {
        this._showPopover(actions);
      }
      return [];
    }

    // inline mode — always hide any lingering popover
    this._hidePopover();

    if (actions.length === 0) return [];

    const offset = LineActionsController.lineEndOffset(value, lineIndex);
    const actionsSnapshot = [...actions];
    const buttonOptions = { renderButton: this._options.renderButton, createIcon: this._options.createIcon };

    return [
      {
        type: 'widget',
        offset,
        side: 'after',
        create(): HTMLElement {
          return buildWidgetContainer(actionsSnapshot, buttonOptions);
        },
      },
    ];
  }

  /**
   * Variant for `showOn: 'always'` — one entry per line with actions.
   *
   * In popover mode only the `activeLineIndex` line is shown; in inline mode
   * every line with non-empty actions gets a widget.
   */
  getDecorationsForLines(
    lineActions: Map<number, LineAction[]>,
    value: string,
    renderMode: 'inline' | 'popover',
    activeLineIndex?: number,
  ): DecorationInput[] {
    if (renderMode === 'popover') {
      if (activeLineIndex === undefined) {
        this._hidePopover();
        return [];
      }
      const actions = lineActions.get(activeLineIndex) ?? [];
      return this.getDecorations(activeLineIndex, actions, value, 'popover');
    }

    // inline mode — emit widget for each line that has actions
    this._hidePopover();
    const result: DecorationInput[] = [];
    for (const [lineIndex, actions] of lineActions) {
      if (actions.length > 0) {
        result.push(...this.getDecorations(lineIndex, actions, value, 'inline'));
      }
    }
    return result;
  }

  /** Remove the floating panel and detach all listeners. Call from plugin `destroy()`. */
  destroy(): void {
    this._hidePopover();
    this._api.host.removeEventListener('rc-textarea-blur', this._blurHandler);
  }

  /** Derive the 0-based line index from a plain-text character offset. */
  static getActiveLineIndex(value: string, selectionStart: number): number {
    return value.slice(0, selectionStart).split('\n').length - 1;
  }

  /**
   * Compact / indicator mode — one small button per line with actions and/or a
   * diagnostic message. Tapping the button opens a self-contained popover with
   * the message (if any) and the action buttons.
   *
   * Use this instead of `getDecorationsForLines()` on mobile / read-only views
   * where cursor placement is unreliable or unavailable (e.g. `'popover'` mode
   * doesn't work in read-only textareas because `selectionStart` never changes).
   *
   * @param lineActions  Map of 0-based line index → actions for that line.
   * @param value        Current plain-text value of the editor.
   * @param diagnosticMessages  Optional map of 0-based line index → message
   *                            text to show at the top of the compact popover.
   */
  getDecorationsForLinesCompact(
    lineActions: Map<number, LineAction[]>,
    value: string,
    diagnosticMessages?: Map<number, string>,
  ): DecorationInput[] {
    this._hidePopover();
    const result: DecorationInput[] = [];

    // Union the set of line indices from both maps
    const lineIndices = new Set([...lineActions.keys(), ...(diagnosticMessages?.keys() ?? [])]);

    for (const lineIndex of lineIndices) {
      const actions = lineActions.get(lineIndex) ?? [];
      const message = diagnosticMessages?.get(lineIndex);
      if (actions.length === 0 && !message) continue;

      const offset = LineActionsController.lineEndOffset(value, lineIndex);
      const options = this._options;
      result.push({
        type: 'widget',
        offset,
        side: 'after',
        create(): HTMLElement {
          return buildCompactIndicator(actions, message, options);
        },
      });
    }

    return result;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Character offset of the end of the given 0-based line (points at the
   * newline character, or end-of-string for the last line).
   */
  static lineEndOffset(value: string, lineIndex: number): number {
    const lines = value.split('\n');
    let offset = 0;
    for (let i = 0; i < lineIndex && i < lines.length; i++) {
      offset += lines[i]!.length + 1; // +1 for the '\n'
    }
    if (lineIndex < lines.length) {
      offset += lines[lineIndex]!.length;
    }
    return offset;
  }

  private _showPopover(actions: LineAction[]): void {
    const actionsKey = actions.map((a) => a.id).join(',');

    // Inject global popover styles once per document
    if (!document.getElementById(POPOVER_STYLE_ID)) {
      const style = document.createElement('style');
      style.id = POPOVER_STYLE_ID;
      style.textContent = POPOVER_STYLES;
      document.head.appendChild(style);
    }

    // Create the panel element if it does not exist yet
    if (!this._popover) {
      this._popover = document.createElement('div');
      this._popover.className = 'rc-line-actions-popover';
      this._popover.addEventListener('mousedown', (e) => e.preventDefault());
      document.body.appendChild(this._popover);
    }

    // Rebuild button contents only when the set of actions changes
    if (actionsKey !== this._lastActionsKey) {
      this._lastActionsKey = actionsKey;
      this._popover.innerHTML = '';
      buildPopoverButtons(this._popover, actions, this._options);
    }

    this._positionPopover();
  }

  private _positionPopover(): void {
    if (!this._popover) return;

    const cursorRect = this._api.getCursorRect();
    const hostRect = this._api.host.getBoundingClientRect();

    let top: number;
    const panelHeight = this._popover.offsetHeight || 32;

    if (cursorRect) {
      top = cursorRect.bottom + 4;
      if (top + panelHeight > window.innerHeight) {
        top = cursorRect.top - panelHeight - 4;
      }
    } else {
      top = hostRect.bottom + 4;
    }

    const panelWidth = this._popover.offsetWidth || 120;
    let left = hostRect.left;
    left = Math.min(left, window.innerWidth - panelWidth - 8);
    left = Math.max(left, 8);

    this._popover.style.top = `${top}px`;
    this._popover.style.left = `${left}px`;
  }

  private _hidePopover(): void {
    if (this._popover) {
      this._popover.remove();
      this._popover = null;
      this._lastActionsKey = '';
    }
  }
}

// ── DOM helpers (module-level so they can be used inside widget create() closures) ──

function buildButton(
  action: LineAction,
  options: Pick<LineActionsOptions, 'renderButton' | 'createIcon'>,
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'rc-line-action-btn';
  btn.type = 'button';
  btn.setAttribute('title', action.label);

  if (options.renderButton) {
    options.renderButton(action, btn);
  } else if (action.icon) {
    const iconEl = options.createIcon?.(action.icon) ?? null;
    if (iconEl) {
      btn.setAttribute('aria-label', action.label);
      btn.appendChild(iconEl);
    } else {
      // Fallback: data-icon attribute for hosts that process it externally
      btn.dataset['icon'] = action.icon;
      btn.setAttribute('aria-label', action.label);
    }
  } else {
    btn.textContent = action.label;
  }

  btn.addEventListener('mousedown', (e) => e.preventDefault());
  btn.addEventListener('click', () => action.onClick());
  return btn;
}

function buildWidgetContainer(
  actions: LineAction[],
  options: Pick<LineActionsOptions, 'renderButton' | 'createIcon'>,
): HTMLElement {
  const container = document.createElement('span');
  container.className = 'rc-line-actions';
  for (const action of actions) {
    container.appendChild(buildButton(action, options));
  }
  return container;
}

function buildPopoverButtons(
  panel: HTMLDivElement,
  actions: LineAction[],
  options: Pick<LineActionsOptions, 'renderButton' | 'createIcon'>,
): void {
  for (const action of actions) {
    panel.appendChild(buildButton(action, options));
  }
}

// ── Compact indicator (mobile / read-only) ────────────────────────────────────

const COMPACT_POPOVER_STYLE_ID = 'rc-compact-popover-style';

const COMPACT_POPOVER_STYLES = `
  .rc-compact-popover {
    position: fixed;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: var(--rc-line-actions-gap, 4px);
    padding: 8px 10px;
    background: var(--rc-line-action-bg, Canvas);
    border: var(--rc-line-action-border, 1px solid ButtonBorder);
    border-radius: var(--rc-line-action-border-radius, 6px);
    box-shadow: var(
      --rc-line-action-shadow,
      0 2px 12px color-mix(in srgb, CanvasText 20%, transparent)
    );
    max-width: min(280px, calc(100vw - 16px));
  }
  .rc-compact-popover-message {
    margin: 0 0 4px;
    font-size: 0.85em;
    opacity: 0.85;
    line-height: 1.4;
    white-space: normal;
    word-break: break-word;
  }
  .rc-compact-popover .rc-line-action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: var(--rc-line-action-padding, 5px 8px);
    border: var(--rc-line-action-border, none);
    border-radius: var(--rc-line-action-border-radius, 3px);
    background: var(--rc-line-action-bg, transparent);
    color: var(--rc-line-action-color, ButtonText);
    font-size: var(--rc-line-action-font-size, 0.875em);
    cursor: pointer;
    user-select: none;
    line-height: 1.4;
    white-space: nowrap;
    opacity: 1;
  }
  .rc-compact-popover .rc-line-action-btn:hover {
    background: var(--rc-line-action-hover-bg, ButtonFace);
  }
`;

function buildCompactIndicator(
  actions: LineAction[],
  message: string | undefined,
  options: LineActionsOptions,
): HTMLElement {
  const btn = document.createElement('button');
  btn.className = 'rc-line-action-btn rc-line-compact-indicator';
  btn.type = 'button';
  btn.setAttribute('title', message ?? actions.map((a) => a.label).join(', '));

  const iconEl = options.createIcon?.('mdi-alert-circle-outline') ?? null;
  if (iconEl) {
    btn.setAttribute('aria-label', message ?? actions.map((a) => a.label).join(', '));
    btn.appendChild(iconEl);
  } else {
    btn.textContent = '⚠';
    btn.setAttribute('aria-label', message ?? actions.map((a) => a.label).join(', '));
  }

  btn.addEventListener('mousedown', (e) => e.preventDefault());
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    showCompactPopover(btn, actions, message, options);
  });

  return btn;
}

function showCompactPopover(
  anchor: HTMLElement,
  actions: LineAction[],
  message: string | undefined,
  options: Pick<LineActionsOptions, 'renderButton' | 'createIcon'>,
): void {
  // Remove any existing compact popover
  document.querySelector('.rc-compact-popover')?.remove();

  // Inject styles once per document
  if (!document.getElementById(COMPACT_POPOVER_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = COMPACT_POPOVER_STYLE_ID;
    style.textContent = COMPACT_POPOVER_STYLES;
    document.head.appendChild(style);
  }

  const panel = document.createElement('div');
  panel.className = 'rc-compact-popover';
  panel.addEventListener('mousedown', (e) => e.preventDefault());

  if (message) {
    const p = document.createElement('p');
    p.className = 'rc-compact-popover-message';
    p.textContent = message;
    panel.appendChild(p);
  }

  for (const action of actions) {
    const actionBtn = buildButton(action, options);
    // Wrap onClick so the popover dismisses after the action fires
    const origClick = action.onClick;
    actionBtn.addEventListener('click', () => {
      origClick();
      panel.remove();
    });
    panel.appendChild(actionBtn);
  }

  document.body.appendChild(panel);

  // Position below (or above) the anchor button
  const rect = anchor.getBoundingClientRect();
  const panelHeight = panel.offsetHeight || 80;
  const panelWidth = panel.offsetWidth || 200;

  let top = rect.bottom + 4;
  if (top + panelHeight > window.innerHeight) {
    top = rect.top - panelHeight - 4;
  }
  top = Math.max(top, 4);

  let left = rect.left;
  left = Math.min(left, window.innerWidth - panelWidth - 8);
  left = Math.max(left, 8);

  panel.style.top = `${top}px`;
  panel.style.left = `${left}px`;

  // Dismiss on click-outside or Escape — defer to avoid self-dismiss on the opening click
  setTimeout(() => {
    const clickHandler = (e: MouseEvent) => {
      if (!panel.contains(e.target as Node)) {
        panel.remove();
        document.removeEventListener('click', clickHandler, true);
        document.removeEventListener('keydown', keyHandler);
      }
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        panel.remove();
        document.removeEventListener('click', clickHandler, true);
        document.removeEventListener('keydown', keyHandler);
      }
    };
    document.addEventListener('click', clickHandler, true);
    document.addEventListener('keydown', keyHandler);
  }, 0);
}
