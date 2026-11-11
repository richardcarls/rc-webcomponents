/**
 * Custom Elements Manifest analyzer plugin for CSS custom properties.
 *
 * - Moves a JSDoc type, `@cssprop {<length>} --name`, into the schema's
 *   `syntax` field. The analyzer stores it as `type.text`, which tools that
 *   read `syntax` ignore. An invalid syntax string fails the analysis.
 * - Fills `syntax`, `description`, and `default` for shared `--rc-*` tokens
 *   from the token contract when an element documents one without them.
 */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { syntaxError } from './css-syntax.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { tokens } = createRequire(import.meta.url)(
  join(ROOT, 'packages/rc-webcomponents/themes/token-contract.mjs'),
);

/** Applies the syntax and shared-token rules to one manifest, in place. */
export function applyCssPropertyMetadata(manifest) {
  for (const module of manifest.modules ?? []) {
    for (const declaration of module.declarations ?? []) {
      for (const property of declaration.cssProperties ?? []) {
        const text = property.type?.text;

        if (text !== undefined) {
          const error = syntaxError(text);

          if (error) {
            throw new Error(
              `${declaration.tagName ?? declaration.name} ${property.name}: invalid @cssprop syntax "${text}" (${error}).`,
            );
          }

          property.syntax = text;
          delete property.type;
        }

        const token = tokens[property.name];

        if (token) {
          property.syntax ??= token.syntax;
          property.description ??= token.description;

          if (property.default === undefined && token.default !== null) {
            property.default = token.default;
          }
        }
      }
    }
  }

  return manifest;
}

/** The analyzer plugin. */
export function cssPropertiesPlugin() {
  return {
    name: 'rc-css-properties',
    packageLinkPhase({ customElementsManifest }) {
      applyCssPropertyMetadata(customElementsManifest);
    },
  };
}
