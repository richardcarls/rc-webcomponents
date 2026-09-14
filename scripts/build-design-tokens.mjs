/*
 * Generates Figma-ready design token documents from the theme packages.
 *
 * The theme CSS stays the source of truth. This script reads it, resolves the
 * token graph (primitives, semantic colors, numeric scales, typography, and the
 * public --rc-* contract), and emits one normalized JSON document per theme
 * under design/tokens/. Those documents drive the Figma variable collections,
 * so a theme change reaches Figma by re-running this script rather than by
 * hand-editing the design file.
 *
 * Structure of the emitted document mirrors how the CSS layers actually work:
 *
 *   Primitives   raw palette values, hidden from pickers
 *   Color        semantic roles, Light and Dark modes, aliasing Primitives
 *   <scales>     numeric groups (shape, motion, radius, size, ...)
 *   RC Contract  the public --rc-* surface, aliasing the layers above it
 *
 * Only the Color collection is mode-aware, matching the CSS: the bridge layer
 * is mode-agnostic and inherits light or dark through the aliases it follows.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const root = process.cwd();
const REM_BASE = 16;
const MODES = ['Light', 'Dark'];

/* ── CSS parsing ───────────────────────────────────────────────────────────── */

/** Splits on a separator that appears at parenthesis depth zero. */
function splitTopLevel(value, separator = ',') {
  const parts = [];
  let depth = 0;
  let buffer = '';

  for (const char of value) {
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
    }

    if (char === separator && depth === 0) {
      parts.push(buffer.trim());
      buffer = '';

      continue;
    }

    buffer += char;
  }

  if (buffer.trim()) {
    parts.push(buffer.trim());
  }

  return parts;
}

/**
 * Walks a stylesheet and returns every custom-property declaration together
 * with the selector nesting it was found under. Brace depth is tracked
 * directly so @layer and @media wrappers do not need special cases.
 */
function parseDeclarations(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const declarations = [];
  const stack = [];
  let buffer = '';

  const record = () => {
    const text = buffer.trim();

    buffer = '';

    if (!text.startsWith('--')) {
      return;
    }

    const colon = text.indexOf(':');

    if (colon === -1) {
      return;
    }

    declarations.push({
      property: text.slice(0, colon).trim(),
      value: text.slice(colon + 1).trim().replace(/\s+/g, ' '),
      scope: stack.filter((entry) => !entry.startsWith('@')).join(' '),
      media: stack.filter((entry) => entry.startsWith('@media')),
    });
  };

  for (const char of clean) {
    if (char === '{') {
      stack.push(buffer.trim());
      buffer = '';
    } else if (char === '}') {
      record();
      stack.pop();
    } else if (char === ';') {
      record();
    } else {
      buffer += char;
    }
  }

  return declarations;
}

/* ── Color math ────────────────────────────────────────────────────────────── */

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function toHex(channel) {
  return Math.round(clamp01(channel) * 255)
    .toString(16)
    .padStart(2, '0');
}

function rgbToHex({ r, g, b }) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function parseHex(value) {
  const raw = value.trim().replace('#', '');
  const normalized =
    raw.length === 3 || raw.length === 4
      ? raw
          .split('')
          .map((part) => part + part)
          .join('')
      : raw;

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16) / 255,
    g: Number.parseInt(normalized.slice(2, 4), 16) / 255,
    b: Number.parseInt(normalized.slice(4, 6), 16) / 255,
    a:
      normalized.length >= 8
        ? Number.parseInt(normalized.slice(6, 8), 16) / 255
        : 1,
  };
}

function gammaEncode(channel) {
  return channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
}

/** Converts an oklch() color to sRGB, which is what Figma variables store. */
function parseOklch(value) {
  const inner = value.slice(value.indexOf('(') + 1, value.lastIndexOf(')'));
  const [coords, alphaPart] = splitTopLevel(inner, '/');
  const [lightnessRaw, chromaRaw, hueRaw] = coords.split(/\s+/).filter(Boolean);

  const lightness = lightnessRaw.endsWith('%')
    ? Number.parseFloat(lightnessRaw) / 100
    : Number.parseFloat(lightnessRaw);
  const chroma = Number.parseFloat(chromaRaw);
  const hue = Number.parseFloat(hueRaw ?? '0');
  const alpha = alphaPart
    ? alphaPart.trim().endsWith('%')
      ? Number.parseFloat(alphaPart) / 100
      : Number.parseFloat(alphaPart)
    : 1;

  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);

  const long = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const medium = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const short = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return {
    r: clamp01(
      gammaEncode(4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short),
    ),
    g: clamp01(
      gammaEncode(-1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short),
    ),
    b: clamp01(
      gammaEncode(-0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short),
    ),
    a: alpha,
  };
}

