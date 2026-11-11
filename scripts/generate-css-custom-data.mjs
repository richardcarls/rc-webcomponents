/**
 * Writes VS Code CSS custom data for every public RC custom property:
 * the shared tokens from the token contract and each component's documented
 * properties from its package manifest. Editors that load the file through
 * `css.customData` offer completion and hover documentation.
 *
 * Run after the component packages build, so each `dist/custom-elements.json`
 * exists.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = 'packages/rc-webcomponents/dist/css-custom-data.json';
const DOCS_URL = 'https://richardcarls.github.io/rc-webcomponents';

function describe({ description, syntax, defaultValue, readBy }) {
  const lines = [description?.trim()].filter(Boolean);

  if (syntax) {
    lines.push(`Syntax: \`${syntax}\``);
  }

  if (defaultValue !== undefined && defaultValue !== null) {
    lines.push(`Default: \`${defaultValue}\``);
  }

  if (readBy.length > 0) {
    lines.push(`Read by: ${readBy.map((tag) => `\`<${tag}>\``).join(', ')}`);
  }

  return { kind: 'markdown', value: lines.join('\n\n') };
}

/** Collects documented CSS properties by name across component manifests. */
export function collectComponentProperties(manifests) {
  const properties = new Map();

  for (const manifest of manifests) {
    for (const module of manifest.modules ?? []) {
      for (const declaration of module.declarations ?? []) {
        if (!declaration.tagName) {
          continue;
        }

        for (const property of declaration.cssProperties ?? []) {
          const entry = properties.get(property.name) ?? { ...property, readBy: [] };

          entry.syntax ??= property.syntax;
          entry.description ??= property.description;
          entry.readBy.push(declaration.tagName);
          properties.set(property.name, entry);
        }
      }
    }
  }

  return properties;
}

/** Maps each shared token to the elements whose package reads it with rcToken(). */
export function collectSharedTokenReaders(root, packageManifests) {
  const readers = new Map();

  for (const { directory, manifest } of packageManifests) {
    const sourceDirectory = join(directory, 'src');
    const tags = (manifest.modules ?? [])
      .flatMap((module) => module.declarations ?? [])
      .map((declaration) => declaration.tagName)
      .filter(Boolean);

    if (!existsSync(sourceDirectory) || tags.length === 0) {
      continue;
    }

    const source = readdirSync(sourceDirectory)
      .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
      .map((file) => readFileSync(join(sourceDirectory, file), 'utf8'))
      .join('\n');

    for (const [, name] of source.matchAll(/rcToken\(\s*['"](--rc-[a-z0-9-]+)['"]/g)) {
      readers.set(name, new Set([...(readers.get(name) ?? []), ...tags]));
    }
  }

  return new Map([...readers].map(([name, tags]) => [name, [...tags].sort()]));
}

/** Builds the custom data document from the contract and component properties. */
export function buildCustomData(tokens, componentProperties, sharedReaders = new Map()) {
  const properties = [];

  for (const [name, token] of Object.entries(tokens)) {
    properties.push({
      name,
      description: describe({
        description: token.description,
        syntax: token.syntax,
        defaultValue: token.default,
        readBy: sharedReaders.get(name) ?? [],
      }),
      references: [
        { name: 'Shared tokens', url: `${DOCS_URL}/guide/styling#global-design-tokens` },
      ],
    });
  }

  for (const [name, property] of componentProperties) {
    if (tokens[name]) {
      continue;
    }

    properties.push({
      name,
      description: describe({
        description: property.description,
        syntax: property.syntax,
        defaultValue: property.default,
        readBy: property.readBy,
      }),
    });
  }

  properties.sort((left, right) => left.name.localeCompare(right.name));

  return { version: 1.1, properties };
}

export async function generateCssCustomData(root = ROOT) {
  const { tokens } = await import(
    join(root, 'packages/rc-webcomponents/themes/token-contract.mjs')
  );
  const packageManifests = readdirSync(join(root, 'packages'))
    .map((name) => join(root, 'packages', name))
    .filter((directory) => existsSync(join(directory, 'dist/custom-elements.json')))
    .map((directory) => ({
      directory,
      manifest: JSON.parse(readFileSync(join(directory, 'dist/custom-elements.json'), 'utf8')),
    }));
  const data = buildCustomData(
    tokens,
    collectComponentProperties(packageManifests.map(({ manifest }) => manifest)),
    collectSharedTokenReaders(root, packageManifests),
  );
  const output = join(root, OUTPUT);

  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(data, null, 2)}\n`);

  return data;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const data = await generateCssCustomData();

  console.log(`Wrote ${data.properties.length} custom properties to ${OUTPUT}.`);
}
