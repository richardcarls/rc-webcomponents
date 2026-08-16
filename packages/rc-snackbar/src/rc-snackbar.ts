import { LitElement, html } from 'lit';
import type { PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';

import snackbarStyles from './rc-snackbar.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-snackbar': RCSnackbar;
  }

  interface HTMLElementEventMap {
    'rc-snackbar-action': CustomEvent<RCSnackbarActionDetail>;
    'rc-snackbar-close': CustomEvent<RCSnackbarCloseDetail>;
  }
}

/** Snackbar queue behavior when `show()` is called while open. */
export type RCSnackbarQueuePolicy = 'queue' | 'replace';

/** Close reasons surfaced by `rc-snackbar-close`. */
export type RCSnackbarCloseReason = 'action' | 'api' | 'timeout' | 'replace' | 'clear';

/** Options accepted by `show()`. */
export interface RCSnackbarShowOptions {
  /** Message text to announce. */
  message: string;
  /** Optional action button label. */
  actionLabel?: string;
  /** Auto-close duration in milliseconds. */
  duration?: number;
}

/** Detail payload for `rc-snackbar-action`. */
export interface RCSnackbarActionDetail {
  /** Message that was visible when the action was activated. */
  message: string;
}

/** Detail payload for `rc-snackbar-close`. */
export interface RCSnackbarCloseDetail {
  /** Close reason. */
  reason: RCSnackbarCloseReason;
  /** Message that closed. */
  message: string;
}

/**
 * Snackbar live-region host for brief status messages and optional actions.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-snackbar rc-snackbar docs}
 *
 * @fires rc-snackbar-action - Fired when the action button is activated.
 * @fires rc-snackbar-close - Fired after a visible snackbar closes.
 *
 * @csspart surface - Snackbar surface.
 * @csspart message - Message text.
 * @csspart action - Optional action button.
 *
 * @attr open - Whether a snackbar is currently visible.
 * @attr message - Visible snackbar message.
 * @attr action-label - Optional action button label.
 * @attr duration - Auto-close duration in milliseconds.
 * @attr queue-policy - `queue` appends while open; `replace` closes the current message.
 *
 * @cssprop [--rc-snackbar-inset-inline=1rem] - Inline-axis inset from the viewport edge.
 * @cssprop [--rc-snackbar-inset-block-end=1rem] - Block-end inset from the viewport edge, before
 *   the safe-area inset.
 * @cssprop [--rc-snackbar-z-index=1000] - Stacking order.
 * @cssprop [--rc-snackbar-gap=0.5rem] - Gap between the message and action.
 * @cssprop [--rc-snackbar-min-block-size=3rem] - Minimum surface block size.
 * @cssprop [--rc-snackbar-max-inline-size=30rem] - Maximum surface inline size.
 * @cssprop [--rc-snackbar-padding-block=0.5rem] - Surface block-axis padding.
 * @cssprop [--rc-snackbar-padding-inline=1rem] - Surface inline-axis padding.
 * @cssprop [--rc-snackbar-border=1px solid CanvasText] - Surface border.
 * @cssprop [--rc-snackbar-radius=0] - Surface border radius.
 * @cssprop [--rc-snackbar-bg=Canvas] - Surface background.
 * @cssprop [--rc-snackbar-color=CanvasText] - Surface text color.
 * @cssprop [--rc-snackbar-shadow=none] - Surface box shadow.
 * @cssprop [--rc-snackbar-action-border] - Action button border; defers to native button
 *   border when unset.
 * @cssprop [--rc-snackbar-action-radius] - Action button border radius; defers to native button
 *   radius when unset.
 * @cssprop [--rc-snackbar-action-padding-block] - Action button block-axis padding; defers to
 *   native button padding when unset.
 * @cssprop [--rc-snackbar-action-padding-inline] - Action button inline-axis padding; defers to
 *   native button padding when unset.
 * @cssprop [--rc-snackbar-action-bg] - Action button background; defers to native button
 *   background when unset.
 * @cssprop [--rc-snackbar-action-color] - Action button text color; defers to native button
 *   color when unset.
 * @cssprop [--rc-snackbar-action-font] - Action button font shorthand; defers to native button
 *   font when unset.
 * @cssprop [--rc-snackbar-focus-ring] - Action button focus outline; defers to native focus
 *   styling when unset.
 * @cssprop [--rc-snackbar-focus-ring-offset] - Action button focus outline offset; defers to
 *   native focus styling when unset.
 */