function colorValue(color) {
  return {
    r: Number(color.r.toFixed(6)),
    g: Number(color.g.toFixed(6)),
    b: Number(color.b.toFixed(6)),
    a: Number(color.a.toFixed(6)),
    hex: rgbToHex(color),
  };
}

/* ── Value resolution ──────────────────────────────────────────────────────── */

const VAR_PATTERN = /^var\(\s*(--[a-z0-9-]+)\s*(?:,([\s\S]*))?\)$/i;

/** Classifies a value without following any variable references. */
function shallowResolve(value) {
  const text = value.trim();
  const varMatch = VAR_PATTERN.exec(text);

  if (varMatch) {
    return { kind: 'alias', target: varMatch[1], fallback: varMatch[2]?.trim() || null };
  }

  if (/^light-dark\(/.test(text)) {
    return { kind: 'light-dark' };
  }

  if (text.startsWith('color-mix(')) {
    return { kind: 'computed' };
  }

  if (text.startsWith('oklch(')) {
    return { kind: 'color', value: parseOklch(text) };
  }

  if (/^#[0-9a-f]{3,8}$/i.test(text)) {
    return { kind: 'color', value: parseHex(text) };
  }

  const dimension = /^(-?\d*\.?\d+)(rem|px|ms|s|%)?$/.exec(text);

  if (dimension) {
    const amount = Number.parseFloat(dimension[1]);
    const unit = dimension[2] ?? null;

    if (unit === 'rem') {
      return { kind: 'number', value: amount * REM_BASE, unit };
    }

    if (unit === 's') {
      return { kind: 'number', value: amount * 1000, unit: 'ms' };
    }

    return { kind: 'number', value: amount, unit };
  }

  return { kind: 'composite', raw: text };
}

/**
 * Builds a resolver that follows variable references all the way down to a
 * concrete value for a given mode. `light-dark()` picks the branch matching the
 * mode, which is how a mode-aware Figma value is derived from mode-free CSS.
 */
function createResolver(byProperty) {
  const resolveIn = (value, mode, depth = 0) => {
    if (depth > 16) {
      return { kind: 'unresolved', raw: value, reason: 'reference-cycle' };
    }

    const text = value.trim();
    const lightDark = /^light-dark\(([\s\S]*)\)$/.exec(text);

    if (lightDark) {
      const [light, dark] = splitTopLevel(lightDark[1], ',');

      return resolveIn(mode === 'Dark' ? dark : light, mode, depth + 1);
    }

    const varMatch = VAR_PATTERN.exec(text);

    if (varMatch) {
      const declared = byProperty.get(varMatch[1]);

      if (declared !== undefined) {
        return resolveIn(declared, mode, depth + 1);
      }

      if (varMatch[2]) {
        return resolveIn(varMatch[2], mode, depth + 1);
      }

      return { kind: 'unresolved', raw: text, reason: 'undeclared-variable' };
    }

    /* Shadow blur is expressed as calc(<elevation> * 2) in the Material theme. */
    const calc = /^calc\(([\s\S]*)\)$/.exec(text);

    if (calc) {
      const [left, operator, right] = calc[1].trim().split(/\s+([*/])\s+/);
      const base = resolveIn(left, mode, depth + 1);
      const factor = Number.parseFloat(right);

      if (base.kind === 'number' && Number.isFinite(factor)) {
        return {
          kind: 'number',
          value: operator === '/' ? base.value / factor : base.value * factor,
          unit: base.unit,
        };
      }

      return { kind: 'unresolved', raw: text, reason: 'calc-unresolved' };
    }

    if (text.startsWith('color-mix(')) {
      const inner = text.slice(text.indexOf('(') + 1, text.lastIndexOf(')'));
      const [, first, second] = splitTopLevel(inner, ',');

      // Every mix in these themes fades one color toward transparent, which is
      // only an alpha change on that color.
      if (!first || !second || second.trim() !== 'transparent') {
        return { kind: 'unresolved', raw: text, reason: 'multi-color-mix' };
      }

      const percent = /(\d+(?:\.\d+)?)%\s*$/.exec(first);
      const base = first.replace(/(\d+(?:\.\d+)?)%\s*$/, '').trim();
      const resolved = resolveIn(base, mode, depth + 1);

      if (resolved.kind !== 'color') {
        return { kind: 'unresolved', raw: text, reason: 'mix-base-unresolved' };
      }

      const ratio = percent ? Number.parseFloat(percent[1]) / 100 : 1;

      return { kind: 'color', value: { ...resolved.value, a: resolved.value.a * ratio } };
    }

    const direct = shallowResolve(text);

    if (direct.kind === 'color' || direct.kind === 'number') {
      return direct;
    }

    return { kind: 'unresolved', raw: text, reason: 'literal' };
  };

  return resolveIn;
}

/**
 * Follows variable references down to a literal string. Font families and
 * weights are declared once on the reference layer and pointed at by name, so
 * a text style needs the value at the end of the chain rather than the `var()`.
 */
function resolveLiteral(value, byProperty, depth = 0) {
  const text = value.trim();

  if (depth > 16) {
    return text;
  }

  const varMatch = VAR_PATTERN.exec(text);

  if (!varMatch) {
    return text;
  }

  const declared = byProperty.get(varMatch[1]);

  if (declared !== undefined) {
    return resolveLiteral(declared, byProperty, depth + 1);
  }

  return varMatch[2] ? resolveLiteral(varMatch[2], byProperty, depth + 1) : text;
}

/**
 * Splits one box-shadow layer into the offset, blur, spread, and color pieces
 * Figma needs for a drop shadow. Colors keep their originating variable so the
 * effect can bind a mode-aware color rather than a baked value.
 */
function parseShadowLayer(layer, resolveIn) {
  const parts = splitTopLevel(layer.trim(), ' ').filter(Boolean);
  const lengths = [];
  let colorPart = null;

  for (const part of parts) {
    if (part === 'inset') {
      continue;
    }

    const resolved = resolveIn(part, 'Light');

    if (resolved.kind === 'number' && lengths.length < 4 && colorPart === null) {
      lengths.push({ raw: part, value: resolved.value });

      continue;
    }

    colorPart = part;
  }

  const [offsetX, offsetY, radius, spread] = lengths;
  const colorVar = colorPart ? VAR_PATTERN.exec(colorPart)?.[1] ?? null : null;
  const colors = {};

  for (const mode of MODES) {
    const resolved = colorPart ? resolveIn(colorPart, mode) : null;

    colors[mode] = resolved?.kind === 'color' ? colorValue(resolved.value) : null;
  }

  return {
    type: 'DROP_SHADOW',
    offsetX: offsetX?.value ?? 0,
    offsetY: offsetY?.value ?? 0,
    radius: radius?.value ?? 0,
    spread: spread?.value ?? 0,
    colorCssVar: colorVar,
    colors,
  };
}

/* ── Token naming ──────────────────────────────────────────────────────────── */

const COMPONENT_PREFIXES = [
  'adaptive-menu',
  'app-bar',
  'bottom-sheet',
  'chip-group',
  'fab-menu',
  'list-item',
  'markdown-editor',
  'menu-button',
  'navigation-bar',
  'navigation-rail',
  'range-slider',
  'search-bar',
  'segmented-button',
  'transfer-list',
  'virtual-canvas',
  'accordion',
  'button',
  'card',
  'carousel',
  'chip',
  'combobox',
  'dialog',
  'disclosure',
  'field',
  'fab',
  'listbox',
  'list',
  'menubar',
  'menu',
  'progress',
  'scroller',
  'select',
  'slider',
  'snackbar',
  'splitter',
  'switch',
  'textarea',
  'toolbar',
];

/** `--md-ref-palette-primary40` becomes `palette/primary/40`. */
function paletteTokenName(property) {
  const stem = property.replace('--md-ref-palette-', '');
  // Family names can contain hyphens, as in neutral-variant40.
  const match = /^([a-z-]+?)(\d+)$/.exec(stem);

  return match ? `palette/${match[1]}/${match[2]}` : `palette/${stem}`;
}

/** Groups an rc contract token under its component, or under `core`. */
function rcTokenName(property) {
  const stem = property.replace('--rc-', '');
  const prefix = COMPONENT_PREFIXES.find(
    (name) => stem === name || stem.startsWith(`${name}-`),
  );

  if (!prefix) {
    return `core/${stem}`;
  }

  const rest = stem.slice(prefix.length).replace(/^-/, '');

  return rest ? `${prefix}/${rest}` : `${prefix}/base`;
}

/** `--md-sys-shape-corner-large` becomes `shape/corner-large`. */
function materialBrandName(property) {
  const stem = property.replace('--md-sys-', '');
  const split = stem.indexOf('-');

  return split === -1 ? `misc/${stem}` : `${stem.slice(0, split)}/${stem.slice(split + 1)}`;
}

/**
 * Substrate has no group prefixes in its token names, so the group is inferred
 * from what each token controls.
 */
function substrateBrandName(property) {
  const stem = property.replace('--substrate-', '');

  // The shadow color is a color role; the sm/md/lg shadows are composites that
  // become effect styles instead of variables.
  if (stem === 'shadow-color') {
    return 'color/shadow';
  }

  const group = [
    [/^radius-/, 'radius'],
    [/^(control|item)-/, 'size'],
    [/^(font|line-height)/, 'typography'],
    [/^motion-/, 'motion'],
    [/^focus-/, 'focus'],
    [/^disabled-/, 'state'],
  ].find(([pattern]) => pattern.test(stem));

  if (!group) {
    return `color/${stem}`;
  }

  // Only strip the prefix when it is the group name itself. Stripping any
  // leading word would collapse control-gap and item-gap onto one name.
  const groupName = group[1];

  return stem.startsWith(`${groupName}-`)
    ? `${groupName}/${stem.slice(groupName.length + 1)}`
    : `${groupName}/${stem}`;
}

/* ── Scope inference ───────────────────────────────────────────────────────── */

/**
 * Figma requires explicit scopes so a token only offers itself where it makes
 * sense. Primitives stay hidden; everything else is inferred from its name.
 */
function inferScopes(name, type) {
  if (name.startsWith('palette/')) {
    return [];
  }

  // `color/` is a namespace, not a role, so it must not be read as a -color
  // suffix when deciding whether a token paints text.
  const role = name.replace(/^color\/(?:computed\/)?/, '');

  if (type === 'COLOR') {
    if (role === 'shadow') {
      return ['EFFECT_COLOR'];
    }

    if (/(^|[/-])(border|outline|stroke|divider)([/-]|$)/.test(role)) {
      return ['STROKE_COLOR'];
    }

    if (/(^|[/-])on-/.test(role) || /(^|[/-])(text|label|icon|color)([/-]|$)/.test(role)) {
      return ['TEXT_FILL'];
    }

    return ['FRAME_FILL', 'SHAPE_FILL'];
  }

  // Matching must respect token-part boundaries: "emphasized" contains "size",
  // and a substring match would scope an easing curve as a dimension.
  const has = (...words) =>
    new RegExp(`(^|[/-])(${words.join('|')})([/-]|$)`).test(role);

  if (has('opacity')) {
    return ['OPACITY'];
  }

  if (role.startsWith('shape/') || has('radius', 'corner')) {
    return ['CORNER_RADIUS'];
  }

  if (/font-size/.test(role)) {
    return ['FONT_SIZE'];
  }

  if (/line-height/.test(role)) {
    return ['LINE_HEIGHT'];
  }

  if (has('tracking') || /letter-spacing/.test(role)) {
    return ['LETTER_SPACING'];
  }

  if (/border-width|stroke-width/.test(role)) {
    return ['STROKE_FLOAT'];
  }

  if (has('gap')) {
    return ['GAP'];
  }

  if (has('padding', 'inset', 'offset')) {
    return ['GAP', 'WIDTH_HEIGHT'];
  }

  if (has('size', 'width', 'height', 'thickness') || /-(block|inline)-size$/.test(role)) {
    return ['WIDTH_HEIGHT'];
  }

  // Durations, easing control points, and elevation dp have no bindable Figma
  // property. They stay as documented reference values rather than polluting
  // every picker, which is what ALL_SCOPES would do.
  return [];
}

/**
 * Material ships unit and family enums alongside its real tokens
 * (`--md-sys-shape-corner-large-top-top-right-unit`). Those describe the token
 * format rather than a design decision, so they never become Figma variables.
 */
function isTokenMetadata(property) {
  return /-(unit|family|path|value)$/.test(property);
}

/* ── Document assembly ─────────────────────────────────────────────────────── */

const THEMES = [
  {
    themeName: 'Material 3',
    themePackage: 'rc-theme-material',
    primitivePrefix: '--md-ref-palette-',
    primitiveName: paletteTokenName,
    brandPrefix: '--md-sys-',
    brandName: materialBrandName,
    excludeBrand: /^--md-sys-typescale-/,
    typescale: /^--md-sys-typescale-(.+?)-(font|size|weight|line-height|tracking)$/,
    typescaleStyleName: (role) => `Material/${role}`,
    shadow: /^--rc-shadow-(level\d+)$/,
    shadowStyleName: (level) => `Elevation/${level}`,
  },
  {
    themeName: 'Substrate',
    themePackage: 'rc-theme-substrate',
    primitivePrefix: null,
    primitiveName: null,
    brandPrefix: '--substrate-',
    brandName: substrateBrandName,
    excludeBrand: /^--substrate-shadow-(sm|md|lg)$/,
    typescale: /^--substrate-(font)-(family|size|weight)$|^--substrate-(line-height)$/,
    typescaleStyleName: () => 'Substrate/body',
    shadow: /^--substrate-shadow-(sm|md|lg)$/,
    shadowStyleName: (level) => `Shadow/${level}`,
  },
];

function buildVariable({ name, property, type, values, description }) {
  return {
    name,
    type,
    scopes: inferScopes(name, type),
    codeSyntax: { WEB: `var(${property})` },
    cssVar: property,
    ...(description ? { description } : {}),
    values,
  };
}

function readTheme(themePackage) {
  const base = join(root, 'packages', themePackage);

  return {
    defaults: parseDeclarations(readFileSync(join(base, 'defaults.css'), 'utf8')),
    bridge: parseDeclarations(readFileSync(join(base, 'bridge.css'), 'utf8')),
  };
}

function buildDocument(theme) {
  const { defaults, bridge } = readTheme(theme.themePackage);

  // @layer only establishes cascade order, so those declarations are still the
  // theme's base values. @media blocks are forced-colors and reduced-motion
  // fallbacks, which have no Figma equivalent.
  const isBase = (entry) => entry.media.length === 0;
  const defaultDecls = defaults.filter(isBase);
  const bridgeDecls = bridge.filter(isBase);

  const byProperty = new Map();

  for (const entry of [...defaultDecls, ...bridgeDecls]) {
    if (!byProperty.has(entry.property)) {
      byProperty.set(entry.property, entry.value);
    }
  }

  const resolveIn = createResolver(byProperty);
  const composite = [];
  const unresolved = [];

  /*
   * Pass 1 — register which CSS variable maps to which Figma variable, so the
   * value pass can emit a real alias whenever a reference points at something
   * that also becomes a variable.
   */
  const registry = new Map();
  const register = (property, name, collection) =>
    registry.set(property, { name, collection });

  const primitiveDecls = theme.primitivePrefix
    ? defaultDecls.filter((entry) => entry.property.startsWith(theme.primitivePrefix))
    : [];

  for (const entry of primitiveDecls) {
    register(entry.property, theme.primitiveName(entry.property), 'Primitives');
  }

  const brandDecls = defaultDecls.filter(
    (entry) =>
      entry.property.startsWith(theme.brandPrefix) &&
      !theme.excludeBrand.test(entry.property) &&
      !isTokenMetadata(entry.property) &&
      !theme.typescale.test(entry.property),
  );

  for (const entry of brandDecls) {
    const derived = theme.brandName(entry.property);
    // A token's collection follows what it resolves to, not what its name
    // starts with: --md-sys-elevation-surface-tint-color is a color, and a
    // color cannot live in a numeric collection.
    const isColor = resolveIn(entry.value, 'Light').kind === 'color';
    const name =
      isColor && !derived.startsWith('color/')
        ? `color/${derived.replace(/\//g, '-')}`
        : derived;

    register(entry.property, name, name.startsWith('color/') ? 'Color' : capitalize(name.split('/')[0]));
  }

  const rcDecls = [];
  const seenRc = new Set();

  for (const entry of bridgeDecls) {
    if (!entry.property.startsWith('--rc-') || seenRc.has(entry.property)) {
      continue;
    }

    seenRc.add(entry.property);
    rcDecls.push(entry);
    register(entry.property, rcTokenName(entry.property), 'RC Contract');
  }

  /* Pass 2 — resolve values. */
  const collections = new Map();

  const ensure = (name, modes, description) => {
    if (!collections.has(name)) {
      collections.set(name, { name, modes, description, variables: [] });
    }

    return collections.get(name);
  };

  /* Computed colors get a synthesized Color variable so the mode-aware result
   * lives in the mode-aware collection and the contract can alias it. */
  const computedColors = new Map();

  const synthesizeComputed = (property, name, values) => {
    const synthetic = `color/computed/${name.replace(/\//g, '-')}`;

    if (!computedColors.has(synthetic)) {
      computedColors.set(synthetic, {
        ...buildVariable({
          name: synthetic,
          property,
          type: 'COLOR',
          values,
          description: `Resolved from ${property}, which composes a color at use time.`,
        }),
        scopes: ['FRAME_FILL', 'SHAPE_FILL'],
      });
    }

    return synthetic;
  };

  if (primitiveDecls.length > 0) {
    const collection = ensure(
      'Primitives',
      ['Value'],
      'Raw reference palette. Not for direct use; semantic tokens alias these.',
    );

    for (const entry of primitiveDecls) {
      const resolved = resolveIn(entry.value, 'Light');

      if (resolved.kind !== 'color') {
        unresolved.push({ property: entry.property, raw: entry.value, reason: resolved.reason });

        continue;
      }

      collection.variables.push(
        buildVariable({
          name: registry.get(entry.property).name,
          property: entry.property,
          type: 'COLOR',
          values: { Value: colorValue(resolved.value) },
        }),
      );
    }
  }

  for (const entry of brandDecls) {
    const { name, collection: collectionName } = registry.get(entry.property);
    const shallow = shallowResolve(entry.value);
    const isColorToken = name.startsWith('color/');

    if (shallow.kind === 'composite') {
      composite.push({ property: entry.property, raw: entry.value, name });

      continue;
    }

    /* A reference to another registered token becomes a real Figma alias. */
    if (shallow.kind === 'alias' && registry.has(shallow.target)) {
      const target = registry.get(shallow.target);
      const alias = { alias: target.name, collection: target.collection };
      const collection = ensure(
        collectionName,
        isColorToken ? MODES : ['Value'],
        undefined,
      );

      collection.variables.push(
        buildVariable({
          name,
          property: entry.property,
          type: isColorToken ? 'COLOR' : 'FLOAT',
          values: isColorToken ? { Light: alias, Dark: alias } : { Value: alias },
        }),
      );

      continue;
    }

    if (isColorToken || shallow.kind === 'light-dark' || shallow.kind === 'computed') {
      const perMode = {};
      let failed = null;

      for (const mode of MODES) {
        const resolved = resolveIn(entry.value, mode);

        if (resolved.kind !== 'color') {
          failed = resolved;
          break;
        }

        /* light-dark() whose branch is a bare primitive reference still aliases
         * cleanly, which keeps the semantic layer pointing at primitives. */
        const lightDark = /^light-dark\(([\s\S]*)\)$/.exec(entry.value.trim());
        const branch = lightDark
          ? splitTopLevel(lightDark[1], ',')[mode === 'Dark' ? 1 : 0]
          : null;
        const branchShallow = branch ? shallowResolve(branch) : null;

        perMode[mode] =
          branchShallow?.kind === 'alias' && registry.has(branchShallow.target)
            ? {
                alias: registry.get(branchShallow.target).name,
                collection: registry.get(branchShallow.target).collection,
              }
            : colorValue(resolved.value);
      }

      if (failed) {
        unresolved.push({ property: entry.property, raw: entry.value, reason: failed.reason });

        continue;
      }

      ensure('Color', MODES, `Semantic color roles for ${theme.themeName}.`).variables.push(
        buildVariable({ name, property: entry.property, type: 'COLOR', values: perMode }),
      );

      continue;
    }

    const resolved = resolveIn(entry.value, 'Light');

    if (resolved.kind === 'number') {
      ensure(collectionName, ['Value'], undefined).variables.push(
        buildVariable({
          name,
          property: entry.property,
          type: 'FLOAT',
          values: { Value: resolved.value },
        }),
      );

      continue;
    }

    unresolved.push({ property: entry.property, raw: entry.value, reason: resolved.reason });
  }

  /* The public --rc-* contract. Single mode: it inherits light and dark by
   * aliasing the mode-aware Color collection, exactly as the CSS bridge does. */
  const rcCollection = ensure(
    'RC Contract',
    ['Value'],
    'The public --rc-* styling contract consumed by rc-webcomponents. Aliases the theme layer, so swapping the theme reskins every component.',
  );

  for (const entry of rcDecls) {
    const name = registry.get(entry.property).name;
    const componentScope = entry.scope.match(/\brc-[a-z-]+\b/)?.[0] ?? null;
    const description = componentScope
      ? `Applied where ${componentScope} is themed.`
      : undefined;
    const shallow = shallowResolve(entry.value);

    if (shallow.kind === 'composite') {
      composite.push({ property: entry.property, raw: entry.value, name });

      continue;
    }

    if (shallow.kind === 'alias' && registry.has(shallow.target)) {
      const target = registry.get(shallow.target);

      rcCollection.variables.push({
        ...buildVariable({
          name,
          property: entry.property,
          type: 'COLOR',
          description,
          values: { Value: { alias: target.name, collection: target.collection } },
        }),
        // The real type depends on what sits at the root of the alias chain, so
        // it is resolved once every entry exists.
        pendingAliasTarget: shallow.target,
      });

      continue;
    }

    if (shallow.kind === 'number') {
      rcCollection.variables.push(
        buildVariable({
          name,
          property: entry.property,
          type: 'FLOAT',
          description,
          values: { Value: shallow.value },
        }),
      );

      continue;
    }

    const perMode = {};
    let failed = null;

    for (const mode of MODES) {
      const resolved = resolveIn(entry.value, mode);

      if (resolved.kind !== 'color') {
        failed = resolved;
        break;
      }

      perMode[mode] = colorValue(resolved.value);
    }

    if (failed) {
      const resolved = resolveIn(entry.value, 'Light');

      if (resolved.kind === 'number') {
        rcCollection.variables.push(
          buildVariable({
            name,
            property: entry.property,
            type: 'FLOAT',
            description,
            values: { Value: resolved.value },
          }),
        );

        continue;
      }

      unresolved.push({
        property: entry.property,
        raw: entry.value,
        reason: failed.reason,
        ...(componentScope ? { scope: componentScope } : {}),
      });

      continue;
    }

    const synthetic = synthesizeComputed(entry.property, name, perMode);

    rcCollection.variables.push(
      buildVariable({
        name,
        property: entry.property,
        type: 'COLOR',
        description,
        values: { Value: { alias: synthetic, collection: 'Color' } },
      }),
    );
  }

  if (computedColors.size > 0) {
    const collection = ensure('Color', MODES, `Semantic color roles for ${theme.themeName}.`);

    collection.variables.push(...computedColors.values());
  }

  /*
   * An rc token may alias another rc token, so its Figma type is whatever sits
   * at the root of the chain, not what the first hop happens to be. A chain
   * that ends at a composite (a shorthand that never became a variable) has no
   * variable to point at, so it falls back to a literal or is reported.
   */
  const rcByProperty = new Map(rcCollection.variables.map((entry) => [entry.cssVar, entry]));

  // Being in the registry only means a declaration was seen; a composite
  // shorthand never becomes a variable, so an alias cannot point at it.
  const materialized = new Set();

  for (const collection of collections.values()) {
    for (const variable of collection.variables) {
      materialized.add(variable.cssVar);
    }
  }

  const rootType = (entry, seen = new Set()) => {
    if (!entry.pendingAliasTarget || seen.has(entry.cssVar)) {
      return entry.type;
    }

    seen.add(entry.cssVar);

    const target = registry.get(entry.pendingAliasTarget);

    if (target && target.collection !== 'RC Contract') {
      return materialized.has(entry.pendingAliasTarget)
        ? target.collection === 'Color'
          ? 'COLOR'
          : 'FLOAT'
        : null;
    }

    const next = rcByProperty.get(entry.pendingAliasTarget);

    return next ? rootType(next, seen) : null;
  };

  const resolvedRc = [];

  for (const entry of rcCollection.variables) {
    if (!entry.pendingAliasTarget) {
      resolvedRc.push(entry);

      continue;
    }

    const type = rootType(entry);

    if (type === null) {
      // The chain ends at a composite; keep the value if it resolves literally.
      const literal = resolveIn(byProperty.get(entry.cssVar) ?? '', 'Light');

      if (literal.kind === 'number') {
        resolvedRc.push({ ...entry, type: 'FLOAT', values: { Value: literal.value }, pendingAliasTarget: undefined });

        continue;
      }

      composite.push({
        property: entry.cssVar,
        raw: byProperty.get(entry.cssVar),
        name: entry.name,
        reason: 'aliases a composite shorthand',
      });

      continue;
    }

    // Scopes were inferred against a placeholder type, so they are recomputed
    // once the chain's real type is known.
    resolvedRc.push({
      ...entry,
      type,
      scopes: inferScopes(entry.name, type),
      pendingAliasTarget: undefined,
    });
  }

  rcCollection.variables = resolvedRc.map(({ pendingAliasTarget: _drop, ...rest }) => rest);

  /* Typography roles become Figma text styles rather than loose variables. */
  const typescale = new Map();

  for (const entry of defaultDecls) {
    const match = theme.typescale.exec(entry.property);

    if (!match) {
      continue;
    }

    const groups = match.slice(1).filter(Boolean);
    const role = theme.themePackage === 'rc-theme-material' ? groups[0] : 'body';
    const field = theme.themePackage === 'rc-theme-material' ? groups[1] : groups.at(-1);
    const styleName = theme.typescaleStyleName(role);

    if (!typescale.has(styleName)) {
      typescale.set(styleName, { name: styleName, role });
    }

    const resolved = resolveIn(entry.value, 'Light');

    typescale.get(styleName)[field] =
      resolved.kind === 'number' ? resolved.value : resolveLiteral(entry.value, byProperty);

    typescale.get(styleName)[`${field}CssVar`] = entry.property;
  }

  /*
   * Shadows are CSS box-shadow composites rather than single tokens, so they
   * become Figma effect styles. Each layer keeps the variable its color came
   * from, letting the Figma step bind a mode-aware color instead of baking one.
   */
  const effectStyles = [...defaultDecls, ...bridgeDecls]
    .filter((entry) => theme.shadow.test(entry.property))
    .map((entry) => {
      const level = theme.shadow.exec(entry.property)[1];
      const layers = entry.value === 'none'
        ? []
        : splitTopLevel(entry.value, ',').map((layer) => parseShadowLayer(layer, resolveIn));

      return {
        name: theme.shadowStyleName(level),
        cssVar: entry.property,
        value: entry.value,
        layers,
      };
    });

  const ordered = [...collections.values()].sort((a, b) => {
    const rank = (name) =>
      ['Primitives', 'Color'].indexOf(name) === -1
        ? name === 'RC Contract'
          ? 9
          : 5
        : ['Primitives', 'Color'].indexOf(name);

    return rank(a.name) - rank(b.name) || a.name.localeCompare(b.name);
  });

  for (const collection of ordered) {
    collection.variables.sort((a, b) => a.name.localeCompare(b.name));
  }

  return {
    $meta: {
      theme: theme.themeName,
      package: `@rcarls/${theme.themePackage}`,
      source: [
        `packages/${theme.themePackage}/defaults.css`,
        `packages/${theme.themePackage}/bridge.css`,
      ],
      generator: 'scripts/build-design-tokens.mjs',
      remBase: REM_BASE,
      note: 'Generated from the theme CSS. Do not hand-edit; re-run the generator after changing a theme.',
    },
    collections: ordered,
    textStyles: [...typescale.values()].sort((a, b) => a.name.localeCompare(b.name)),
    effectStyles: effectStyles.sort((a, b) => a.name.localeCompare(b.name)),
    skipped: {
      note: 'Composite values are CSS shorthands with no single-variable Figma equivalent; bind their parts individually. Forced-colors and reduced-motion overrides are accessibility fallbacks Figma cannot express.',
      composite: composite.sort((a, b) => a.property.localeCompare(b.property)),
      unresolved: unresolved.sort((a, b) => a.property.localeCompare(b.property)),
    },
  };
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* ── Entry point ───────────────────────────────────────────────────────────── */

function write(path, document) {
  const full = join(root, path);

  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, `${JSON.stringify(document, null, 2)}\n`);

  const variables = document.collections.reduce(
    (total, collection) => total + collection.variables.length,
    0,
  );

  console.log(
    `${path}\n  ${document.collections.length} collections, ${variables} variables, ` +
      `${document.textStyles.length} text styles, ${document.effectStyles.length} effect styles\n` +
      `  ${document.skipped.composite.length} composite, ${document.skipped.unresolved.length} unresolved`,
  );
}

for (const theme of THEMES) {
  const document = buildDocument(theme);

  write(`design/tokens/${theme.themePackage.replace('rc-theme-', '')}.tokens.json`, document);
}
