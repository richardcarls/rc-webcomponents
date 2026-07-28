/** Returns the index of the point nearest to a value, or -1 for an empty list. */
export function findNearestSnapIndex(points: readonly number[], value: number): number {
  let nearestIndex = -1;
  let nearestDistance = Infinity;

  points.forEach((point, index) => {
    const distance = Math.abs(point - value);

    if (Number.isFinite(point) && distance < nearestDistance) {
      nearestIndex = index;
      nearestDistance = distance;
    }
  });

  return nearestIndex;
}

/**
 * Returns the next point index in a direction relative to a value.
 *
 * Falls back to the nearest endpoint when no point remains in that direction.
 */
export function findNextSnapIndex(
  points: readonly number[],
  value: number,
  direction: -1 | 1,
): number {
  if (direction > 0) {
    const index = points.findIndex((point) => Number.isFinite(point) && point > value);

    return index >= 0 ? index : points.length - 1;
  }

  for (let index = points.length - 1; index >= 0; index -= 1) {
    if (Number.isFinite(points[index]) && points[index] < value) {
      return index;
    }
  }

  return points.length > 0 ? 0 : -1;
}

/** Returns the first or last point index for a direction, or -1 when empty. */
export function findExtremeSnapIndex(points: readonly number[], direction: -1 | 1): number {
  return points.length === 0 ? -1 : direction > 0 ? points.length - 1 : 0;
}
