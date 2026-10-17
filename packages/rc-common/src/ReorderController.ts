import type { ReactiveController, ReactiveControllerHost } from 'lit';

import { DragGestureController, type DragGestureDetail } from './DragGestureController.js';
import { cssZoom } from './cssZoom.js';
import { findNearestScrollAncestor } from './findNearestScrollAncestor.js';
import {
  arrowKeys,
  getScrollOffset,
  isReversed,
  logicalDelta,
  logicalRect,
  physicalOffset,
  renderedOrientation,
  resolveFlow,
  type Flow,
  type LogicalAxis,
} from './flow.js';
import { LiveAnnouncer } from './LiveAnnouncer.js';

/** How the active reorder was started. */
export type ReorderMode = 'pointer' | 'keyboard';

/** Announcement text for each reorder step. Positions are 1-based. */
export interface ReorderMessages {
  /** Description written to handles that have no authored `aria-description`. */
  instructions: string;
  grabbed: (position: number, count: number) => string;
  moved: (position: number, count: number) => string;
  dropped: (position: number, count: number) => string;
  canceled: (position: number, count: number) => string;
}

export const DEFAULT_REORDER_MESSAGES: Readonly<ReorderMessages> = Object.freeze({
  instructions: 'Press Space to reorder.',
  grabbed: (position: number, count: number) =>
    `Picked up, position ${position} of ${count}. ` +
    'Use the arrow keys to move, Space to drop, Escape to cancel.',
  moved: (position: number, count: number) => `Moved to position ${position} of ${count}.`,
  dropped: (position: number, count: number) => `Dropped at position ${position} of ${count}.`,
  canceled: (position: number, count: number) =>
    `Reorder canceled. Back at position ${position} of ${count}.`,
});

export interface ReorderOptions {
  /** Reorderable items in order. Hidden items should be left out. */
  items: () => readonly HTMLElement[];

  /** Selector for the handle inside an item that starts a reorder. */
  handleSelector: string;

  /**
   * Where the live region is mounted. Defaults to the nearest open `dialog` or popover around
   * the host, else the document body. The region must not sit inside a widget whose role
   * restricts its children, such as a list, and must not sit outside an open modal dialog,
   * where it would be inert.
   */
  announcerRoot?: () => (ParentNode & Node) | null;

  /** Announcement overrides, read when each message is spoken. */
  messages?: () => Partial<ReorderMessages> | undefined;

  /** Whether reordering is currently unavailable. */
  disabled?: () => boolean;

  /** Distance from the scroll container's block edges that starts autoscroll, in px. */
  autoScrollEdge?: number;

  /**
   * Applies a move. Called once at the end of a pointer drag, and for every
   * step of a keyboard reorder, including the move back when it is canceled.
   */
  onMove: (item: HTMLElement, from: number, to: number, mode: ReorderMode) => void;

  /** Called when an item is lifted (`item` set) and when it is put down (`null`). */
  onActiveChange?: (item: HTMLElement | null, mode: ReorderMode | null) => void;
}

interface Slot {
  start: number;
  size: number;
}

interface PointerSession {
  mode: 'pointer';
  item: HTMLElement;
  from: number;
  to: number;
  flow: Flow;
  slots: Slot[];
  step: number;
  scroller: Element;
  scrollStartCssPx: number;
  pointerDeltaViewportPx: number;
  x: number;
  y: number;
}

interface KeyboardSession {
  mode: 'keyboard';
  item: HTMLElement;
  from: number;
  current: number;
  flow: Flow;
}

const AUTO_SCROLL_MAX_SPEED = 16;

