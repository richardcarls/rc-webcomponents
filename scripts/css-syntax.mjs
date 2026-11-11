/**
 * Validation for CSS Properties and Values API syntax strings, the grammar
 * the token contract and `@cssprop {<syntax>}` tags use to describe the
 * values a custom property accepts.
 */

/** Data types a syntax component may name. */
const SYNTAX_TYPES = new Set([
  'angle',
  'color',
  'custom-ident',
  'image',
  'integer',
  'length',
  'length-percentage',
  'number',
  'percentage',
  'resolution',
  'string',
  'time',
  'transform-function',
  'transform-list',
  'url',
]);

export const CSS_WIDE_KEYWORDS = new Set([
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
  'default',
]);

/** Returns why a syntax string is invalid, or null when it is valid. */
export function syntaxError(syntax) {
  if (syntax.trim() === '*') {
    return null;
  }

  if (syntax.trim() === '') {
    return 'empty syntax';
  }

  for (const component of syntax.split('|').map((part) => part.trim())) {
    const type = /^<([a-z-]+)>([+#]?)$/.exec(component);

    if (type) {
      if (!SYNTAX_TYPES.has(type[1])) {
        return `unknown data type <${type[1]}>`;
      }

      continue;
    }

    if (!/^-?[a-z_][a-z0-9_-]*$/i.test(component)) {
      return `invalid component "${component}"`;
    }

    if (CSS_WIDE_KEYWORDS.has(component.toLowerCase())) {
      return `CSS-wide keyword "${component}" cannot be a syntax component`;
    }
  }

  return null;
}
