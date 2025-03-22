import { LitElement, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DragController, ResizeController } from '@rcarls/rc-common';

declare global {
  interface HTMLElementTagNameMap {
    'rc-dialog': RCDialog;
  }
}

/**
 * Enhances a consumer-provided `<dialog>` child with drag, resize, and
 * accessible event forwarding. Renders nothing itself — the `<dialog>` element
 * remains in the document's light DOM for full CSS and AT access.
 *
 * @slot - Place a `<dialog>` element with your content here.
 *
 * @fires rc-dialog-close - Mirrors the inner `<dialog>` close event.
 *   `detail: { returnValue: string }`
 * @fires rc-dialog-cancel - Mirrors the inner `<dialog>` cancel event
 *   (Escape key).
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */
@customElement('rc-dialog')
export class RCDialog extends LitElement {
  override createRenderRoot() { return this; }

  /**
   * Allow the dialog to be moved by dragging. Use `move-handle` to restrict
   * dragging to a specific child element (e.g. a titlebar).
   * Named `movable` — not `draggable` — to avoid colliding with the
   * built-in HTML Drag and Drop `draggable` global attribute.
   */
  @property({ type: Boolean, reflect: true })
  movable = false;

  /** CSS selector (within the inner `<dialog>`) for the drag handle element. */
  @property({ type: String, attribute: 'move-handle' })
  moveHandle = '';

  /** Bounds constraint for movement. */
  @property({ type: String, attribute: 'move-bounds' })
  moveBounds: 'viewport' | 'parent' = 'viewport';

  /** Keyboard arrow-key step in px for moving. */
  @property({ type: Number, attribute: 'move-step' })
  moveStep = 4;

  /** Enable resizing, mirroring the CSS `resize` property values. */
  @property({ type: String, reflect: true })
  resize: 'none' | 'both' | 'horizontal' | 'vertical' = 'none';

  /** Edge hit-test thickness in px for resize detection. */
  @property({ type: Number, attribute: 'resize-threshold' })
  resizeThreshold = 8;

  /** Keyboard arrow-key step in px for resizing. */
  @property({ type: Number, attribute: 'resize-step' })
  resizeStep = 4;

  // ---- Native <dialog> delegation ----------------------------------------

  /** Whether the inner `<dialog>` is currently open. */
  get open(): boolean { return this._dlg()?.open ?? false; }

  /** The return value set when the dialog was closed. */
  get returnValue(): string { return this._dlg()?.returnValue ?? ''; }

  /** Opens the inner `<dialog>` as a modal. */
  showModal(): void { this._dlg()?.showModal(); }

  /** Opens the inner `<dialog>` as a non-modal. */
  show(): void { this._dlg()?.show(); }

  /** Closes the inner `<dialog>`, optionally setting a return value. */
  close(returnValue?: string): void { this._dlg()?.close(returnValue); }

  // ---- Internals ----------------------------------------------------------

  private _dlg(): HTMLDialogElement | null {
    return this.querySelector<HTMLDialogElement>(':scope > dialog');
  }

  override render() { return nothing; }

  override firstUpdated() {
    const dlg = this._dlg();
    if (!dlg) {
      if (import.meta.env.DEV) {
        console.warn(
          '[rc-dialog] No <dialog> child found. Place a <dialog> element ' +
          'directly inside <rc-dialog>.',
          this,
        );
      }
      return;
    }

    if (import.meta.env.DEV) {
      const hasLabel =
        dlg.hasAttribute('aria-labelledby') || dlg.hasAttribute('aria-label');
      if (!hasLabel) {
        console.warn(
          '[rc-dialog] The inner <dialog> is missing aria-labelledby or ' +
          'aria-label. Add one to satisfy the ARIA dialog pattern.',
          dlg,
        );
      }
    }

    dlg.addEventListener('close', this._onClose);
    dlg.addEventListener('cancel', this._onCancel);

    if (this.movable || this.moveHandle) {
      const handle = this.moveHandle
        ? (dlg.querySelector<Element>(this.moveHandle) ?? dlg)
        : dlg;
      new DragController(this, {
        target: dlg,
        handle,
        bounds: this.moveBounds,
        step: this.moveStep,
      });
    }

    if (this.resize !== 'none') {
      new ResizeController(this, {
        target: dlg,
        direction: this.resize,
        threshold: this.resizeThreshold,
        step: this.resizeStep,
        bounds: this.moveBounds,
      });
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    const dlg = this._dlg();
    if (!dlg) return;
    dlg.removeEventListener('close', this._onClose);
    dlg.removeEventListener('cancel', this._onCancel);
  }

  private _onClose = () => {
    this.dispatchEvent(
      new CustomEvent('rc-dialog-close', {
        bubbles: true,
        composed: true,
        detail: { returnValue: this.returnValue },
      }),
    );
  };

  private _onCancel = () => {
    this.dispatchEvent(
      new CustomEvent('rc-dialog-cancel', { bubbles: true, composed: true }),
    );
  };
}

export default RCDialog;
