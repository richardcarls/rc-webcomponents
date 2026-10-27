import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Packages that ship on their own but are not components, so the aggregate
 * neither re-exports nor registers them. Shared by the aggregate generator and
 * the package validator so both agree on what "a component package" means.
 */
export const infrastructurePackages = new Set([
  '@rcarls/rc-common',
  '@rcarls/rc-textarea-adapters',
  '@rcarls/rc-textarea-plugin-markdown',
  '@rcarls/rc-theme-material',
  '@rcarls/rc-theme-substrate',
  '@rcarls/rc-theme-win31',
  '@rcarls/rc-webcomponents',
]);

/** Component packages the aggregate covers, sorted by package name. */
export function listComponentPackages(root) {
  const packagesRoot = join(root, 'packages');

  return readdirSync(packagesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({
      directory: entry.name,
      manifest: JSON.parse(readFileSync(join(packagesRoot, entry.name, 'package.json'), 'utf8')),
    }))
    .filter(({ manifest }) => !infrastructurePackages.has(manifest.name))
    .sort((left, right) => left.manifest.name.localeCompare(right.manifest.name));
}
