/** Bounds of the portion of a top-level document currently visible to the user. */
export interface VisualViewportBounds {
  /** Inline-start offset from the layout viewport in CSS pixels. */
  left: number;

  /** Block-start offset from the layout viewport in CSS pixels. */
  top: number;

  /** Visible inline size in CSS pixels. */
  width: number;

  /** Visible block size in CSS pixels. */
  height: number;

  /** Inline-end coordinate in layout-viewport CSS pixels. */
  right: number;

  /** Block-end coordinate in layout-viewport CSS pixels. */
  bottom: number;
}

/**
 * Returns visual-viewport bounds in layout-viewport coordinates.
 *
 * Falls back to the layout viewport when `VisualViewport` is unavailable.
 */
export function getVisualViewportBounds($window: Window): VisualViewportBounds {
  const $visualViewport = $window.visualViewport;
  const left = $visualViewport?.offsetLeft ?? 0;
  const top = $visualViewport?.offsetTop ?? 0;
  const width = $visualViewport?.width ?? $window.innerWidth;
  const height = $visualViewport?.height ?? $window.innerHeight;

  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}
