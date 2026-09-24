/**
 * Writing-mode and direction aware geometry.
 *
 * Components describe layout in logical terms (the block axis lines stack
 * along, the inline axis text runs along, a start and an end on each), but the
 * DOM reports everything physically: `scrollLeft`, `clientX`, `rect.left`,
 * `ArrowRight`. This module is the single place that translates between the
 * two, so no component compares `direction` or `writing-mode` by hand.
 *
 * Resolve a {@link Flow} with {@link resolveFlow} at interaction or measure
 * time rather than caching it for the element's lifetime: a `dir` change on an
 * ancestor fires no event.
 */

export type LogicalAxis = 'block' | 'inline';
export type PhysicalAxis = 'x' | 'y';
export type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

export interface Flow {
  /** Physical axis text runs along. */
  inline: PhysicalAxis;
  /** Physical axis lines stack along. */
  block: PhysicalAxis;
  /** The inline start is on the right (x) or the bottom (y). */
  inlineReversed: boolean;
  /** The block start is on the right (vertical-rl, sideways-rl). */
  blockReversed: boolean;
  /** Computed `direction` is `rtl`. */
  rtl: boolean;
}

export interface LogicalRect {
  inlineStart: number;
  blockStart: number;
  inlineSize: number;
  blockSize: number;
}

export interface ArrowKeyMap {
  /** Moves to the next item along the orientation. */
  next: ArrowKey;
  /** Moves to the previous item along the orientation. */
  prev: ArrowKey;
  /** Crosses the orientation toward the flow's end, e.g. opening a submenu. */
  openFirst: ArrowKey;
  /** Crosses the orientation toward the flow's start. */
  openLast: ArrowKey;
}

/** The ordinary left-to-right, top-to-bottom flow, for callers with no element yet. */
export const HORIZONTAL_LTR_FLOW: Readonly<Flow> = Object.freeze({
  inline: 'x',
  block: 'y',
  inlineReversed: false,
  blockReversed: false,
  rtl: false,
});

/** Reads the computed writing mode and direction of `el`. */
export function resolveFlow(el: Element): Flow {
  const styles = getComputedStyle(el);
  const rtl = styles.direction === 'rtl';

  switch (styles.writingMode) {
    case 'vertical-rl':
    case 'sideways-rl':
      return { inline: 'y', block: 'x', inlineReversed: rtl, blockReversed: true, rtl };

    case 'vertical-lr':
      return { inline: 'y', block: 'x', inlineReversed: rtl, blockReversed: false, rtl };

    case 'sideways-lr':
      // Glyphs are rotated counterclockwise, so text runs bottom to top.
      return { inline: 'y', block: 'x', inlineReversed: !rtl, blockReversed: false, rtl };

    default:
      return { inline: 'x', block: 'y', inlineReversed: rtl, blockReversed: false, rtl };
  }
}

/** The physical axis a logical axis runs along. */
export function physicalAxis(axis: LogicalAxis, flow: Flow): PhysicalAxis {
  return axis === 'inline' ? flow.inline : flow.block;
}

/** Whether a logical axis starts on the right (x) or the bottom (y). */
export function isReversed(axis: LogicalAxis, flow: Flow): boolean {
  return axis === 'inline' ? flow.inlineReversed : flow.blockReversed;
}

/** Whether a physical axis runs right to left (x) or bottom to top (y) in this flow. */
function isPhysicalReversed(axis: PhysicalAxis, flow: Flow): boolean {
  return flow.inline === axis ? flow.inlineReversed : flow.blockReversed;
}

/**
 * Distance scrolled from the logical start of `axis`, never negative.
 *
 * Scroll offsets on an axis that starts on the right or bottom run from 0
 * toward negative values (CSSOM View). `flow` must be the scroll container's
 * own flow, since that is what decides where its scroll origin is.
 */
export function getScrollOffset(el: Element, axis: LogicalAxis, flow: Flow): number {
  const raw = physicalAxis(axis, flow) === 'x' ? el.scrollLeft : el.scrollTop;

  return isReversed(axis, flow) ? Math.abs(raw) : raw;
}

