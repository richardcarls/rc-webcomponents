import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ANIMATED_LAYOUT_PROPERTY_BUDGETS,
  CROSS_COMPONENT_TOKEN_CONTRACTS,
  PRIVATE_THEME_TOKEN_CONTRACTS,
  REMOVED_TOKEN_CONTRACTS,
  extractMarkers,
  extractThemeSelectorMetrics,
  extractTokenDefinitions,
  extractTokenReferences,
  extractTransitionAnalysis,
  findMarkerContractErrors,
  inspectTheme,
  runAudit,
} from './audit-component-architecture.mjs';

test('extracts marker and token contracts without confusing references and definitions', () => {
  const css = `
    :root { --rc-accent: Highlight; --_rc-private: none; }
    [data-rc-icon] { color: var(--rc-accent, var(--rc-markdown-editor-color)); }
    getPropertyValue('--rc-imperative-duration');
  `;

  assert.deepEqual([...extractMarkers(css)], ['data-rc-icon']);
  assert.deepEqual([...extractTokenDefinitions(css)], ['--rc-accent', '--_rc-private']);

  // A declaration explained by a comment, or sitting first in its block behind
  // indentation, is still a definition.
  assert.deepEqual(
    [
      ...extractTokenDefinitions(`
        .theme {
          --rc-first: 0;
          /* Why this one is what it is. */
          --rc-commented: 1;
        }
      `),
    ],
    ['--rc-first', '--rc-commented'],
  );

  assert.deepEqual(
    [...extractTokenReferences(css)],
    ['--rc-accent', '--rc-markdown-editor-color', '--rc-imperative-duration'],
  );

  // A style query tests a token instead of substituting it, so it is a
  // reference even though there is no var() anywhere.
  assert.deepEqual(
    [...extractTokenReferences('@container style(--rc-segmented-button-appearance: segmented) {}')],
    ['--rc-segmented-button-appearance'],
  );
});

test('recognizes only the canonical 0.7 token namespace', () => {
  assert.deepEqual(
    [...extractTokenReferences('var(--rme-color) var(--rc-markdown-editor-color)')],
    ['--rc-markdown-editor-color'],
  );

  assert.ok(REMOVED_TOKEN_CONTRACTS.has('--rc-text'));

  assert.deepEqual(CROSS_COMPONENT_TOKEN_CONTRACTS['--rc-thumb-radius'], [
    'rc-range-slider',
    'rc-slider',
  ]);

  assert.ok(PRIVATE_THEME_TOKEN_CONTRACTS['rc-theme-material'].has('--_rc-button-ripple-color'));

  // The segmented button stopped parameterizing its structure through private
  // tokens, so no theme overrides any of them now.
  for (const theme of ['rc-theme-material', 'rc-theme-substrate', 'rc-theme-win31']) {
    assert.ok(
      ![...PRIVATE_THEME_TOKEN_CONTRACTS[theme]].some((token) =>
        token.startsWith('--_rc-segmented-button-'),
      ),
    );
  }
});

test('extracts animated layout properties from multi-line transitions and @keyframes, ignoring composite-only ones', () => {
  const css = `
    /* transform var(--x) should not count as layout even though it's near block-size text in a comment */
    .rail {
      transition:
        inline-size var(--rc-navigation-rail-duration, 200ms) var(--rc-navigation-rail-easing, ease),
        padding var(--rc-navigation-rail-duration, 200ms) var(--rc-navigation-rail-easing, ease);
    }
    .chip {
      transition: background-color 150ms ease, transform 150ms cubic-bezier(0.2, 0, 0, 1);
    }
    @keyframes rc-progress-indeterminate {
      0% { inset-inline-start: -40%; }
      100% { inset-inline-start: 100%; }
    }
  `;

  const { layoutProperties, transitionsAll } = extractTransitionAnalysis(css);

  assert.deepEqual([...layoutProperties].sort(), ['inline-size', 'inset-inline-start', 'padding']);
  assert.equal(transitionsAll, false);
});

test('flags transition: all regardless of case or accompanying layout properties', () => {
  const { transitionsAll } = extractTransitionAnalysis('.x { transition: all 150ms ease; }');

  assert.equal(transitionsAll, true);
});

test('every animated-layout-property budget entry is still animated, and every found property is budgeted', () => {
  const result = runAudit(process.cwd());

  assert.deepEqual(
    result.errors.filter((error) => error.includes('layout property') || error.includes('is stale')),
    [],
  );

  assert.ok(ANIMATED_LAYOUT_PROPERTY_BUDGETS['rc-disclosure'].has('block-size'));
});

test('reports an actionable error for a marker without an ownership contract', () => {
  assert.deepEqual(findMarkerContractErrors(new Set(['data-rc-new-hook']), {}), [
    'Unclassified marker data-rc-new-hook; add its ownership category to MARKER_CONTRACTS.',
  ]);
});

test('selector metrics ignore prose mentioning !important, ::part(), or a marker in a comment', () => {
  const css = `
    /*
     * This comment explains why a declaration needs !important, mentions
     * ::part(trigger), [data-rc-icon], and a .rc-button--variant modifier
     * class, and an #anchor-style-looking id, none of which are real CSS.
     */
    .real { color: red !important; }
  `;

  assert.deepEqual(extractThemeSelectorMetrics(css), {
    parts: 0,
    markerHooks: 0,
    importantDeclarations: 1,
    idSelectors: 0,
    modifierHooks: 0,
  });
});

test('theme entrypoints import and layer every component stylesheet', () => {
  for (const themeName of ['rc-theme-material', 'rc-theme-substrate']) {
    const theme = inspectTheme(process.cwd(), themeName);

    assert.deepEqual(theme.missingImports, []);
    assert.deepEqual(theme.unlayeredFiles, []);
  }
});

test('the current component architecture satisfies hard guardrails', () => {
  const result = runAudit(process.cwd());

  assert.deepEqual(result.errors, []);
  assert.equal(result.summary.componentPackages, 38);
  assert.equal(result.summary.customElements, 41);
  assert.deepEqual(result.themeCoverage['rc-theme-substrate'].missing, []);

  assert.deepEqual(result.familyTokens['--rc-thumb-radius'], ['rc-range-slider', 'rc-slider']);

  assert.ok(
    result.themes
      .find((theme) => theme.name === 'rc-theme-material')
      .privateTokenOverrides.some((token) => token.startsWith('--_rc-button-ripple-')),
  );
});
