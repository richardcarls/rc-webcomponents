import type { Plugin } from 'vite';
import { minifyTemplateLiterals } from 'rollup-plugin-minify-template-literals';

const INCLUDE = /packages\/[^/]+\/src\/.+\.ts$/;
const EXCLUDE = /\.test\.ts$/;
const INTERPOLATED_CSS = /\b(?:css|cssText)`[^`]*\$\{/;

/**
 * Minifies CSS in component template literals: Lit `css` styles and light-DOM
 * structural CSS tagged with rc-common's `cssText`. Lightning CSS runs without
 * targets, so it only minifies and never lowers syntax or logical properties.
 * HTML templates are left as written. Edits go through magic-string, so package
 * source maps still resolve code to its original lines and minified CSS to the
 * template it came from.
 *
 * CSS templates must not interpolate. The minifier parses each interpolation as
 * a placeholder token, and a placeholder in a selector is re-serialized with a
 * descendant space (`${PANEL}[open]` becomes `${PANEL} [open]`), which silently
 * changes what the rule matches. The guard fails the build instead.
 */
export function rcCssLiteralMinify(): Plugin[] {
  const guard: Plugin = {
    name: 'rc-css-literal-guard',
    transform(code, id) {
      if (INCLUDE.test(id) && !EXCLUDE.test(id) && INTERPOLATED_CSS.test(code)) {
        this.error(`${id}: write CSS template literals without \${} interpolation.`);
      }

      return null;
    },
  };

  return [
    guard,
    minifyTemplateLiterals({
      include: INCLUDE,
      exclude: EXCLUDE,
      // Tags match by substring, so 'css' covers both `css` and `cssText`.
      minify: { html: false, cssTags: ['css'] },
    }) as Plugin,
  ];
}
