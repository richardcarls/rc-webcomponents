import { html, nothing } from 'lit';
import { property } from 'lit/decorators.js';

import { RCTextarea } from '@rcarls/rc-textarea';
import type { RCTextareaPlugin } from '@rcarls/rc-textarea';

import { rteStyles } from './rc-text-editor.styles.ts';
import type { EditorToolbarActionDetail } from './types.ts';


/**
 * Rich-text editor extending `<rc-textarea>` with a formatting toolbar, markdown
 * decoration support, and an optional HTML preview panel.
 *
 * Consumer markup is identical to `<rc-textarea>`:
 *
 * ```html
 * <rc-text-editor markdown>
 *   <label for="body">Body</label>
 *   <textarea id="body" name="body"></textarea>
 * </rc-text-editor>
 * ```
 *
 * @fires rc-preview-change - When preview mode is toggled. Detail: `{ preview: boolean }`.
 *
 * @attr {boolean} toolbar - Show the formatting toolbar (default: true).
 * @attr {boolean} markdown - Activate the bundled markdown decoration plugin.
 * @attr {boolean} preview  - Controlled: show the HTML preview panel.
 * @attr {boolean} default-preview - Uncontrolled initial preview state.
 */
export class RcTextEditor extends RCTextarea {
  static override styles = [RCTextarea.styles, rteStyles];

  // ── Properties ─────────────────────────────────────────────────────────────

  /** Show the formatting toolbar. */
  @property({ type: Boolean, reflect: true })
  toolbar = true;

  /** Enable the bundled markdown decoration plugin (requires `@rcarls/rc-textarea-plugin-markdown`). */
  @property({ type: Boolean, reflect: true })
  markdown = false;

  // preview — controlled/uncontrolled per AGENTS.md pattern

  private _preview: boolean | undefined;
  private _defaultPreview = false;
  private _previewInitialized = false;

  /** Controlled: whether the HTML preview panel is shown. */
  @property({ type: Boolean, reflect: true })
  get preview(): boolean {
    return this._preview ?? this._defaultPreview;
  }

  set preview(v: boolean) {
    const old = this._preview;
    this._preview = v;
    this._previewInitialized = true;
    this.requestUpdate('preview', old);

    if (old !== v) this._dispatchPreviewChange(v);
  }

  /** Uncontrolled initial preview state. Ignored once `preview` has been set. */
  @property({ type: Boolean, attribute: 'default-preview' })
  get defaultPreview(): boolean {
    return this._defaultPreview;
  }

  set defaultPreview(v: boolean) {
    const old = this._defaultPreview;
    this._defaultPreview = v;
    if (!this._previewInitialized && this._preview === undefined) {
      this.requestUpdate('defaultPreview', old);
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('keydown', this._onRteKeyDown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._onRteKeyDown);
  }

  override firstUpdated(): void {
    super.firstUpdated();
    if (this.markdown) this._applyMarkdownPlugin();
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);

    if (changed.has('markdown')) {
      if (this.markdown) this._applyMarkdownPlugin();
      else this.removePlugin();
    }

    if (changed.has('preview') || changed.has('defaultPreview')) {
      this._syncPreview();
    }
  }

  // ── Rendering ───────────────────────────────────────────────────────────────

  override render() {
    const toolbarTpl = html`
      <rc-editor-toolbar
        part="toolbar"
        @rc-toolbar-action=${this._onToolbarAction}
      ></rc-editor-toolbar>
    `;

    return html`
      ${this.toolbar ? toolbarTpl : nothing}
      ${super.render()}
      <div
        id="rte-preview"
        part="preview"
        aria-live="polite"
        ?hidden=${!this.preview}
      ></div>
    `;
  }

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────

  private _onRteKeyDown = (e: KeyboardEvent): void => {
    if (!e.ctrlKey && !e.metaKey) return;

    if (e.shiftKey && e.key === 'P') {
      e.preventDefault();
      this.preview = !this.preview;
      return;
    }

    if (!e.shiftKey) {
      switch (e.key) {
        case 'b': e.preventDefault(); this.wrapSelection('**', '**'); return;
        case 'i': e.preventDefault(); this.wrapSelection('*', '*');   return;
        case '`': e.preventDefault(); this.wrapSelection('`', '`');   return;
        case 'k': e.preventDefault(); this._insertText('[](url)');    return;
      }
    }
  };

  // ── Toolbar action handler ──────────────────────────────────────────────────

  private _onToolbarAction = (e: CustomEvent<EditorToolbarActionDetail>): void => {
    switch (e.detail.action) {
      case 'bold':    this.wrapSelection('**', '**'); break;
      case 'italic':  this.wrapSelection('*', '*');   break;
      case 'code':    this.wrapSelection('`', '`');   break;
      case 'link':    this._insertText('[](url)');    break;
      case 'heading': this._insertText('# ');         break;
      case 'preview': this.preview = !this.preview;   break;
    }
  };

  // ── Preview ─────────────────────────────────────────────────────────────────

  private _syncPreview(): void {
    const el = this.shadowRoot?.getElementById('rte-preview');
    if (!el) return;

    if (this.preview) {
      el.innerHTML = this._getPreviewHtml();
      el.hidden = false;
    } else {
      el.hidden = true;
      el.innerHTML = '';
    }
  }

  private _getPreviewHtml(): string {
    const plugin = this._plugin;

    if (
      plugin !== null &&
      'getPreviewHtml' in plugin &&
      typeof (plugin as { getPreviewHtml?: unknown }).getPreviewHtml === 'function'
    ) {
      return (plugin as { getPreviewHtml(v: string): string }).getPreviewHtml(this.value);
    }

    // Safe fallback: escaped raw text
    return `<pre>${this.value.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>`;
  }

  // ── Markdown plugin ─────────────────────────────────────────────────────────

  private _applyMarkdownPlugin(): void {
    void import('@rcarls/rc-textarea-plugin-markdown')
      .then(({ markdownPlugin }) => {
        this.usePlugin(markdownPlugin as RCTextareaPlugin);
      })
      .catch(() => {
        console.warn(
          '[rc-text-editor] Optional peer dependency @rcarls/rc-textarea-plugin-markdown is not installed.',
        );
      });
  }

  // ── Events ──────────────────────────────────────────────────────────────────

  private _dispatchPreviewChange(preview: boolean): void {
    this.dispatchEvent(
      new CustomEvent('rc-preview-change', {
        bubbles: true,
        composed: true,
        detail: { preview },
      }),
    );
  }
}
