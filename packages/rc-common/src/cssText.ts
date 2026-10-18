/**
 * Identity tag for CSS written as a plain string, such as light-DOM structural
 * styles installed through a `<style>` element. It returns the same text an
 * untagged template would, with interpolations joined in place and escapes
 * cooked as usual. The tag marks the literal as CSS so the package build can
 * minify it.
 *
 * @example
 * ```ts
 * const LIGHT_DOM_CSS = cssText`
 *   @layer rc-base {
 *     rc-example > button { inline-size: 100%; }
 *   }
 * `;
 * ```
 */
export function cssText(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((text, part, index) => text + String(values[index - 1]) + part);
}
