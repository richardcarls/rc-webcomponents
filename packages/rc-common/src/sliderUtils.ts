/**
 * Clamps `value` to [min, max] and rounds to the nearest `step` boundary.
 *
 * A step of 0 or less disables snapping and returns the clamped value as-is.
 */
export function snapToStep(value: number, min: number, max: number, step: number): number {
  const clamped = Math.min(Math.max(value, min), max);

  if (step <= 0) return clamped;

  const snapped = Math.round((clamped - min) / step) * step + min;

  return Math.min(Math.max(snapped, min), max);
}

/**
 * Returns `value`'s position within [min, max] as a fraction in [0, 1].
 *
 * Returns 0 when min === max to avoid division by zero.
 */
export function valueToPercent(value: number, min: number, max: number): number {
  if (max === min) return 0;

  return Math.min(Math.max((value - min) / (max - min), 0), 1);
}