/**
 * Reorders a list of items by dragging a handle or with the keyboard.
 *
 * The controller never moves DOM nodes. It previews a pointer drag with
 * inline `translate` offsets on the lifted item and the items it passes, and
 * reports each committed move through `onMove`; the host applies it, or lets
 * its consumer do so.
 *
 * Pointer: a drag starts once a handle is pressed and moved a few pixels, so a
 * plain click still focuses or activates the handle. On touch and pen, as on
 * Android, a long press anywhere else on an item also picks it up; moving
 * before the press completes scrolls instead, and the click that would follow
 * the drop is swallowed so the press does not also activate a control in the
 * item. A mouse drags only by the handle. The nearest scroll
 * container scrolls while the pointer is near its block edges, and Escape
 * cancels.
 *
 * Keyboard: Space or Enter on a focused handle picks the item up, the block-axis
 * arrow keys, Home, and End move it, Space or Enter drops it, and Escape moves it
 * back to where it started. Moving focus away drops it. Each step is announced
 * through a {@link LiveAnnouncer}, and focus follows the item's handle, including
 * when a framework re-creates the item's nodes.
 *
 * Geometry and arrow keys resolve through the flow helpers, so the block axis
 * may run in any direction.
 */
export class ReorderController implements ReactiveController {
  private readonly _host: ReactiveControllerHost & HTMLElement;
  private readonly _options: ReorderOptions;
  private readonly _gesture: DragGestureController;
  private readonly _pressGesture: DragGestureController;
  private _activeGesture: DragGestureController | null = null;
  private _pending: { item: HTMLElement } | null = null;
  private _session: PointerSession | KeyboardSession | null = null;
  private readonly _translated = new Map<HTMLElement, { value: string; priority: string }>();
  private _announcer: LiveAnnouncer | null = null;
  private _autoScrollFrame = 0;
  private _restoringFocus = false;

  constructor(host: ReactiveControllerHost & HTMLElement, options: ReorderOptions) {
    this._host = host;
    this._options = options;

    this._gesture = new DragGestureController(host, {
      target: host,
      activation: 'axis',
      axis: 'both',
      canStart: (event) => this._canStart(event),
      onStart: (detail) => this._pointerStart(detail, this._gesture),
      onMove: (detail) => this._pointerMove(detail),
      onEnd: () => this._pointerEnd(),
      onCancel: () => this._cancel(),
    });

    this._pressGesture = new DragGestureController(host, {
      target: host,
      activation: 'press',
      canStart: (event) => this._canStartPress(event),
      onStart: (detail) => this._pointerStart(detail, this._pressGesture),
      onMove: (detail) => this._pointerMove(detail),
      onEnd: (detail) => {
        const item = this._session?.mode === 'pointer' ? this._session.item : null;

        this._pointerEnd();

        if (item) {
          this._swallowNextClick(item, detail);
        }
      },
      onCancel: (detail) => {
        const item = this._session?.mode === 'pointer' ? this._session.item : null;

        this._cancel();

        if (item) {
          this._swallowNextClick(item, detail);
        }
      },
    });

    host.addController(this);
  }

  /** Whether an item is currently lifted. */
  get active(): boolean {
    return this._session !== null;
  }

  hostConnected(): void {
    this._host.addEventListener('keydown', this._onKeyDown);
    this._host.addEventListener('focusout', this._onFocusOut);
  }

  hostDisconnected(): void {
    this._host.removeEventListener('keydown', this._onKeyDown);
    this._host.removeEventListener('focusout', this._onFocusOut);
    this._end();
    this._announcer?.dispose();
    this._announcer = null;
  }

  /** Cancels any active reorder, restoring the starting position. */
  cancel(): void {
    if (this._session?.mode === 'pointer') {
      // Cancelling the gesture routes through onCancel.
      this._activeGesture?.setOptions({});

      return;
    }

    this._cancel();
  }

  /** The text of a message, honoring overrides. */
  message<K extends keyof ReorderMessages>(key: K): ReorderMessages[K] {
    return this._options.messages?.()?.[key] ?? DEFAULT_REORDER_MESSAGES[key];
  }

  private _items(): readonly HTMLElement[] {
    return this._options.items();
  }

  private _isDisabled(): boolean {
    return this._options.disabled?.() ?? false;
  }

