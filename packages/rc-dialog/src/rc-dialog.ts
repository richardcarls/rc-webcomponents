import { LitElement, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
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
 * @fires rc-dialog-open - Fired when the dialog opens via `showModal()` or `show()`.
 * @fires rc-dialog-toggle - Fired when user/native interaction changes open state.
 *
 * @fires rc-dialog-request-close - Fired before the dialog closes (Escape key,
 *   backdrop click when `light-dismiss` is set, or a call to `requestClose()`).
 *   **Cancelable** — call `preventDefault()` to block the close (e.g. unsaved-
 *   changes guard). `detail: { returnValue: string }`
 *
 * @fires rc-dialog-cancel - Mirrors the inner `<dialog>` cancel event when the
 *   close was not prevented. Backward-compatible alias for `rc-dialog-request-close`.
 *
 * @fires rc-dialog-close - Mirrors the inner `<dialog>` close event.
 *   `detail: { returnValue: string }`
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */
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

  /**
   * Proxied to the inner `<dialog closedby="...">` attribute (Chrome 134+,
   * Safari 18.4+, Firefox 139+). Progressive enhancement — no-op in older browsers.
   *
   * - `'any'`          — Escape OR backdrop click closes the dialog.
   * - `'closerequest'` — Escape only (browser default for modal dialogs).
   * - `'none'`         — Only programmatic `close()` / `requestClose()`.
   * - `''`             — Attribute absent; use `light-dismiss` for JS fallback.
   */
  @property({ type: String, attribute: 'closed-by', reflect: true })
  closedBy: 'any' | 'closerequest' | 'none' | '' = '';

  /**
   * JS fallback for backdrop-click dismissal. When true, a click on the
   * `<dialog>` element itself (i.e. the backdrop area, not a child element)
   * calls `requestClose()`. Complements native `closed-by="any"` for browsers
   * that do not yet support the `closedby` attribute.
   */
  @property({ type: Boolean, attribute: 'light-dismiss' })
  lightDismiss = false;

  // ---- Native <dialog> delegation ----------------------------------------

  private _controlledOpen: boolean | undefined = undefined;
  private _defaultOpen = false;
  private _dialogRef: WeakRef<HTMLDialogElement> | null = null;
  private _observer = new MutationObserver(() => this._setupDialog());
  private _suppressNextCloseToggle = false;

  /** Whether the inner `<dialog>` is currently open. Host writes update silently. */
  @property({ type: Boolean, attribute: 'open', reflect: true })
  get open(): boolean { return this._dlg()?.open ?? false; }
  set open(value: boolean | undefined) {
    const oldValue = this._controlledOpen;

    this._controlledOpen = value;

    if (value !== undefined) {
      this._applyOpen(value, true);
    }

    this.requestUpdate('open', oldValue);
  }

  /** Initial uncontrolled open state. */
  @property({ type: Boolean, attribute: 'default-open' })
  get defaultOpen(): boolean { return this._defaultOpen; }
  set defaultOpen(value: boolean) {
    const oldValue = this._defaultOpen;

    this._defaultOpen = value;

    if (this._controlledOpen === undefined && value) {
      this._applyOpen(true, true);
    }

    this.requestUpdate('defaultOpen', oldValue);
  }

  /** The return value set when the dialog was closed. */
  get returnValue(): string { return this._dlg()?.returnValue ?? ''; }

  /** Opens the inner `<dialog>` as a modal and fires `rc-dialog-open`. */
  showModal(): void {
    if (this._applyOpen(true, false, true)) {
      this.dispatchEvent(new CustomEvent('rc-dialog-open', { bubbles: true, composed: true }));
      this._dispatchToggle(true);
    }
  }

  /** Opens the inner `<dialog>` as a non-modal and fires `rc-dialog-open`. */
  show(): void {
    if (this._applyOpen(true, false, false)) {
      this.dispatchEvent(new CustomEvent('rc-dialog-open', { bubbles: true, composed: true }));
      this._dispatchToggle(true);
    }
  }

  /** Closes the inner `<dialog>`, optionally setting a return value. */
  close(returnValue?: string): void { this._dlg()?.close(returnValue); }

  /**
   * Requests the inner `<dialog>` to close, firing a cancelable `cancel` event
   * first. If the consumer prevents `rc-dialog-request-close`, the close is
   * blocked. Falls back to a synthesized cancel → close sequence in browsers
   * that do not yet support the native `requestClose()` method.
   */
  requestClose(returnValue?: string): void {
    const dlg = this._dlg();
    if (!dlg) return;
    if (typeof (dlg as any).requestClose === 'function') {
      (dlg as any).requestClose(returnValue);
    } else {
      // Synthesize a cancelable cancel event; _onCancel fires rc-dialog-request-close.
      // If not prevented, _onCancel does not call dlg.close() — we do it here.
      const ev = new Event('cancel', { cancelable: true, bubbles: false });
      const prevented = !dlg.dispatchEvent(ev);
      if (!prevented) dlg.close(returnValue);
    }
  }

  // ---- Internals ----------------------------------------------------------

  private _dlg(): HTMLDialogElement | null {
    return this._dialogRef?.deref() ?? this.querySelector<HTMLDialogElement>(':scope > dialog');
  }

  override render() { return nothing; }

  override connectedCallback() {
    super.connectedCallback();
    this._observer.observe(this, { childList: true });
  }

  override firstUpdated() {
    this._setupDialog();
  }

  private _setupDialog() {
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

    if (this._dialogRef?.deref() === dlg) return;

    this._teardownDialog();
    this._dialogRef = new WeakRef(dlg);

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
      if (dlg.getAttribute('role') === 'alertdialog' && !dlg.hasAttribute('aria-describedby')) {
        console.warn(
          '[rc-dialog] <dialog role="alertdialog"> should have aria-describedby ' +
          'pointing to the alert message text.',
          dlg,
        );
      }
    }

    dlg.addEventListener('close', this._onClose);
    dlg.addEventListener('cancel', this._onCancel);

    if (this.lightDismiss && 'closedBy' in HTMLDialogElement.prototype) {
      dlg.setAttribute('closedby', 'any');
    } else if (this.lightDismiss) {
      dlg.addEventListener('click', this._onBackdropClick);
    } else {
      if (this.closedBy) dlg.setAttribute('closedby', this.closedBy);
    }

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

    if (this._controlledOpen !== undefined) {
      this._applyOpen(this._controlledOpen, true);
    } else if (this.defaultOpen) {
      this._applyOpen(true, true);
    }
  }

  override updated(changed: PropertyValues) {
    const dlg = this._dlg();
    if (!dlg) return;

    if (changed.has('closedBy')) {
      if (this.closedBy) dlg.setAttribute('closedby', this.closedBy);
      else dlg.removeAttribute('closedby');
    }

    if (changed.has('lightDismiss')) {
      if (this.lightDismiss && 'closedBy' in HTMLDialogElement.prototype) {
        // native support available — delegate to closedby="any" instead of JS handler
        dlg.setAttribute('closedby', 'any');
        dlg.removeEventListener('click', this._onBackdropClick);
      } else if (this.lightDismiss) {
        dlg.addEventListener('click', this._onBackdropClick);
      } else {
        dlg.removeEventListener('click', this._onBackdropClick);
        if (this.closedBy) dlg.setAttribute('closedby', this.closedBy);
        else dlg.removeAttribute('closedby');
      }
    }
  }

  override disconnectedCallback() {
    this._observer.disconnect();
    this._teardownDialog();
    super.disconnectedCallback();
  }

  private _teardownDialog(): void {
    const dlg = this._dialogRef?.deref();
    if (!dlg) return;

    dlg.removeEventListener('close', this._onClose);
    dlg.removeEventListener('cancel', this._onCancel);
    dlg.removeEventListener('click', this._onBackdropClick);
    this._dialogRef = null;
  }

  private _onClose = () => {
    this.dispatchEvent(
      new CustomEvent('rc-dialog-close', {
        bubbles: true,
        composed: true,
        detail: { returnValue: this.returnValue },
      }),
    );

    if (!this._suppressNextCloseToggle) {
      this._dispatchToggle(false);
    }

    this._suppressNextCloseToggle = false;
    this.requestUpdate('open');
  };

  /**
   * Intercepts the native `cancel` event (Escape key or `requestClose()`).
   * Fires the cancelable `rc-dialog-request-close` event first. If prevented,
   * the native cancel is suppressed and the dialog stays open. If not prevented,
   * the backward-compatible `rc-dialog-cancel` is also fired and the browser
   * proceeds to close the dialog naturally (no explicit `dlg.close()` call here,
   * so the `requestClose()` fallback can close after `dispatchEvent` returns).
   */
  private _onCancel = (e: Event) => {
    const requestCloseEvent = new CustomEvent('rc-dialog-request-close', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { returnValue: this.returnValue },
    });
    const prevented = !this.dispatchEvent(requestCloseEvent);

    if (prevented) {
      e.preventDefault();
    } else {
      this.dispatchEvent(
        new CustomEvent('rc-dialog-cancel', { bubbles: true, composed: true }),
      );
    }
  };

  /**
   * Detects backdrop clicks: a click whose `target` is the `<dialog>` element
   * itself (not a descendant) means the user clicked outside the dialog's
   * content box on the backdrop area.
   */
  private _onBackdropClick = (e: MouseEvent) => {
    if (e.target === this._dlg()) this.requestClose();
  };

  private _applyOpen(open: boolean, silent: boolean, modal = true): boolean {
    const dlg = this._dlg();
    if (!dlg) return false;

    if (open) {
      if (dlg.open) return false;
      modal ? dlg.showModal() : dlg.show();
      this.requestUpdate('open');
      return true;
    }

    if (!dlg.open) return false;

    this._suppressNextCloseToggle = silent;
    dlg.close();
    this.requestUpdate('open');

    return true;
  }

  private _dispatchToggle(open: boolean): void {
    this.dispatchEvent(
      new CustomEvent('rc-dialog-toggle', {
        bubbles: true,
        composed: true,
        detail: { open, returnValue: this.returnValue },
      }),
    );
  }
}

export default RCDialog;
