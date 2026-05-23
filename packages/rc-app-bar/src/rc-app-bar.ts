import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import {
  ScrollObserverController,
  type ScrollObserverTarget,
} from '@rcarls/rc-common';

import appBarStyles from './rc-app-bar.styles';

declare global {
  interface HTMLElementTagNameMap {
    'rc-app-bar': RCAppBar;
  }
}

export type RCAppBarVariant = 'compact' | 'expanded';

export type RCAppBarScrollBehavior = 'pinned' | 'collapse' | 'hide';

export interface RCAppBarScrollDetail {
  /** Whether the observed scroll target is past the threshold. */
  scrolled: boolean;
}

/**
 * A headless app bar with leading, title, exact-center, and trailing regions.
 *
 * The element carries no landmark role. Consumers provide all controls and
 * icons, and wrap page-level instances in `<header>` when a banner landmark is
 * appropriate.
 *
 * Scrolled state is dual-mode. Uncontrolled: set `scrollTarget` (or the
 * `scroll-target` selector attribute) and the bar observes the container.
 * Controlled: assign `scrolled`; assigning `undefined` releases observation.
 * Host writes are silent.
 *
 * @slot leading - Leading navigation or controls; accepts multiple children
 * @slot - The single title region; may contain title and subtitle markup
 * @slot center - Content kept at the exact horizontal center, such as search
 * @slot trailing - Trailing action controls
 * @fires rc-app-bar-scroll - When observed scroll state crosses the threshold;
 *   `detail: { scrolled }`
 * @cssprop [--rc-app-bar-bg=Canvas] - Bar background
 * @cssprop [--rc-app-bar-color=CanvasText] - Bar text color
 * @cssprop [--rc-app-bar-compact-min-height=3rem] - Compact row minimum height
 * @cssprop [--rc-app-bar-expanded-padding-block=0.75em] - Expanded title padding
 * @cssprop [--rc-app-bar-padding-inline=0.75em] - Horizontal padding
 * @cssprop [--rc-app-bar-gap=0.5em] - Gap between regions
 * @cssprop [--rc-app-bar-transition-duration=200ms] - Endpoint and hide duration
 * @cssprop [--rc-app-bar-scroll-shadow=1px solid GrayText] - Scrolled divider
 * @csspart root - The grid container
 * @csspart leading - Wrapper around the leading slot
 * @csspart title - Wrapper around the single title slot
 * @csspart center - Wrapper around the centered slot
 * @csspart trailing - Wrapper around the trailing slot
 * @csspart scroll-shadow - Scrolled-state separator
 */
export class RCAppBar extends LitElement {
  static styles = [appBarStyles];

  /** Structural variant. `expanded` adds a flexible title row. */
  @property({ type: String, reflect: true })
  variant: RCAppBarVariant = 'compact';

  /** Visual response to observed scrolling. */
  @property({ type: String, attribute: 'scroll-behavior', reflect: true })
  scrollBehavior: RCAppBarScrollBehavior = 'pinned';

  /**
   * Scroll container to observe. The attribute accepts a CSS selector or
   * `window`; the property also accepts an element, document, or window.
   */
  @property({ attribute: 'scroll-target' })
  scrollTarget: ScrollObserverTarget | string | null = null;

  /** Scroll offset in px past which the bar is scrolled (strict `>`). */
  @property({ type: Number, attribute: 'scroll-threshold' })
  scrollThreshold = 4;

  private _scrolled: boolean | undefined = undefined;

  @state()
  private _observedScrolled = false;

  @state()
  private _hasLeading = false;

  @state()
  private _hasCenter = false;

  @state()
  private _hasTrailing = false;

  private _collapsed = false;

  private _hidden = false;

  private _collapseDistance = 0;

  private _collapseOffsetDistance = 0;

  private _collapseProgress = 0;

  private _internals = this.attachInternals();

  private _resizeObserver: ResizeObserver | null = null;

