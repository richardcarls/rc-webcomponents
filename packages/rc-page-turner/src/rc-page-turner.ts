import { LitElement, html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';

import {
  MessagesController,
  RafScheduler,
  arrowKeys,
  numberFormat,
  parseCssTime,
  renderedOrientation,
  resolveFlow,
  syncDefaultAttribute,
  warnMissingDirectChild,
  type Flow,
} from '@rcarls/rc-common';
import type { RCPageTurnerPage } from './rc-page-turner-page.js';

import pageTurnerStyles from './rc-page-turner.styles.js';

/** Built-in text of `rc-page-turner` and its pages. Positions are 1-based. */
export interface RCPageTurnerMessages {
  /** `aria-roledescription` of the page turner. */
  pageTurner: string;
  /** `aria-roledescription` of each page. */
  page: string;
  /** Default accessible name of each page. */
  position: (position: number, count: number, locale?: string) => string;
  previous: string;
  next: string;
}

export const DEFAULT_PAGE_TURNER_MESSAGES: Readonly<RCPageTurnerMessages> = Object.freeze({
  pageTurner: 'pages',
  page: 'page',
  position: (position: number, count: number, locale?: string) => {
    const format = numberFormat(locale, { useGrouping: false });

    return `${format.format(position)} of ${format.format(count)}`;
  },
  previous: 'Previous page',
  next: 'Next page',
});

declare module '@rcarls/rc-common' {
  interface RcMessageCatalog {
    'rc-page-turner': RCPageTurnerMessages;
  }
}

export type RCPageTurnerChangeTrigger = 'api' | 'button' | 'keyboard';

export interface RCPageTurnerChangeDetail {
  index: number;
  trigger: RCPageTurnerChangeTrigger;
}

declare global {
  interface HTMLElementEventMap {
    'rc-page-turner-change': CustomEvent<RCPageTurnerChangeDetail>;
  }
  interface HTMLElementTagNameMap {
    'rc-page-turner': RCPageTurner;
  }
}

const DEFAULT_TURN_DURATION_MS = 320;
const DEFAULT_TURN_EASING = 'cubic-bezier(0.2, 0, 0, 1)';
/** Reduced motion and forced colors swap the turn for a fade no longer than this. */
const MAX_FADE_DURATION_MS = 150;

type TurnMotion = 'turn' | 'fade' | 'none';

interface Turn {
  animation: Animation;
  moving: RCPageTurnerPage;
  outgoing: RCPageTurnerPage;
  incoming: RCPageTurnerPage;
}

/**
 * Shows one page of a stack at a time and turns between them like the pages
 * of a book, following the WAI-ARIA APG carousel pattern without automatic
 * rotation. One `rc-page-turner-page` per page; authored content stays light
 * DOM and stays connected on every page, so a turn never rebuilds content.
 *
 * Pages share one grid cell. A page that isn't shown skips its rendering
 * through `content-visibility: hidden`, except the pages either side of the
 * current one, which stay laid out (but unpainted) a frame after each turn
 * so the next turn only has to paint. A turn animates only `transform` (or
 * `opacity`) of the one page that moves, through the Web Animations API:
 * turning forward, the current page swings away around the spine (the
 * inline-start edge, so the right edge in RTL and the top in vertical text)
 * and uncovers the next; turning back, the previous page swings in over the
 * current one. Under `prefers-reduced-motion: reduce` or forced colors the
 * turn becomes a short fade; an `instant` change and engines without
 * `Element.animate()` swap pages without motion.
 *
 * Accessibility state changes when the turn starts, not when it ends: the
 * departing page becomes `inert` and `aria-hidden` at once, and if focus was
 * inside it, focus moves to the arriving page. Focus elsewhere, such as on
 * the previous/next buttons, stays where it is. The pages sit in a polite
 * live region, so a turn announces the arriving page.
 *
 * `activeIndex` is a controlled/uncontrolled property, like `rc-carousel`'s:
 * leave it unset for uncontrolled usage (`default-active-index` seeds the
 * first page), or set it to drive the turner. Buttons, keys, and the
 * imperative API report through `rc-page-turner-change`; in controlled usage
 * the turner doesn't move until the host writes the new index.
 *
 * Keyboard: with the page viewport focused, the arrow keys along the inline
 * axis turn to the previous and next page, and Home/End go to the first and
 * last. Keys pressed inside page content are left to that content.
 *
 * @slot - One or more `rc-page-turner-page` elements.
 * @slot previous-icon - Optional icon for the previous button, replacing the
 *   default chevron. Only rendered when `navigation` is set.
 * @slot next-icon - Optional icon for the next button, replacing the default
 *   chevron. Only rendered when `navigation` is set.
 *
 * @fires rc-page-turner-change - Fires when a button, a key, or the
 *   imperative API asks for another page. Host writes to `activeIndex` are
 *   silent. `detail: { index, trigger: 'button'|'keyboard'|'api' }`
 *
 * @attr active-index - Controls the current page. Host writes are silent;
 *   listen for `rc-page-turner-change` to stay in sync.
 * @attr default-active-index - Initial page for uncontrolled usage.
 * @attr navigation - Shows previous/next buttons.
 *
 * Built-in text (button names, role descriptions, page positions) follows the
 * element's own `lang`, else `<html lang>`: per element through `messages`,
 * or for every page turner through `registerMessages()` from
 * `@rcarls/rc-common` under `rc-page-turner`.
 *
 * @cssprop [--rc-page-turner-color=CanvasText] - Foreground color.
 * @cssprop [--rc-page-turner-duration=320ms] - Length of a turn. Read when a
 *   turn starts; a fade uses at most 150ms of it.
 * @cssprop [--rc-page-turner-easing=cubic-bezier(0.2, 0, 0, 1)] - Easing of
 *   a turn. Read when a turn starts.
 * @cssprop [--rc-page-turner-perspective=75rem] - Viewing distance a page
 *   turns in. Smaller values exaggerate the depth.
 * @cssprop [--rc-page-turner-navigation-button-size=40px] - Previous/next
 *   button diameter.
 * @cssprop [--rc-page-turner-navigation-button-background=color-mix(in srgb, CanvasText 12%, transparent)] -
 *   Previous/next button background.
 * @cssprop [--rc-page-turner-navigation-button-color=CanvasText] -
 *   Previous/next button icon color.
 * @cssprop [--rc-page-turner-navigation-inset=8px] - Previous/next button
 *   inset from the viewport edge.
 *
 * @csspart viewport - The focusable page stack and live region.
 * @csspart navigation - Previous/next button wrapper.
 * @csspart navigation-button - A previous or next button.
 * @csspart navigation-button-previous - The previous button specifically.
 * @csspart navigation-button-next - The next button specifically.
 *
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/carousel/ WAI-ARIA APG Carousel pattern}
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-page-turner rc-page-turner documentation}
 */
export class RCPageTurner extends LitElement {
  static override styles = pageTurnerStyles;

  private readonly _internals: ElementInternals;

  @query('#viewport') private _viewportEl?: HTMLDivElement;

  private _pages: RCPageTurnerPage[] = [];
  /** The page last presented as current, which a turn starts from. */
  private _presentedIndex: number | undefined;
  private _turn: Turn | undefined;
  private _pendingInstant = false;
  /** Lays out the current page's neighbors a frame after a page settles. */
  private readonly _adjacentFrame = new RafScheduler(this);
  private _writtenRoleDescription: string | null = null;

  private readonly _messages = new MessagesController(
    this,
    'rc-page-turner',
    DEFAULT_PAGE_TURNER_MESSAGES,
    {
      overrides: () => this.messages,
    },
  );

  /** Built-in text overrides; unset keys fall back to registered text, then English. */
  @property({ attribute: false })
  messages: Partial<RCPageTurnerMessages> | undefined;

  /** Shows previous/next buttons. */
  @property({ type: Boolean, reflect: true })
  navigation = false;

  private _activeIndex: number | undefined;
  private _defaultActiveIndex = 0;
  private _uncontrolledActiveIndex: number | undefined;
  private _activeIndexInitialized = false;

  /** Controls the current page. Host writes are silent. */
  @property({ type: Number, attribute: 'active-index' })
  get activeIndex(): number {
    return this._clampIndex(
      this._activeIndex ?? this._uncontrolledActiveIndex ?? this._defaultActiveIndex,
    );
  }

  set activeIndex(value: number | undefined) {
    const oldValue = this.activeIndex;

    this._activeIndex = value;
    this._activeIndexInitialized = true;
    this.requestUpdate('activeIndex', oldValue);
  }

  /** Initial page for uncontrolled usage. */
  @property({ type: Number, attribute: 'default-active-index' })
  get defaultActiveIndex(): number {
    return this._defaultActiveIndex;
  }

  set defaultActiveIndex(value: number) {
    const oldValue = this._defaultActiveIndex;

    this._defaultActiveIndex = value;

    if (
      !this._activeIndexInitialized &&
      this._activeIndex === undefined &&
      this._uncontrolledActiveIndex === undefined
    ) {
      this.requestUpdate('activeIndex', oldValue);
    }

    this.requestUpdate('defaultActiveIndex', oldValue);
  }

  constructor() {
    super();
    this._internals = this.attachInternals();
    this._internals.role = 'group';
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'group');
    }

    this._pages = this._directPages();
    this._syncText();

    if (this.hasUpdated) {
      this._presentImmediately(this.activeIndex);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._settleTurn();
  }

  protected override firstUpdated(): void {
    if (import.meta.env.DEV) {
      warnMissingDirectChild(this, {
        selector: ':scope > rc-page-turner-page',
        childDescription: '<rc-page-turner-page> elements',
      });

      if (!this.hasAttribute('aria-label') && !this.hasAttribute('aria-labelledby')) {
        console.warn(
          "[rc-page-turner] No aria-label/aria-labelledby set. Provide one describing this page turner's content.",
        );
      }
    }

    this._presentImmediately(this.activeIndex);
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    this._syncText();

    if (changed.has('activeIndex') && this.hasUpdated) {
      this._presentIndex(this.activeIndex);
    }
  }

  /** Turns to the next page. */
  next(): void {
    this._step(1, 'api');
  }

  /** Turns to the previous page. */
  previous(): void {
    this._step(-1, 'api');
  }

  /** Turns directly to a page index; `instant` skips the animation. */
  goToIndex(index: number, instant = false): void {
    this._pendingInstant = instant;
    this._setActiveIndex(index, 'api');
  }

  private _step(delta: 1 | -1, trigger: RCPageTurnerChangeTrigger): void {
    if (this._canStep(delta)) {
      this._setActiveIndex(this.activeIndex + delta, trigger);
    }
  }

  private _canStep(delta: 1 | -1): boolean {
    return delta > 0 ? this.activeIndex < this._pages.length - 1 : this.activeIndex > 0;
  }

  private _clampIndex(index: number): number {
    const count = this._pages.length;

    return count === 0 ? 0 : Math.min(count - 1, Math.max(0, Math.trunc(index) || 0));
  }

  private _setActiveIndex(index: number, trigger: RCPageTurnerChangeTrigger): void {
    const clamped = this._clampIndex(index);
    const oldValue = this.activeIndex;

    if (oldValue === clamped) {
      this._pendingInstant = false;

      return;
    }

    // Controlled usage never self-writes: only the host's own activeIndex
    // write moves the turner, in response to the event below.
    if (this._activeIndex === undefined) {
      this._uncontrolledActiveIndex = clamped;
      this.requestUpdate('activeIndex', oldValue);
    }

    this.dispatchEvent(
      new CustomEvent<RCPageTurnerChangeDetail>('rc-page-turner-change', {
        bubbles: true,
        composed: true,
        detail: { index: clamped, trigger },
      }),
    );
  }

  /** Presents `index` as current, turning from the page shown now. */
  private _presentIndex(index: number): void {
    const from = this._presentedIndex;
    const instant = this._pendingInstant;

    this._pendingInstant = false;

    if (from === undefined || from === index || !this._pages[from] || !this._pages[index]) {
      this._presentImmediately(index);

      return;
    }

    this._turnTo(from, index, instant ? 'none' : this._preferredMotion());
  }

  /** Shows `index` alone with no motion, settling any turn in flight. */
  private _presentImmediately(index: number): void {
    this._settleTurn();

    this._pages.forEach((page, pageIndex) => {
      page.present(pageIndex === index ? 'active' : 'hidden');
    });

    this._presentedIndex = this._pages[index] ? index : undefined;
    this._scheduleAdjacent();
  }

  /**
   * Prepares the pages either side of the current one in a later frame, so
   * their layout never lands in the frame that shows or turns a page. Pages
   * further away go back to skipping their rendering.
   */
  private _scheduleAdjacent(): void {
    this._adjacentFrame.schedule(() => {
      const current = this._presentedIndex;

      if (this._turn || current === undefined) {
        return;
      }

      this._pages.forEach((page, index) => {
        const presentation = Math.abs(index - current) === 1 ? 'adjacent' : 'hidden';

        if (index !== current && page.presentation !== presentation) {
          page.present(presentation);
        }
      });
    });
  }

  private _preferredMotion(): TurnMotion {
    const view = this.ownerDocument.defaultView;

    if (!view || typeof HTMLElement.prototype.animate !== 'function') {
      return 'none';
    }

    return view.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      view.matchMedia('(forced-colors: active)').matches
      ? 'fade'
      : 'turn';
  }

  private _turnTo(from: number, to: number, motion: TurnMotion): void {
    // A turn in flight lands first, so turns never overlap or leave a page
    // lifted.
    this._settleTurn();

    const outgoing = this._pages[from];
    const incoming = this._pages[to];

    // Reads before writes: one style resolution per turn.
    const focusWasInside = outgoing.matches(':focus-within');
    const timing = motion === 'none' ? undefined : this._turnTiming(motion);
    const flow = motion === 'turn' ? resolveFlow(this) : undefined;

    this._presentedIndex = to;

    this._pages.forEach((page, index) => {
      // Adjacent pages stay laid out; the turn's end plans them again.
      if (
        index !== from &&
        index !== to &&
        page.presentation !== 'hidden' &&
        page.presentation !== 'adjacent'
      ) {
        page.present('hidden');
      }
    });

    if (!timing) {
      outgoing.present('hidden');
      incoming.present('active');
      this._restoreFocus(focusWasInside, incoming);
      this._scheduleAdjacent();

      return;
    }

    // Turning forward, the current page swings away and uncovers the next;
    // turning back, the previous page swings in over the current one. A
    // fade always brings the arriving page in on top.
    const forward = to > from;
    const moving = motion === 'turn' && forward ? outgoing : incoming;
    const beneath = moving === outgoing ? incoming : outgoing;

    beneath.present(beneath === incoming ? 'active' : 'revealed');
    moving.present('turning', moving === incoming);
    this._restoreFocus(focusWasInside, incoming);

    let keyframes: Keyframe[];
    let direction: PlaybackDirection = 'normal';

    if (motion === 'turn' && flow) {
      const { origin, folded } = turnGeometry(flow);
      const flat = folded.replace(/-?180deg/, '0deg');

      moving.style.setProperty('--_rc-page-turner-origin', origin);

      keyframes = [{ transform: folded }, { transform: flat }];
      // A page shows only while it is less than halfway folded. Forward plays
      // the back turn in reverse, so the departing page's visible half gets
      // the same share of the turn as the arriving page's; a decelerating
      // easing played forward would fold it out of sight almost at once.
      direction = forward ? 'reverse' : 'normal';
    } else {
      keyframes = [{ opacity: 0 }, { opacity: 1 }];
    }

    const animation = moving.animate(keyframes, { ...timing, direction, fill: 'backwards' });

    this._turn = { animation, moving, outgoing, incoming };

    animation.finished.then(
      () => {
        if (this._turn?.animation === animation) {
          this._settleTurn();
        }
      },
      () => {
        // Cancelled by _settleTurn(), which already applied the end state.
      },
    );
  }

  /** Ends a turn in flight at once, in its final state. */
  private _settleTurn(): void {
    const turn = this._turn;

    if (!turn) {
      return;
    }

    this._turn = undefined;
    turn.animation.cancel();
    turn.moving.style.removeProperty('--_rc-page-turner-origin');
    turn.outgoing.present('hidden');
    turn.incoming.present('active');
    this._scheduleAdjacent();
  }

  private _turnTiming(motion: Exclude<TurnMotion, 'none'>): KeyframeAnimationOptions {
    const styles = getComputedStyle(this);
    const duration =
      parseCssTime(styles.getPropertyValue('--rc-page-turner-duration')) ??
      DEFAULT_TURN_DURATION_MS;
    const easing = styles.getPropertyValue('--rc-page-turner-easing').trim() || DEFAULT_TURN_EASING;

    return motion === 'turn'
      ? { duration, easing }
      : { duration: Math.min(duration, MAX_FADE_DURATION_MS), easing: 'linear' };
  }

  private _restoreFocus(focusWasInside: boolean, incoming: RCPageTurnerPage): void {
    if (focusWasInside) {
      incoming.focus({ preventScroll: true });
    }
  }

  private _syncText(): void {
    const messages = this._messages.value;
    const locale = this._messages.locale;

    this._writtenRoleDescription = syncDefaultAttribute(
      this,
      'aria-roledescription',
      messages.pageTurner,
      this._writtenRoleDescription,
    );

    this._pages.forEach((page, index) => {
      page.describe(messages.position(index + 1, this._pages.length, locale), messages.page);
    });
  }

  private _directPages(): RCPageTurnerPage[] {
    return Array.from(this.children).filter(
      (el): el is RCPageTurnerPage => el.localName === 'rc-page-turner-page',
    );
  }

  private _onSlotChange = (): void => {
    const pages = this._directPages();

    if (pages.length === this._pages.length && pages.every((page, i) => page === this._pages[i])) {
      return;
    }

    const oldValue = this.activeIndex;

    this._pages = pages;
    this._syncText();
    this._presentImmediately(this.activeIndex);
    this.requestUpdate('activeIndex', oldValue);
  };

  /**
   * Keys pressed inside page content belong to that content, so only keys
   * aimed at the viewport itself turn pages. The arrow pair follows the
   * rendered inline axis, resolved per keydown since a `dir` change on an
   * ancestor fires no event.
   */
  private _onViewportKeydown = (event: KeyboardEvent): void => {
    const viewport = this._viewportEl;

    if (
      !viewport ||
      event.composedPath()[0] !== viewport ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    const flow = resolveFlow(viewport);
    const keys = arrowKeys(renderedOrientation('horizontal', flow), flow);

    switch (event.key) {
      case keys.next:
        this._step(1, 'keyboard');
        break;
      case keys.prev:
        this._step(-1, 'keyboard');
        break;
      case 'Home':
        this._setActiveIndex(0, 'keyboard');
        break;
      case 'End':
        this._setActiveIndex(this._pages.length - 1, 'keyboard');
        break;
      default:
        return;
    }

    event.preventDefault();
  };

  protected override render() {
    const messages = this._messages.value;
    const canPrev = this._canStep(-1);
    const canNext = this._canStep(1);

    return html`
      <div
        id="viewport"
        part="viewport"
        tabindex="0"
        aria-live="polite"
        @keydown=${this._onViewportKeydown}
      >
        <slot @slotchange=${this._onSlotChange}></slot>
      </div>

      ${this.navigation
        ? html`
            <div id="navigation" part="navigation">
              <button
                type="button"
                part="navigation-button navigation-button-previous"
                aria-label=${messages.previous}
                aria-disabled=${canPrev ? 'false' : 'true'}
                @click=${() => this._step(-1, 'button')}
              >
                <span aria-hidden="true">
                  <slot name="previous-icon">
                    <svg
                      viewBox="0 0 6 10"
                      width="10"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="5,1 1,5 5,9" />
                    </svg>
                  </slot>
                </span>
              </button>
              <button
                type="button"
                part="navigation-button navigation-button-next"
                aria-label=${messages.next}
                aria-disabled=${canNext ? 'false' : 'true'}
                @click=${() => this._step(1, 'button')}
              >
                <span aria-hidden="true">
                  <slot name="next-icon">
                    <svg
                      viewBox="0 0 6 10"
                      width="10"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="1,1 5,5 1,9" />
                    </svg>
                  </slot>
                </span>
              </button>
            </div>
          `
        : nothing}
    `;
  }
}

/**
 * Where a page turns from and the transform of a fully turned page. The spine
 * is the inline-start edge: the left edge in horizontal LTR text, the right in
 * RTL, the top (or bottom, when the inline axis runs upward) in vertical text.
 * The free edge always swings toward the viewer.
 */
export function turnGeometry(flow: Flow): { origin: string; folded: string } {
  if (flow.inline === 'x') {
    return flow.inlineReversed
      ? { origin: 'right center', folded: 'rotateY(180deg)' }
      : { origin: 'left center', folded: 'rotateY(-180deg)' };
  }

  return flow.inlineReversed
    ? { origin: 'center bottom', folded: 'rotateX(-180deg)' }
    : { origin: 'center top', folded: 'rotateX(180deg)' };
}
