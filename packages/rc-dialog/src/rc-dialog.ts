import { LitElement, nothing, type PropertyValues } from 'lit';
import { property, query } from 'lit/decorators.js';
import { DragController, ResizeController } from '@rcarls/rc-common';

/** Detail shape for `rc-dialog-close` and `rc-dialog-request-close`. */
export interface RCDialogCloseEvent {
  returnValue: string;
}

/** Detail shape for `rc-dialog-toggle`. */
export interface RCDialogToggleEvent {
  open: boolean;
  returnValue: string;
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-dialog': RCDialog;
  }

  interface HTMLElementEventMap {
    'rc-dialog-open': CustomEvent<Record<string, never>>;
    'rc-dialog-close': CustomEvent<RCDialogCloseEvent>;
    'rc-dialog-request-close': CustomEvent<RCDialogCloseEvent>;
    'rc-dialog-cancel': CustomEvent<Record<string, never>>;
    'rc-dialog-toggle': CustomEvent<RCDialogToggleEvent>;
  }
}

/**
 * Enhances a native `<dialog>` child with drag, resize, and accessible
 * event forwarding.
 *
 * @slot - Place a `<dialog>` element with your content here.
 *
 * @fires rc-dialog-open - Fired when the dialog opens via `showModal()` or `show()`.
 * @fires rc-dialog-toggle - Fired when user/native interaction changes open state.
 * @fires rc-dialog-request-close - Fired before the dialog closes (cancellable).
 * @fires rc-dialog-cancel - Mirrors the inner `<dialog>` cancel event when the
 *   close was not prevented. Backward-compatible alias for `rc-dialog-request-close`.
 * @fires rc-dialog-close - Mirrors the inner `<dialog>` close event.
 *   `detail: { returnValue: string }`
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */
export class RCDialog extends LitElement {
  override createRenderRoot() {
    return this;
  }

  /**
   * Allow the dialog to be moved by dragging.
   *
   * Use `move-handle` to restrict dragging to a specific child
   * element (e.g. a titlebar).
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
   * Proxied to the inner `<dialog closedby="...">` attribute.
   *
   * Progressive enhancement, no-op in older browsers.
   *
   * - `'any'`          — Escape OR backdrop click closes the dialog.
   * - `'closerequest'` — Escape only (browser default for modal dialogs).
   * - `'none'`         — Only programmatic `close()` / `requestClose()`.
   * - `''`             — Attribute absent; use `light-dismiss` for JS fallback.
   */
  @property({ type: String, attribute: 'closed-by', reflect: true })
  closedBy: 'any' | 'closerequest' | 'none' | '' = '';

  /**
   * When true and the dialog is modal, a click on the backdrop area calls
   * `requestClose()`.
   */
  @property({ type: Boolean, attribute: 'light-dismiss' })
  lightDismiss = false;

  /**
   * Whether to open as modal with controlled open. Default: `true`.
   */
  modal = true;

  /** The inner `<dialog>` element, resolved live via `@query` on each access. */
  @query(':scope > dialog')
  protected _$dialog!: HTMLDialogElement | null;

  private _controlledOpen: boolean | undefined = undefined;
  private _defaultOpen = false;
  // Tracks which <dialog> has its listeners wired; used by _teardownDialog to
  // remove listeners even after the element is removed from the DOM.
  private _$wired: WeakRef<HTMLDialogElement> | null = null;
  protected _observer: MutationObserver | null = null;
  private _suppressNextCloseToggle = false;

  /** The element that had focus when the dialog was opened; restored on close. */
  protected _$opener: Element | null = null;

  /** Whether the inner `<dialog>` is currently open. Host writes update silently. */
  @property({ type: Boolean, attribute: 'open', reflect: true })
  get open(): boolean {
    return this._$dialog?.open ?? false;
  }

  set open(value: boolean | undefined) {
    const oldValue = this._controlledOpen;

    this._controlledOpen = value;

    if (value !== undefined) {
      this._applyOpen(value, true, this.modal);
    }

    this.requestUpdate('open', oldValue);
  }

  /** Initial uncontrolled open state. */
  @property({ type: Boolean, attribute: 'default-open' })
  get defaultOpen(): boolean {
    return this._defaultOpen;
  }

