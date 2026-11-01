/** Options for {@link LiveAnnouncer}. */
export interface LiveAnnouncerOptions {
  /**
   * Where the region mounts, read before each announcement. It must be inside
   * any open modal `<dialog>` around the host, since everything outside one is
   * inert, and outside any widget whose role restricts its children, such as a
   * list. A `null` result, like an absent option, uses {@link announcerRootFor}.
   */
  root?: () => (ParentNode & Node) | null | undefined;
}

/**
 * The nearest open dialog or popover around `$host`, across shadow roots,
 * else the current body of the host's document.
 */
export function announcerRootFor($host: Element): ParentNode & Node {
  let $node: Element | null = $host;

  while ($node) {
    if (
      ($node.localName === 'dialog' && $node.hasAttribute('open')) ||
      ($node.hasAttribute('popover') && $node.matches(':popover-open'))
    ) {
      return $node;
    }

    const root = $node.getRootNode();

    $node = $node.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
  }

  return $host.ownerDocument.body;
}

/**
 * A polite, visually hidden live region for status messages that have no
 * visible text of their own, such as the steps of a drag reorder.
 *
 * The region is created on first use and its mount point is resolved again
 * before every announcement, so it follows the host into and out of open
 * dialogs. It also survives the page replacing `document.body`, as Turbo
 * navigation does around a permanent element, or a DOM morph removing the
 * region: the next announcement mounts it in the current root.
 */
export class LiveAnnouncer {
  private readonly _$host: Element;
  private readonly _options: LiveAnnouncerOptions;
  private _$region: HTMLElement | undefined;
  private _clearTimer: ReturnType<typeof setTimeout> | undefined;

  constructor($host: Element, options: LiveAnnouncerOptions = {}) {
    this._$host = $host;
    this._options = options;
  }

  /** The region element, for tests and for callers that need to inspect it. */
  get element(): HTMLElement {
    if (!this._$region) {
      const $region = this._$host.ownerDocument.createElement('div');

      $region.setAttribute('role', 'status');
      $region.setAttribute('aria-live', 'polite');
      $region.setAttribute('aria-atomic', 'true');
      $region.setAttribute('data-rc-live-announcer', '');

      Object.assign($region.style, {
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

      this._$region = $region;
    }

    return this._$region;
  }

  /**
   * Speaks `message`. The region is emptied first so a message identical to
   * the previous one is still announced.
   */
  announce(message: string): void {
    const $region = this.element;
    const root = this._options.root?.() ?? announcerRootFor(this._$host);

    if ($region.parentNode !== root) {
      root.appendChild($region);
    }

    clearTimeout(this._clearTimer);
    $region.textContent = '';

    // A separate task lets assistive technology observe the empty state first,
    // and a region that was just mounted register before its text changes.
    this._clearTimer = setTimeout(() => {
      $region.textContent = message;
    }, 50);
  }

  /** Removes the region. A later announcement mounts it again. */
  dispose(): void {
    clearTimeout(this._clearTimer);

    if (this._$region) {
      this._$region.textContent = '';
      this._$region.remove();
    }
  }
}
