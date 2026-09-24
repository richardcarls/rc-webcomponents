import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import {
  getScrollOffset,
  inlineArrowKeys,
  isFocusable,
  logicalRect,
  resolveFlow,
  RovingTabIndexMixin,
  setScrollOffset,
} from '@rcarls/rc-common';
import type { RCChip } from '@rcarls/rc-chip';

import chipGroupStyles from './rc-chip-group.styles.js';

export type RCChipGroupLayout = 'auto' | 'wrap' | 'scroll';
export type RCChipGroupKind = 'generic' | 'assist' | 'filter';
export type RCChipGroupSelection = 'none' | 'single' | 'multiple';

export interface RCChipGroupToggleDetail {
  /** Expanded state requested by the user. */
  expanded: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-chip-group': RCChipGroup;
  }

  interface HTMLElementEventMap {
    'rc-chip-group-toggle': CustomEvent<RCChipGroupToggleDetail>;
  }
}

/**
 * Adaptive chip layout for native controls, `rc-chip`, and arbitrary elements.
 * Natural wrapping is kept while content fits within `max-rows`; overflowing
 * auto groups collapse to one horizontally scrolling row with a leading
 * Show all action.
 *
 * Assist groups expose toolbar semantics and roving arrow-key navigation.
 * Filter groups preserve native radio/checkbox behavior: author a `<fieldset>`
 * around the group, then place one native input in each direct-child chip label.
 * Generic groups are layout-only and do not coordinate their children.
 *
 * @slot - Direct chip or arbitrary-element children.
 *
 * @fires rc-chip-group-toggle - Fired after the user activates Show all or Show less.
 *
 * @csspart root - Flex layout and horizontal scroll container.
 * @csspart toggle - Internal leading disclosure chip.
 * @csspart toggle-icon - MDI tune icon inside the disclosure chip.
 * @csspart toggle-separator - Vertical separator after the disclosure chip.
 *
 * @attr layout - Layout strategy: `auto`, `wrap`, or `scroll`.
 * @attr max-rows - Maximum natural rows before auto layout collapses.
 * @attr kind - Coordination mode: `generic`, `assist`, or `filter`.
 * @attr selection - Filter semantics hint: `none`, `single`, or `multiple`.
 * @attr expanded - Current auto-layout disclosure state. Host writes are silent.
 * @attr default-expanded - Initial uncontrolled disclosure state.
 * @attr label - Accessible label for assist-toolbar semantics.
 * @attr show-all-label - Label for the collapsed overflow action.
 * @attr show-less-label - Label for the expanded overflow action.
 *
 * @cssprop [--rc-chip-group-column-gap=0.5rem] - Inline gap between items.
 * @cssprop [--rc-chip-group-row-gap=0] - Block gap between wrapped rows.
 * @cssprop [--rc-chip-group-padding-block=0] - Group block-axis padding.
 * @cssprop [--rc-chip-group-scroll-padding-inline=0] - Horizontal scroll padding.
 * @cssprop [--rc-chip-group-scrollbar-width=none] - Standards-based scrollbar width.
 * @cssprop [--rc-chip-group-scrollbar-display=none] - WebKit scrollbar display.
 * @cssprop [--rc-chip-group-toggle-gap=0.5rem] - Gap between the disclosure icon and label.
 * @cssprop [--rc-chip-group-toggle-separator-gap=0.5rem] - Gap before the disclosure separator.
 * @cssprop [--rc-chip-group-toggle-icon-size=1.125rem] - Disclosure icon size.
 * @cssprop [--rc-chip-group-toggle-separator-block-size=1.5rem] - Separator block size.
 * @cssprop [--rc-chip-group-toggle-separator-inline-size=1px] - Separator thickness.
 * @cssprop [--rc-chip-group-toggle-separator-color=currentColor] - Separator color.
 */
export class RCChipGroup extends RovingTabIndexMixin(LitElement) {
  static override styles = chipGroupStyles;

