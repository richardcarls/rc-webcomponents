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

function cemTags() {
  const manifest = readJson('dist/custom-elements.json');
  const tags = new Set();

  for (const mod of manifest.modules ?? []) {
    for (const declaration of mod.declarations ?? []) {
      if (declaration.tagName) {
        tags.add(declaration.tagName);
      }
    }
  }

  return tags;
}

function assertIncludes(text, needle, label) {
  if (!text.includes(needle)) {
    errors.push(`${label}: missing ${needle}`);
  }
}

const components = componentPackageNames();
const tags = cemTags();
const sidebar = read('docs/sidebars.ts');
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
]) {
  assertIncludes(reactTypes, needle, 'packages/rc-webcomponents/src/react.d.ts');
}

for (const needle of [
  'checkmark: boolean',
  'checkmark?: boolean | string',
  'label: string',
  "orientation: 'horizontal' | 'vertical'",
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
