/** Width and height of a viewport in CSS pixels. */
export interface ViewportSize {
  /** Inline size in CSS pixels. */
  width: number;

  /** Block size in CSS pixels. */
  height: number;
}

/**
 * The block size a viewport reports while the software keyboard is up.
 * `keyboard` follows the keyboard, so the result is the space left above it;
 * `full` keeps the keyboard-free height, as window size classes should.
 */
export type SoftKeyboardHeight = 'keyboard' | 'full';

/** Options for {@link SoftKeyboardViewport}. */
export interface SoftKeyboardViewportOptions {
  /**
   * The block size to report while the keyboard is up. Defaults to `keyboard`.
   */
  heightWhileOpen?: SoftKeyboardHeight;

  /**
   * How long, in milliseconds, a closing keyboard may take to give the viewport
   * its full height back before a shorter measurement is accepted after all.
   * Defaults to 1000.
   */
  closeTimeout?: number;

  /**
   * Called when the close timeout expires, so the consumer can measure again
   * and apply the viewport as it has settled.
   */
  onCloseTimeout?: () => void;
}

/** Input types that take typed text, so focusing them raises a software keyboard. */
const TEXT_ENTRY_INPUT_TYPES = [
  '',
  'date',
  'datetime-local',
  'email',
  'month',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'time',
  'url',
  'week',
];

const DEFAULT_CLOSE_TIMEOUT = 1000;

/**
 * Returns the focused element, following focus into open shadow roots, where
 * custom elements keep their native fields.
 */
export function deepActiveElement(document: Document): Element | null {
  let $active = document.activeElement;

  while ($active?.shadowRoot?.activeElement) {
    $active = $active.shadowRoot.activeElement;
  }

  return $active;
}

/**
 * Whether focusing the element raises a software keyboard: an editable
 * textarea, a text-like input, or editable content.
 */
export function isTextEntryElement($element: Element | null): boolean {
  if ($element instanceof HTMLTextAreaElement) {
    return !$element.readOnly && !$element.disabled;
  }

  if ($element instanceof HTMLInputElement) {
    return (
      !$element.readOnly &&
      !$element.disabled &&
      TEXT_ENTRY_INPUT_TYPES.includes($element.type)
    );
  }

  return $element instanceof HTMLElement && $element.isContentEditable;
}

/** Whether the document's focused element, inside shadow roots too, takes typed text. */
export function isTextEntryFocused(document: Document): boolean {
  return isTextEntryElement(deepActiveElement(document));
}

/**
 * Filters viewport measurements across a software keyboard opening and
 * closing, so a surface sized to the viewport follows the keyboard without
 * the transitional sizes some browsers report.
 *
 * A viewport that shrinks at the same width while a text field has focus is
 * the keyboard opening. Once the field loses focus the keyboard is closing,
 * and the viewport should only grow back. Firefox for Android reports a size
 * shorter than the keyboard-open one for a few frames first; while closing,
 * shrinks like that are ignored until the full height returns, a text field
 * takes focus again, the width changes, or `closeTimeout` passes.
 *
 * Feed it every measurement with {@link SoftKeyboardViewport.next} and apply
 * the size it returns. Call {@link SoftKeyboardViewport.reset} when tracking
 * stops.
 */
export class SoftKeyboardViewport {
  private readonly _heightWhileOpen: SoftKeyboardHeight;
  private readonly _closeTimeout: number;
  private readonly _onCloseTimeout?: () => void;

  // Last size reported with no keyboard up.
  private _full: ViewportSize | null = null;

  // Last size returned from next().
  private _applied: ViewportSize | null = null;

  private _keyboardOpen = false;
  private _closeTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: SoftKeyboardViewportOptions = {}) {
    this._heightWhileOpen = options.heightWhileOpen ?? 'keyboard';
    this._closeTimeout = options.closeTimeout ?? DEFAULT_CLOSE_TIMEOUT;
    this._onCloseTimeout = options.onCloseTimeout;
  }

  /** Whether the keyboard is up or still closing, as far as the measurements show. */
  get keyboardOpen(): boolean {
    return this._keyboardOpen;
  }

  /**
   * Returns the size to apply for a fresh measurement.
   *
   * @param measured - The viewport as measured now.
   * @param textEntryFocused - Whether a field that raises the keyboard has focus.
   */
  next(measured: ViewportSize, textEntryFocused: boolean): ViewportSize {
    const full = this._full;

    // A first measurement, or a rotation, starts over from what is measured.
    if (!full || !this._applied || measured.width !== this._applied.width) {
      return this._settle(measured);
    }

    if (measured.height >= full.height) {
      return this._settle(measured);
    }

    if (textEntryFocused) {
      this._clearCloseTimer();
      this._keyboardOpen = true;

      return this._apply(
        this._heightWhileOpen === 'full' ? { ...measured, height: full.height } : measured,
      );
    }

    if (!this._keyboardOpen) {
      return this._settle(measured);
    }

    this._startCloseTimer();

    // Closing: take growth toward the full height, never a shrink.
    if (this._heightWhileOpen === 'full' || measured.height < this._applied.height) {
      return this._apply({ ...measured, height: this._applied.height });
    }

    return this._apply(measured);
  }

  /** Forgets the measurements so far and cancels a pending close timeout. */
  reset(): void {
    this._clearCloseTimer();
    this._full = null;
    this._applied = null;
    this._keyboardOpen = false;
  }

  // Takes the measurement as the keyboard-free size.
  private _settle(measured: ViewportSize): ViewportSize {
    this._clearCloseTimer();
    this._keyboardOpen = false;
    this._full = measured;

    return this._apply(measured);
  }

  private _apply(size: ViewportSize): ViewportSize {
    this._applied = size;

    return size;
  }

  private _startCloseTimer(): void {
    if (this._closeTimer !== null) {
      return;
    }

    this._closeTimer = setTimeout(() => {
      this._closeTimer = null;
      this._keyboardOpen = false;

      // The viewport settled short of the full height, so that is the new full height.
      this._full = null;
      this._onCloseTimeout?.();
    }, this._closeTimeout);
  }

  private _clearCloseTimer(): void {
    if (this._closeTimer === null) {
      return;
    }

    clearTimeout(this._closeTimer);
    this._closeTimer = null;
  }
}
