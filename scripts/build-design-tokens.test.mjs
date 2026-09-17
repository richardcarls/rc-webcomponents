import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const root = process.cwd();

execFileSync(process.execPath, [join(root, 'scripts/build-design-tokens.mjs')], {
  cwd: root,
  stdio: 'pipe',
});

/*
 * A unit-level export used only for the one edge case the real theme CSS
 * can't exercise (an easing curve with an unresolvable control point).
 * Importing it re-runs the module's top-level write loop a second time,
 * redundant with the execFileSync run above but harmless and idempotent.
 */
const { resolveCubicBezierComposite } = await import('./build-design-tokens.mjs');

function load(theme) {
  return JSON.parse(readFileSync(join(root, `design/tokens/${theme}.tokens.json`), 'utf8'));
}

function variable(document, collectionName, variableName) {
  const collection = document.collections.find((entry) => entry.name === collectionName);

  return collection?.variables.find((entry) => entry.name === variableName);
}

const material = load('material');
const substrate = load('substrate');
const win31 = load('win31');

test('semantic colors alias primitives per mode instead of duplicating values', () => {
  const primary = variable(material, 'Color', 'color/primary');

  assert.deepEqual(primary.values.Light, {
    alias: 'palette/primary/40',
    collection: 'Primitives',
  });

  assert.deepEqual(primary.values.Dark, {
    alias: 'palette/primary/80',
    collection: 'Primitives',
  });
});

test('the rc contract aliases the theme layer rather than restating it', () => {
  assert.deepEqual(variable(material, 'RC Contract', 'core/accent').values.Value, {
    alias: 'color/primary',
    collection: 'Color',
  });
});

test('primitive hex values survive the round trip', () => {
  assert.equal(variable(material, 'Primitives', 'palette/primary/40').values.Value.hex, '#6750a4');
});

test('primitives stay out of variable pickers while semantic tokens are scoped', () => {
  assert.deepEqual(variable(material, 'Primitives', 'palette/primary/40').scopes, []);

  assert.deepEqual(variable(material, 'RC Contract', 'button/bg').scopes, [
    'FRAME_FILL',
    'SHAPE_FILL',
  ]);
});

test('every variable carries a var() code syntax for Dev Mode', () => {
  for (const collection of material.collections) {
    for (const entry of collection.variables) {
      assert.match(
        entry.codeSyntax.WEB,
        /^var\(--[a-z0-9-]+\)$/,
        `${entry.name} has code syntax ${entry.codeSyntax.WEB}`,
      );
    }
  }
});

test('rem dimensions convert to pixels', () => {
  // --md-sys-typescale-body-large-size is 1rem in the source CSS.
  assert.equal(material.textStyles.find((s) => s.name === 'Material/body-large').size, 16);
});

test('text styles follow variable references to literal font values', () => {
  const body = material.textStyles.find((style) => style.name === 'Material/body-large');

  assert.equal(body.font, 'Roboto');
  assert.equal(body.weight, 400);
});

test('shadow composites become effect layers with calc blur resolved', () => {
  const level2 = material.effectStyles.find((style) => style.name === 'Elevation/level2');
  const [layer] = level2.layers;

  assert.equal(layer.offsetY, 3);
  // Blur is calc(<elevation> * 2) in the source.
  assert.equal(layer.radius, 6);
  // color-mix(... 18%, transparent) is an alpha change on the shadow color.
  assert.equal(layer.colors.Light.a, 0.18);
});

test('an elevation level of none produces no layers', () => {
  assert.deepEqual(
    material.effectStyles.find((style) => style.name === 'Elevation/level0').layers,
    [],
  );
});

