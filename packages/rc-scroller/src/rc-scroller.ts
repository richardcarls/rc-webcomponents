import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';

import {
  RafScheduler,
  clientSize,
  getScrollOffset,
  resolveFlow,
  scrollSize,
  type Flow,
  type LogicalAxis,
} from '@rcarls/rc-common';

import scrollerStyles from './rc-scroller.styles.js';

export type RCScrollerAxis = 'block' | 'inline' | 'both';
export type RCScrollerLayout = 'none' | 'content';

/** Pixels of remaining scroll distance below which an edge counts as reached. */
const BOUNDARY_THRESHOLD = 4;

declare global {
  interface HTMLElementTagNameMap {
    'rc-scroller': RCScroller;
  }
}

/**
 * Design-system-neutral native scroll region with optional content and
 * fullbleed layout tracks. The custom element host is the scroll container,
 * so native scrolling APIs and events work directly on `<rc-scroller>`.
 *
 * With `layout="content"`, direct children use the centered content track.
 * Add `data-rc-scroller-span="fullbleed"` to a direct child to span the full
 * available inline size. This child attribute is a layout convention rather
 * than component state.
 *
 * The author owns the accessible name and landmark semantics when the region
 * needs them. The component does not add `role` or `tabindex` automatically.
 *
 * @slot - Scrollable content.
 *
 * @csspart content - Wrapper for the default slot and optional layout grid.
 *
 * @attr axis - Scroll axis: `block`, `inline`, or `both`.
 * @attr layout - Layout mode: `none` or `content`.
 * @attr [at-block-start] - Reflected, computed. Present when scrolled to (within a few
 *   pixels of) the block-start edge, or when the block axis isn't scrollable
 *   (`axis="inline"`) — nothing more to reveal counts as already at both edges.
 *   Edges are logical: in RTL the inline start is the right edge, and in
 *   vertical writing modes the block axis runs horizontally.
 * @attr [at-block-end] - Reflected, computed. The block-end equivalent of `at-block-start`.
 * @attr [at-inline-start] - Reflected, computed. The inline-start equivalent, always
 *   present when the inline axis isn't scrollable (`axis="block"`).
 * @attr [at-inline-end] - Reflected, computed. The inline-end equivalent of `at-inline-start`.
 *
 * @cssprop [--rc-scroller-overscroll-behavior=contain] - Overscroll behavior on enabled axes.
 * @cssprop [--rc-scroller-overflow-anchor=auto] - Browser scroll anchoring behavior.
 * @cssprop [--rc-scroller-scrollbar-width=auto] - Scrollbar width.
 * @cssprop [--rc-scroller-scrollbar-color=auto] - Scrollbar thumb and track colors.
 * @cssprop [--rc-scroller-content-padding-inline=1rem] - Minimum inline gutter in content layout.
 * @cssprop [--rc-scroller-content-max-inline-size=100%] - Maximum width of the content track.
 * @cssprop [--rc-scroller-content-row-gap=0] - Gap between rows in content layout.
 */
export class RCScroller extends LitElement {
  static override styles = scrollerStyles;

  // Boundary state can only be measured after render, so the reflected edge
  // properties intentionally schedule one follow-up update.
  static override enabledWarnings = (LitElement.enabledWarnings ?? []).filter(
    (warning) => warning !== 'change-in-update',
  );

  /** Scroll axis. */
  @property({ reflect: true })
  axis: RCScrollerAxis = 'block';

  /** Optional child layout. */
  @property({ reflect: true })
  layout: RCScrollerLayout = 'none';

  /** Reflected, computed. See the class doc comment. */
  @property({ type: Boolean, reflect: true, attribute: 'at-block-start' })
  atBlockStart = true;

  /** Reflected, computed. See the class doc comment. */
  @property({ type: Boolean, reflect: true, attribute: 'at-block-end' })
  atBlockEnd = true;

  /** Reflected, computed. See the class doc comment. */
  @property({ type: Boolean, reflect: true, attribute: 'at-inline-start' })
  atInlineStart = true;

  /** Reflected, computed. See the class doc comment. */
  @property({ type: Boolean, reflect: true, attribute: 'at-inline-end' })
  atInlineEnd = true;

  private _resizeObserver: ResizeObserver | null = null;

  private readonly _frame = new RafScheduler(this);

  override connectedCallback(): void {
    super.connectedCallback();

    this.addEventListener('scroll', this._onScroll, { passive: true });

    if (typeof ResizeObserver === 'function') {
      this._resizeObserver = new ResizeObserver(this._onScroll);
      this._resizeObserver.observe(this);
    }
  }

  override firstUpdated(): void {
    // Only accurate once the shadow DOM (and slotted content) has actually
    // rendered — connectedCallback runs before Lit's first render, when
    // scrollWidth/clientHeight etc. don't yet reflect real layout. Also
    // covers connecting already scrolled (bfcache restore, fragment nav)
    // rather than waiting for the first scroll/resize event.
    this._evaluateBoundaries();
  }

  override disconnectedCallback(): void {
    this.removeEventListener('scroll', this._onScroll);
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;

    super.disconnectedCallback();
  }

  protected override render() {
    return html`<div part="content"><slot></slot></div>`;
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('axis') || changed.has('layout')) {
      this._evaluateBoundaries();
    }
  }

  /**
   * Scroll and resize can fire several times per frame, and every evaluation
   * reads layout, so boundary state is recomputed at most once per frame.
   */
  private readonly _onScroll = (): void => {
    this._frame.schedule(() => this._evaluateBoundaries());
  };

  private _edges(axis: LogicalAxis, flow: Flow): [start: boolean, end: boolean] {
    const offset = getScrollOffset(this, axis, flow);
    const max = scrollSize(this, axis, flow) - clientSize(this, axis, flow);

    return [offset <= BOUNDARY_THRESHOLD, offset >= max - BOUNDARY_THRESHOLD];
  }

  private _evaluateBoundaries(): void {
    // Read at measure time: a dir or writing-mode change on an ancestor fires
    // no event of its own.
    const flow = resolveFlow(this);

    [this.atBlockStart, this.atBlockEnd] =
      this.axis !== 'inline' ? this._edges('block', flow) : [true, true];

    [this.atInlineStart, this.atInlineEnd] =
      this.axis !== 'block' ? this._edges('inline', flow) : [true, true];
  }
}
