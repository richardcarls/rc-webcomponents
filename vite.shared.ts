import MagicString from 'magic-string';
import type { Plugin } from 'vite';
import { minifyTemplateLiterals } from 'rollup-plugin-minify-template-literals';

import { RC_TOKEN_FALLBACKS } from './packages/rc-common/src/tokenFallbacks.ts';

const INCLUDE = /packages\/[^/]+\/src\/.+\.ts$/;
const EXCLUDE = /\.test\.ts$/;
const INTERPOLATED_CSS = /\b(?:css|cssText)`[^`]*\$\{/;
// Vite has already compiled the TypeScript, and esbuild prints double quotes.
const RC_TOKEN_CALL =
  /\$\{(?:\(0,\s*)?(?:[\w$]+\.)?rcToken\)?\(\s*["'](--rc-[a-z0-9-]+)["']\s*(?:,\s*["']([a-z-]+)["']\s*)?\)\}/g;
const DEFERRALS = new Set(['inherit', 'initial', 'revert', 'revert-layer', 'unset']);

/**
 * Replaces each `${rcToken('--rc-name')}` in source with the `var()` text the
 * call returns at runtime, so CSS templates reach the minifier without
 * interpolation. Unbuilt code, such as tests and the dev server, runs
 * rc-common's rcToken() and gets the same text.
 */
export function rcTokenInline(): Plugin {
  return {
    name: 'rc-token-inline',
    transform(code, id) {
      if (!INCLUDE.test(id) || EXCLUDE.test(id) || !code.includes('rcToken(')) {
        return null;
      }

      const output = new MagicString(code);

      for (const match of code.matchAll(RC_TOKEN_CALL)) {
        const [call, name, deferTo] = match;

        if (!(name in RC_TOKEN_FALLBACKS)) {
          this.error(`${id}: rcToken() names unknown shared token ${name}.`);
        }

        if (deferTo !== undefined && !DEFERRALS.has(deferTo)) {
          this.error(`${id}: rcToken() can only defer to a CSS-wide keyword, not ${deferTo}.`);
        }

        const fallback = deferTo ?? RC_TOKEN_FALLBACKS[name as keyof typeof RC_TOKEN_FALLBACKS];
        const text = fallback === null ? `var(${name})` : `var(${name}, ${fallback})`;

        output.overwrite(match.index, match.index + call.length, text);
      }

      if (!output.hasChanged()) {
        return null;
      }

      return { code: output.toString(), map: output.generateMap({ hires: true, source: id }) };
    },
  };
}

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
    rcTokenInline(),
    guard,
    minifyTemplateLiterals({
      include: INCLUDE,
      exclude: EXCLUDE,
      // Tags match by substring, so 'css' covers both `css` and `cssText`.
      minify: { html: false, cssTags: ['css'] },
    }) as Plugin,
  ];
}
