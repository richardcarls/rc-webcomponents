/** A finite, nonnegative integer configuration value. */
export function whole(value: number, fallback = 0): number {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}

/** A finite positive pixel estimate, or zero when unavailable. */
export function positive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export interface Geometry {
  /** Effective number of sequential items in a line. */
  itemsPerLine: number;

  /** Line pitch including the inter-line gap. */
  lineSize: number;

  /** Whether the pitch came from layout rather than the author estimate. */
  measured: boolean;
}

export interface WindowInput extends Geometry {
  count: number;
  overscan: number;
  viewStart: number;
  viewSize: number;
  focused: number;
}

export interface WindowRange {
  start: number;
  end: number;
  spacerStart: number;
  spacerEnd: number;
}

/** Calculate a contiguous window from validated, logical layout facts. */
export function calculateWindow(input: WindowInput): WindowRange {
  const { count, overscan, itemsPerLine, lineSize, viewStart, viewSize, focused } = input;
  const lines = Math.ceil(count / itemsPerLine);
  // Half a pixel absorbs rect snapping at exact line boundaries in Firefox.
  const firstLine = Math.min(
    lines,
    Math.max(0, Math.floor((Math.max(0, viewStart) + 0.5) / lineSize) - overscan),
  );
  const lastLine = Math.min(
    lines,
    Math.max(firstLine, Math.ceil((viewStart + viewSize - 0.5) / lineSize) + overscan),
  );

  let start = Math.min(count, firstLine * itemsPerLine);
  let end = Math.min(count, lastLine * itemsPerLine);

  if (focused >= 0 && focused < count) {
    const focusedLine = Math.floor(focused / itemsPerLine);

    start = Math.min(start, focusedLine * itemsPerLine);
    end = Math.max(end, Math.min(count, (focusedLine + 1) * itemsPerLine));
  }

  return {
    start,
    end,
    spacerStart: Math.floor(start / itemsPerLine) * lineSize,
    spacerEnd: Math.max(0, lines - Math.ceil(end / itemsPerLine)) * lineSize,
  };
}

/** Read resolved pixel tracks, ignoring CSS grid line-name annotations. */
export function resolvedTracks(value: string): number[] | null {
  const tokens = value
    .replace(/\[[^\]]*\]/g, '')
    .trim()
    .split(/\s+/);

  if (!tokens.every((token) => /^\d+(?:\.\d+)?px$/.test(token))) {
    return null;
  }

  return tokens.map(Number.parseFloat);
}

/** Resolve the deliberately small, numeric subset of grid span syntax we support. */
export function trackSpan(start: string, end: string, count: number): number | null {
  if (start === 'auto' && end === 'auto') {
    return 1;
  }

  const span = /^span (\d+)$/.exec(start === 'auto' ? end : start);

  if (span && (start === 'auto' || end === 'auto')) {
    return Math.max(1, Number(span[1]));
  }

  if (start === '1' && (end === '-1' || end === String(count + 1))) {
    return count;
  }

  return null;
}
