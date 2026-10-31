import { cssText, defineLightDomBaseStyles } from '@rcarls/rc-common';

/**
 * Light-DOM base styles for `rc-list` reordering.
 *
 * Reorder handles are consumer-authored buttons in light DOM, so the list's
 * shadow styles cannot reach them. A handle must not start native panning, or
 * a touch drag scrolls the page instead of moving the item.
 */
export const LIST_BASE_CSS = cssText`
@layer rc-base {
  rc-list[reorderable] [data-rc-reorder-handle] {
    touch-action: none;
    cursor: grab;
  }

  rc-list[data-reordering] {
    user-select: none;
    -webkit-user-select: none;
  }

  rc-list[data-reordering] [data-rc-reorder-handle] {
    cursor: grabbing;
  }

  /* Items shifting out of the lifted item's way. The lifted item follows the pointer. */
  rc-list[data-reordering] > rc-list-item:not([data-dragging]) {
    transition: translate var(--rc-list-item-reorder-duration, 0ms)
      var(--rc-list-item-reorder-easing, ease);
  }

  @media (prefers-reduced-motion: reduce) {
    rc-list[data-reordering] > rc-list-item {
      transition-duration: 0ms;
    }
  }
}
`;

/** Installs the shared list reorder styles once per containing root. */
export const ensureListBaseStyles: (root: Document | ShadowRoot) => void = defineLightDomBaseStyles(
  'rc-list',
  LIST_BASE_CSS,
);
