/**
 * A polite, visually hidden live region for status messages that have no
 * visible text of their own, such as the steps of a drag reorder.
 *
 * Mount it where it is both reachable and valid: inside any open modal
 * `<dialog>` around the component, since everything outside one is inert, and
 * outside any widget whose role restricts its children, such as a list.
 */
export class LiveAnnouncer {
  private readonly _$region: HTMLElement;
  private _clearTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(root: ParentNode & Node) {
    const document = root.ownerDocument ?? (root as unknown as Document);

    this._$region = document.createElement('div');
    this._$region.setAttribute('role', 'status');
    this._$region.setAttribute('aria-live', 'polite');
    this._$region.setAttribute('aria-atomic', 'true');
    this._$region.setAttribute('data-rc-live-announcer', '');

    Object.assign(this._$region.style, {
      position: 'absolute',
      inlineSize: '1px',
      blockSize: '1px',
      margin: '-1px',
      padding: '0',
      overflow: 'hidden',
      clipPath: 'inset(50%)',
      whiteSpace: 'nowrap',
      border: '0',
    });

    root.appendChild(this._$region);
  }

  /** The region element, for tests and for callers that need to reposition it. */
  get element(): HTMLElement {
    return this._$region;
  }

  /**
   * Speaks `message`. The region is emptied first so a message identical to
   * the previous one is still announced.
   */
  announce(message: string): void {
    clearTimeout(this._clearTimer);
    this._$region.textContent = '';

    // A separate task lets assistive technology observe the empty state first.
    this._clearTimer = setTimeout(() => {
      this._$region.textContent = message;
    }, 50);
  }

  /** Removes the region. */
  dispose(): void {
    clearTimeout(this._clearTimer);
    this._$region.remove();
  }
}