  private readonly _scroll = new ScrollObserverController(this, {
    target: () => this._resolveScrollTarget(),
    threshold: this.scrollThreshold,
    disabled: true,
    onChange: (scrolled) => {
      this._observedScrolled = scrolled;
      this._syncVisualState();
      this.dispatchEvent(
        new CustomEvent<RCAppBarScrollDetail>('rc-app-bar-scroll', {
          bubbles: true,
          composed: true,
          detail: { scrolled },
        }),
      );
    },
    onScroll: (scrollTop, delta) => this._onObservedScroll(scrollTop, delta),
  });

  /**
   * Whether the bar is past its scroll threshold. Host writes are silent and
   * controlled; assigning `undefined` releases observation.
   */
  @property({ attribute: false })
  get scrolled(): boolean {
    return this._scrolled ?? this._observedScrolled;
  }
  set scrolled(value: boolean | undefined) {
    const oldValue = this.scrolled;

    this._scrolled = value;
    this._syncScrollObserver();
    this._syncVisualState();
    this.requestUpdate('scrolled', oldValue);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._connectResizeObserver();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (
      changed.has('scrollTarget') ||
      changed.has('scrollThreshold') ||
      changed.has('scrollBehavior')
    ) {
      this._syncScrollObserver();
    }

    if (changed.has('variant') || changed.has('scrollBehavior')) {
      this._syncVisualState();
    }
  }

  protected override firstUpdated(): void {
    this._observeLayout();
    this._measureLayout();
    this._syncScrollObserver();
    this._syncVisualState();
  }

  protected override updated(): void {
    this._observeLayout();
    this._measureLayout();
    this._syncStateOutputs();
  }

  private _connectResizeObserver(): void {
    if (!('ResizeObserver' in globalThis)) return;

    this._resizeObserver ??= new ResizeObserver(() => this._measureLayout());
    this._observeLayout();
  }

  private _observeLayout(): void {
    if (!this._resizeObserver) return;

    this._resizeObserver.disconnect();
    ['#leading', '#title', '#center', '#trailing'].forEach((selector) => {
      const element = this.shadowRoot?.querySelector<HTMLElement>(selector);
      if (element) this._resizeObserver?.observe(element);
    });
  }

  private _measureLayout(): void {
    const leading = this.shadowRoot?.querySelector<HTMLElement>('#leading');
    const title = this.shadowRoot?.querySelector<HTMLElement>('#title');
    const trailing = this.shadowRoot?.querySelector<HTMLElement>('#trailing');
    if (!leading || !title || !trailing) return;

    const edgeSize = Math.max(leading.offsetWidth, trailing.offsetWidth);
    this.style.setProperty('--_rc-app-bar-edge-size', `${edgeSize}px`);

    if (this.variant === 'expanded' && !this._collapsed) {
      const nextDistance = title.offsetHeight;
      if (nextDistance > 0) {
        const titleStyle = getComputedStyle(title);
        const padding =
          Number.parseFloat(titleStyle.paddingBlockStart) +
          Number.parseFloat(titleStyle.paddingBlockEnd);
        const contentHeight = Math.max(title.offsetHeight - padding, 0);
        const compactHeight = title.offsetTop;
        const endpointCompactHeight = Math.max(compactHeight, contentHeight);

        this._collapseDistance = nextDistance;
        this._collapseOffsetDistance =
          compactHeight - (endpointCompactHeight - contentHeight) / 2;
        this.style.setProperty(
          '--_rc-app-bar-collapse-distance',
          `${nextDistance}px`,
        );
        this._applyCollapseGeometry();
      }
    }
  }

  private _syncScrollObserver(): void {
    this._scroll.setOptions({
      threshold: this.scrollThreshold,
      disabled: this._scrolled !== undefined || this._resolveScrollTarget() === null,
    });
  }

  private _resolveScrollTarget(): ScrollObserverTarget | null {
    const target = this.scrollTarget;
    if (target === null || target === undefined) return null;

    if (typeof target !== 'string') return target;
    if (target === 'window') return window;

    try {
      return this.ownerDocument?.querySelector(target) ?? null;
    } catch {
      return null;
    }
  }

