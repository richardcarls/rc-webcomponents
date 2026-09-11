# Release rc-webcomponents

Releases use GitFlow, one synchronized Changesets version, and a protected `vX.Y.Z` tag. Yarn
creates each workspace tarball so internal `workspace:*` dependencies become real versions. The
npm CLI publishes those tarballs through [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)
and verifies the registry metadata and SLSA provenance before continuing.

Important: Do not add `registry-url`, `.npmrc` credentials, `NODE_AUTH_TOKEN`, `NPM_TOKEN`, or
`YARN_NPM_AUTH_TOKEN` to the release job. A configured credential would let npm fall back from
OIDC and defeat the token-free release invariant.

## Configure the release prerequisites

Before the first OIDC release:

1. Add a GitHub repository rule set for tags matching `v*`. Restrict tag creation and updates to
   release maintainers and prevent deletion or force updates.
1. Keep the `npm` GitHub environment available. The trusted-publisher identity includes this
   exact environment name.
1. Ensure the release job uses npm 11.5.1 or newer. The publisher checks this before making any
   registry mutation.
1. Sign in to npmjs.com with an account that has package write access and account-level 2FA. Use
   `yarn workspaces list --no-private` as the authoritative package checklist.
1. For every public package, configure the trusted publisher manually on npmjs.com (each
   package's page → **Settings** → **Trusted Publisher**). `npm trust` commands need a fresh,
   browser-completed one-time password on every single invocation (including read-only
   `npm trust list` calls), and that browser step only auto-completes when npm has a real
   terminal on both stdin and stdout. Piping output to script it (to audit or batch multiple
   packages non-interactively) breaks that TTY detection and npm fails immediately with `EOTP`
   instead of opening the browser prompt. There is no way to script this reliably without either
   a manual browser click per package per invocation or an authenticator-app OTP code, so
   configure it by hand instead:

   - Provider: GitHub Actions
   - Organization or user: `richardcarls`
   - Repository: `rc-webcomponents`
   - Workflow filename: `release.yml`
   - Environment name: `npm`
   - Permission: allow this trusted publisher to run `npm publish`

   Repeat for every public package. Before adding a new one, check whether a trusted publisher
   already exists on that package's settings page: if one is unexpected, investigate and remove
   it manually rather than assuming it is safe to replace.

## Cut and validate a stable release

Start from a clean, current `develop` branch. Replace `0.4.1` below with the version Changesets is
expected to produce.

On Linux or macOS:

```bash
git switch develop
git pull --ff-only
git switch -c release/v0.4.1
yarn version:packages
git diff -- packages .changeset
yarn ci
yarn publish:packages:dry-run
git add .changeset packages
git commit -m "chore(release): version packages to 0.4.1"
```

On Windows:

```powershell
git switch develop
git pull --ff-only
git switch -c release/v0.4.1
yarn.cmd version:packages
git diff -- packages .changeset
yarn.cmd ci
yarn.cmd publish:packages:dry-run
git add .changeset packages
git commit -m "chore(release): version packages to 0.4.1"
```

Inspect the diff immediately after `version:packages`. Every public package must have the same
stable version, internal source ranges must remain `workspace:*`, and all pending intent files
must be consumed. Stop if Changesets computes an unexpected version.

The publishing dry run creates and inspects every package tarball, then performs read-only npm
lookups to confirm every public package name already exists. It must report the dependency order,
show no remaining `workspace:` range, and stop the release if any package still needs its initial
manual bootstrap publish. It never writes to the npm registry.

## Merge, tag, and publish

Merge the release branch to `main` with a merge commit, push `main`, and then tag that exact merge
commit. Pushing `main` alone never publishes.

On Linux or macOS:

```bash
git switch main
git pull --ff-only
git merge --no-ff release/v0.4.1 -m "chore(release): merge branch release/v0.4.1"
git push origin main
git tag v0.4.1
yarn release:check
git push origin v0.4.1
```

On Windows:

```powershell
git switch main
git pull --ff-only
git merge --no-ff release/v0.4.1 -m "chore(release): merge branch release/v0.4.1"
git push origin main
git tag v0.4.1
yarn.cmd release:check
git push origin v0.4.1
```

`release:check` requires the exact stable tag, confirms the commit is contained in
`origin/main`, runs the full CI suite, and repeats the tarball validation. The tag-triggered
workflow then publishes packages in dependency order with npm OIDC.

After the workflow succeeds:

1. Confirm every public workspace exposes the tagged version on npm.
1. Confirm published dependency ranges contain no `workspace:` protocol.
1. Confirm every package has a `https://slsa.dev/provenance/v1` attestation.
1. Install and build a downstream consumer against the corrected version.
1. Merge the release branch back to `develop` with `--no-ff`.

## Resume a partial release

Do not create a replacement tag for a transient failure. Open the `Publish to npm` workflow,
choose **Run workflow**, and select the original `vX.Y.Z` tag. The publisher verifies and skips
correct packages, then publishes only missing versions.

Registry, authentication, parsing, or invalid immutable-version errors stop the run immediately.
If an existing version contains incorrect metadata, it cannot be overwritten; correct the issue
in a new patch release.

## Disable automation-token publishing

Only after one complete OIDC release is verified, enforce package-level 2FA and disallow token
bypass. For every public package, open its npmjs.com settings page and require two-factor
authentication for publishing (disallow the automation-token bypass). Do this manually, one
package at a time; there is no scripted equivalent, for the same OTP-per-invocation reason
described above.

Then remove the old npm token from the repository or `npm` GitHub environment and revoke the
granular automation token on npm.

## Bootstrap Trusted Publishing for a new package

npm requires a package name to exist before it can have a trusted publisher. Its
staged-publishing feature has the same prerequisite, so `npm stage publish` cannot create a
brand-new package. If the package name already exists on npm at any version, do not publish a
bootstrap version; configure or verify its trusted publisher and continue with the normal release.

For a brand-new package name, perform one initial publish manually before running
`version:packages`. Use the package's current, unreleased version so the next synchronized version
remains available for the OIDC workflow and its provenance attestation.

Important: Never bootstrap at the intended synchronized release version. npm versions are
immutable, so the workflow cannot replace a manual publish with an OIDC-provenance publish of the
same version. Never use a bypass-2FA token for the bootstrap publish.

From a clean `develop` branch, build and validate the repository, then prepare an inspected
tarball in a temporary directory. Pass more than one explicit package name when bootstrapping
several new packages together.

On Linux or macOS:

```bash
bootstrap_dir=$(mktemp -d)
yarn build
yarn validate:packages
yarn bootstrap:packages --out "$bootstrap_dir" @rcarls/<package-name>
```

On Windows:

```powershell
$bootstrapDir = Join-Path ([System.IO.Path]::GetTempPath()) "rc-npm-bootstrap-$([guid]::NewGuid())"
yarn.cmd build
yarn.cmd validate:packages
yarn.cmd bootstrap:packages --out $bootstrapDir @rcarls/<package-name>
```

The helper accepts only explicit public workspace names, orders selected packages by their runtime
dependencies, packs them with Yarn so `workspace:*` ranges are rewritten, validates each packed
manifest, refuses to overwrite an existing tarball, and prints the exact `npm publish` commands.
It never authenticates to npm or publishes anything.

Run each printed command interactively and complete its 2FA prompt. Then:

1. Confirm its current version is visible on npmjs.com.
1. Configure the trusted publisher with GitHub Actions, `richardcarls/rc-webcomponents`,
   `release.yml`, the `npm` environment, and permission to run `npm publish`.
1. Continue with the normal release steps above. `version:packages` will move the fixed group to
   its next synchronized version, and the tag workflow will publish it directly with OIDC and
   provenance.