  set defaultOpen(value: boolean) {
    const oldValue = this._defaultOpen;

    this._defaultOpen = value;

    if (this._controlledOpen === undefined && value && this.isConnected) {
      this._applyOpen(true, true, this.modal);
    }

    this.requestUpdate('defaultOpen', oldValue);
  }

  /** The return value set when the dialog was closed. */
  get returnValue(): string {
    return this._$dialog?.returnValue ?? '';
  }

  /** Opens the inner `<dialog>` as a modal and fires `rc-dialog-open`. */
  showModal(): void {
    if (this._applyOpen(true, false, true)) {
      this.dispatchEvent(new CustomEvent('rc-dialog-open', { bubbles: true, composed: true }));
      this._dispatchToggle(true);
    }
  }

  /**
   * Opens the inner `<dialog>` (non-modal) and fires `rc-dialog-open`.
   */
  show(): void {
    if (this._applyOpen(true, false, false)) {
      this.dispatchEvent(new CustomEvent('rc-dialog-open', { bubbles: true, composed: true }));
      this._dispatchToggle(true);
    }
  }

  /** Closes the inner `<dialog>`, optionally setting a return value. */
  close(returnValue?: string): void {
    this._$dialog?.close(returnValue);
  }

  /**
   * Requests the inner `<dialog>` to close, firing a cancelable `cancel` event
   * first.
   */
  requestClose(returnValue?: string): void {
    const $dialog = this._$dialog;

    if (!$dialog) {
      return;
    }

    if ('requestClose' in $dialog && typeof $dialog.requestClose === 'function') {
      $dialog.requestClose(returnValue);
    } else {
      // Synthesize a cancelable cancel event; _onCancel fires rc-dialog-request-close.
      // If not prevented, _onCancel does not call $dlg.close() — we do it here.
      const ev = new Event('cancel', { cancelable: true, bubbles: false });
      const prevented = !$dialog.dispatchEvent(ev);

      if (!prevented) {
        $dialog.close(returnValue);
      }
    }
  }

  override render() {
    return nothing;
  }

  override connectedCallback() {
    super.connectedCallback();

    this._observer = new MutationObserver(() => this._setupDialog());
    this._observer.observe(this, { childList: true });
  }

  override firstUpdated() {
    this._setupDialog();
  }

  /** Wires event listeners, drag/resize controllers, and initial open state for the inner `<dialog>`. */
  protected _setupDialog() {
    const $dialog = this._$dialog;

    if (!$dialog) {
      if (import.meta.env.DEV) {
        console.warn(
          '[rc-dialog] No <dialog> child found. Place a <dialog> element ' +
            'directly inside <rc-dialog>.',
          this,
        );
      }

      return;
    }

    if (this._$wired?.deref() === $dialog) {
      return;
    }

    this._teardownDialog();
    this._$wired = new WeakRef($dialog);

    if (import.meta.env.DEV) {
      const hasLabel =
        $dialog.hasAttribute('aria-labelledby') || $dialog.hasAttribute('aria-label');

      if (!hasLabel) {
        console.warn(
          '[rc-dialog] The inner <dialog> is missing aria-labelledby or ' +
            'aria-label. Add one to satisfy the ARIA dialog pattern.',
          $dialog,
        );
      }

      if (
        $dialog.getAttribute('role') === 'alertdialog' &&
        !$dialog.hasAttribute('aria-describedby')
      ) {
        console.warn(
          '[rc-dialog] <dialog role="alertdialog"> should have aria-describedby ' +
            'pointing to the alert message text.',
          $dialog,
        );
      }

      if (!$dialog.querySelector('button:not([disabled])')) {
        console.warn(
          '[rc-dialog] No enabled <button> found inside <dialog>. APG recommends ' +
            'including a visible close button in the tab sequence.',
          $dialog,
        );
      }
    }

    $dialog.addEventListener('close', this._onClose);
    $dialog.addEventListener('cancel', this._onCancel);

    if (this.lightDismiss && 'closedBy' in HTMLDialogElement.prototype) {
      $dialog.setAttribute('closedby', 'any');
    } else if (this.lightDismiss) {
      $dialog.addEventListener('click', this._onBackdropClick);
    } else {
      if (this.closedBy) {
        $dialog.setAttribute('closedby', this.closedBy);
      }
    }

    if (this.movable || this.moveHandle) {
      const $handle = this.moveHandle
        ? ($dialog.querySelector<Element>(this.moveHandle) ?? $dialog)
        : $dialog;

      new DragController(this, {
        target: $dialog,
        handle: $handle,
        bounds: this.moveBounds,
        step: this.moveStep,
      });
    }

    if (this.resize !== 'none') {
      // TODO: add a separate resize-bounds attribute; moveBounds is a proxy for now.
      new ResizeController(this, {
        target: $dialog,
        direction: this.resize,
        threshold: this.resizeThreshold,
        step: this.resizeStep,
        bounds: this.moveBounds,
      });
    }

    if (this._controlledOpen !== undefined) {
      this._applyOpen(this._controlledOpen, true, this.modal);
    } else if (this.defaultOpen) {
      this._applyOpen(true, true, this.modal);
    }
  }

