import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const errors = [];

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function readJson(path) {
  return JSON.parse(read(path));
}

function has(path) {
  return existsSync(join(root, path));
}

function packageDirs() {
  return readdirSync(join(root, 'packages'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function componentPackageNames() {
  return packageDirs().filter((name) => has(`packages/${name}/src/${name}.ts`));
}

function cemDeclarations() {
  const manifest = readJson('dist/custom-elements.json');
  const declarations = new Map();

  for (const mod of manifest.modules ?? []) {
    for (const declaration of mod.declarations ?? []) {
      if (declaration.tagName) {
        declarations.set(declaration.tagName, declaration);
      }
    }
  }

  return declarations;
}

function assertIncludes(text, needle, label) {
  if (!text.includes(needle)) {
    errors.push(`${label}: missing ${needle}`);
  }
}

const components = componentPackageNames();
const declarations = cemDeclarations();
const tags = new Set(declarations.keys());
const sidebar = read('docs/sidebars.ts');
const rootReadme = read('README.md');
const docsHomepage = read('docs/src/pages/index.tsx');
const reactTypes = read('packages/rc-webcomponents/src/react.d.ts');
const solidTypes = read('packages/rc-webcomponents/src/solid.d.ts');
const rcCommonReadme = read('packages/rc-common/README.md');

for (const name of components) {
  if (!tags.has(name)) {
    errors.push(`${name}: missing custom-elements manifest declaration`);
  }

  if (!has(`docs/docs/components/${name}.mdx`)) {
    errors.push(`${name}: missing Docusaurus component page`);
  }

  assertIncludes(rootReadme, `](packages/${name}/)`, 'README.md');
  assertIncludes(docsHomepage, `'${name}'`, 'docs/src/pages/index.tsx');
}

for (const [tag, declaration] of declarations) {
  if ((declaration.events ?? []).some((event) => event.name === 'type')) {
    errors.push(`${tag}: custom-elements manifest contains a spurious "type" event`);
  }
}

for (const eventName of ['rc-textarea-focus', 'rc-textarea-select']) {
  if (!(declarations.get('rc-textarea')?.events ?? []).some((event) => event.name === eventName)) {
    errors.push(`rc-textarea: custom-elements manifest is missing the ${eventName} event`);
  }
}

if (!(declarations.get('rc-toolbar')?.slots ?? []).some((slot) => slot.name === '')) {
  errors.push('rc-toolbar: custom-elements manifest is missing the default slot');
}

const dialogModal = (declarations.get('rc-dialog')?.members ?? []).find(
  (member) => member.name === 'modal',
);

if (!dialogModal || dialogModal.attribute !== undefined) {
  errors.push('rc-dialog: modal must be documented as a property-only manifest member');
}

for (const file of readdirSync(join(root, 'docs/docs/components')).filter((name) =>
  name.endsWith('.mdx'),
)) {
  const page = `docs/docs/components/${file}`;
  const content = read(page);
  const tag = file.replace(/\.mdx$/, '');

  assertIncludes(content, `<ApiTable tag="${tag}" />`, page);
  assertIncludes(sidebar, `components/${tag}`, 'docs/sidebars.ts');

  if (!tags.has(tag)) {
    errors.push(`${page}: ApiTable tag has no custom-elements manifest declaration`);
  }
}

for (const needle of [
  'checkmark: boolean',
  'checkmark?: boolean',
  'label: string',
  "orientation: 'horizontal' | 'vertical'",
  'readonly atBlockStart: boolean',
  'readonly atBlockEnd: boolean',
  'readonly atInlineStart: boolean',
  'readonly atInlineEnd: boolean',
  'export type RCRangeSliderRef = HTMLElement & {',
  'readonly: boolean',
]) {
  assertIncludes(reactTypes, needle, 'packages/rc-webcomponents/src/react.d.ts');
}

for (const needle of [
  'checkmark: boolean',
  'checkmark?: boolean | string',
  'label: string',
  "orientation: 'horizontal' | 'vertical'",
  'readonly atBlockStart: boolean',
  'readonly atBlockEnd: boolean',
  'readonly atInlineStart: boolean',
  'readonly atInlineEnd: boolean',
  'export type RCRangeSliderRef = HTMLElement & {',
  'readonly: boolean',
]) {
  assertIncludes(solidTypes, needle, 'packages/rc-webcomponents/src/solid.d.ts');
}

for (const exportName of [
  'ActiveDescendantController',
  'AnchorController',
  'DragController',
  'keyInteraction',
  'keyNavigation',
  'mouseMove',
  'ResizeController',
  'RovingTabIndexMixin',
  'ScrollObserverController',
  'findNearestScrollAncestor',
  'isFocusable',
  'snapToStep',
  'valueToPercent',
]) {
  assertIncludes(rcCommonReadme, exportName, 'packages/rc-common/README.md');
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Audited ${components.length} component API surfaces.`);
}
