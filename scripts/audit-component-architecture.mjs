import { existsSync, readFileSync, readdirSync } from 'node:fs';
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

/*
 * The namespace prefix each theme exhaustively vendors defaults for, as
 * opposed to a namespace it only reads from as an optional consumer hook.
 * Material's bridge deliberately reads component-level MWC token names
 * (--md-fab-container-color, --md-menu-container-shape, and similar) with a
 * safe fallback chain, by design, for an application that already has its
 * own Material Web Components environment (see defaults.css's header
 * comment); those have no local definition on purpose and aren't a bug.
 * --md-sys-* is different: that's the design-token namespace this package
 * vendors exhaustively (colors, typography, shape, state, elevation, and
 * now motion), so a reference into it with no local definition can create
 * an otherwise undetected dead token reference. Substrate and win31 have
 * no such
 * external-hook tier: every reference in their own namespace is meant to be
 * locally defined.
 */
export const THEME_OWNED_TOKEN_PREFIXES = {
  'rc-theme-material': '--md-sys-',
  'rc-theme-substrate': '--substrate-',
  'rc-theme-win31': '--win31-',
};

export const THEME_SELECTOR_BUDGETS = {
  'rc-theme-material': {
    parts: 108,
    // Dialog surfaces add no marker coupling; the retained growth comes from
    // documented chip-icon and visible-list-position contracts.
    markerHooks: 71,
    // Dropped from 13: the reduced-motion refinement replaced a blunt
    // *, !important sweep (2 declarations) with token-level overrides.
    // The audit's own comment-stripping fix also corrected a false count
    // (raw text included 3 !important mentions inside a prose comment).
    importantDeclarations: 9,
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

/*
 * A component that animates a layout property (box geometry, not paint) runs
 * layout on every frame instead of compositing on the GPU. Each entry is a
 * deliberate exception with its own justification; anything else found by
 * extractTransitionAnalysis() is an error. Keys are component package names
 * for a component's own source, and theme names for motion a theme package
 * adds on top of a component (see rc-theme-material below).
 */
export const ANIMATED_LAYOUT_PROPERTY_BUDGETS = {
  // The `<details>` panel measures its open state as actual box height;
  // `calc-size()` isn't broadly supported enough yet to be the primary
  // mechanism. See the motion guide for the tradeoff.
  'rc-disclosure': new Set(['block-size']),
  // The active-item indicator resizes to the newly selected item's box, not
  // just its own position; a transform-only scale would distort its border
  // and corner radius instead of tracking the target's real geometry.
  'rc-navigation-bar': new Set(['inline-size', 'block-size']),
  // The rail itself widens and repads on expand/collapse (a transform-only
  // approximation would clip or overlap sibling content instead of reflowing
  // it), and the active-item indicator resizes the same way rc-navigation-bar's
  // does.
  'rc-navigation-rail': new Set(['inline-size', 'block-size', 'padding']),
  // The fill tracks literal determinate progress, in a box sized as a
  // percentage of the track. The indeterminate sweep moved to translate(),
  // a composited property, so it no longer needs a budget entry here.
  'rc-progress': new Set(['inline-size']),
  // The thumb's own box grows and shrinks with the track in some themes.
  'rc-switch': new Set(['inline-size', 'block-size']),
  // The floating label crosses from placeholder position to the shrunk
  // caption position. A `transform`-based rewrite is tracked separately
  // (pending theme-material-multiline-label-spacing changeset) and is a
  // different risk profile than this motion-token pass.
  'rc-theme-material': new Set(['inset-block-start', 'font-size', 'line-height']),
};

export const PACKAGE_ID_SELECTOR_BUDGETS = {
  'rc-adaptive-menu': 14,
  'rc-app-bar': 29,
  'rc-carousel': 7,
  'rc-chip-group': 10,
  'rc-combobox': 4,
  // Grew the same way rc-menu-button's did: the popup's exit fade split its
  // one #popup rule into separate open/closed/@starting-style declarations,
  // and its reduced-motion override restates the same two rules again to
  // split scale (spatial, zeroed) from opacity/overlay/display (effects,
  // shortened) instead of zeroing the shared duration.
  'rc-fab-menu': 11,
  'rc-field': 25,
  'rc-markdown-editor': 19,
  // Grew with the popup's own open/close fade: enter, exit, and its
  // @starting-style all re-select #popup by ID.
  'rc-menu-button': 12,
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

/**
 * Files allowed to use physical CSS (`left`, `margin-right`, `style.left`, ...)
 * and why. Everything else uses logical properties so layout follows `dir` and
 * `writing-mode`. Entries marked "pending" are known RTL bugs scheduled for a
 * fix; delete the entry in the change that fixes the file, and the stale-entry
 * check below will insist on it.
 */
export const PHYSICAL_CSS_ALLOWLIST = {
  'packages/rc-common/src/DragController.ts': 'pins a dragged box at physical pointer coordinates',
  'packages/rc-common/src/ResizeController.ts':
    'resizes a pinned box from physical pointer coordinates (its injected handle offset is pending)',
  'packages/rc-dialog/src/dialogBaseStyles.ts': 'visual-viewport offsets are physical',
  'packages/rc-theme-material/components/select.css': 'visual-viewport offsets are physical',
  'packages/rc-theme-substrate/components/select.css': 'visual-viewport offsets are physical',
  'packages/rc-virtual-canvas/src/rc-virtual-canvas.styles.ts': 'canvas pixel space is physical',
  'packages/rc-virtual-canvas/src/rc-virtual-canvas.ts': 'canvas pixel space is physical',
  'packages/rc-common/src/AnchorController.ts':
    'pending: -start/-end placements align physically, wrong in RTL',
  'packages/rc-splitter/src/rc-splitter.styles.ts': 'pending: physical borders and offsets',
  'packages/rc-slider/src/rc-slider.ts': 'pending: fill and tick offsets start from the left',
  'packages/rc-range-slider/src/rc-range-slider.ts':
    'pending: fill and thumb offsets start from the left',
  'packages/rc-markdown-editor/src/rc-markdown-editor.styles.ts':
    'pending: blockquote and list indents',
  'packages/rc-markdown-editor/src/rc-markdown-editor.ts':
    'pending: link popover aligns to the physical left edge',
  'packages/rc-textarea/src/rc-textarea.styles.ts': 'pending: gutter border and wrap indent',
  'packages/rc-textarea/src/line-actions-controller.ts':
    'pending: popover aligns to the physical left edge',
};

/**
 * Files allowed to read `direction` or `writing-mode` themselves. Everyone
 * else resolves them through rc-common's flow helpers.
 */
export const DIRECTION_READ_ALLOWLIST = {
  'packages/rc-common/src/flow.ts': 'owns direction and writing-mode resolution',
};

const PHYSICAL_CSS_DECLARATION =
  /(?:^|[\s;{])(?:((?:margin|padding|border)-(?:left|right)(?:-[a-z]+)?|left|right)\s*:|((?:text-align|float|clear)\s*:\s*(?:left|right))\b)/g;
const PHYSICAL_STYLE_WRITE =
  /\.style\.(left|right|marginLeft|marginRight|paddingLeft|paddingRight)\s*=/g;
const DIRECTION_READ =
  /\b(?:getComputedStyle\([^)]*\)|styles?|computed)\.(?:direction|writingMode)\b|['"]rtl['"]/;

/**
 * Physical CSS properties declared in `text`. TypeScript sources are only
 * scanned inside template literals and `.style.*` writes, so object keys such
 * as a `{ left: 'right' }` lookup table don't count as CSS.
 */
export function extractPhysicalCss(text, isCss) {
  const regions = isCss ? [text] : [...text.matchAll(/`([^`]*)`/g)].map((match) => match[1]);
  const found = new Set();

  for (const region of regions) {
    for (const match of region.matchAll(PHYSICAL_CSS_DECLARATION)) {
      found.add((match[1] ?? match[2]).replace(/\s+/g, ''));
    }
  }

  if (!isCss) {
    for (const match of text.matchAll(PHYSICAL_STYLE_WRITE)) {
      found.add(`style.${match[1]}`);
    }
  }

  return found;
}

export function readsDirection(text) {
  return DIRECTION_READ.test(text);
}

/** Checks each file against an allowlist, and the allowlist against the files. */
export function findAllowlistErrors(hits, allowlist, describe) {
  const errors = [];

  for (const [path, detail] of hits) {
    if (!allowlist[path]) {
      errors.push(`${path}: ${describe} (${detail}); use logical equivalents or allowlist it.`);
    }
  }

  for (const path of Object.keys(allowlist)) {
    if (!hits.has(path)) {
      errors.push(`${path}: allowlisted for ${describe} but no longer needs it; remove the entry.`);
    }
  }

  return errors;
}

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

/*
 * extractTokenReferences() above is deliberately scoped to the --rc- and
 * --_rc- namespaces for the shared-contract checks (family tokens, consumer
 * tracking). A theme's own design-system tokens (--md-, --substrate-,
 * --win31-) never match it, so it can't answer "is this theme-native
 * reference defined anywhere" — this sibling captures every custom-property
 * reference regardless of namespace for that narrower question.
 */
export function extractAllTokenReferences(text) {
  const fromVars = [...text.matchAll(/var\(\s*(--[a-z0-9_-]+)/g)].map((match) => match[1]);
  const fromComputedStyles = [
    ...text.matchAll(/getPropertyValue\(\s*['"](--[a-z0-9_-]+)['"]\s*\)/g),
  ].map((match) => match[1]);
  const fromStyleQueries = [...text.matchAll(/style\(\s*(--[a-z0-9_-]+)\s*:/g)].map(
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

/*
 * Sibling to extractAllTokenReferences: extractTokenDefinitions() above is
 * scoped to the --rc- and --_rc- namespaces for the same shared-contract
 * reasons, so it misses every vendored --md-sys- (and --substrate-,
 * --win31-) definition a theme declares in its own namespace.
 */
export function extractAllTokenDefinitions(text) {
  const withoutComments = text.replace(/\/\*[\s\S]*?\*\//g, ' ');

  return new Set(
    [...withoutComments.matchAll(/(^|[;{]\s*)(--[a-z0-9_-]+)\s*:/gm)].map((match) => match[2]),
  );
}

/*
 * Properties whose change forces layout (box geometry), as opposed to paint
 * or composite-only properties such as color, opacity, or transform.
 */
const ANIMATED_LAYOUT_PROPERTIES = new Set([
  'width',
  'height',
  'inline-size',
  'block-size',
  'min-width',
  'min-height',
  'min-inline-size',
  'min-block-size',
  'max-width',
  'max-height',
  'max-inline-size',
  'max-block-size',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'padding-block',
  'padding-inline',
  'padding-block-start',
  'padding-block-end',
  'padding-inline-start',
  'padding-inline-end',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'margin-block',
  'margin-inline',
  'margin-block-start',
  'margin-block-end',
  'margin-inline-start',
  'margin-inline-end',
  'top',
  'right',
  'bottom',
  'left',
  'inset',
  'inset-block',
  'inset-inline',
  'inset-block-start',
  'inset-block-end',
  'inset-inline-start',
  'inset-inline-end',
  'font-size',
  'line-height',
  'gap',
  'row-gap',
  'column-gap',
  'flex-basis',
]);

function splitOnTopLevelCommas(value) {
  const parts = [];
  let depth = 0;
  let current = '';

  for (const char of value) {
    if (char === '(') {
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
    }

    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  parts.push(current);

  return parts;
}

function splitTransitionPropertyNames(value) {
  return splitOnTopLevelCommas(value)
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function extractKeyframesBodies(text) {
  const bodies = [];
  const opener = /@keyframes\s+[\w-]+\s*\{/g;
  let match;

  while ((match = opener.exec(text))) {
    let depth = 1;
    let index = match.index + match[0].length;

    while (index < text.length && depth > 0) {
      if (text[index] === '{') {
        depth += 1;
      } else if (text[index] === '}') {
        depth -= 1;
      }

      index += 1;
    }

    bodies.push(text.slice(match.index + match[0].length, index - 1));
    opener.lastIndex = index;
  }

  return bodies;
}

/*
 * `transition`/`transition-property` shorthands and @keyframes bodies are
 * parsed for the property names they animate, not line-grepped: a multi-line
 * shorthand such as field.css's own transition list wraps `cubic-bezier(...)`
 * across several lines, which a naive per-line regex misreads. `transition:
 * all` is flagged on its own because it animates whatever a future edit adds
 * to the rule, layout properties included, with no budget able to catch it.
 */
export function extractTransitionAnalysis(text) {
  const withoutComments = text.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const layoutProperties = new Set();
  let transitionsAll = false;

  for (const match of withoutComments.matchAll(/transition(?:-property)?\s*:\s*([^;]+);/g)) {
    for (const name of splitTransitionPropertyNames(match[1])) {
      if (name === 'all') {
        transitionsAll = true;
      }

      if (ANIMATED_LAYOUT_PROPERTIES.has(name)) {
        layoutProperties.add(name);
      }
    }
  }

  for (const body of extractKeyframesBodies(withoutComments)) {
    for (const match of body.matchAll(/(?:^|[;{])\s*([a-z-]+)\s*:/g)) {
      if (ANIMATED_LAYOUT_PROPERTIES.has(match[1])) {
        layoutProperties.add(match[1]);
      }
    }
  }

  return { layoutProperties, transitionsAll };
}

function checkAnimatedLayoutProperties(name, animatedLayoutProperties, transitionsAll, errors) {
  if (transitionsAll) {
    errors.push(
      `${name}: uses 'transition: all', which animates every property a future edit adds to ` +
        'the rule, layout included, with no budget able to scope it. Name properties explicitly.',
    );
  }

  const budget = ANIMATED_LAYOUT_PROPERTY_BUDGETS[name] ?? new Set();

  for (const property of animatedLayoutProperties) {
    if (!budget.has(property)) {
      errors.push(
        `${name}: transition/@keyframes animates layout property ${property}, which has no ` +
          'budget entry. Add it to ANIMATED_LAYOUT_PROPERTY_BUDGETS with a justification, or ' +
          'animate transform/opacity instead.',
      );
    }
  }

  for (const property of budget) {
    if (!animatedLayoutProperties.includes(property)) {
      errors.push(
        `${name}: ANIMATED_LAYOUT_PROPERTY_BUDGETS entry for ${property} is stale; it is no ` +
          'longer animated.',
      );
    }
  }
}

/*
 * Comments stripped before counting: a prose comment explaining *why* a
 * declaration needs !important (or mentioning ::part()/a marker/a modifier
 * class) reads as one more real occurrence otherwise. Found when a
 * reduced-motion comment explaining the old !important sweep's removal
 * pushed Material's own importantDeclarations count over budget for a
 * reason that had nothing to do with real CSS.
 */
export function extractThemeSelectorMetrics(css) {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, ' ');

  return {
    parts: (withoutComments.match(/::part\(/g) ?? []).length,
    markerHooks: (withoutComments.match(/\[data-rc-/g) ?? []).length,
    importantDeclarations: (withoutComments.match(/!important/g) ?? []).length,
    idSelectors: (withoutComments.match(/(^|[\s>,+~])#[a-zA-Z_-]/gm) ?? []).length,
    modifierHooks: (withoutComments.match(/\.rc-[a-z0-9-]+--[a-z0-9-]+/g) ?? []).length,
  };
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
  const transitionAnalysis = extractTransitionAnalysis(source);
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
    animatedLayoutProperties: sorted(transitionAnalysis.layoutProperties),
    transitionsAll: transitionAnalysis.transitionsAll,
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
  const transitionAnalysis = extractTransitionAnalysis(allCss);
  /*
   * defaults.css and state-layer.css (Material only) are deliberately left
   * out of allCss: defaults.css vendors hundreds of upstream tokens most of
   * which this theme's own bridge/components never touch, by design (an app
   * with its own Material environment imports only bridge.css and expects
   * those upstream tokens for OTHER apps to be there whether this theme
   * consumes them or not), so folding it into tokenDefinitions would flag
   * most of it as having "no public or runtime consumer". They're scanned
   * here only for the narrower question the theme's own defaults.test.ts
   * can't answer on its own: does every theme-native token this theme's own
   * bridge or components actually reference resolve to a definition
   * *somewhere*, including its own vendored/composited defaults? Seven MD3
   * duration/easing names shipped referenced-but-undeclared this way,
   * silently falling back to their inline var() fallback, until this check
   * existed to catch it.
   */
  const definitionOnlyCss = [join(directory, 'defaults.css'), join(directory, 'state-layer.css')]
    .filter((path) => existsSync(path))
    .map(read)
    .join('\n');
  const knownTokenDefinitions = new Set([
    ...extractAllTokenDefinitions(allCss),
    ...extractAllTokenDefinitions(definitionOnlyCss),
  ]);

  return {
    name: themeName,
    componentFiles: componentFiles.length,
    missingImports,
    unlayeredFiles,
    tokenDefinitions: sorted(extractTokenDefinitions(allCss)),
    tokenReferences: sorted(extractTokenReferences(allCss)),
    allTokenReferences: sorted(extractAllTokenReferences(allCss)),
    knownTokenDefinitions,
    markerSelectors: sorted(extractMarkers(allCss)),
    animatedLayoutProperties: sorted(transitionAnalysis.layoutProperties),
    transitionsAll: transitionAnalysis.transitionsAll,
    selectorMetrics: extractThemeSelectorMetrics(allCss),
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

  const physicalCssHits = new Map();
  const directionReadHits = new Map();

  for (const path of markerFiles) {
    const text = read(path);
    const displayPath = relative(root, path);
    const physical = extractPhysicalCss(text, extname(path) === '.css');

    if (physical.size > 0) {
      physicalCssHits.set(displayPath, sorted(physical).join(', '));
    }

    if (extname(path) === '.ts' && readsDirection(text)) {
      directionReadHits.set(displayPath, 'direction or writing-mode');
    }
  }

  errors.push(
    ...findAllowlistErrors(physicalCssHits, PHYSICAL_CSS_ALLOWLIST, 'physical CSS'),
    ...findAllowlistErrors(directionReadHits, DIRECTION_READ_ALLOWLIST, 'reads direction'),
  );

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

    checkAnimatedLayoutProperties(
      pkg.package,
      pkg.animatedLayoutProperties,
      pkg.transitionsAll,
      errors,
    );
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

    /*
     * A reference into the theme's own exhaustively-vendored namespace (see
     * THEME_OWNED_TOKEN_PREFIXES) must resolve to a real definition
     * somewhere in the theme package, defaults.css and state-layer.css
     * included. Otherwise the var() silently falls back to its inline
     * literal and the reference is dead weight that looks wired up but
     * isn't.
     */
    const ownedPrefix = THEME_OWNED_TOKEN_PREFIXES[theme.name];

    for (const token of theme.allTokenReferences) {
      if (!token.startsWith(ownedPrefix)) {
        continue;
      }

      if (!theme.knownTokenDefinitions.has(token)) {
        errors.push(
          `${theme.name}: token reference ${token} is declared nowhere in the theme package ` +
            '(checked bridge, components, defaults, and state-layer).',
        );
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

    checkAnimatedLayoutProperties(
      theme.name,
      theme.animatedLayoutProperties,
      theme.transitionsAll,
      errors,
    );
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