test('oklch brand colors convert to sRGB', () => {
  const primary = variable(substrate, 'Color', 'color/primary');

  assert.match(primary.values.Light.hex, /^#[0-9a-f]{6}$/);
  assert.notEqual(primary.values.Light.hex, primary.values.Dark.hex);
});

test('a two color mix lands between its operands', () => {
  const tinted = variable(
    substrate,
    'Color',
    'color/computed/menu-button-trigger-hover-background',
  );
  const accent = variable(substrate, 'Color', 'color/primary');
  const base = variable(substrate, 'Color', 'color/surface-raised');

  assert.ok(tinted, 'expected the 10 percent accent tint over the button fill to resolve');
  assert.equal(tinted.values.Light.a, 1, 'a mix of two opaque colors stays opaque');

  const channels = ['r', 'g', 'b'];
  const between = channels.every((channel) => {
    const [low, high] = [accent, base]
      .map((entry) => entry.values.Light[channel])
      .sort((first, second) => first - second);

    return tinted.values.Light[channel] >= low && tinted.values.Light[channel] <= high;
  });

  assert.ok(between, `expected ${tinted.values.Light.hex} to sit between its operands`);
});

test('a mix against a system color stays unresolved rather than guessing', () => {
  // `currentColor` is contextual by definition, so this one cannot resolve to a
  // value no matter what the theme does.
  const entry = substrate.skipped.unresolved.find(
    (candidate) => candidate.property === '--rc-card-subtitle-color',
  );

  assert.equal(entry?.reason, 'mix-base-unresolved');
});

test('themed mixes name a theme token as their other operand', () => {
  // A mix against a bare system color has no value outside a browser, so it
  // never reaches the export. Every theme mix should resolve instead.
  const unresolved = new Set(substrate.skipped.unresolved.map((entry) => entry.property));

  for (const property of [
    '--rc-splitter-separator-color',
    '--rc-splitter-handle-color',
    '--rc-dialog-scrim',
  ]) {
    assert.ok(!unresolved.has(property), `${property} should resolve`);
  }
});

test('substrate exposes the same rc contract surface as material', () => {
  const names = (document) =>
    new Set(
      document.collections
        .find((entry) => entry.name === 'RC Contract')
        .variables.map((entry) => entry.name),
    );
  const shared = [...names(substrate)].filter((name) => names(material).has(name));

  assert.ok(
    shared.length > 100,
    `expected a broad shared contract, found ${shared.length} shared tokens`,
  );
});

test('every alias points at a variable that exists and shares its type', () => {
  for (const document of [material, substrate]) {
    const index = new Map();

    for (const collection of document.collections) {
      for (const entry of collection.variables) {
        index.set(`${collection.name}::${entry.name}`, entry);
      }
    }

    for (const collection of document.collections) {
      for (const entry of collection.variables) {
        for (const value of Object.values(entry.values)) {
          if (!value || !value.alias) {
            continue;
          }

          const target = index.get(`${value.collection ?? collection.name}::${value.alias}`);

          assert.ok(target, `${entry.name} aliases missing ${value.alias}`);

          assert.equal(
            target.type,
            entry.type,
            `${entry.name} (${entry.type}) aliases ${value.alias} (${target.type})`,
          );
        }
      }
    }
  }
});

test('scopes match the variable type they are attached to', () => {
  const colorScopes = new Set([
    'FRAME_FILL',
    'SHAPE_FILL',
    'TEXT_FILL',
    'STROKE_COLOR',
    'EFFECT_COLOR',
  ]);

  for (const document of [material, substrate]) {
    for (const collection of document.collections) {
      for (const entry of collection.variables) {
        for (const scope of entry.scopes) {
          const isColorScope = colorScopes.has(scope);

          assert.equal(
            isColorScope,
            entry.type === 'COLOR',
            `${entry.name} is ${entry.type} but scoped ${scope}`,
          );
        }
      }
    }
  }
});

test('variable names are unique within each collection', () => {
  for (const document of [material, substrate]) {
    for (const collection of document.collections) {
      const names = collection.variables.map((entry) => entry.name);

      assert.equal(
        new Set(names).size,
        names.length,
        `${collection.name} has duplicate variable names`,
      );
    }
  }
});

test('composite shorthands are reported rather than silently dropped', () => {
  const border = material.skipped.composite.find((entry) => entry.property === '--rc-border');

  assert.ok(border, '--rc-border is a shorthand and should be listed as composite');
});

test('a cubic-bezier composed from var() control points resolves to a literal STRING variable', () => {
  const standard = variable(material, 'Motion', 'motion/easing-standard');

  assert.equal(standard?.type, 'STRING');
  assert.equal(standard?.values.Value, 'cubic-bezier(0.2, 0, 0, 1)');

  const emphasizedDecelerate = variable(material, 'Motion', 'motion/easing-emphasized-decelerate');

  assert.equal(emphasizedDecelerate?.values.Value, 'cubic-bezier(0.05, 0.7, 0.1, 1)');

  // None of the seven named easings should fall through to skipped.composite
  // now that their control points resolve.
  const skippedEasings = material.skipped.composite.filter((entry) =>
    entry.name.startsWith('motion/easing-'),
  );

  assert.deepEqual(skippedEasings, []);
});

test('a cubic-bezier with an unresolvable control point stays a reported composite, not a partial curve', () => {
  const byProperty = new Map([
    ['--test-easing-x0', '0.2'],
    // y0 is left undeclared on purpose.
    ['--test-easing-x1', '0'],
    ['--test-easing-y1', '1'],
  ]);

  const resolveIn = (value) => {
    const match = /^var\(\s*(--[a-z0-9-]+)\s*\)$/.exec(value.trim());
    const declared = match ? byProperty.get(match[1]) : undefined;

    return declared === undefined
      ? { kind: 'unresolved', raw: value, reason: 'undeclared-variable' }
      : { kind: 'number', value: Number.parseFloat(declared) };
  };

  const raw =
    'cubic-bezier(var(--test-easing-x0), var(--test-easing-y0), var(--test-easing-x1), var(--test-easing-y1))';

  assert.equal(resolveCubicBezierComposite(raw, resolveIn), null);
});

test('unresolved values always record why they could not be resolved', () => {
  for (const document of [material, substrate]) {
    for (const entry of document.skipped.unresolved) {
      assert.ok(entry.reason, `${entry.property} is missing a reason`);
    }
  }
});

test('a font shorthand is a composite, not the first number inside it', () => {
  // `var(--weight, 500) var(--size, 1rem) / var(--lh) var(--family)` both starts
  // and ends with `var(`, so an anchored greedy pattern reads it as one variable
  // whose fallback is the rest of the declaration, and it resolves to `500`.
  for (const document of [material, substrate]) {
    const fontShorthands = document.collections
      .flatMap((collection) => collection.variables)
      .filter((entry) => /(^|\/)(.*-)?font$/.test(entry.name));

    assert.deepEqual(fontShorthands, [], 'font shorthands should never become variables');
  }

  const composites = material.skipped.composite.map((entry) => entry.property);

  assert.ok(composites.includes('--rc-card-title-font'));
  assert.ok(composites.includes('--rc-disclosure-summary-font'));
});

test('a mix weight written as a calc still resolves', () => {
  // Material writes its state layers as `calc(var(--opacity, 0.08) * 100%)`
  // rather than as a literal percentage.
  const index = new Map(
    material.collections
      .flatMap((collection) => collection.variables)
      .map((entry) => [entry.name, entry]),
  );

  for (const name of ['list-item/hover-bg', 'list-item/active-bg']) {
    assert.ok(index.has(name), `${name} should resolve`);
  }

  const unresolved = new Set(material.skipped.unresolved.map((entry) => entry.property));

  assert.ok(!unresolved.has('--rc-list-item-hover-bg'));
  assert.ok(!unresolved.has('--rc-disclosure-summary-hover-background'));
});

test('a metric scaled from a unit token resolves to a real length', () => {
  // The Windows 3.1 theme writes the factor first, as calc(22 * var(--unit)),
  // which is the commuted form of what Material writes. Without it every
  // metric, and every bridge token aliasing one, degrades to a composite.
  assert.deepEqual(variable(win31, 'Size', 'size/control-height').values, { Value: 22 });
  assert.deepEqual(variable(win31, 'Size', 'size/listbox-row-height').values, { Value: 17 });
  assert.deepEqual(variable(win31, 'Size', 'size/scrollbar-size').values, { Value: 16 });

  const composite = new Set(win31.skipped.composite.map((entry) => entry.property));

  assert.ok(!composite.has('--rc-control-block-size'));
  assert.ok(!composite.has('--rc-list-item-min-block-size'));
});

test('the Windows 3.1 export carries its palette and its RC contract', () => {
  assert.equal(variable(win31, 'Color', 'color/surface').values.Light.hex, '#c0c0c0');
  assert.equal(variable(win31, 'Color', 'color/selection').values.Light.hex, '#000080');

  const contract = win31.collections.find((entry) => entry.name === 'RC Contract');

  assert.ok(contract.variables.length > 250, 'the bridge should export its full contract');
});
