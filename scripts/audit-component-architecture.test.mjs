import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  CROSS_COMPONENT_TOKEN_CONTRACTS,
  PRIVATE_THEME_TOKEN_CONTRACTS,
  REMOVED_TOKEN_CONTRACTS,
  extractMarkers,
  extractTokenDefinitions,
  extractTokenReferences,
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

test('reports an actionable error for a marker without an ownership contract', () => {
  assert.deepEqual(findMarkerContractErrors(new Set(['data-rc-new-hook']), {}), [
    'Unclassified marker data-rc-new-hook; add its ownership category to MARKER_CONTRACTS.',
  ]);
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
  assert.equal(result.summary.componentPackages, 37);
  assert.equal(result.summary.customElements, 40);
  assert.ok(result.warnings.some((warning) => warning.includes('selective coverage')));

  assert.deepEqual(result.familyTokens['--rc-thumb-radius'], ['rc-range-slider', 'rc-slider']);

  assert.ok(
    result.themes
      .find((theme) => theme.name === 'rc-theme-material')
      .privateTokenOverrides.some((token) => token.startsWith('--_rc-button-ripple-')),
  );
});
