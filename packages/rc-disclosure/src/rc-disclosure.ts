import { ensureDisclosureBaseStyles } from './disclosureBaseStyles.js';

export interface RCDisclosureToggleEvent {
  /** Whether the disclosure is now open. */
  open: boolean;
}

const TOGGLE_EVENT = 'rc-disclosure-toggle';
const DETAILS_SELECTOR = ':scope > details';
const SUMMARY_SELECTOR = ':scope > summary';

declare global {
  interface HTMLElementTagNameMap {
    'rc-disclosure': RCDisclosure;
  }
}

/**
 * Disclosure wrapper for a native <details>/<summary> pair with controlled and uncontrolled
 * open state,
 * following the WAI-ARIA Disclosure pattern.
 *
 * The browser keeps ownership of open/close behavior, keyboard support, and
 * accessibility. This element mirrors state, emits a consistent custom event,
 * and automatically opens when the URL hash matches any id within its subtree.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-disclosure rc-disclosure docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/ WAI-ARIA Disclosure pattern}
 *
 * @fires rc-disclosure-toggle - Fires when the child `<details>` toggles.
 *
 * @attr open - Controlled open state mirrored to the child `<details>`.
 * @attr default-open - Initial open state for uncontrolled usage.
 *
 * @cssprop [--rc-disclosure-border=0] - Panel border.
 * @cssprop [--rc-disclosure-radius=0] - Panel corner radius.
 * @cssprop [--rc-disclosure-background=transparent] - Panel background while closed.
 * @cssprop [--rc-disclosure-color=inherit] - Panel foreground.
 * @cssprop [--rc-disclosure-open-background] - Panel background while open. Defers to
 *   `--rc-disclosure-background` when unset.
 * @cssprop [--rc-disclosure-open-shadow=none] - Panel shadow while open.
 * @cssprop [--rc-disclosure-summary-min-block-size=0] - Summary minimum block size. Set this to
 *   at least `3rem` for a comfortable touch target.
 * @cssprop [--rc-disclosure-summary-padding-block=0] - Summary block padding.
 * @cssprop [--rc-disclosure-summary-padding-inline=0] - Summary inline padding.
 * @cssprop [--rc-disclosure-summary-gap=0] - Summary gap, for a theme that lays the summary out
 *   as a grid or flex container.
 * @cssprop [--rc-disclosure-summary-color=inherit] - Summary foreground.
 * @cssprop [--rc-disclosure-summary-font=inherit] - Summary font shorthand.
 * @cssprop [--rc-disclosure-summary-marker-color=currentColor] - Native disclosure marker color.
 *   A theme that replaces the marker with its own affordance should hide `::marker` itself.
 * @cssprop [--rc-disclosure-summary-hover-background=transparent] - Summary hover background.
 * @cssprop [--rc-disclosure-focus-ring=var(--rc-focus-ring, 2px solid Highlight)] - Summary
 *   focus-visible outline.
 * @cssprop [--rc-disclosure-focus-ring-offset=0] - Summary focus-visible outline offset.
 * @cssprop [--rc-disclosure-content-padding-block=0] - Content block padding.
 * @cssprop [--rc-disclosure-content-padding-inline=0] - Content inline padding.
 * @cssprop [--rc-disclosure-content-color=inherit] - Content foreground.
 * @cssprop [--rc-disclosure-content-font=inherit] - Content font shorthand.
 * @cssprop [--rc-disclosure-duration=0ms] - Open and close transition duration. Zero by default,
 *   so the panel snaps the way the platform does until a theme opts into motion. The animation
 *   runs on `::details-content` where that is supported and is skipped entirely where it is not.
 * @cssprop [--rc-disclosure-easing=ease] - Open and close transition easing.
 */
export class RCDisclosure extends HTMLElement {
  private _observer = new MutationObserver(() => this._setupDetails());

  private _$details: HTMLDetailsElement | null = null;

  private _scrollFrame = 0;
  private _controlledOpen: boolean | undefined;
  private _defaultOpen = false;
  private _defaultOpenInitialized = false;
  private _uncontrolledOpen: boolean | undefined;
  private _openInitialized = false;
  private _reflectingOpen = false;
  private _suppressNextToggle = false;

  static get observedAttributes(): string[] {
    return ['open', 'default-open'];
  }

  /** Current open state. Host writes are silent; assign `undefined` to release control. */
  get open(): boolean {
    return this._controlledOpen ?? this._uncontrolledOpen ?? this._defaultOpen;
  }

  set open(value: boolean | undefined) {
    this._controlledOpen = value;
    this._openInitialized = true;
    this._applyOpen(this.open);
    this._reflectOpen(this.open);
  }