  private _expanded: boolean | undefined;
  private _defaultExpanded = false;
  private _uncontrolledExpanded: boolean | undefined;
  private _expandedInitialized = false;
  private _measureFrame: number | undefined;
  private _targetVisibilityFrame: number | undefined;
  private _pendingScrollOffset: number | undefined;
  private _pendingScrollTarget: HTMLElement | undefined;

  /** Chips run vertically (vertical writing mode); drives aria-orientation. */
  @state()
  private _inlineVertical = false;

  @state()
  private _overflowing = false;

  @query('#root', true)
  protected _$root!: HTMLDivElement;

  @query('#items', true)
  private _$slot!: HTMLSlotElement;

  @query('#toggle', true)
  private _$toggle!: RCChip;

  @query('#toggle-wrap', true)
  private _$toggleWrap!: HTMLSpanElement;

  private _resizeObserver: ResizeObserver | null = null;

  private _mutationObserver: MutationObserver | null = null;
  private readonly _authoredVariants = new Map<RCChip, RCChip['variant']>();

  /** Layout strategy. */
  @property({ reflect: true })
  layout: RCChipGroupLayout = 'auto';

  /** Maximum natural rows before auto layout collapses to horizontal scrolling. */
  @property({ type: Number, attribute: 'max-rows', reflect: true })
  maxRows = 2;

  /** Child coordination mode. */
  @property({ reflect: true })
  kind: RCChipGroupKind = 'generic';

  /** Native filter selection hint. */
  @property({ reflect: true })
  selection: RCChipGroupSelection = 'none';

  /** Accessible label used when `kind="assist"` exposes toolbar semantics. */
  @property()
  label = 'Chip actions';

  /** Collapsed overflow action label. */
  @property({ attribute: 'show-all-label' })
  showAllLabel = 'Show all';

  /** Expanded overflow action label. */
  @property({ attribute: 'show-less-label' })
  showLessLabel = 'Show less';

  /** Current auto-layout disclosure state. Host writes are silent. */
  @property({ type: Boolean, reflect: true })
  get expanded(): boolean {
    return this._expanded ?? this._uncontrolledExpanded ?? this._defaultExpanded;
  }

  set expanded(value: boolean | undefined) {
    const oldValue = this.expanded;

    this._expanded = value;
    this._expandedInitialized = true;
    this.requestUpdate('expanded', oldValue);
  }

  /** Initial uncontrolled disclosure state. */
  @property({ type: Boolean, attribute: 'default-expanded' })
  get defaultExpanded(): boolean {
    return this._defaultExpanded;
  }

  set defaultExpanded(value: boolean) {
    const oldValue = this._defaultExpanded;

    this._defaultExpanded = value;

    if (
      !this._expandedInitialized &&
      this._expanded === undefined &&
      this._uncontrolledExpanded === undefined
    ) {
      this.requestUpdate('expanded', oldValue);
    }

    this.requestUpdate('defaultExpanded', oldValue);
  }

  override connectedCallback(): void {
    super.connectedCallback();

    if (typeof ResizeObserver === 'function') {
      this._resizeObserver ??= new ResizeObserver(() => this._scheduleMeasure());
      this._resizeObserver.observe(this);
    }

    if (typeof MutationObserver === 'function') {
      this._mutationObserver ??= new MutationObserver(() => {
        this._syncNativeSelection();
        this._scheduleMeasure();
      });

      this._mutationObserver.observe(this, {
        subtree: true,
        attributes: true,
        attributeFilter: ['checked', 'disabled', 'hidden'],
      });
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
    this._mutationObserver?.disconnect();

    if (this._measureFrame !== undefined) {
      cancelAnimationFrame(this._measureFrame);
      this._measureFrame = undefined;
    }

    if (this._targetVisibilityFrame !== undefined) {
      cancelAnimationFrame(this._targetVisibilityFrame);
      this._targetVisibilityFrame = undefined;
    }

    this._pendingScrollOffset = undefined;
    this._pendingScrollTarget = undefined;
    this._restoreAuthoredVariants();
  }

  protected override firstUpdated(): void {
    this._syncAssignedItems();
    this._observeAssignedItems();
    this._scheduleMeasure();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('kind')) {
      this._syncAssignedItems();
      this._$slot.dispatchEvent(new Event('slotchange'));
    }

    if (changed.has('layout') || changed.has('maxRows') || changed.has('expanded')) {
      this._scheduleMeasure();
    }
  }

