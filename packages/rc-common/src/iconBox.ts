import { unsafeCSS, type CSSResult } from 'lit';

/** Options for {@link iconBoxStyles}. */
export interface IconBoxOptions {
  /** Selector for the shadow element that frames the icon. */
  box: string;
  /** Custom property that sets the box's size, such as `--rc-chip-remove-icon-size`. */
  size: `--rc-${string}`;
  /** The size used when the custom property is unset, such as `1.5rem`. */
  fallback: string;
  /**
   * Selector for the slot that takes a replacement icon. Defaults to every
   * `slot` inside the box. Pass the box selector when the box is the slot.
   */
  slot?: string;
}

/**
 * Shadow styles for a component-owned icon area: a square box, sized by one
 * custom property, that centers whatever icon it holds.
 *
 * - The box sets its `font-size` to the size and is `1em` square, so an
 *   icon-font glyph or a `1em` SVG fills it. Its single grid track is the
 *   box itself, so an oversized icon can't stretch it. Its size never
 *   depends on its content, so an icon element that renders a frame late
 *   (such as `<iconify-icon>`) causes no layout shift.
 * - A built-in SVG (shadow content, including slot fallback) fills the box.
 *   Draw it in a square `viewBox` whose padding sets the glyph's size.
 * - A slotted `svg` or `img` is centered and kept within the box. A slotted
 *   SVG without `width` or `height` attributes, which has no intrinsic size,
 *   fills the box. Slotted text takes the box's font size even over an
 *   icon-font utility class, and the box clips anything still too large,
 *   such as a ligature whose font has not loaded.
 *
 * @example
 * ```ts
 * static styles = css`
 *   ${iconBoxStyles({ box: '#remove', size: '--rc-chip-remove-icon-size', fallback: '1.125em' })}
 * `;
 * ```
 */
export function iconBoxStyles({ box, size, fallback, slot }: IconBoxOptions): CSSResult {
  const value = `var(${size}, ${fallback})`;
  const slotSelector = slot ?? `${box} slot`;

  return unsafeCSS(`
    ${box} {
      display: inline-grid;
      flex: none;
      grid-template: minmax(0, 1fr) / minmax(0, 1fr);
      place-items: center;
      box-sizing: border-box;
      font-size: ${value};
      inline-size: 1em;
      block-size: 1em;
      line-height: 1;
      overflow: clip;
    }

    :is(${box}) svg {
      display: block;
      inline-size: 1em;
      block-size: 1em;
    }

    ${slotSelector}::slotted(*) {
      font-size: inherit !important;
      line-height: 1 !important;
    }

    ${slotSelector}::slotted(:is(svg, img)) {
      display: block;
      max-inline-size: 100%;
      max-block-size: 100%;
    }

    ${slotSelector}::slotted(svg:not([width], [height])) {
      inline-size: 1em;
      block-size: 1em;
    }
  `);
}
