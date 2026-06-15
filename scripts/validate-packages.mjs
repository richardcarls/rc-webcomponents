import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

const root = process.cwd();
const packagesRoot = join(root, 'packages');
const packageDirs = readdirSync(packagesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(packagesRoot, entry.name));

const packages = packageDirs.map((directory) => ({
  directory,
  manifest: JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8')),
}));

const errors = [];

function collectExportTargets(value) {
  if (typeof value === 'string') {
    return [value];
  }

  if (value === null || typeof value !== 'object') {
    return [];
  }

  return Object.values(value).flatMap(collectExportTargets);
}

function packedFiles(packageName) {
  const command = process.platform === 'win32' ? 'cmd.exe' : 'yarn';
  const args = process.platform === 'win32'
    ? ['/d', '/s', '/c', 'yarn.cmd', 'workspace', packageName, 'pack', '--dry-run', '--json']
    : ['workspace', packageName, 'pack', '--dry-run', '--json'];
  const output = execFileSync(
    command,
    args,
    { cwd: root, encoding: 'utf8' },
  );

  return new Set(
    output
      .trim()
      .split(/\r?\n/)
      .map((line) => JSON.parse(line))
      .filter((entry) => entry.location)
      .map((entry) => entry.location.replaceAll('\\', '/')),
  );
}

function validatePackedTarget(packageName, directory, files, target, label) {
  if (target.includes('*')) {
    return;
  }

  const normalized = target.replace(/^\.\//, '').replaceAll('\\', '/');
  const absolute = resolve(directory, target);
  const outsidePackage = relative(directory, absolute).split(sep).includes('..');

  if (outsidePackage) {
    errors.push(`${packageName}: ${label} points outside the package: ${target}`);

    return;
  }

  if (!files.has(normalized)) {
    errors.push(`${packageName}: ${label} is missing from the packed tarball: ${target}`);
  }
}

for (const { directory, manifest } of packages) {
  const files = packedFiles(manifest.name);

  for (const [exportName, value] of Object.entries(manifest.exports ?? {})) {
    for (const target of collectExportTargets(value)) {
      validatePackedTarget(manifest.name, directory, files, target, `export ${exportName}`);
    }
  }

  for (const field of ['main', 'module', 'types', 'customElements']) {
    if (manifest[field]) {
      validatePackedTarget(manifest.name, directory, files, manifest[field], field);
    }
  }
}

const fixedGroup = JSON.parse(readFileSync(join(root, '.changeset/config.json'), 'utf8')).fixed[0];
const packageNames = packages.map(({ manifest }) => manifest.name);

for (const packageName of packageNames) {
  if (!fixedGroup.includes(packageName)) {
    errors.push(`${packageName}: missing from the Changesets fixed group`);
  }
}

for (const packageName of fixedGroup) {
  if (!packageNames.includes(packageName)) {
    errors.push(`${packageName}: fixed-group entry has no workspace package`);
  }
}

const aggregateDirectory = join(packagesRoot, 'rc-webcomponents');
const aggregateManifest = JSON.parse(readFileSync(join(aggregateDirectory, 'package.json'), 'utf8'));
const aggregateIndex = readFileSync(join(aggregateDirectory, 'src/index.ts'), 'utf8');
const aggregateDefine = readFileSync(join(aggregateDirectory, 'src/define.ts'), 'utf8');
const infrastructurePackages = new Set([
  '@rcarls/rc-common',
  '@rcarls/rc-textarea-adapters',
  '@rcarls/rc-textarea-plugin-markdown',
  '@rcarls/rc-theme-material',
  '@rcarls/rc-webcomponents',
]);

for (const { manifest } of packages) {
  if (infrastructurePackages.has(manifest.name)) {
    continue;
  }

  if (!aggregateManifest.dependencies?.[manifest.name]) {
    errors.push(`${manifest.name}: missing from aggregate package dependencies`);
  }

  if (!aggregateIndex.includes(`export * from '${manifest.name}';`)) {
    errors.push(`${manifest.name}: missing from aggregate class exports`);
  }

  if (manifest.exports?.['./define'] && !aggregateDefine.includes(`import '${manifest.name}/define';`)) {
    errors.push(`${manifest.name}: missing from aggregate define imports`);
  }
}

if (!existsSync(join(aggregateDirectory, 'themes/base.css'))) {
  errors.push('@rcarls/rc-webcomponents: missing published base theme');
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validated ${packages.length} package manifests and packed tarballs.`);
}
