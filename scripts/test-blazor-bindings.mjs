/**
 * Compiles the generated Blazor event bindings against a Razor fixture
 * (`packages/rc-webcomponents/typings/blazor`) with the .NET SDK.
 *
 * Razor emits an element as static markup when it knows none of its event
 * attributes, which compiles without error, so the script also fails when the
 * generated component still contains an `@onrc-` attribute as text.
 *
 *   node scripts/test-blazor-bindings.mjs
 */
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = join(ROOT, 'packages', 'rc-webcomponents', 'typings', 'blazor');

function findFile(directory, name) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      const found = findFile(path, name);

      if (found) {
        return found;
      }
    } else if (entry.name === name) {
      return path;
    }
  }

  return undefined;
}

const build = spawnSync(
  'dotnet',
  ['build', FIXTURE, '-nologo', '--no-incremental', '-p:EmitCompilerGeneratedFiles=true'],
  { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
);

if (build.error) {
  console.error(`Could not run the .NET SDK: ${build.error.message}`);
  process.exit(1);
}

if (build.status !== 0) {
  console.error(build.stdout);
  process.exit(build.status ?? 1);
}

const generated = findFile(join(FIXTURE, 'obj'), 'Fixture_razor.g.cs');
const unbound = generated && readFileSync(generated, 'utf8').match(/@onrc-[a-z-]+/g);

if (!generated) {
  console.error('The Razor source generator wrote no Fixture_razor.g.cs.');
  process.exit(1);
}

if (unbound) {
  console.error(`Razor left these event attributes unbound: ${[...new Set(unbound)].join(', ')}`);
  process.exit(1);
}

console.log('Blazor bindings compile, and every fixture event attribute is bound.');