  /** The item and handle an event landed in, if it landed on a handle. */
  private _resolve(event: Event): { item: HTMLElement; handle: HTMLElement } | null {
    const items = this._items();

    for (const $node of event.composedPath()) {
      if (!($node instanceof HTMLElement)) {
        continue;
      }

      if ($node === this._host) {
        return null;
      }

      if (!$node.matches(this._options.handleSelector)) {
        continue;
      }

      const item = items.find(($item) => $item.contains($node));

      return item ? { item, handle: $node } : null;
    }

    return null;
  }

  private _handleOf(item: HTMLElement | undefined): HTMLElement | null {
    return item?.querySelector<HTMLElement>(this._options.handleSelector) ?? null;
  }

  private _announce(message: string): void {
    const root = this._options.announcerRoot?.() ?? announcerRootFor(this._host);

    if (this._announcer?.element.parentNode !== root) {
      this._announcer?.dispose();
      this._announcer = new LiveAnnouncer(root);
    }

    this._announcer.announce(message);
  }

  // ---------------------------------------------------------------- pointer

  private _canStart(event: PointerEvent): boolean {
    if (this._session || this._isDisabled()) {
      return false;
    }

    const target = this._resolve(event);

    this._pending = target ? { item: target.item } : null;

    return target !== null;
  }

  /** Whether a touch or pen press on an item, away from its handle, may long-press it. */
  private _canStartPress(event: PointerEvent): boolean {
    if (event.pointerType === 'mouse' || this._session || this._isDisabled()) {
      return false;
    }

    // The handle drags without waiting.
    if (this._resolve(event)) {
      return false;
    }

    const path = event.composedPath();
    const item = this._items().find(($item) => path.includes($item));

    this._pending = item ? { item } : null;

    return item !== undefined;
  }