  protected override _collectItems($slot: HTMLSlotElement): Element[] {
    if (this.kind !== 'assist') {
      return [];
    }

    const $toggleButton = this._$toggle?.querySelector(':scope > button');
    const items = $slot.assignedElements().flatMap(($element) => {
      if ($element.matches('rc-button, rc-chip')) {
        const $button = $element.querySelector(':scope > button');

        return $button ? [$button] : [];
      }

      return this._isAssistItem($element) ? [$element] : [];
    });

    return $toggleButton ? [$toggleButton, ...items] : items;
  }

  protected override _initItems(): void {
    super._initItems();

    const $target = this._lastFocused ?? this.firstItem;

    queueMicrotask(() => {
      if (this.kind === 'assist' && this.matches(':focus-within')) {
        this.focusItem($target);
      }
    });
  }

  private _isAssistItem($element: Element): boolean {
    if (
      $element instanceof HTMLButtonElement ||
      $element instanceof HTMLInputElement ||
      $element instanceof HTMLSelectElement ||
      $element instanceof HTMLTextAreaElement
    ) {
      return true;
    }

    if ($element instanceof HTMLAnchorElement || $element instanceof HTMLAreaElement) {
      return $element.hasAttribute('href');
    }

    return isFocusable($element);
  }

  private readonly _handleKeyDown = (event: KeyboardEvent): void => {
    if (
      this.kind !== 'assist' ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    ) {
      return;
    }

    // Chips run along the inline axis, so the keys follow whichever physical
    // axis that is and whichever way it runs: ArrowLeft for next in RTL,
    // ArrowDown in vertical text.
    const keys = inlineArrowKeys(resolveFlow(this._$root));

    switch (event.key) {
      case keys.next:
        event.preventDefault();
        this.focusItem(this.nextItem);
        break;
      case keys.prev:
        event.preventDefault();
        this.focusItem(this.previousItem);
        break;
      case 'Home':
        event.preventDefault();
        this.focusFirst();
        break;
      case 'End':
        event.preventDefault();
        this.focusLast();
        break;
    }
  };

  private _handleSlotChange(event: Event): void {
    this._onSlotChange(event);

    queueMicrotask(() => {
      if (!this.isConnected) {
        return;
      }

      this._syncAssignedItems();
      this._observeAssignedItems();
      this._scheduleMeasure();
    });
  }

  private _assignedElements(): HTMLElement[] {
    return this._$slot
      .assignedElements({ flatten: true })
      .filter(($element): $element is HTMLElement => $element instanceof HTMLElement);
  }

  private _syncAssignedItems(): void {
    const variant = this.kind === 'assist' ? 'assist' : this.kind === 'filter' ? 'filter' : null;
    const $assignedChips = this._assignedElements().filter(
      ($element): $element is RCChip => $element.localName === 'rc-chip',
    );

    for (const [$chip, authoredVariant] of this._authoredVariants) {
      if (!variant || !$assignedChips.includes($chip)) {
        $chip.variant = authoredVariant;
        this._authoredVariants.delete($chip);
      }
    }

    if (variant) {
      for (const $chip of $assignedChips) {
        if (!this._authoredVariants.has($chip)) {
          this._authoredVariants.set($chip, $chip.variant);
        }

        $chip.variant = variant;
      }
    }

    this._syncNativeSelection();
    this._validateFilterItems();
  }

  private _observeAssignedItems(): void {
    this._resizeObserver?.disconnect();
    this._resizeObserver?.observe(this);

    for (const $element of this._assignedElements()) {
      this._resizeObserver?.observe($element);
    }
  }

  private _syncNativeSelection(): void {
    if (this.kind !== 'filter') {
      return;
    }

    for (const $element of this._assignedElements()) {
      if ($element.localName !== 'rc-chip') {
        continue;
      }

      ($element as RCChip).syncNativeSelection();
    }
  }