  /** Initial open state for uncontrolled usage. */
  get defaultOpen(): boolean {
    return this._defaultOpen;
  }

  set defaultOpen(value: boolean) {
    this._defaultOpen = value;
    this._defaultOpenInitialized = true;

    if (
      !this._openInitialized &&
      this._controlledOpen === undefined &&
      this._uncontrolledOpen === undefined
    ) {
      this._applyOpen(value);
      this._reflectOpen(value);
    }
  }

  connectedCallback(): void {
    ensureDisclosureBaseStyles(this.getRootNode() as Document | ShadowRoot);
    this._observer.observe(this, { childList: true });
    window.addEventListener('hashchange', this._onHashChange);
    this._setupDetails();
  }

  disconnectedCallback(): void {
    this._observer.disconnect();
    window.removeEventListener('hashchange', this._onHashChange);
    cancelAnimationFrame(this._scrollFrame);
    this._teardownDetails();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) {
      return;
    }

    if (name === 'default-open') {
      this.defaultOpen = newValue !== null;

      return;
    }

    if (this._reflectingOpen) {
      return;
    }

    this.open = newValue === null ? false : true;
  }

  private _setupDetails(): void {
    const $details = this.querySelector<HTMLDetailsElement>(DETAILS_SELECTOR);

    if ($details === this._$details) {
      return;
    }

    this._teardownDetails();
    this._$details = $details;

    if (!$details) {
      if (import.meta.env.DEV) {
        console.warn(
          '[rc-disclosure] No direct child <details> found. Place native ' +
            '<details><summary>...</summary>...</details> inside <rc-disclosure>.',
          this,
        );
      }

      return;
    }

    if (!$details.id) {
      $details.id = crypto.randomUUID();
    }

    const $summary = $details.querySelector<HTMLElement>(SUMMARY_SELECTOR);

    $summary?.setAttribute('aria-controls', $details.id);

    $details.addEventListener('toggle', this._onToggle);

    if (this._controlledOpen === undefined && this._uncontrolledOpen === undefined) {
      this._uncontrolledOpen = this._defaultOpenInitialized ? this._defaultOpen : $details.open;
    }

    this._applyOpen(this.open, true);
    this._reflectOpen(this.open);
    this._openForCurrentHash();
  }

  private _teardownDetails(): void {
    const $summary = this._$details?.querySelector<HTMLElement>(SUMMARY_SELECTOR);

    $summary?.removeAttribute('aria-controls');

    this._$details?.removeEventListener('toggle', this._onToggle);
    this._$details = null;
  }

  private _applyOpen(open: boolean, suppressToggle = true): void {
    const $details = this._$details;

    if (!$details) {
      return;
    }

    if ($details.open !== open) {
      this._suppressNextToggle = suppressToggle;
      $details.open = open;
    }
  }

  private _reflectOpen(value: boolean): void {
    if (this.hasAttribute('open') === value) {
      return;
    }

    this._reflectingOpen = true;
    this.toggleAttribute('open', value);
    this._reflectingOpen = false;
  }

  private _onToggle = (): void => {
    if (this._suppressNextToggle) {
      this._suppressNextToggle = false;

      return;
    }

    const requestedOpen = this._$details?.open ?? false;

    if (this._controlledOpen === undefined) {
      this._uncontrolledOpen = requestedOpen;
      this._reflectOpen(requestedOpen);
    } else {
      this._applyOpen(this._controlledOpen, true);
      this._reflectOpen(this._controlledOpen);
    }

    this.dispatchEvent(
      new CustomEvent<RCDisclosureToggleEvent>(TOGGLE_EVENT, {
        bubbles: true,
        composed: true,
        detail: { open: requestedOpen },
      }),
    );
  };

  private _onHashChange = (): void => {
    this._openForCurrentHash();
  };

  private _openForCurrentHash(): void {
    if (!location.hash) {
      return;
    }

    const targetId = decodeURIComponent(location.hash.slice(1));

    if (!targetId) {
      return;
    }

    const $target = this.querySelector(`#${CSS.escape(targetId)}`);

    if (!$target) {
      return;
    }

    const wasOpen = this.open;

    if (this._controlledOpen === undefined) {
      this._uncontrolledOpen = true;
      this._applyOpen(true);
      this._reflectOpen(true);
    } else {
      this.dispatchEvent(
        new CustomEvent<RCDisclosureToggleEvent>(TOGGLE_EVENT, {
          bubbles: true,
          composed: true,
          detail: { open: true },
        }),
      );
    }

    if (!this.open) {
      return;
    }

    if (wasOpen) {
      return;
    }

    cancelAnimationFrame(this._scrollFrame);

    this._scrollFrame = requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView();
    });
  }
}

export default RCDisclosure;