  /**
   * Swallows the click that follows lifting a pointer after a long-press
   * drag, which would otherwise activate whatever control the press began on.
   */
  private _swallowNextClick(item: HTMLElement, detail: DragGestureDetail): void {
    const document = this._host.ownerDocument;

    const swallow = (event: MouseEvent): void => {
      // Keyboard clicks have no click count. Modern pointer clicks carry the
      // original pointer ID; older MouseEvent clicks use the lifted item.
      if (
        event.detail === 0 ||
        !event.composedPath().includes(item) ||
        (event instanceof PointerEvent &&
          event.pointerId > 0 &&
          event.pointerId !== detail.pointerId)
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      stop();
    };

    const stop = (): void => {
      clearTimeout(timer);
      document.removeEventListener('click', swallow, true);
    };

    // A click from this pointer arrives right after its release, or not at all.
    const timer = setTimeout(stop, 400);

    document.addEventListener('click', swallow, true);
  }

  private _pointerStart(detail: DragGestureDetail, gesture: DragGestureController): void {
    const item = this._pending?.item;

    this._pending = null;
    this._activeGesture = gesture;

    const items = this._items();
    const from = item ? items.indexOf(item) : -1;

    if (!item || from === -1) {
      return;
    }

    const flow = resolveFlow(this._host);
    const hostRect = this._host.getBoundingClientRect();
    const slots = items.map(($item) => {
      const rect = logicalRect($item.getBoundingClientRect(), hostRect, flow);

      return { start: rect.blockStart, size: rect.blockSize };
    });

    const scroller = findNearestScrollAncestor(this._host);

    this._session = {
      mode: 'pointer',
      item,
      from,
      to: from,
      flow,
      slots,
      step: stepFor(slots, from),
      scroller,
      scrollStartCssPx: scrollOffsetAlongBlock(scroller, flow),
      pointerDeltaViewportPx: 0,
      x: detail.x,
      y: detail.y,
    };

    this._options.onActiveChange?.(item, 'pointer');
    this._announce(this.message('grabbed')(from + 1, items.length));
    this._pointerMove(detail);
  }

  private _pointerMove(detail: DragGestureDetail): void {
    const session = this._session;

    if (session?.mode !== 'pointer') {
      return;
    }

    session.x = detail.x;
    session.y = detail.y;

    session.pointerDeltaViewportPx = logicalDelta(
      { dx: detail.deltaX, dy: detail.deltaY },
      'block',
      session.flow,
    );

    this._layoutPointer(session);
    this._queueAutoScroll();
  }

  private _layoutPointer(session: PointerSession): void {
    const scrollDeltaCssPx =
      scrollOffsetAlongBlock(session.scroller, session.flow) - session.scrollStartCssPx;
    const scrollerZoom =
      session.scroller === this._host.ownerDocument.scrollingElement
        ? 1
        : cssZoom(session.scroller);
    const deltaViewportPx = session.pointerDeltaViewportPx + scrollDeltaCssPx * scrollerZoom;
    const { slots, from } = session;
    const center = slots[from].start + deltaViewportPx + slots[from].size / 2;
    let to = from;

    for (let index = from + 1; index < slots.length; index += 1) {
      if (center > slots[index].start + slots[index].size / 2) {
        to = index;
      }
    }

    for (let index = from - 1; index >= 0; index -= 1) {
      if (center < slots[index].start + slots[index].size / 2) {
        to = index;
      }
    }

    if (to !== session.to) {
      session.to = to;
      this._announce(this.message('moved')(to + 1, slots.length));
    }

    const items = this._items();

    items.forEach(($item, index) => {
      let offset = 0;

      if ($item === session.item) {
        offset = deltaViewportPx;
      } else if (index > from && index <= to) {
        offset = -session.step;
      } else if (index < from && index >= to) {
        offset = session.step;
      }

      this._translate($item, offset, session.flow);
    });
  }

  private _translate($item: HTMLElement, blockOffsetViewportPx: number, flow: Flow): void {
    if (blockOffsetViewportPx === 0) {
      this._restoreTranslation($item);

      return;
    }

    const blockOffsetCssPx = blockOffsetViewportPx / cssZoom($item);
    const { x, y } = physicalOffset({ inline: 0, block: blockOffsetCssPx }, flow);

    if (!this._translated.has($item)) {
      this._translated.set($item, {
        value: $item.style.getPropertyValue('translate'),
        priority: $item.style.getPropertyPriority('translate'),
      });
    }

    $item.style.setProperty('translate', `${x}px ${y}px`);
  }

  private _clearTranslations(): void {
    for (const $item of this._translated.keys()) {
      this._restoreTranslation($item);
    }
  }

  private _restoreTranslation($item: HTMLElement): void {
    const original = this._translated.get($item);

    if (!original) {
      return;
    }

    this._translated.delete($item);

    if (original.value) {
      $item.style.setProperty('translate', original.value, original.priority);
    } else {
      $item.style.removeProperty('translate');
    }
  }

  private _queueAutoScroll(): void {
    if (this._autoScrollFrame) {
      return;
    }

    this._autoScrollFrame = requestAnimationFrame(() => {
      this._autoScrollFrame = 0;

      const session = this._session;

      if (session?.mode !== 'pointer') {
        return;
      }

      const speed = this._autoScrollSpeed(session);

      if (speed === 0) {
        return;
      }

      const before = scrollOffsetAlongBlock(session.scroller, session.flow);

      session.scroller.scrollBy(session.flow.block === 'x' ? { left: speed } : { top: speed });

      if (scrollOffsetAlongBlock(session.scroller, session.flow) !== before) {
        this._layoutPointer(session);
        this._queueAutoScroll();
      }
    });
  }

  /** Physical scroll speed for the pointer's distance from the scroller's block edges. */
  private _autoScrollSpeed(session: PointerSession): number {
    const edge = this._options.autoScrollEdge ?? 48;
    const { scroller, flow } = session;
    const document = this._host.ownerDocument;
    const rect =
      scroller === document.scrollingElement || scroller === document.documentElement
        ? new DOMRect(0, 0, window.innerWidth, window.innerHeight)
        : scroller.getBoundingClientRect();
    const horizontal = flow.block === 'x';
    const position = horizontal ? session.x : session.y;
    const min = horizontal ? rect.left : rect.top;
    const max = horizontal ? rect.right : rect.bottom;
    const ramp = (distance: number) =>
      Math.ceil(((edge - Math.max(0, distance)) / edge) * AUTO_SCROLL_MAX_SPEED);

    if (position - min < edge) {
      return -ramp(position - min);
    }

    if (max - position < edge) {
      return ramp(max - position);
    }

    return 0;
  }

  private _pointerEnd(): void {
    const session = this._session;

    if (session?.mode !== 'pointer') {
      return;
    }

    const { item, from, to } = session;
    const count = session.slots.length;

    // Ending the lifted state first drops any reorder transitions, so clearing
    // the preview offsets and the committed DOM move land in one frame.
    this._end();

    if (to !== from) {
      this._commit(item, from, to, 'pointer');
    }

    this._announce(this.message('dropped')(to + 1, count));
  }

  // --------------------------------------------------------------- keyboard

  private readonly _onKeyDown = (event: KeyboardEvent): void => {
    const session = this._session;

    if (session?.mode === 'pointer') {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.cancel();
      }

      return;
    }

    if (session?.mode === 'keyboard') {
      const target = this._resolve(event);
      const currentItem = this._items()[session.current];

      if (!target || target.item !== currentItem) {
        this._drop();

        return;
      }

      this._keyboardStep(event, session);

      return;
    }

    if ((event.key !== ' ' && event.key !== 'Enter') || this._isDisabled()) {
      return;
    }

    const target = this._resolve(event);

    if (!target) {
      return;
    }

    event.preventDefault();

    const items = this._items();
    const from = items.indexOf(target.item);

    this._session = {
      mode: 'keyboard',
      item: target.item,
      from,
      current: from,
      flow: resolveFlow(this._host),
    };

    this._host.ownerDocument.addEventListener('pointerdown', this._onDocumentPointerDown, true);
    this._options.onActiveChange?.(target.item, 'keyboard');
    this._announce(this.message('grabbed')(from + 1, items.length));
  };

