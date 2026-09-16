import { readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = resolve(SCRIPT_DIR, '..');

export const MARKER_CONTRACTS = {
  'data-rc-action-overflowed': 'component-state',
  'data-rc-action-promoted': 'component-state',
  'data-rc-anchor': 'internal-controller',
  'data-rc-anchor-style': 'style-sentinel',
  'data-rc-bottom-sheet-handle': 'authored-behavior',
  'data-rc-button-icon': 'authored-structure',
  'data-rc-button-label': 'authored-structure',
  'data-rc-button-progress': 'authored-structure',
  'data-rc-button-selected-icon': 'authored-structure',
  'data-rc-chip-icon': 'authored-structure',
  'data-rc-chip-label': 'authored-structure',
  'data-rc-dialog-resize-axis': 'authored-behavior',
  'data-rc-dialog-resize-origin': 'authored-behavior',
  'data-rc-field-control': 'authored-behavior',
  'data-rc-icon': 'authored-structure',
  'data-rc-light-dom-base': 'style-sentinel',
  'data-rc-list-leading': 'authored-structure',
  'data-rc-list-position': 'component-state',
  'data-rc-list-supporting': 'authored-structure',
  'data-rc-menu-icon': 'authored-structure',
  'data-rc-menu-label': 'authored-structure',
  'data-rc-menu-leading': 'authored-structure',
  'data-rc-menu-shortcut': 'authored-structure',
  'data-rc-menu-trailing': 'authored-structure',
  'data-rc-navigation-collapse-icon': 'authored-structure',
  'data-rc-navigation-expand-icon': 'authored-structure',
  'data-rc-navigation-icon': 'authored-structure',
  'data-rc-navigation-indicator': 'authored-behavior',
  'data-rc-navigation-label': 'authored-structure',
  'data-rc-range-slider-reflector': 'internal-component',
  'data-rc-resize-corner': 'internal-controller',
  'data-rc-scroller-span': 'authored-behavior',
  'data-rc-segmented-button-selected-icon': 'authored-structure',
  'data-rc-view-transition': 'authored-theme-hook',
  'data-rc-win31-default': 'authored-theme-hook',
  'data-rc-win31-inactive': 'authored-theme-hook',
  'data-rc-win31-toggle': 'authored-theme-hook',
};

export const REMOVED_TOKEN_CONTRACTS = new Set([
  '--rc-app-bar-background',
  '--rc-chip-group-webkit-scrollbar-display',
  '--rc-list-item-bg',
  '--rc-list-item-supporting-color',
  '--rc-navigation-rail-toggle-border',
  '--rc-navigation-rail-toggle-font',
  '--rc-navigation-rail-toggle-padding',
  '--rc-combobox-chip-padding-inline',
  '--rc-select-chip-padding-inline',
  '--rc-text',
  '--rc-textarea-radius',
  '--rc-transfer-list-panel-background',
  '--rc-transfer-list-panel-border',
  '--rc-transfer-list-panel-radius',
]);

export const CROSS_COMPONENT_TOKEN_CONTRACTS = {
  '--rc-chip-remove-offset-inline': ['rc-combobox', 'rc-select'],
  '--rc-chip-remove-target-size': ['rc-combobox', 'rc-select'],
  '--rc-anchor-viewport-block-size': ['rc-combobox'],
  '--rc-anchor-viewport-inline-size': ['rc-combobox'],
  '--rc-dialog-scrim': ['rc-bottom-sheet'],
  '--rc-fab-inset-block': ['rc-fab', 'rc-fab-menu'],
  '--rc-fab-inset-inline': ['rc-fab', 'rc-fab-menu'],
  '--rc-fab-z-index': ['rc-fab', 'rc-fab-menu'],
  '--rc-menu-button-popup-z-index': ['rc-fab-menu'],
  '--rc-thumb-radius': ['rc-range-slider', 'rc-slider'],
  '--rc-line-action-bg': ['rc-textarea'],
  '--rc-line-action-border': ['rc-textarea'],
  '--rc-line-action-border-radius': ['rc-textarea'],
  '--rc-line-action-color': ['rc-textarea'],
  '--rc-line-action-font-size': ['rc-textarea'],
  '--rc-line-action-hover-bg': ['rc-textarea'],
  '--rc-line-action-hover-color': ['rc-textarea'],
  '--rc-line-action-hover-opacity': ['rc-textarea'],
  '--rc-line-action-opacity': ['rc-textarea'],
  '--rc-line-action-padding': ['rc-textarea'],
  '--rc-line-action-shadow': ['rc-textarea'],
  '--rc-line-actions-gap': ['rc-textarea'],
  '--rc-line-actions-margin-start': ['rc-textarea'],
};

export const PRIVATE_THEME_TOKEN_CONTRACTS = {
  'rc-theme-material': new Set([
    '--_rc-button-ripple-color',
    '--_rc-button-ripple-duration',
    '--_rc-button-ripple-easing',
    '--_rc-button-ripple-enabled',
    '--_rc-button-ripple-opacity',
    '--_rc-field-input-line-height',
    '--_rc-field-label-line-height',
  ]),
  'rc-theme-substrate': new Set(),
  'rc-theme-win31': new Set(),
};

export const THEME_SELECTOR_BUDGETS = {
  'rc-theme-material': {
    parts: 108,
    // Dialog surfaces add no marker coupling; the retained growth comes from
    // documented chip-icon and visible-list-position contracts.
    markerHooks: 71,
    importantDeclarations: 13,
    idSelectors: 3,
    modifierHooks: 59,
  },
  'rc-theme-substrate': {
    // Grew with rc-field coverage: the field's own anatomy plus the resets a
    // control provider needs so its chrome stops nesting inside the field's.
    parts: 45,
    markerHooks: 22,
    importantDeclarations: 1,
    idSelectors: 0,
    modifierHooks: 0,
  },
  'rc-theme-win31': {
    // Period chrome is drawn rather than tinted, so the theme reaches more
    // shadow-owned elements than the modern themes do. The !important
    // declarations are the icon-geometry and forced-colors overrides.
    parts: 115,
    markerHooks: 19,
    importantDeclarations: 8,
    idSelectors: 0,
    modifierHooks: 0,
  },
};

export const PACKAGE_ID_SELECTOR_BUDGETS = {
  'rc-adaptive-menu': 14,
  'rc-app-bar': 29,
  'rc-carousel': 7,
  'rc-chip-group': 10,
  'rc-combobox': 4,
  'rc-fab-menu': 6,
  'rc-field': 25,
  'rc-markdown-editor': 19,
  'rc-menu-button': 9,
  'rc-menubar': 3,
  'rc-navigation-bar': 4,
  'rc-navigation-rail': 18,
  'rc-search-bar': 15,
  'rc-select': 2,
  'rc-splitter': 8,
  'rc-textarea': 19,
  'rc-toolbar': 2,
  'rc-transfer-list': 6,
  'rc-virtual-canvas': 7,
};

const NON_COMPONENT_PACKAGES = new Set([
  'rc-common',
  'rc-textarea-adapters',
  'rc-textarea-plugin-markdown',
  'rc-theme-material',
  'rc-theme-substrate',
  'rc-theme-win31',
  'rc-webcomponents',
]);
const COMPONENT_THEME_FILE = new Map([['rc-list', 'list-item.css']]);

function read(path) {
  return readFileSync(path, 'utf8');
}

function listFiles(directory, predicate) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!['dist', 'node_modules'].includes(entry.name)) {
        files.push(...listFiles(path, predicate));
      }
    } else if (predicate(path)) {
      files.push(path);
    }
  }

  return files;
}