export class RCSnackbar extends LitElement {
  static override styles = snackbarStyles;

  private _queue: RCSnackbarShowOptions[] = [];
  private _timer: number | undefined;
  private _lastMessage = '';

  /** Whether the snackbar is currently visible. */
  @property({ type: Boolean, reflect: true })
  open = false;

  /** Visible message text. */
  @property({ type: String, reflect: true })
  message = '';

  /** Optional action button label. */
  @property({ type: String, attribute: 'action-label', reflect: true })
  actionLabel = '';

  /** Auto-close duration in milliseconds. Set to 0 to keep open. */
  @property({ type: Number })
  duration = 4000;

  /** Queue behavior for show calls while open. */
  @property({ type: String, attribute: 'queue-policy' })
  queuePolicy: RCSnackbarQueuePolicy = 'queue';

  override disconnectedCallback(): void {
    this._clearTimer();
    super.disconnectedCallback();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('open') && !this.open) {
      this._clearTimer();
    }
  }

  protected override render() {
    return html`
      <div part="surface" role="status" aria-live="polite" aria-atomic="true">
        <span part="message">${this.message}</span>
        <button part="action" type="button" @click=${this._handleAction}>
          ${this.actionLabel}
        </button>
      </div>
    `;
  }

  /**
   * Shows a message or queues it according to `queuePolicy`.
   *
   * @example
   * snackbar.show({
   *   message: 'Recipe saved',
   *   actionLabel: 'Undo',
   *   duration: 6000,
   * });
   */
  show(message: string | RCSnackbarShowOptions): void {
    const next = typeof message === 'string' ? { message } : message;

    if (this.open) {
      if (this.queuePolicy === 'replace') {
        this._closeCurrent('replace', false);
        this._showNow(next);
      } else {
        this._queue.push(next);
      }

      return;
    }

    this._showNow(next);
  }

  /** Closes the current snackbar. */
  close(reason: RCSnackbarCloseReason = 'api'): void {
    this._closeCurrent(reason, true);
  }

  /** Clears the current snackbar and all queued messages. */
  clear(): void {
    this._queue = [];
    this._closeCurrent('clear', false);
  }

  private _showNow(next: RCSnackbarShowOptions): void {
    const duration = next.duration ?? this.duration;

    this._clearTimer();
    this.message = next.message;
    this.actionLabel = next.actionLabel ?? '';
    this._lastMessage = next.message;
    this.open = true;

    if (duration > 0) {
      this._timer = window.setTimeout(() => this._closeCurrent('timeout', true), duration);
    }
  }

  private _closeCurrent(reason: RCSnackbarCloseReason, showNext: boolean): void {
    if (!this.open) {
      return;
    }

    const message = this.message;

    this._clearTimer();
    this.open = false;
    this.message = '';
    this.actionLabel = '';

    this.dispatchEvent(
      new CustomEvent<RCSnackbarCloseDetail>('rc-snackbar-close', {
        bubbles: true,
        composed: true,
        detail: { reason, message },
      }),
    );

    if (showNext) {
      const next = this._queue.shift();

      if (next) {
        queueMicrotask(() => this._showNow(next));
      }
    }
  }

  private _handleAction(): void {
    if (!this.open) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent<RCSnackbarActionDetail>('rc-snackbar-action', {
        bubbles: true,
        composed: true,
        detail: { message: this._lastMessage },
      }),
    );

    this._closeCurrent('action', true);
  }

  private _clearTimer(): void {
    window.clearTimeout(this._timer);
    this._timer = undefined;
  }
}

export default RCSnackbar;