  private _keyboardStep(event: KeyboardEvent, session: KeyboardSession): void {
    const count = this._items().length;
    const keys = arrowKeys(renderedOrientation('vertical', session.flow), session.flow);
    let to: number | undefined;

    switch (event.key) {
      case keys.next:
        to = Math.min(count - 1, session.current + 1);
        break;
      case keys.prev:
        to = Math.max(0, session.current - 1);
        break;
      case 'Home':
        to = 0;
        break;
      case 'End':
        to = count - 1;
        break;
      case ' ':
      case 'Enter':
        event.preventDefault();
        this._drop();

        return;

      case 'Escape': {
        event.preventDefault();
        event.stopPropagation();

        const { item, current, from } = session;

        this._end();

        if (current !== from) {
          this._commit(item, current, from, 'keyboard');
        }

        this._announce(this.message('canceled')(from + 1, count));

        return;
      }

      default:
        return;
    }

    event.preventDefault();

    if (to === session.current) {
      return;
    }

    this._commit(session.item, session.current, to, 'keyboard');
    session.current = to;
    this._announce(this.message('moved')(to + 1, count));
  }

  private readonly _onFocusOut = (event: FocusEvent): void => {
    const session = this._session;

    if (session?.mode !== 'keyboard' || this._restoringFocus) {
      return;
    }

    const next = event.relatedTarget;

    if (next instanceof Node) {
      const currentItem = this._items()[session.current];
      const $handle = this._handleOf(currentItem);

      if (!$handle?.contains(next)) {
        this._drop();
      }

      return;
    }

    // Focus went nowhere: the handle's node moved or was replaced, which some
    // engines report after the move. Put focus back rather than dropping;
    // a press elsewhere still drops through _onDocumentPointerDown.
    requestAnimationFrame(() => {
      if (this._session !== session) {
        return;
      }

      const $active = deepActiveElement(this._host.ownerDocument);
      const items = this._items();
      const $item = items.includes(session.item) ? session.item : items[session.current];
      const $handle = this._handleOf($item);

      if ($active && $active !== this._host.ownerDocument.body && !$handle?.contains($active)) {
        this._drop();
      } else if ($handle && $active !== $handle) {
        $handle.focus();
      }
    });
  };