export function extractMarkers(text) {
  return new Set(text.match(/data-rc-[a-z0-9-]+/g) ?? []);
}

export function extractTokenReferences(text) {
  const fromVars = [...text.matchAll(/var\(\s*(--(?:_)?rc-[a-z0-9-]+)/g)].map((match) => match[1]);
  const fromComputedStyles = [
    ...text.matchAll(/getPropertyValue\(\s*['"](--(?:_)?rc-[a-z0-9-]+)['"]\s*\)/g),
  ].map((match) => match[1]);
  /*
   * A style query consumes a token by testing it rather than substituting it,
   * so it never appears inside a var(). Without this a token that only gates a
   * @container style() block reads as defined by the themes and consumed by
   * nobody.
   */
  const fromStyleQueries = [...text.matchAll(/style\(\s*(--(?:_)?rc-[a-z0-9-]+)\s*:/g)].map(
    (match) => match[1],
  );

  return new Set([...fromVars, ...fromComputedStyles, ...fromStyleQueries]);
}

export function extractTokenDefinitions(text) {
  /*
   * Comments are removed before matching. A declaration explained by a comment
   * directly above it used to read as undefined, so Material was hiding 24 of
   * its own definitions this way and Substrate 8. It only surfaced when a theme
   * commented a token that a private contract required.
   */
  const withoutComments = text.replace(/\/\*[\s\S]*?\*\//g, ' ');

  return new Set(
    [...withoutComments.matchAll(/(^|[;{]\s*)(--(?:_)?rc-[a-z0-9-]+)\s*:/gm)].map(
      (match) => match[2],
    ),
  );
}

export function findMarkerContractErrors(markers, contracts = MARKER_CONTRACTS) {
  const errors = [];

  for (const marker of markers) {
    if (!contracts[marker]) {
      errors.push(`Unclassified marker ${marker}; add its ownership category to MARKER_CONTRACTS.`);
    }
  }

  for (const marker of Object.keys(contracts)) {
    if (!markers.has(marker)) {
      errors.push(
        `Classified marker ${marker} is no longer present; remove or update its contract.`,
      );
    }
  }

  return errors;
}

function sorted(values) {
  return [...values].sort();
}

function packageDirectories(root) {
  const packagesRoot = join(root, 'packages');

  return readdirSync(packagesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(packagesRoot, entry.name))
    .sort();
}

function componentPackages(root) {
  return packageDirectories(root).filter((directory) => {
    const name = basename(directory);

    return !NON_COMPONENT_PACKAGES.has(name) && readdirSync(join(directory, 'src')).length > 0;
  });
}

function manifestDeclarations(root) {
  const manifest = JSON.parse(read(join(root, 'dist/custom-elements.json')));
  const declarations = [];

  for (const module of manifest.modules ?? []) {
    for (const declaration of module.declarations ?? []) {
      if (declaration.tagName) {
        declarations.push({ ...declaration, modulePath: module.path });
      }
    }
  }

  return declarations;
}

function packageNameFromModule(modulePath) {
  return modulePath.split(/[\\/]/)[1];
}

function inspectPackage(directory, declarations, baseTokens) {
  const name = basename(directory);
  const sourceFiles = listFiles(
    join(directory, 'src'),
    (path) => extname(path) === '.ts' && !path.endsWith('.test.ts'),
  );
  const source = sourceFiles.map(read).join('\n');
  const markers = extractMarkers(source);
  const tokens = extractTokenReferences(source);
  const hasLightDomBase = markers.has('data-rc-light-dom-base');
  const hasShadowStyles = sourceFiles.some(
    (path) => path.endsWith('.styles.ts') || /static\s+(?:override\s+)?styles\s*=/.test(read(path)),
  );
  const hasLightRenderRoot = /createRenderRoot\s*\([^)]*\)[\s\S]{0,160}?return\s+this\s*;/.test(
    source,
  );
  const hasAutonomousElement = /extends\s+HTMLElement/.test(source);
  let styleModel = 'shadow';

  if (hasAutonomousElement && !hasShadowStyles && !hasLightDomBase) {
    styleModel = 'autonomous-light';
  } else if (hasLightRenderRoot && hasShadowStyles) {
    styleModel = 'mixed-light-shadow';
  } else if (hasLightRenderRoot) {
    styleModel = 'lit-light';
  } else if (hasLightDomBase && hasShadowStyles) {
    styleModel = 'shadow-plus-light-base';
  } else if (hasLightDomBase) {
    styleModel = 'light-base';
  }

  return {
    package: name,
    tags: declarations
      .filter((declaration) => packageNameFromModule(declaration.modulePath) === name)
      .map((declaration) => declaration.tagName)
      .sort(),
    styleModel,
    lightDomBase: hasLightDomBase,
    lightDomLayered: hasLightDomBase && source.includes('@layer rc-base'),
    parts: declarations
      .filter((declaration) => packageNameFromModule(declaration.modulePath) === name)
      .reduce((count, declaration) => count + (declaration.cssParts?.length ?? 0), 0),
    publicTokens: declarations
      .filter((declaration) => packageNameFromModule(declaration.modulePath) === name)
      .reduce((count, declaration) => count + (declaration.cssProperties?.length ?? 0), 0),
    documentedTokens: sorted(
      declarations
        .filter((declaration) => packageNameFromModule(declaration.modulePath) === name)
        .flatMap(
          (declaration) => declaration.cssProperties?.map((property) => property.name) ?? [],
        ),
    ),
    sharedTokenDependencies: sorted([...tokens].filter((token) => baseTokens.has(token))),
    componentTokenDependencies: sorted([...tokens].filter((token) => !baseTokens.has(token))),
    markers: sorted(markers),
    selectorMetrics: {
      idSelectors: (source.match(/(^|[\s>,+~])#[a-zA-Z_-]/gm) ?? []).length,
    },
  };
}

export function inspectTheme(root, themeName) {
  const directory = join(root, 'packages', themeName);
  const componentsDirectory = join(directory, 'components');
  const componentFiles = listFiles(componentsDirectory, (path) => extname(path) === '.css');
  const aggregate = read(join(directory, 'components.css'));
  const expectedLayer = `${themeName}.components`;
  const imports = new Set(
    [...aggregate.matchAll(/@import\s+['"]\.\/components\/([^'"]+)['"]/g)].map((match) => match[1]),
  );
  const missingImports = componentFiles
    .map((path) => basename(path))
    .filter((name) => !imports.has(name));
  const unlayeredFiles = componentFiles
    .filter((path) => !read(path).includes(`@layer ${expectedLayer}`))
    .map((path) => relative(root, path));
  const allCss = [read(join(directory, 'bridge.css')), aggregate, ...componentFiles.map(read)].join(
    '\n',
  );

  return {
    name: themeName,
    componentFiles: componentFiles.length,
    missingImports,
    unlayeredFiles,
    tokenDefinitions: sorted(extractTokenDefinitions(allCss)),
    tokenReferences: sorted(extractTokenReferences(allCss)),
    markerSelectors: sorted(extractMarkers(allCss)),
    selectorMetrics: {
      parts: (allCss.match(/::part\(/g) ?? []).length,
      markerHooks: (allCss.match(/\[data-rc-/g) ?? []).length,
      importantDeclarations: (allCss.match(/!important/g) ?? []).length,
      idSelectors: (allCss.match(/(^|[\s>,+~])#[a-zA-Z_-]/gm) ?? []).length,
      modifierHooks: (allCss.match(/\.rc-[a-z0-9-]+--[a-z0-9-]+/g) ?? []).length,
    },
  };
}

export function runAudit(root = DEFAULT_ROOT) {
  const errors = [];
  const warnings = [];
  const baseCss = read(join(root, 'packages/rc-webcomponents/themes/base.css'));
  const baseTokens = extractTokenDefinitions(baseCss);
  const stylingGuide = read(join(root, 'docs/docs/guide/styling.mdx'));
  const declarations = manifestDeclarations(root);
  const packages = componentPackages(root).map((directory) =>
    inspectPackage(directory, declarations, baseTokens),
  );
  const sourceFiles = componentPackages(root).flatMap((directory) =>
    listFiles(
      join(directory, 'src'),
      (path) => extname(path) === '.ts' && !path.endsWith('.test.ts'),
    ),
  );
  const markerFiles = [
    ...sourceFiles,
    ...listFiles(
      join(root, 'packages/rc-common/src'),
      (path) => extname(path) === '.ts' && !path.endsWith('.test.ts'),
    ),
    ...listFiles(join(root, 'packages/rc-theme-material/components'), (path) =>
      path.endsWith('.css'),
    ),
    ...listFiles(join(root, 'packages/rc-theme-substrate/components'), (path) =>
      path.endsWith('.css'),
    ),
    ...listFiles(join(root, 'packages/rc-theme-win31/components'), (path) => path.endsWith('.css')),
  ];
  const discoveredMarkers = new Set(markerFiles.flatMap((path) => [...extractMarkers(read(path))]));

  errors.push(...findMarkerContractErrors(discoveredMarkers));

  for (const token of baseTokens) {
    if (!stylingGuide.includes(token)) {
      errors.push(`Shared token ${token} is missing from the styling guide.`);
    }
  }

  for (const pkg of packages.filter((entry) => entry.lightDomBase && !entry.lightDomLayered)) {
    errors.push(`${pkg.package}: injected light-DOM base CSS is not in @layer rc-base.`);
  }

  const themes = ['rc-theme-material', 'rc-theme-substrate', 'rc-theme-win31'].map((theme) =>
    inspectTheme(root, theme),
  );
  const tokenConsumers = new Map();

  for (const pkg of packages) {
    for (const token of [...pkg.sharedTokenDependencies, ...pkg.componentTokenDependencies]) {
      const consumers = tokenConsumers.get(token) ?? [];

      consumers.push(pkg.package);
      tokenConsumers.set(token, consumers);
    }
  }

  const familyTokens = Object.fromEntries(
    sorted(
      [...tokenConsumers]
        .filter(([token, consumers]) => !baseTokens.has(token) && consumers.length > 1)
        .map(([token]) => token),
    ).map((token) => [token, tokenConsumers.get(token)]),
  );
  const sourceTokens = new Set(tokenConsumers.keys());
  const documentedTokens = new Set(packages.flatMap((pkg) => pkg.documentedTokens));

  for (const pkg of packages) {
    const ownerPrefixes = pkg.tags.map((tag) => `--${tag}-`);

    for (const token of pkg.componentTokenDependencies) {
      if (token.startsWith('--_')) {
        continue;
      }

      const isOwned = ownerPrefixes.some((prefix) => token.startsWith(prefix));
      const allowedConsumers = CROSS_COMPONENT_TOKEN_CONTRACTS[token];

      if (isOwned && !pkg.documentedTokens.includes(token)) {
        errors.push(`${pkg.package}: public token ${token} is missing from its CEM documentation.`);
      } else if (!isOwned && !allowedConsumers?.includes(pkg.package)) {
        errors.push(
          `${pkg.package}: cross-component token ${token} lacks an explicit consumer contract.`,
        );
      }

      if (allowedConsumers?.includes(pkg.package) && !pkg.documentedTokens.includes(token)) {
        errors.push(
          `${pkg.package}: contracted token ${token} is missing from its CEM documentation.`,
        );
      }
    }

    const budget = PACKAGE_ID_SELECTOR_BUDGETS[pkg.package] ?? 0;

    if (pkg.selectorMetrics.idSelectors > budget) {
      errors.push(
        `${pkg.package}: ID-selector count ${pkg.selectorMetrics.idSelectors} exceeds budget ${budget}.`,
      );
    }
  }

  const runtimeTokenFiles = listFiles(join(root, 'packages'), (path) => {
    return ['.css', '.ts'].includes(extname(path)) && !path.endsWith('.test.ts');
  });

  for (const path of runtimeTokenFiles) {
    const contents = read(path);
    const displayPath = relative(root, path);

    if (/--rme-[a-z0-9-]+/.test(contents)) {
      errors.push(`${displayPath}: removed --rme-* token namespace reappeared.`);
    }

    for (const token of REMOVED_TOKEN_CONTRACTS) {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      if (new RegExp(`${escaped}(?![a-z0-9-])`).test(contents)) {
        errors.push(`${displayPath}: removed token ${token} reappeared.`);
      }
    }
  }

  for (const theme of themes) {
    const themeReferences = new Set(theme.tokenReferences);
    const allowedPrivateTokens = PRIVATE_THEME_TOKEN_CONTRACTS[theme.name];

    theme.privateTokenOverrides = theme.tokenDefinitions.filter((token) => token.startsWith('--_'));

    theme.potentiallyUnusedTokenDefinitions = theme.tokenDefinitions.filter(
      (token) => !baseTokens.has(token) && !sourceTokens.has(token) && !themeReferences.has(token),
    );

    for (const token of theme.privateTokenOverrides) {
      if (!allowedPrivateTokens?.has(token)) {
        errors.push(`${theme.name}: private override ${token} lacks an explicit contract.`);
      }
    }

    for (const token of allowedPrivateTokens ?? []) {
      if (!theme.privateTokenOverrides.includes(token)) {
        errors.push(`${theme.name}: private token contract ${token} is stale.`);
      }
    }

    for (const token of theme.tokenDefinitions) {
      if (
        !token.startsWith('--_') &&
        !baseTokens.has(token) &&
        !documentedTokens.has(token) &&
        !themeReferences.has(token)
      ) {
        errors.push(`${theme.name}: token definition ${token} has no public or runtime consumer.`);
      }
    }

    const selectorBudget = THEME_SELECTOR_BUDGETS[theme.name];

    for (const [metric, value] of Object.entries(theme.selectorMetrics)) {
      if (value > selectorBudget[metric]) {
        errors.push(
          `${theme.name}: ${metric} count ${value} exceeds budget ${selectorBudget[metric]}.`,
        );
      }
    }
  }

  for (const theme of themes) {
    for (const file of theme.missingImports) {
      errors.push(`${theme.name}: components/${file} is not imported by components.css.`);
    }

    for (const file of theme.unlayeredFiles) {
      errors.push(`${theme.name}: ${file} is not enclosed in @layer ${theme.name}.components.`);
    }
  }

  const themeCoverage = Object.fromEntries(
    themes.map((theme) => {
      const files = new Set(
        listFiles(join(root, 'packages', theme.name, 'components'), (path) =>
          path.endsWith('.css'),
        ).map((path) => basename(path)),
      );
      const missing = packages
        .filter((pkg) => {
          const expected = COMPONENT_THEME_FILE.get(pkg.package) ?? `${pkg.package.slice(3)}.css`;

          return !files.has(expected);
        })
        .map((pkg) => pkg.package);

      return [theme.name, { missing }];
    }),
  );

  if (themeCoverage['rc-theme-material'].missing.length > 0) {
    errors.push(
      `rc-theme-material: missing component coverage for ${themeCoverage['rc-theme-material'].missing.join(', ')}.`,
    );
  }

  if (themeCoverage['rc-theme-substrate'].missing.length > 0) {
    warnings.push(
      `rc-theme-substrate: selective coverage omits ${themeCoverage['rc-theme-substrate'].missing.join(', ')}.`,
    );
  }

  return {
    errors,
    warnings,
    summary: {
      componentPackages: packages.length,
      customElements: declarations.length,
      sharedTokens: baseTokens.size,
      classifiedMarkers: Object.keys(MARKER_CONTRACTS).length,
    },
    markerContracts: MARKER_CONTRACTS,
    packages,
    familyTokens,
    themes,
    themeCoverage,
  };
}

function printAudit(result, json) {
  if (json) {
    console.log(JSON.stringify(result, null, 2));

    return;
  }

  const { summary } = result;

  console.log(
    `Audited ${summary.componentPackages} component packages, ${summary.customElements} custom elements, ${summary.sharedTokens} shared tokens, and ${summary.classifiedMarkers} marker contracts.`,
  );

  for (const warning of result.warnings) {
    console.warn(`warning: ${warning}`);
  }

  for (const error of result.errors) {
    console.error(`error: ${error}`);
  }
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isCli) {
  const result = runAudit();

  printAudit(result, process.argv.includes('--json'));

  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}