  override updated(changed: PropertyValues) {
    const $dialog = this._$dialog;

    if (!$dialog) {
      return;
    }

    if (changed.has('closedBy')) {
      if (this.closedBy) {
        $dialog.setAttribute('closedby', this.closedBy);
      } else {
        $dialog.removeAttribute('closedby');
      }
    }

    if (changed.has('lightDismiss')) {
      if (this.lightDismiss && 'closedBy' in HTMLDialogElement.prototype) {
        // Native support available — delegate to closedby="any" instead of JS handler.
        $dialog.setAttribute('closedby', 'any');
        $dialog.removeEventListener('click', this._onBackdropClick);
      } else if (this.lightDismiss) {
        $dialog.addEventListener('click', this._onBackdropClick);
      } else {
        $dialog.removeEventListener('click', this._onBackdropClick);

        if (this.closedBy) {
          $dialog.setAttribute('closedby', this.closedBy);
        } else {
          $dialog.removeAttribute('closedby');
        }
      }
    }
  }

  override disconnectedCallback() {
    this._observer?.disconnect();
    this._observer = null;

    this._teardownDialog();

    super.disconnectedCallback();
  }

  /** Removes all event listeners attached to the inner `<dialog>` and clears cached state. */
  protected _teardownDialog(): void {
    const $dialog = this._$wired?.deref();

    if (!$dialog) {
      return;
    }

    $dialog.removeEventListener('close', this._onClose);
    $dialog.removeEventListener('cancel', this._onCancel);
    $dialog.removeEventListener('click', this._onBackdropClick);

    this._$wired = null;
    this._$opener = null;
  }

  protected _onClose = () => {
    // Restore focus to the element that triggered the open, per APG focus management.
    if (this._$opener instanceof HTMLElement) {
      if (this._$opener.isConnected) {
        this._$opener.focus();
      } else {
        // Opener was removed from the DOM while the dialog was open; fall back
        // to body so focus is not left stranded.
        document.body.focus();
      }
    }

    this._$opener = null;

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
   * Intercepts the native `cancel` event.
   */
  protected _onCancel = (e: Event) => {
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
      this.dispatchEvent(new CustomEvent('rc-dialog-cancel', { bubbles: true, composed: true }));
    }
  };

  /**
   * Detects backdrop clicks.
   */
  protected _onBackdropClick = (e: MouseEvent) => {
    if (e.target === this._$dialog) {
      this.requestClose();
    }
  };

  /**
   * Opens or closes the inner `<dialog>` and returns `true` if state actually changed.
   *
   * @param open - Whether to open (`true`) or close (`false`).
   * @param silent - When `true`, suppresses the outgoing `rc-dialog-toggle` event.
   * @param modal - Whether to call `showModal()` (`true`) or `show()` (`false`).
   */
  protected _applyOpen(open: boolean, silent: boolean, modal = true): boolean {
    const $dialog = this._$dialog;

    if (!$dialog) {
      return false;
    }

    if (open) {
      if ($dialog.open) {
        return false;
      }

      // Capture focus owner before the dialog steals it, so we can restore on close.
      this._$opener = document.activeElement;
      modal ? $dialog.showModal() : $dialog.show();
      this.requestUpdate('open');

      return true;
    }

    if (!$dialog.open) {
      return false;
    }

    this._suppressNextCloseToggle = silent;
    $dialog.close();
    this.requestUpdate('open');

    return true;
  }

  /** Dispatches `rc-dialog-toggle` with the current open state and return value. */
  protected _dispatchToggle(open: boolean): void {
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
