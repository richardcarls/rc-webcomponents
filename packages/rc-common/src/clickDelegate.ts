import type { ReactiveController, ReactiveControllerHost } from 'lit';

/**
 * Descendants a click delegate treats as already self-sufficiently
 * interactive. A click that lands on, or inside, one of these is left
 * alone — the descendant already handles its own click (natively, or via
 * its own listener), so forwarding it too would double-handle it.
 */
const DEFAULT_INTERACTIVE_SELECTOR =
  'a[href], button, input, select, textarea, summary, [role="button"], [role="link"], ' +
  '[contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex="-1"])';

/**
 * True when `event`'s composed path already passes through an interactive
 * descendant of `host` before reaching `host` itself.
 *
 * Walking `composedPath()` (rather than `event.target`) is what makes this
 * shadow-DOM-safe: a click inside a slotted control composes back through
 * the light tree the same way regardless of which shadow boundaries it
 * crosses, so this works whether `host` renders the descendant directly or
 * receives it through a slot.
 */
function isEventFromInteractiveDescendant(
  event: Event,
  host: HTMLElement,
  selector: string,
): boolean {
  for (const entry of event.composedPath()) {
    if (entry === host) {
      return false;
    }

    if (entry instanceof Element && entry.matches(selector)) {
      return true;
    }
  }

  return false;
}

export interface ClickDelegateControllerOptions {
  /** Resolves the element to forward qualifying host clicks to. */
  target: () => HTMLElement | null | undefined;
  /** Skip delegation entirely, e.g. while the host is disabled. */
  disabled?: () => boolean;
  /** Selector for descendants that already handle their own clicks. */
  interactiveSelector?: string;
}

/**
 * Forwards a host's plain, primary-button clicks to a target via a genuine
 * `.click()` call, for the lifetime of the host's connection, unless the
 * click already landed on one of the host's own interactive descendants.
 *
 * This is the "stretched link" / "block link" pattern's click-anywhere-in-
 * the-container half, implemented at the JS layer rather than via a CSS
 * `::after` overlay on the target itself. Reach for the CSS technique first
 * where it's available — it keeps the container's enhancement layer
 * entirely CSS (no JS dependency at all) and, for an anchor target,
 * preserves modified clicks (the browser's own click lands on the real
 * anchor). It doesn't fit every shadow-DOM host, though: an overlay
 * anchored to a slotted element's own containing block can end up scoped to
 * whatever shadow-internal wrapper establishes that block (not the host you
 * meant to fill), and clipped by any `overflow` on an ancestor between the
 * two — both true of `rc-list-item`'s content region, which needs its own
 * `overflow: hidden` for label truncation. This controller is for exactly
 * that case: a host that can't offer a working CSS overlay for its slotted
 * content.
 *
 * Two things it deliberately can never do, both for the same underlying
 * reason: `.click()` and dispatched events are untrusted
 * (`Event.isTrusted === false`), and browsers restrict trusted-only
 * behavior to genuine, direct clicks.
 *   - Forward a modified click. Ctrl/Cmd/Shift/Alt or non-primary clicks may
 *     invoke alternate browser or application behavior that cannot survive a
 *     synthetic `.click()`. They are excluded rather than silently degraded
 *     into an unintended plain activation. A modifier-clicking user gets
 *     nothing from the host's dead space and full native behavior from
 *     clicking the target directly — the honest degradation, not a broken one.
 *   - Make `target` itself keyboard-reachable. `target` needs its own
 *     tab stop regardless (a native `<a>`/`<button>`) — this only extends
 *     *pointer* reach, the same as the CSS technique would.
 *
 * `target` and `disabled` are getters, not static values, so a host can
 * resolve its target dynamically (an `action-target` id-ref looked up by
 * attribute, a structural query for a designated child, one that only
 * matters once some other condition is met) without re-constructing the
 * controller.
 *
 * @example
 * ```ts
 * class ActionRow extends LitElement {
 *   constructor() {
 *     super();
 *     new ClickDelegateController(this, {
 *       target: () => this.querySelector<HTMLElement>(':scope > a[href]'),
 *     });
 *   }
 * }
 * ```
 */
export class ClickDelegateController implements ReactiveController {
  private readonly _host: ReactiveControllerHost & HTMLElement;
  private readonly _options: ClickDelegateControllerOptions;

  constructor(host: ReactiveControllerHost & HTMLElement, options: ClickDelegateControllerOptions) {
    this._host = host;
    this._options = options;
    host.addController(this);
  }

  hostConnected(): void {
    this._host.addEventListener('click', this._handleClick);
  }

  hostDisconnected(): void {
    this._host.removeEventListener('click', this._handleClick);
  }

  private readonly _handleClick = (event: Event): void => {
    const target = this._options.target();
    const click = event as MouseEvent;

    if (
      !target ||
      this._options.disabled?.() ||
      click.defaultPrevented ||
      click.button !== 0 ||
      click.altKey ||
      click.ctrlKey ||
      click.metaKey ||
      click.shiftKey ||
      isEventFromInteractiveDescendant(
        click,
        this._host,
        this._options.interactiveSelector ?? DEFAULT_INTERACTIVE_SELECTOR,
      )
    ) {
      return;
    }

    // The original click landed on plain dead space, so it had no default
    // action to begin with — this just marks it consumed for any other
    // listener further up the tree that checks `defaultPrevented`, and
    // guards against the unusual case of the host itself sitting inside an
    // ancestor form/label where a plain click would otherwise do something.
    click.preventDefault();
    target.click();
  };
}