/** Scrolls `el` so that it is `offset` pixels from the logical start of `axis`. */
export function setScrollOffset(
  el: Element,
  axis: LogicalAxis,
  offset: number,
  flow: Flow,
  behavior: ScrollBehavior = 'auto',
): void {
  const raw = isReversed(axis, flow) ? -offset : offset;

  if (physicalAxis(axis, flow) === 'x') {
    el.scrollTo({ left: raw, behavior });
  } else {
    el.scrollTo({ top: raw, behavior });
  }
}

/** Visible size of `el` along `axis`. */
export function clientSize(el: Element, axis: LogicalAxis, flow: Flow): number {
  return physicalAxis(axis, flow) === 'x' ? el.clientWidth : el.clientHeight;
}

/** Scrollable content size of `el` along `axis`. */
export function scrollSize(el: Element, axis: LogicalAxis, flow: Flow): number {
  return physicalAxis(axis, flow) === 'x' ? el.scrollWidth : el.scrollHeight;
}

function startOffset(
  rect: DOMRectReadOnly,
  container: DOMRectReadOnly,
  axis: PhysicalAxis,
  reversed: boolean,
): number {
  if (axis === 'x') {
    return reversed ? container.right - rect.right : rect.left - container.left;
  }

  return reversed ? container.bottom - rect.bottom : rect.top - container.top;
}

/** `rect` expressed as logical offsets from the start edges of `container`. */
export function logicalRect(
  rect: DOMRectReadOnly,
  container: DOMRectReadOnly,
  flow: Flow,
): LogicalRect {
  return {
    inlineStart: startOffset(rect, container, flow.inline, flow.inlineReversed),
    blockStart: startOffset(rect, container, flow.block, flow.blockReversed),
    inlineSize: flow.inline === 'x' ? rect.width : rect.height,
    blockSize: flow.block === 'x' ? rect.width : rect.height,
  };
}

/**
 * The physical translation for a logical offset from the start corner, the
 * inverse of {@link logicalRect}. An element anchored with
 * `inset-inline-start: 0; inset-block-start: 0` reaches `offset` with
 * `translate(x, y)`; in RTL that means a negative `x`.
 */
export function physicalOffset(
  offset: { inline: number; block: number },
  flow: Flow,
): { x: number; y: number } {
  const inline = flow.inlineReversed ? -offset.inline : offset.inline;
  const block = flow.blockReversed ? -offset.block : offset.block;

  return flow.inline === 'x' ? { x: inline, y: block } : { x: block, y: inline };
}

/** A physical pointer delta projected onto `axis`, positive toward its end. */
export function logicalDelta(
  delta: { dx: number; dy: number },
  axis: LogicalAxis,
  flow: Flow,
): number {
  const value = physicalAxis(axis, flow) === 'x' ? delta.dx : delta.dy;

  return isReversed(axis, flow) ? -value : value;
}

/**
 * Arrow keys for an ARIA `orientation`.
 *
 * `aria-orientation` is physical, so `horizontal` always means the Left and
 * Right keys. Which of them means "next" follows the flow along that physical
 * axis: in RTL, and in `vertical-rl` where lines stack right to left, next is
 * ArrowLeft. The cross axis follows the same rule, so a vertical menu in RTL
 * opens its submenu with ArrowLeft, as the APG describes.
 */
export function arrowKeys(orientation: 'horizontal' | 'vertical', flow: Flow): ArrowKeyMap {
  const xReversed = isPhysicalReversed('x', flow);
  const yReversed = isPhysicalReversed('y', flow);
  const xForward: ArrowKey = xReversed ? 'ArrowLeft' : 'ArrowRight';
  const xBackward: ArrowKey = xReversed ? 'ArrowRight' : 'ArrowLeft';
  const yForward: ArrowKey = yReversed ? 'ArrowUp' : 'ArrowDown';
  const yBackward: ArrowKey = yReversed ? 'ArrowDown' : 'ArrowUp';

  return orientation === 'horizontal'
    ? { next: xForward, prev: xBackward, openFirst: yForward, openLast: yBackward }
    : { next: yForward, prev: yBackward, openFirst: xForward, openLast: xBackward };
}
