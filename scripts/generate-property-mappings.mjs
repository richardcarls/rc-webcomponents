/**
 * Generate tooling metadata for the shared RC custom properties. The CSS file
 * remains authoritative; this script never registers properties in a browser.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = 'themes/base.css';
const systemColors = new Set([
  'AccentColor',
  'ButtonBorder',
  'ButtonFace',
  'ButtonText',
  'Canvas',
  'Field',
  'FieldText',
  'GrayText',
  'Highlight',
  'HighlightText',
]);

/** Read only --rc-* declarations on :root, retaining conditional overrides. */
export function parseBaseDeclarations(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const declarations = new Map();
  const stack = [];
  let buffer = '';

  const record = () => {
    const declaration = buffer.trim();

    buffer = '';

    const match = /^(--rc-[a-z0-9-]+)\s*:\s*([\s\S]+)$/.exec(declaration);

    if (!match || stack.at(-1) !== ':root') {
      return;
    }

    const [, name, rawValue] = match;
    const value = rawValue.trim().replace(/\s+/g, ' ');
    const conditions = stack.filter((part) => part.startsWith('@supports '));
    const entry = declarations.get(name) ?? { fallback: undefined, conditional: [] };

    if (conditions.length === 0) {
      if (entry.fallback !== undefined) {
        throw new Error(`Duplicate base declaration: ${name}`);
      }

      entry.fallback = value;
    } else {
      entry.conditional.push({ when: conditions.join(' and '), value });
    }

    declarations.set(name, entry);
  };

  for (const character of clean) {
    if (character === '{') {
      stack.push(buffer.trim());
      buffer = '';
    } else if (character === ';') {
      record();
    } else if (character === '}') {
      record();
      stack.pop();
    } else {
      buffer += character;
    }
  }

  if (stack.length !== 0) {
    throw new Error('Unbalanced base CSS blocks');
  }

  for (const [name, entry] of declarations) {
    if (entry.fallback === undefined) {
      throw new Error(`Missing base declaration: ${name}`);
    }
  }

  return declarations;
}

function classify(name, fallback, declarations, visited = new Set()) {
  if (visited.has(name)) {
    return { syntax: null, reason: 'cyclic-reference' };
  }

  visited.add(name);

  const alias = /^var\((--rc-[a-z0-9-]+)\)$/.exec(fallback);

  if (alias) {
    const target = declarations.get(alias[1]);
    const syntax = target
      ? classify(alias[1], target.fallback, declarations, visited).syntax
      : null;

    return { syntax, reason: 'dynamic-fallback' };
  }

  if (systemColors.has(fallback)) {
    return { syntax: '<color>', reason: 'system-color' };
  }

  if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:ms|s)$/.test(fallback)) {
    return { syntax: '<time>' };
  }

  if (/^[+-]?(?:\d+\.?\d*|\.\d+)px$/.test(fallback)) {
    return { syntax: '<length>' };
  }

  if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:em|rem|ch|ex|lh|rlh)$/.test(fallback)) {
    return { syntax: '<length>', reason: 'relative-unit' };
  }

  if (name === '--rc-focus-ring-offset' && fallback === '0') {
    return { syntax: '<length>' };
  }

  if (/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(fallback)) {
    return { syntax: '<number>' };
  }

  return { syntax: null, reason: 'unsupported-syntax' };
}

export function propertyMappings(css) {
  const declarations = parseBaseDeclarations(css);
  const properties = {};

  for (const [name, { fallback, conditional }] of [...declarations].sort(([a], [b]) =>
    a.localeCompare(b),
  )) {
    const { syntax, reason } = classify(name, fallback, declarations);

    properties[name] = {
      fallback,
      syntax,
      inherits: true,
      registration: reason ? null : { syntax, inherits: true, initialValue: fallback },
      ...(reason ? { ineligibleReason: reason } : {}),
      ...(conditional.length ? { conditional } : {}),
    };
  }

  return { schemaVersion: 1, source, properties };
}

export function generate() {
  const packageRoot = resolve(root, 'packages/rc-webcomponents');
  const css = readFileSync(resolve(packageRoot, source), 'utf8');
  const output = resolve(packageRoot, 'dist/property-mappings.json');

  writeFileSync(output, `${JSON.stringify(propertyMappings(css), null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generate();
}