  private _onObservedScroll(scrollTop: number, delta: number): void {
    if (this._scrolled !== undefined) return;

    if (this.scrollBehavior === 'collapse' && this.variant === 'expanded') {
      if (this._collapseDistance <= 0) return;

      const distance = this._collapseDistance;
      const progress = Math.min(Math.max(scrollTop / distance, 0), 1);
      this._setCollapseProgress(progress >= 0.999 ? 1 : progress);
    } else {
      this._setCollapseProgress(0);
    }

    if (this.scrollBehavior === 'hide') {
      if (scrollTop <= this.scrollThreshold || delta < 0) {
        this._setHidden(false);
      } else if (delta > 0) {
        this._setHidden(true);
      }
    } else {
      this._setHidden(false);
    }
  }

  private _syncVisualState(): void {
    if (this._scrolled === undefined) {
      if (this.scrollBehavior !== 'collapse' || this.variant !== 'expanded') {
        this._setCollapseProgress(0);
      }
      if (this.scrollBehavior !== 'hide') this._setHidden(false);

      return;
    }

    const collapse = this.variant === 'expanded' && this.scrollBehavior === 'collapse';
    this._setCollapseProgress(collapse && this.scrolled ? 1 : 0);
    this._setHidden(false);
  }

  private _setCollapseProgress(progress: number): void {
    this._collapseProgress = progress;
    this.style.setProperty('--_rc-app-bar-collapse-progress', `${progress}`);
    this._applyCollapseGeometry();

    const collapsed = progress >= 1;
    if (collapsed === this._collapsed) return;

    this._collapsed = collapsed;
    this.toggleAttribute('data-collapsed', collapsed);
    this._setCustomState('collapsed', collapsed);
    this._measureLayout();
  }

  private _applyCollapseGeometry(): void {
    const offset = this._collapseOffsetDistance * this._collapseProgress;
    const remainingRow =
      this._collapseDistance * (1 - this._collapseProgress);

    this.style.setProperty('--_rc-app-bar-collapse-offset', `${-offset}px`);
    this.style.setProperty('--_rc-app-bar-expanded-size', `${remainingRow}px`);
    this.style.setProperty(
      '--_rc-app-bar-expanded-opacity',
      `${1 - this._collapseProgress}`,
    );
  }

  private _setHidden(hidden: boolean): void {
    if (hidden === this._hidden) return;

    this._hidden = hidden;
    this.toggleAttribute('data-hidden', hidden);
    this._setCustomState('hidden', hidden);
  }

  private _syncStateOutputs(): void {
    this.toggleAttribute('data-scrolled', this.scrolled);
    this._setCustomState('scrolled', this.scrolled);
    this.toggleAttribute('data-collapsed', this._collapsed);
    this.toggleAttribute('data-hidden', this._hidden);
  }

  private _setCustomState(name: string, active: boolean): void {
    if (!this._internals.states) return;

    if (active) {
      this._internals.states.add(name);
    } else {
      this._internals.states.delete(name);
    }
  }

  private _onSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const hasContent = slot.assignedElements({ flatten: true }).length > 0;

    switch (slot.name) {
      case 'leading':
        this._hasLeading = hasContent;
        break;

      case 'center':
        this._hasCenter = hasContent;
        break;

      case 'trailing':
        this._hasTrailing = hasContent;
        break;
    }

    queueMicrotask(() => this._measureLayout());
  }

  protected override render() {
    return html`
      <div
        id="root"
        part="root"
        data-has-center=${this._hasCenter ? '' : nothing}
      >
        <div
          id="leading"
          part="leading"
          class=${classMap({ empty: !this._hasLeading })}
        >
          <slot name="leading" @slotchange=${this._onSlotChange}></slot>
        </div>
        <div id="title" part="title">
          <slot @slotchange=${this._onSlotChange}></slot>
        </div>
        <div
          id="center"
          part="center"
          class=${classMap({ empty: !this._hasCenter })}
        >
          <slot name="center" @slotchange=${this._onSlotChange}></slot>
        </div>
        <div
          id="trailing"
          part="trailing"
          class=${classMap({ empty: !this._hasTrailing })}
        >
          <slot name="trailing" @slotchange=${this._onSlotChange}></slot>
        </div>
        <div id="scroll-shadow" part="scroll-shadow"></div>
      </div>
    `;
  }
}

export default RCAppBar;