  private _restoreAuthoredVariants(): void {
    for (const [$chip, variant] of this._authoredVariants) {
      $chip.variant = variant;
    }

    this._authoredVariants.clear();
  }

  private _validateFilterItems(): void {
    if (this.kind !== 'filter' || this.selection === 'none' || !import.meta.env.DEV) {
      return;
    }

    const expectedType = this.selection === 'single' ? 'radio' : 'checkbox';
    const invalid = this._assignedElements().filter(($element) => {
      if ($element.localName !== 'rc-chip') {
        return false;
      }

      return !$element.querySelector(`:scope > label > input[type="${expectedType}"]`);
    });

    if (invalid.length > 0) {
      console.warn(
        `[rc-chip-group] selection="${this.selection}" expects each rc-chip to contain a native ${expectedType} input.`,
        invalid,
      );
    }
  }

  private readonly _handleChange = (event: Event): void => {
    if (this._resolvedLayout === 'scroll') {
      if (this._targetVisibilityFrame !== undefined) {
        cancelAnimationFrame(this._targetVisibilityFrame);
        this._targetVisibilityFrame = undefined;
      }

      this._pendingScrollOffset = this._inlineScrollOffset();

      const assigned = new Set(this._assignedElements());

      this._pendingScrollTarget = event
        .composedPath()
        .find(
          ($target): $target is HTMLElement =>
            $target instanceof HTMLElement && assigned.has($target),
        );
    }

    queueMicrotask(() => {
      this._syncNativeSelection();
      this._scheduleMeasure();
    });
  };

  private readonly _toggleExpanded = (): void => {
    const oldValue = this.expanded;
    const requestedExpanded = !oldValue;

    if (this._expanded === undefined) {
      this._uncontrolledExpanded = requestedExpanded;
      this.requestUpdate('expanded', oldValue);
    }

    this.dispatchEvent(
      new CustomEvent<RCChipGroupToggleDetail>('rc-chip-group-toggle', {
        bubbles: true,
        composed: true,
        detail: { expanded: requestedExpanded },
      }),
    );
  };

  private _scheduleMeasure(): void {
    if (this._measureFrame !== undefined || !this.isConnected) {
      return;
    }

    this._measureFrame = requestAnimationFrame(() => {
      this._measureFrame = undefined;
      this._measureRows();
    });
  }

  private _measureRows(): void {
    // aria-orientation reports how the chips actually render, like a native
    // range input made vertical by writing-mode: vertical in vertical text.
    const vertical = resolveFlow(this._$root).inline === 'y';

    if (vertical !== this._inlineVertical) {
      this._inlineVertical = vertical;
    }

    if (this.layout !== 'auto') {
      if (this.layout === 'scroll' && this._pendingScrollOffset !== undefined) {
        const $target = this._pendingScrollTarget;

        this._setInlineScrollOffset(this._pendingScrollOffset);
        this._keepTargetVisible($target);
        this._scheduleTargetVisibility($target);
      }

      this._pendingScrollOffset = undefined;
      this._pendingScrollTarget = undefined;

      if (this._overflowing) {
        this._overflowing = false;
      }

      return;
    }

    const items = this._assignedElements().filter(($element) => !$element.hidden);
    const wasScrolling = this._resolvedLayout === 'scroll';
    const scrollOffset = this._pendingScrollOffset ?? this._inlineScrollOffset();
    const flow = resolveFlow(this._$root);
    const rootRect = this._$root.getBoundingClientRect();

    this._$root.toggleAttribute('data-measuring', true);
    this._$toggleWrap.hidden = true;

    const rowStarts: number[] = [];

    // Rows stack along the block axis, which is horizontal in vertical text.
    for (const $item of items) {
      const start = logicalRect($item.getBoundingClientRect(), rootRect, flow).blockStart;

      if (!rowStarts.some((rowStart) => Math.abs(rowStart - start) < 1)) {
        rowStarts.push(start);
      }
    }

    this._$root.removeAttribute('data-measuring');

    const nextOverflowing = rowStarts.length > Math.max(1, Math.floor(this.maxRows || 1));

    this._$toggleWrap.hidden = !nextOverflowing;

    if (nextOverflowing !== this._overflowing) {
      this._overflowing = nextOverflowing;

      void this.updateComplete.then(() => {
        if (this.kind === 'assist') {
          this._initItems();
        }
      });
    }

    if (wasScrolling && this._resolvedLayout === 'scroll') {
      const $target = this._pendingScrollTarget;

      this._setInlineScrollOffset(scrollOffset);
      this._keepTargetVisible($target);
      this._scheduleTargetVisibility($target);
    }

    this._pendingScrollOffset = undefined;
    this._pendingScrollTarget = undefined;
  }

