const CSS_TIME = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(ms|s)?$/i;

/**
 * Parses a CSS `<time>` value read from a custom property into milliseconds.
 *
 * Accepts `ms` and `s` units in any case, such as `300ms` or `.3s`, the form a
 * theme's motion token often resolves to. A unitless number is read as
 * milliseconds. Returns `undefined` for an empty, negative, non-finite, or
 * otherwise unparsable value (including `calc()` and other functions), so a
 * caller can fall back to its own default.
 *
 * @example
 * const raw = getComputedStyle(el).getPropertyValue('--rc-bottom-sheet-snap-duration');
 * const duration = parseCssTime(raw) ?? 300;
 */
export function parseCssTime(value: string): number | undefined {
  const match = CSS_TIME.exec(value.trim());

  if (!match) {
    return undefined;
  }

  const [, amount, unit] = match;
  const milliseconds = Number(amount) * (unit?.toLowerCase() === 's' ? 1000 : 1);

  return Number.isFinite(milliseconds) && milliseconds >= 0 ? milliseconds : undefined;
}
