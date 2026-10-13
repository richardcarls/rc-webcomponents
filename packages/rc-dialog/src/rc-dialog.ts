import { LitElement, nothing, type PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';

import {
  DragController,
  getVisualViewportBounds,
  NativeChildController,
  ResizeController,
  type ResizeDirection,
  type ResizeLifecycleDetail,
  type ResizeOrigin,
  warnMissingDirectChild,
} from '@rcarls/rc-common';
import { ensureDialogBaseStyles } from './dialogBaseStyles.js';

export type RCDialogVariant = 'standard' | 'fullscreen' | 'side';

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
 * Draggable, resizable wrapper for a native <dialog>, following the WAI-ARIA Dialog Modal
 * pattern.
 *
 * The surface and its backdrop fade in and out through CSS alone (`@starting-style` plus
 * a discrete `display`/`overlay` transition), using the shared `--rc-motion-effects-*`
 * tokens. `showModal()`/`close()` stay synchronous and nothing waits on the transition
 * finishing; a zero-duration theme or a browser without support both degrade to an
 * instant, fully correct open and close. The surface only animates opacity, not scale,
 * because `movable`/resizable geometry reads `getBoundingClientRect()`, which reports the
 * transformed box for as long as a scale transition is still running.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-dialog rc-dialog docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ WAI-ARIA Dialog Modal pattern}
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
 * @attr open - Controlled open state. Reads the inner `<dialog>.open` value.
 * @attr default-open - Initial uncontrolled open state.
 * @attr movable - Allow the dialog to be moved by dragging.
 * @attr move-handle - CSS selector (within the inner `<dialog>`) for the drag handle element.
 * @attr move-bounds - Bounds constraint for movement: `viewport` or `parent`.
 * @attr move-step - Keyboard arrow-key step in px for moving.
 * @attr resize - Enable resizing, mirroring the CSS `resize` property values.
 * @attr resize-origin - Origin for resize edge hit-testing or explicit handles.
 * @attr resize-handle - CSS selector, scoped to the inner `<dialog>`, for one or more explicit
 *   resize handles.
 * @attr resize-threshold - Edge hit-test thickness in px for resize detection.
 * @attr resize-step - Keyboard arrow-key step in px for resizing.
 * @attr closed-by - Proxied to the inner `<dialog closedby="...">` attribute.
 * @attr light-dismiss - When present and the dialog is modal, a click on the backdrop area calls
 *   `requestClose()`.
 * @attr variant - Surface presentation: `standard` (default), visual-viewport-filling
 *   `fullscreen`, or `side`, a modal side sheet docked to the inline end.
 * @prop modal - Whether controlled open state uses `showModal()` instead of `show()`.
 *   JavaScript property only; no attribute is observed.
 *
 * @cssprop [--rc-dialog-inline-size=fit-content] - Standard surface preferred inline size. Set
 *   `100%` for a task dialog whose fluid content would otherwise shrink it to its minimum.
 * @cssprop [--rc-dialog-min-inline-size=auto] - Standard surface minimum inline size.
 * @cssprop [--rc-dialog-max-inline-size=none] - Standard surface maximum inline size.
 * @cssprop [--rc-dialog-max-block-size=calc(100dvb - 2rem)] - Standard surface block bound. The
 *   surface never scrolls itself, so a scrollable dialog should scroll a dedicated inner region.
 * @cssprop [--rc-dialog-padding=1em] - Standard surface padding.
 * @cssprop [--rc-dialog-border=0] - Surface border.
 * @cssprop [--rc-dialog-radius=0] - Surface corner radius.
 * @cssprop [--rc-dialog-background=Canvas] - Surface background.
 * @cssprop [--rc-dialog-color=CanvasText] - Surface foreground.
 * @cssprop [--rc-dialog-shadow=none] - Surface shadow.
 * @cssprop [--rc-dialog-scrim=color-mix(in srgb, CanvasText 32%, transparent)] - Modal backdrop color.
 * @cssprop [--rc-dialog-fullscreen-padding-block] - Fullscreen block padding. Defaults to a
 *   safe-area-aware inset, which is the one value the fullscreen variant genuinely needs of its own.
 * @cssprop [--rc-dialog-fullscreen-padding-inline] - Fullscreen inline padding, safe-area aware.
 * @cssprop [--rc-dialog-fullscreen-background] - Fullscreen background. Defers to
 *   `--rc-dialog-background` when unset.
 * @cssprop [--rc-dialog-side-inline-size=min(100%, 25rem)] - Side sheet inline size.
 * @cssprop [--rc-dialog-side-background] - Side sheet background. Defers to
 *   `--rc-dialog-background` when unset.
 * @cssprop [--rc-dialog-side-radius] - Side sheet start-corner radius. Defers to
 *   `--rc-dialog-radius` when unset.
 * @cssprop [--rc-dialog-side-shadow] - Side sheet shadow. Defers to `--rc-dialog-shadow` when
 *   unset.
 * @cssprop --rc-dialog-visual-viewport-left - Read-only fullscreen visual viewport left edge.
 * @cssprop --rc-dialog-visual-viewport-top - Read-only fullscreen visual viewport top edge.
 * @cssprop --rc-dialog-visual-viewport-width - Read-only fullscreen visual viewport width.
 * @cssprop --rc-dialog-visual-viewport-height - Read-only fullscreen visual viewport height.
 *
 * Fullscreen geometry, meaning position, size, margin, radius, and shadow, is structural rather
 * than themable: filling the visual viewport is what keeps the surface correct under browser zoom
 * and a software keyboard. Side sheet placement is structural too: the surface docks to the inline
 * end at full block size, with safe-area padding on its docked edges; only its inline size,
 * background, start-corner radius, and shadow are themable. Neither docked variant moves or
 * resizes, so `movable` and `resize` apply to the standard variant only.
 *
 * This element also writes `--rc-dialog-visual-viewport-left`, `-top`, `-width`, and `-height`
 * onto itself while a fullscreen dialog is open. Those are geometry outputs, not theme inputs:
 * read them if something inside the dialog needs the same measurements, but setting them does not
 * move the dialog, and the component overwrites them on the next viewport change. They are
 * candidates for private `--_rc-dialog-*` names in the next compatible API revision.
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
   *
   * Reactive: changing this or any other `move-*` option after setup
   * rebuilds the move behavior and re-queries `move-handle`.
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

  /**
   * Enable resizing, mirroring the CSS `resize` property values.
   *
   * Reactive: changing this or any other `resize-*` option after setup
   * rebuilds the resize behavior and re-queries `resize-handle` matches, so
   * `'none'` turns resizing off and restores the handles' focusability.
   */
  @property({ type: String, reflect: true })
  resize: 'none' | 'both' | 'horizontal' | 'vertical' = 'none';

  /**
   * Origin for resize edge hit-testing or explicit handles.
   *
   * Empty preserves the historical free edge-detection behavior.
   */
  @property({ type: String, attribute: 'resize-origin' })
  resizeOrigin: ResizeOrigin = '';

  /**
   * CSS selector, scoped to the inner `<dialog>`, for one or more explicit
   * resize handles.
   *
   * Handles may override host behavior with:
   * - `data-rc-dialog-resize-axis="x|y|both"`
   * - `data-rc-dialog-resize-origin="top|right|bottom|left|top-left|..."`
   */
  @property({ type: String, attribute: 'resize-handle' })
  resizeHandle = '';

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
   * Surface presentation. Fullscreen geometry follows the visual viewport while open; a side
   * sheet docks to the inline end at full block size.
   */
  @property({ type: String, reflect: true })
  variant: RCDialogVariant = 'standard';

  /**
   * Whether to open as modal with controlled open. Default: `true`.
   */
  @property({ attribute: false })
  modal = true;

  /** The inner `<dialog>` element, resolved from the direct light-DOM child. */
  protected get _$dialog(): HTMLDialogElement | null {
    return this._dialogController.child;
  }

  private _controlledOpen: boolean | undefined = undefined;
  private _defaultOpen = false;
  protected readonly _dialogController = new NativeChildController<HTMLDialogElement>(this, {
    selector: ':scope > dialog',
    observe: true,
    onChange: ($dialog) => this._setupDialog($dialog),
    onMissing: () => {
      if (import.meta.env.DEV) {
        warnMissingDirectChild(this, {
          selector: ':scope > dialog',
          message:
            '[rc-dialog] No direct child <dialog> found. Place a native <dialog> inside <rc-dialog>.',
        });
      }
    },
  });

  // Tracks which <dialog> has its listeners wired; used by _teardownDialog to
  // remove listeners even after the element is removed from the DOM.
  protected _$wired: WeakRef<HTMLDialogElement> | null = null;
  protected _suppressNextCloseToggle = false;

  private _trackingVisualViewport = false;

  private _dragController: DragController | null = null;
  // Move-relevant options the current controller was built from.
  private _dragConfig: readonly (string | number)[] = [];

  private _resizeControllers: ResizeController[] = [];
  // Resize-relevant options the current controllers were built from.
  private _resizeConfig: readonly (string | number)[] = [];

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

  override firstUpdated() {
    this._dialogController.sync();
  }

  /** Wires event listeners, drag/resize controllers, and initial open state for the inner `<dialog>`. */
  protected _setupDialog($dialog: HTMLDialogElement | null = this._$dialog) {
    if (!$dialog) {
      this._teardownDialog();

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

    this._syncDragController($dialog, true);
    this._syncResizeControllers($dialog, true);

    if (this._controlledOpen !== undefined) {
      this._applyOpen(this._controlledOpen, true, this.modal);
    } else if (this.defaultOpen) {
      this._applyOpen(true, true, this.modal);
    }

    this._syncVisualViewportTracking();
  }

  override updated(changed: PropertyValues) {
    const $dialog = this._$dialog;

    if (!$dialog) {
      return;
    }

    if (changed.has('variant')) {
      this._syncVisualViewportTracking();
    }

    if (this._$wired?.deref() === $dialog) {
      this._syncDragController($dialog);
      this._syncResizeControllers($dialog);
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

  override connectedCallback() {
    super.connectedCallback();
    ensureDialogBaseStyles(this.getRootNode() as Document | ShadowRoot);
  }

  override disconnectedCallback() {
    this._stopVisualViewportTracking();
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
    this._syncDragController(null, true);
    this._syncResizeControllers(null, true);

    this._$wired = null;
    this._$opener = null;
  }

  protected _onClose = () => {
    this._stopVisualViewportTracking();

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

  /** Hook for subclasses to respond when a resize gesture begins. */
  protected _onResizeStart(_detail: ResizeLifecycleDetail): void {}

  /** Hook for subclasses to respond to each resize update during an active gesture. */
  protected _onResize(_detail: ResizeLifecycleDetail): void {}

  /** Hook for subclasses to respond after a resize gesture has settled. */
  protected _onResizeEnd(_detail: ResizeLifecycleDetail): void {}

  /** Whether the variant docks the surface, which rules out moving and resizing it. */
  private get _isDocked(): boolean {
    return this.variant !== 'standard';
  }

  /**
   * Rebuilds the move controller when the move options differ from the ones
   * it was built from, or unconditionally when `force` is set (a newly wired
   * or torn-down `<dialog>`).
   */
  private _syncDragController($dialog: HTMLDialogElement | null, force = false): void {
    const enabled =
      !!$dialog && !this._isDocked && (this.movable || !!this.moveHandle);
    const config = enabled ? [this.moveHandle, this.moveBounds, this.moveStep] : [];

    if (!force && this._sameControllerConfig(config, this._dragConfig)) {
      return;
    }

    this._dragConfig = config;
    this._dragController?.dispose();
    this._dragController = null;

    if (!enabled) {
      return;
    }

    const $handle = this.moveHandle
      ? ($dialog.querySelector<Element>(this.moveHandle) ?? $dialog)
      : $dialog;

    this._dragController = new DragController(this, {
      target: $dialog,
      handle: $handle,
      bounds: this.moveBounds,
      step: this.moveStep,
    });
  }

  /**
   * Rebuilds the resize controllers when the resize options differ from the
   * ones they were built from, or unconditionally when `force` is set (a
   * newly wired or torn-down `<dialog>`).
   */
  private _syncResizeControllers($dialog: HTMLDialogElement | null, force = false): void {
    const config = $dialog
      ? [
          this._isDocked ? 'none' : this.resize,
          this.resizeOrigin,
          this.resizeHandle,
          this.resizeThreshold,
          this.resizeStep,
          this.moveBounds,
        ]
      : [];

    if (!force && this._sameControllerConfig(config, this._resizeConfig)) {
      return;
    }

    this._resizeConfig = config;

    for (const controller of this._resizeControllers) {
      controller.dispose();
    }

    this._resizeControllers = [];

    if (!$dialog || this._isDocked || this.resize === 'none') {
      return;
    }

    const lifecycle = {
      onResizeStart: (detail: ResizeLifecycleDetail) => this._onResizeStart(detail),
      onResize: (detail: ResizeLifecycleDetail) => this._onResize(detail),
      onResizeEnd: (detail: ResizeLifecycleDetail) => this._onResizeEnd(detail),
    };
    const $handles = this._resizeHandles($dialog);
    // TODO: add a separate resize-bounds attribute; moveBounds is a proxy for now.
    const shared = {
      target: $dialog,
      threshold: this.resizeThreshold,
      step: this.resizeStep,
      bounds: this.moveBounds,
      ...lifecycle,
    };

    if ($handles.length === 0) {
      this._resizeControllers.push(
        new ResizeController(this, {
          ...shared,
          direction: this.resize,
          origin: this.resizeOrigin,
        }),
      );

      return;
    }

    for (const $handle of $handles) {
      this._resizeControllers.push(
        new ResizeController(this, {
          ...shared,
          direction: this._resizeDirectionForHandle($handle),
          handle: $handle,
          origin: this._resizeOriginForHandle($handle),
        }),
      );
    }
  }

  private _sameControllerConfig(
    current: readonly (string | number)[],
    previous: readonly (string | number)[],
  ): boolean {
    return (
      current.length === previous.length &&
      current.every((value, index) => value === previous[index])
    );
  }

  protected _resizeHandles($dialog: HTMLDialogElement): Element[] {
    if (!this.resizeHandle) {
      return [];
    }

    try {
      return [...$dialog.querySelectorAll(this.resizeHandle)];
    } catch {
      if (import.meta.env.DEV) {
        console.warn('[rc-dialog] Invalid resize-handle selector.', this.resizeHandle);
      }

      return [];
    }
  }

  protected _resizeDirectionForHandle($handle: Element): ResizeDirection {
    const axis = $handle.getAttribute('data-rc-dialog-resize-axis');

    switch (axis) {
      case 'x':
        return 'horizontal';
      case 'y':
        return 'vertical';
      case 'both':
        return 'both';
      default:
        return this.resize;
    }
  }

  protected _resizeOriginForHandle($handle: Element): ResizeOrigin {
    return (
      ($handle.getAttribute('data-rc-dialog-resize-origin') as ResizeOrigin | null) ??
      this.resizeOrigin
    );
  }

  /**
   * Opens or closes the inner `<dialog>` and returns `true` if state actually changed.
   *
   * @param open - whether to open (`true`) or close (`false`)
   * @param silent - when `true`, suppresses the outgoing `rc-dialog-toggle` event
   * @param modal - whether to call `showModal()` (`true`) or `show()` (`false`)
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
      this._syncVisualViewportTracking();
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

  private _handleVisualViewportChange = (): void => {
    const $window = this.ownerDocument.defaultView;

    if (!$window) {
      return;
    }

    const bounds = getVisualViewportBounds($window);
    // The bounds are viewport pixels, but lengths set here are zoomed again
    // when an ancestor such as the root has a CSS zoom (an app-wide interface
    // size), so convert them to the dialog's own pixels.
    const zoom = (this as Element & { currentCSSZoom?: number }).currentCSSZoom || 1;
    const px = (value: number) => `${value / zoom}px`;

    this.style.setProperty('--rc-dialog-visual-viewport-left', px(bounds.left));
    this.style.setProperty('--rc-dialog-visual-viewport-top', px(bounds.top));
    this.style.setProperty('--rc-dialog-visual-viewport-width', px(bounds.width));
    this.style.setProperty('--rc-dialog-visual-viewport-height', px(bounds.height));
  };

  private _syncVisualViewportTracking(): void {
    if (this.variant === 'fullscreen' && this.open) {
      this._startVisualViewportTracking();
    } else {
      this._stopVisualViewportTracking();
    }
  }

  private _startVisualViewportTracking(): void {
    const $window = this.ownerDocument.defaultView;

    if (!$window) {
      return;
    }

    this._handleVisualViewportChange();

    if (this._trackingVisualViewport) {
      return;
    }

    this._trackingVisualViewport = true;
    $window.addEventListener('resize', this._handleVisualViewportChange);
    $window.visualViewport?.addEventListener('resize', this._handleVisualViewportChange);
    $window.visualViewport?.addEventListener('scroll', this._handleVisualViewportChange);
  }

  private _stopVisualViewportTracking(): void {
    const $window = this.ownerDocument.defaultView;

    if ($window && this._trackingVisualViewport) {
      $window.removeEventListener('resize', this._handleVisualViewportChange);
      $window.visualViewport?.removeEventListener('resize', this._handleVisualViewportChange);
      $window.visualViewport?.removeEventListener('scroll', this._handleVisualViewportChange);
    }

    this._trackingVisualViewport = false;
    this.style.removeProperty('--rc-dialog-visual-viewport-left');
    this.style.removeProperty('--rc-dialog-visual-viewport-top');
    this.style.removeProperty('--rc-dialog-visual-viewport-width');
    this.style.removeProperty('--rc-dialog-visual-viewport-height');
  }
}

export default RCDialog;
