import { isPhysicalReversed, type Flow } from './flow.js';

/**
 * A placement on a fixed physical side: what {@link resolveAnchorPlacement}
 * returns after resolving an {@link AnchorPlacement} against the flow. It is
 * an output only; placements are always given logically.
 */
export type PhysicalAnchorPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

/**
 * Where to place the floating element relative to its anchor, in logical
 * terms that follow the writing mode and direction.
 *
 * The side is `block-start`/`block-end` (above/below a row in horizontal text,
 * to its sides in vertical text) or `inline-start`/`inline-end` (beside it
 * along the reading direction, so `inline-end` opens to the left in RTL). The
 * optional `-start`/`-end` suffix aligns to the start or end edge along the
 * other axis, so `block-end-start` aligns right edges in RTL.
 */
export type AnchorPlacement =
  | 'block-start'
  | 'block-start-start'
  | 'block-start-end'
  | 'block-end'
  | 'block-end-start'
  | 'block-end-end'
  | 'inline-start'
  | 'inline-start-start'
  | 'inline-start-end'
  | 'inline-end'
  | 'inline-end-start'
  | 'inline-end-end';

/**
 * Resolves a placement to a physical side and alignment for a given flow.
 * The side maps through its logical axis; alignment suffixes flip where the
 * cross axis runs right to left or bottom to top.
 */
export function resolveAnchorPlacement(
  placement: AnchorPlacement,
  flow: Flow,
): PhysicalAnchorPlacement {
  // An unrecognized value, such as a physical placement set from untyped
  // HTML, falls back to the default rather than failing to position.
  const [, axis, edge, suffix] = /^(block|inline)-(start|end)(?:-(start|end))?$/.exec(
    placement,
  ) ?? ['', 'block', 'end', 'start'];
  const physical = axis === 'inline' ? flow.inline : flow.block;
  const reversed = axis === 'inline' ? flow.inlineReversed : flow.blockReversed;
  const towardEnd = (edge === 'end') !== reversed;
  const side: 'top' | 'bottom' | 'left' | 'right' =
    physical === 'x' ? (towardEnd ? 'right' : 'left') : towardEnd ? 'bottom' : 'top';
  const align = suffix as 'start' | 'end' | undefined;

  if (!align) {
    return side;
  }

  // top/bottom align along x; left/right along y.
  const cross = side === 'top' || side === 'bottom' ? 'x' : 'y';
  const physicalAlign = isPhysicalReversed(cross, flow)
    ? align === 'start'
      ? 'end'
      : 'start'
    : align;

  return `${side}-${physicalAlign}`;
}
