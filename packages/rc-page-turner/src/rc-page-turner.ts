import { LitElement, html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';

import {
  HydrationController,
  ControlledIndexController,
  DragGestureController,
  FlowController,
  MessagesController,
  RafScheduler,
  arrowKeys,
  logicalDelta,
  numberFormat,
  parseCssTime,
  renderedOrientation,
  resolveFlow,
  syncDefaultAttribute,
  warnMissingDirectChild,
  type DragGestureDetail,
  type Flow,
  MorphRecoveryController,
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

export type RCPageTurnerChangeTrigger = 'api' | 'button' | 'keyboard' | 'swipe';

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
/** Release velocity (px/s) along the turn past which a drag commits or springs back regardless of distance. */
const SWIPE_VELOCITY = 300;
/** Share of the page the free edge must cross before a slow release commits. */
const COMMIT_PROGRESS = 0.5;
/** Shortest settle after a release, so a nearly finished drag still visibly lands. */
const MIN_SETTLE_DURATION_MS = 80;
/** Timeline length of the paused animation a drag scrubs through. */
const SCRUB_DURATION_MS = 1000;

type TurnMotion = 'turn' | 'fade' | 'none';

interface Turn {
  animation: Animation;
  /** The blank back layer, in step with the moving page. */
  back?: Animation;
  moving: RCPageTurnerPage;
  outgoing: RCPageTurnerPage;
  incoming: RCPageTurnerPage;
}

/** A drag in progress. `to` is `undefined` when the drag has no page to turn to. */
interface DragTurn {
  flow: Flow;
  /** Inline size of the viewport, the distance of a full turn. */
  size: number;
  from: number;
  to: number | undefined;
  forward: boolean;
  /** Share of the page the free edge has crossed, 0 to 1. */
  progress: number;
  /** The moving page's angle as a share of a full fold, 0 (flat) to 1 (folded). */
  fold: number;
  /** The page following the pointer; absent when motion is reduced. */
  scrub?: Turn & ReturnType<typeof turnGeometry> & { flat: string };
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
 * `Element.animate()` swap pages without motion. Past 90° a turning page
 * shows a blank back (the `page-back` part) as it falls beyond the
 * inline-start edge; the viewport clips across the inline axis only.
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
 * Touch and pen drags along the inline axis turn pages; mouse drags do too
 * with `mouse-dragging`. The page's free edge follows the pointer, and on
 * release the turn completes once that edge has crossed the middle of the
 * page or on a fast swipe, and otherwise settles back. Under reduced motion or forced colors a drag doesn't move the page;
 * a long or fast enough one turns it with the usual fade. Drags across the
 * inline axis are left to the browser, so pages still scroll vertically, but
 * a scrollable element inside a page needs its own
 * `touch-action: pan-y pinch-zoom` (`pan-x` in vertical text): touch-action
 * stops at the nearest scroll container.
 *
 * @slot - One or more `rc-page-turner-page` elements.
 * @slot previous-icon - Optional icon for the previous button, replacing the
 *   default chevron. Only rendered when `navigation` is set.
 * @slot next-icon - Optional icon for the next button, replacing the default
 *   chevron. Only rendered when `navigation` is set.
 *
 * @fires rc-page-turner-change - Fires when a button, a key, a swipe, or the
 *   imperative API asks for another page. Host writes to `activeIndex` are
 *   silent. `detail: { index, trigger: 'button'|'keyboard'|'swipe'|'api' }`
 *
 * @attr active-index - Controls the current page. Host writes are silent;
 *   listen for `rc-page-turner-change` to stay in sync.
 * @attr default-active-index - Initial page for uncontrolled usage.
 * @attr navigation - Shows previous/next buttons.
 * @attr mouse-dragging - Lets mouse drags turn pages, as touch and pen
 *   drags always do. Off by default, so a mouse can select page text.
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
 * @cssprop [--rc-page-turner-page-back-background=Canvas] - The blank back of
 *   a turning page, shown once it folds past 90°.
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
 * @csspart page-back - The blank back of the turning page, a layer the turner
 *   draws in step with it. Visible only during a turn, once the page folds
 *   past 90°.
 * @csspart navigation - Previous/next button wrapper.
 * @csspart navigation-button - A previous or next button.
 * @csspart navigation-button-previous - The previous button specifically.
 * @csspart navigation-button-next - The next button specifically.
 *
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/carousel/ WAI-ARIA APG Carousel pattern}
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-page-turner rc-page-turner documentation}
 */
export class RCPageTurner extends LitElement {
  /** Writes the element's attributes again after a DOM morph removes them. */
  protected readonly _morphRecovery = new MorphRecoveryController(this, {
    role: 'group',
    resync: () => this._syncText(),
  });

  protected readonly _hydration = new HydrationController(this);

  static override styles = pageTurnerStyles;

  private readonly _internals: ElementInternals;

  @query('#viewport') private _viewportEl?: HTMLDivElement;
  @query('[part~="page-back"]') private _pageBackEl?: HTMLDivElement;

  private _pages: RCPageTurnerPage[] = [];
  private readonly _flow = new FlowController(this);
  private _ancestorStyles?: MutationObserver;
  private _dragAxis: 'x' | 'y' = 'x';
  private readonly _onFlowChange = (): void => {
    this._flow.refresh();
    this._syncDragAxis();
  };

  /** The page last presented as current, which a turn starts from. */
  private _presentedIndex: number | undefined;
  private _turn: Turn | undefined;
  private _pendingInstant = false;
  /** Lays out the current page's neighbors a frame after a page settles. */
  private readonly _adjacentFrame = new RafScheduler(this);
  private _writtenRoleDescription: string | null = null;
  private _waitingForPageDefinition = false;

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

  /** Lets mouse drags turn pages, as touch and pen drags always do. */
  @property({ type: Boolean, reflect: true, attribute: 'mouse-dragging' })
  mouseDragging = false;

  private _drag: DragTurn | undefined;
  /** Swallows the click that ends a drag, so it doesn't activate page content. */
  private _suppressNextClick = false;

  private readonly _dragController = new DragGestureController(this, {
    target: () => this._viewportEl ?? null,
    axis: 'x',
    // Waits for movement along the inline axis, so taps stay clicks and
    // cross-axis drags stay scrolls.
    activation: 'axis',
    canStart: (event) => {
      if (this._pages.length < 2 || (event.pointerType === 'mouse' && !this.mouseDragging)) {
        return false;
      }

      this._syncDragAxis();

      return true;
    },
    onStart: (detail) => this._startDrag(detail),
    onMove: (detail) => this._moveDrag(detail),
    onEnd: (detail) => this._endDrag(detail, true),
    onCancel: (detail) => this._endDrag(detail, false),
  });

  private readonly _index = new ControlledIndexController<RCPageTurnerChangeTrigger>(this, {
    normalize: (index) => this._clampIndex(index),
    eventName: 'rc-page-turner-change',
  });

  /** Controls the current page. Host writes are silent. */
  @property({ type: Number, attribute: 'active-index' })
  get activeIndex(): number {
    return this._index.value;
  }

  set activeIndex(value: number | undefined) {
    this._index.setControlled(value);
  }

  /** Initial page for uncontrolled usage. */
  @property({ type: Number, attribute: 'default-active-index' })
  get defaultActiveIndex(): number {
    return this._index.defaultValue;
  }

  set defaultActiveIndex(value: number) {
    this._index.setDefault(value);
  }

  constructor() {
    super();
    this._internals = this.attachInternals();
    this._internals.role = 'group';
  }

  override connectedCallback(): void {
    super.connectedCallback();

    this._observeAncestorStyles();

    this._pages = this._directPages();
    this._syncText();

    if (this.hasUpdated) {
      this._syncDragAxis();
      this._presentImmediately(this.activeIndex);
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._ancestorStyles?.disconnect();
    this._ancestorStyles = undefined;
    this.ownerDocument.defaultView?.removeEventListener('resize', this._onFlowChange);
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

    this._syncDragAxis();
    this._presentImmediately(this.activeIndex);
  }

  protected override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    this._syncText();
    this._syncDragAxis();

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
    if (!this._index.request(index, trigger)) {
      this._pendingInstant = false;
    }
  }

  /** Presents `index` as current, turning from the page shown now. */
  private _presentIndex(index: number): void {
    const from = this._presentedIndex;
    const instant = this._pendingInstant;

    this._pendingInstant = false;

    // A released drag already turns toward the index it reported.
    if (from === index && this._turn?.incoming === this._pages[index]) {
      return;
    }

    if (from === undefined || from === index || !this._pages[from] || !this._pages[index]) {
      this._presentImmediately(index);

      return;
    }

    this._turnTo(from, index, instant ? 'none' : this._preferredMotion());
  }

  /** Shows `index` alone with no motion, settling any turn in flight. */
  private _presentImmediately(index: number): void {
    this._abortDrag();
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

      if (this._turn || this._drag || current === undefined) {
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
    this._abortDrag();
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

    let animation: Animation;
    let back: Animation | undefined;

    if (motion === 'turn' && flow) {
      const geometry = turnGeometry(flow);

      // A page's front shows only while it is less than halfway folded.
      // Forward plays the back turn in reverse, so the departing page's
      // front gets the same share of the turn as the arriving page's; a
      // decelerating easing played forward would fold it away almost at once.
      ({ animation, back } = this._animateLeaf(
        moving,
        geometry,
        [geometry.folded, flatFold(geometry.folded)],
        { ...timing, direction: forward ? 'reverse' : 'normal', fill: 'backwards' },
      ));
    } else {
      animation = moving.animate([{ opacity: 0 }, { opacity: 1 }], {
        ...timing,
        fill: 'backwards',
      });
    }

    this._turn = { animation, back, moving, outgoing, incoming };

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
    this._hidePageBack(turn.back);
    turn.outgoing.present('hidden');
    turn.incoming.present('active');
    this._scheduleAdjacent();
  }

  /**
   * Animates a turning page and the blank back layer through the same
   * transforms. The layer is the page mirrored across its own center, so it
   * faces the viewer exactly when the page has folded past 90°, where the
   * page's front is hidden.
   */
  private _animateLeaf(
    moving: RCPageTurnerPage,
    { origin, flip }: ReturnType<typeof turnGeometry>,
    transforms: string[],
    options: KeyframeAnimationOptions,
  ): { animation: Animation; back?: Animation } {
    moving.style.setProperty('--_rc-page-turner-origin', origin);

    const animation = moving.animate(
      transforms.map((transform) => ({ transform })),
      options,
    );
    const pageBack = this._pageBackEl;

    if (!pageBack) {
      return { animation };
    }

    pageBack.style.setProperty('--_rc-page-turner-origin', origin);
    this._internals.states?.add('turning');

    const back = pageBack.animate(
      transforms.map((transform) => ({ transform: `${transform} ${flip}` })),
      options,
    );

    return { animation, back };
  }

  private _hidePageBack(back: Animation | undefined): void {
    back?.cancel();
    this._internals.states?.delete('turning');
  }

  /**
   * Drags follow the rendered inline axis, and only cross-axis pans stay with
   * the browser; the viewport clips across that axis only. Flow changes
   * refresh these styles before another gesture, and pointerdown resolves
   * them again for changes that did not notify the component.
   */
  private _syncDragAxis(): void {
    const viewport = this._viewportEl;

    if (!viewport) {
      return;
    }

    const horizontal = resolveFlow(this).inline === 'x';
    const axis = horizontal ? 'x' : 'y';

    if (axis !== this._dragAxis) {
      this._dragAxis = axis;
      this._dragController.setOptions({ axis });
    }

    viewport.style.touchAction = horizontal ? 'pan-y pinch-zoom' : 'pan-x pinch-zoom';
    // Clipped across the inline axis only: a page folded past 90° falls
    // beyond the inline-start edge, showing its back.
    viewport.style.overflow = horizontal ? 'visible clip' : 'clip visible';
  }

  /** Tracks inherited style changes that do not resize the turner. */
  private _observeAncestorStyles(): void {
    if (typeof MutationObserver !== 'function') {
      return;
    }

    this._ancestorStyles?.disconnect();
    this._ancestorStyles = new MutationObserver(this._onFlowChange);

    const ancestors: Element[] = [this];

    for (let index = 0; index < ancestors.length; index++) {
      const ancestor = ancestors[index];

      this._ancestorStyles.observe(ancestor, {
        attributes: true,
        attributeFilter: ['class', 'style'],
      });

      const root = ancestor.getRootNode();
      const parent = ancestor.parentElement ?? (root instanceof ShadowRoot ? root.host : null);

      if (parent) {
        ancestors.push(parent);
      }
    }

    this.ownerDocument.defaultView?.addEventListener('resize', this._onFlowChange);
  }

  /**
   * Lifts the page a drag turns: toward the inline start turns forward, so
   * the current page lifts; toward the inline end turns back, so the
   * previous page comes in over it, edge-on at the spine from the first
   * move. Accessibility state doesn't change until the drag commits.
   */
  private _startDrag(detail: DragGestureDetail): void {
    this._settleTurn();

    const viewport = this._viewportEl;
    const flow = resolveFlow(this);
    const from = this._presentedIndex ?? this.activeIndex;
    const forward = logicalDelta({ dx: detail.deltaX, dy: detail.deltaY }, 'inline', flow) < 0;
    const target = from + (forward ? 1 : -1);
    const to = this._pages[target] ? target : undefined;
    // The one layout read of the gesture, before any write. A rendered box,
    // not clientWidth, so CSS zoom scales it like the pointer's coordinates.
    const box = viewport?.getBoundingClientRect();
    const size = Math.max(1, (flow.inline === 'x' ? box?.width : box?.height) ?? 0);

    this._drag = { flow, size, from, to, forward, progress: 0, fold: forward ? 0 : 0.5 };
    this._suppressNextClick = true;
    this._internals.states?.add('dragging');

    if (to === undefined || this._preferredMotion() !== 'turn') {
      return;
    }

    const outgoing = this._pages[from];
    const incoming = this._pages[to];
    const moving = forward ? outgoing : incoming;
    const geometry = turnGeometry(flow);
    const flat = flatFold(geometry.folded);

    if (forward) {
      outgoing.present('turning', true);
      incoming.present('revealed', false);
    } else {
      incoming.present('turning', false);
      outgoing.present('active');
    }

    // Scrubbed by fold share: flat at 0, folded at the end.
    const { animation, back } = this._animateLeaf(moving, geometry, [flat, geometry.folded], {
      duration: SCRUB_DURATION_MS,
      easing: 'linear',
      fill: 'both',
    });

    animation.pause();
    back?.pause();
    this._drag.scrub = { animation, back, moving, outgoing, incoming, ...geometry, flat };
    this._moveDrag(detail);
  }

  private _moveDrag(detail: DragGestureDetail): void {
    const drag = this._drag;

    if (!drag || drag.to === undefined) {
      return;
    }

    const delta = logicalDelta({ dx: detail.deltaX, dy: detail.deltaY }, 'inline', drag.flow);
    const travel = (drag.forward ? -delta : delta) / drag.size;
    // The free edge tracks the pointer: turning forward it starts at the
    // outer edge, turning back at the spine. Its offset from the spine is the
    // cosine of the page's angle, ignoring perspective.
    const edge = drag.forward ? 1 - travel : travel;

    drag.progress = Math.min(1, Math.max(0, travel));
    drag.fold = Math.acos(Math.min(1, Math.max(-1, edge))) / Math.PI;

    if (drag.scrub) {
      const time = drag.fold * SCRUB_DURATION_MS;

      drag.scrub.animation.currentTime = time;

      if (drag.scrub.back) {
        drag.scrub.back.currentTime = time;
      }
    }
  }

  /**
   * Completes the turn past halfway or on a swipe toward it, and otherwise
   * settles back; a swipe the other way always settles back. The rest of the
   * motion runs from where the page was released, with the turn's easing,
   * as an ordinary turn that any later turn settles first.
   */
  private _endDrag(detail: DragGestureDetail, released: boolean): void {
    const drag = this._drag;

    this._drag = undefined;
    this._internals.states?.delete('dragging');

    // The click that ends this pointer sequence, if any, dispatches first.
    setTimeout(() => {
      this._suppressNextClick = false;
    });

    if (!drag || drag.to === undefined) {
      return;
    }

    const velocity =
      logicalDelta({ dx: detail.velocityX, dy: detail.velocityY }, 'inline', drag.flow) *
      (drag.forward ? -1 : 1);
    const commit =
      released &&
      (velocity > SWIPE_VELOCITY ||
        (velocity >= -SWIPE_VELOCITY && drag.progress >= COMMIT_PROGRESS));

    if (!drag.scrub) {
      if (commit) {
        this._setActiveIndex(drag.to, 'swipe');
      }

      return;
    }

    const { scrub } = drag;
    const { moving, outgoing, incoming, folded, flat } = scrub;
    const focusWasInside = outgoing.matches(':focus-within');
    const timing = this._turnTiming('turn');
    // A forward turn ends folded and a back turn flat, and settling back
    // returns where it started.
    const endFold = drag.forward === commit ? 1 : 0;
    const remaining = Math.abs(endFold - drag.fold);

    scrub.animation.cancel();
    scrub.back?.cancel();

    const { animation: settle, back } = this._animateLeaf(
      moving,
      scrub,
      [scaleFold(folded, drag.fold), endFold ? folded : flat],
      {
        duration: Math.max(MIN_SETTLE_DURATION_MS, Number(timing.duration) * remaining),
        easing: timing.easing,
        fill: 'both',
      },
    );

    if (commit) {
      // Lands like a turn from `from` to `to`: the arriving page is current
      // from now on.
      this._presentedIndex = drag.to;
      outgoing.present(drag.forward ? 'turning' : 'revealed', false);
      incoming.present(drag.forward ? 'active' : 'turning', true);
      this._restoreFocus(focusWasInside, incoming);
      this._turn = { animation: settle, back, moving, outgoing, incoming };
    } else {
      // Settles back: the page the drag started on stays current.
      this._turn = { animation: settle, back, moving, outgoing: incoming, incoming: outgoing };
    }

    settle.finished.then(
      () => {
        if (this._turn?.animation === settle) {
          this._settleTurn();
        }
      },
      () => {
        // Cancelled by _settleTurn(), which already applied the end state.
      },
    );

    if (commit) {
      const to = drag.to;

      this._setActiveIndex(to, 'swipe');

      // A controlled host that doesn't take the new index keeps its page.
      queueMicrotask(() => {
        if (this.activeIndex !== to && this._presentedIndex === to) {
          this._presentImmediately(this.activeIndex);
        }
      });
    }
  }

  /** Drops a drag's lift when something else moves the turner mid-drag. */
  private _abortDrag(): void {
    const drag = this._drag;

    if (!drag?.scrub) {
      return;
    }

    drag.scrub.animation.cancel();
    drag.scrub.moving.style.removeProperty('--_rc-page-turner-origin');
    this._hidePageBack(drag.scrub.back);
    drag.scrub = undefined;
    drag.to = undefined;
  }

  private _onViewportClickCapture = (event: Event): void => {
    if (this._suppressNextClick) {
      this._suppressNextClick = false;
      event.preventDefault();
      event.stopPropagation();
    }
  };

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
    const registry = this.ownerDocument.defaultView?.customElements;

    if (this._pages.some((page) => typeof page.describe !== 'function')) {
      if (registry?.get('rc-page-turner-page')) {
        // A definition can exist before its connected children have upgraded.
        registry.upgrade(this);
      } else if (registry && !this._waitingForPageDefinition) {
        this._waitingForPageDefinition = true;

        void registry.whenDefined('rc-page-turner-page').then(() => {
          this._waitingForPageDefinition = false;

          if (this.isConnected) {
            this._syncText();
          }
        });
      }
    }

    this._writtenRoleDescription = syncDefaultAttribute(
      this,
      'aria-roledescription',
      messages.pageTurner,
      this._writtenRoleDescription,
    );

    this._pages.forEach((page, index) => {
      if (typeof page.describe !== 'function') {
        return;
      }

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
    // The server cannot see the pages, so hydrate as if there were none first.
    const serverView = this._hydration.serverView;
    const canPrev = !serverView && this._canStep(-1);
    const canNext = !serverView && this._canStep(1);

    return html`
      <div
        id="viewport"
        part="viewport"
        tabindex="0"
        aria-live="polite"
        @keydown=${this._onViewportKeydown}
        @click=${{ handleEvent: this._onViewportClickCapture, capture: true }}
      >
        <slot @slotchange=${this._onSlotChange}></slot>
        <div part="page-back" aria-hidden="true"></div>
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
 * Where a page turns from, the transform of a fully turned page, and the flip
 * that mirrors a page across its own center for the blank back layer. The
 * spine is the inline-start edge: the left edge in horizontal LTR text, the
 * right in RTL, the top (or bottom, when the inline axis runs upward) in
 * vertical text. The free edge always swings toward the viewer.
 */
export function turnGeometry(flow: Flow): { origin: string; folded: string; flip: string } {
  if (flow.inline === 'x') {
    return flow.inlineReversed
      ? {
          origin: 'right center',
          folded: 'rotateY(180deg)',
          flip: 'translateX(-50%) rotateY(180deg) translateX(50%)',
        }
      : {
          origin: 'left center',
          folded: 'rotateY(-180deg)',
          flip: 'translateX(50%) rotateY(180deg) translateX(-50%)',
        };
  }

  return flow.inlineReversed
    ? {
        origin: 'center bottom',
        folded: 'rotateX(-180deg)',
        flip: 'translateY(-50%) rotateX(180deg) translateY(50%)',
      }
    : {
        origin: 'center top',
        folded: 'rotateX(180deg)',
        flip: 'translateY(50%) rotateX(180deg) translateY(-50%)',
      };
}

/** The flat counterpart of a folded transform. */
function flatFold(folded: string): string {
  return folded.replace(/-?180deg/, '0deg');
}

/** `folded` turned only `share` of the way, from flat (0) to fully folded (1). */
function scaleFold(folded: string, share: number): string {
  return folded.replace(/(-?)180deg/, (_, sign: string) => `${sign}${(180 * share).toFixed(2)}deg`);
}