  private _keepTargetVisible($target: HTMLElement | undefined): void {
    if (!$target?.isConnected || !this.contains($target)) {
      return;
    }

    const flow = resolveFlow(this._$root);
    const root = logicalRect(
      this._$root.getBoundingClientRect(),
      this._$root.getBoundingClientRect(),
      flow,
    );
    const target = logicalRect(
      $target.getBoundingClientRect(),
      this._$root.getBoundingClientRect(),
      flow,
    );
    const targetEnd = target.inlineStart + target.inlineSize;
    const delta =
      target.inlineStart < 0
        ? target.inlineStart
        : targetEnd > root.inlineSize
          ? targetEnd - root.inlineSize
          : 0;

    if (delta !== 0) {
      this._setInlineScrollOffset(this._inlineScrollOffset() + delta);
    }
  }

  /** Scroll distance from the root's inline start, never negative. */
  private _inlineScrollOffset(): number {
    return getScrollOffset(this._$root, 'inline', resolveFlow(this._$root));
  }

  private _setInlineScrollOffset(offset: number): void {
    setScrollOffset(this._$root, 'inline', offset, resolveFlow(this._$root));
  }

  private _scheduleTargetVisibility($target: HTMLElement | undefined): void {
    if (!$target) {
      return;
    }

    this._targetVisibilityFrame = requestAnimationFrame(() => {
      this._targetVisibilityFrame = undefined;

      if (this._resolvedLayout === 'scroll') {
        this._keepTargetVisible($target);
      }
    });
  }

  private get _resolvedLayout(): 'wrap' | 'scroll' {
    if (this.layout === 'scroll') {
      return 'scroll';
    }

    if (this.layout === 'auto' && this._overflowing && !this.expanded) {
      return 'scroll';
    }

    return 'wrap';
  }

  protected override render() {
    const assist = this.kind === 'assist';
    const showToggle = this.layout === 'auto' && this._overflowing;

    return html`
      <div
        id="root"
        part="root"
        data-mode=${this._resolvedLayout}
        role=${assist ? 'toolbar' : nothing}
        aria-label=${assist ? this.label : nothing}
        aria-orientation=${assist && this._inlineVertical ? 'vertical' : nothing}
        @keydown=${this._handleKeyDown}
        @change=${{ handleEvent: this._handleChange, capture: true }}
      >
        <span id="toggle-wrap" ?hidden=${!showToggle}>
          <rc-chip id="toggle" part="toggle" variant="assist">
            <button type="button" ?disabled=${!showToggle} @click=${this._toggleExpanded}>
              <svg
                part="toggle-icon"
                data-rc-chip-icon
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 24 24"
              >
                <path
                  fill="currentColor"
                  d="M3 17v2h6v-2zM3 5v2h10V5zm10 16v-2h8v-2h-8v-2h-2v6zM7 9v2H3v2h4v2h2V9zm14 4v-2H11v2zm-6-4h2V7h4V5h-4V3h-2z"
                ></path>
              </svg>
              ${this.expanded ? this.showLessLabel : this.showAllLabel}
            </button>
          </rc-chip>
          <span id="toggle-separator" part="toggle-separator" aria-hidden="true"></span>
        </span>
        <div id="slot-wrap" @focusin=${this._handleItemFocus}>
          <slot id="items" @slotchange=${this._handleSlotChange}></slot>
        </div>
      </div>
    `;
  }
}

export default RCChipGroup;