  private readonly _onDocumentPointerDown = (event: PointerEvent): void => {
    const session = this._session;

    if (session?.mode !== 'keyboard') {
      return;
    }

    const $handle = this._handleOf(this._items()[session.current]);

    if (!$handle || !event.composedPath().includes($handle)) {
      this._drop();
    }
  };

  /** Ends a keyboard reorder where the item now is. */
  private _drop(): void {
    if (this._session?.mode !== 'keyboard') {
      return;
    }

    const count = this._items().length;
    const position = this._session.current + 1;

    this._end();
    this._announce(this.message('dropped')(position, count));
  }

  // ----------------------------------------------------------------- shared

  /**
   * Applies a move and keeps focus on the moved item's handle. Moving a node
   * drops its focus, and a framework may replace the node outright, so the
   * handle is looked up again once the host has rendered.
   */
  private _commit(item: HTMLElement, from: number, to: number, mode: ReorderMode): void {
    const $focused = this._handleOf(item);
    const hadFocus = $focused !== null && $focused === deepActiveElement(this._host.ownerDocument);

    this._restoringFocus = hadFocus;

    try {
      this._options.onMove(item, from, to, mode);
    } finally {
      if (!hadFocus) {
        this._restoringFocus = false;
      }
    }

    if (!hadFocus) {
      return;
    }

    requestAnimationFrame(() => {
      const items = this._items();
      const moved = items.includes(item) ? item : items[to];
      const $handle = this._handleOf(moved);

      if (this._session?.mode === 'keyboard' && moved && moved !== this._session.item) {
        this._session.item = moved;
      }

      if (this._session?.mode === 'keyboard' && moved) {
        this._session.current = items.indexOf(moved);
      }

      if ($handle && deepActiveElement(this._host.ownerDocument) !== $handle) {
        $handle.focus();
      }

      this._restoringFocus = false;
    });
  }

  private _cancel(): void {
    const session = this._session;

    if (!session) {
      return;
    }

    const count = this._items().length;

    this._end();

    if (session.mode === 'keyboard' && session.current !== session.from) {
      this._commit(session.item, session.current, session.from, 'keyboard');
    }

    this._announce(this.message('canceled')(session.from + 1, count));
  }

  private _end(): void {
    if (this._autoScrollFrame) {
      cancelAnimationFrame(this._autoScrollFrame);
      this._autoScrollFrame = 0;
    }

    const hadSession = this._session !== null;

    this._host.ownerDocument.removeEventListener('pointerdown', this._onDocumentPointerDown, true);
    this._session = null;
    this._pending = null;
    this._activeGesture = null;

    if (hadSession) {
      this._options.onActiveChange?.(null, null);
    }

    this._clearTranslations();
  }
}

/** Scroller position along the host's block axis, using the scroller's own scroll origin. */
function scrollOffsetAlongBlock(scroller: Element, hostFlow: Flow): number {
  const scrollerFlow = resolveFlow(scroller);
  const axis: LogicalAxis = scrollerFlow.block === hostFlow.block ? 'block' : 'inline';
  const offset = getScrollOffset(scroller, axis, scrollerFlow);

  return isReversed(axis, scrollerFlow) === hostFlow.blockReversed ? offset : -offset;
}

/** Distance the neighbors of the lifted slot shift by: its size plus the gap after it. */
function stepFor(slots: readonly Slot[], index: number): number {
  const slot = slots[index];
  const next = slots[index + 1];
  const previous = slots[index - 1];

  if (next) {
    return next.start - slot.start;
  }

  if (previous) {
    return slot.start + slot.size - (previous.start + previous.size);
  }

  return slot.size;
}

/** The nearest open dialog or popover around `$host`, across shadow roots, else the body. */
function announcerRootFor($host: HTMLElement): ParentNode & Node {
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

function deepActiveElement(document: Document): Element | null {
  let $active = document.activeElement;

  while ($active?.shadowRoot?.activeElement) {
    $active = $active.shadowRoot.activeElement;
  }

  return $active;
}

export default ReorderController;
