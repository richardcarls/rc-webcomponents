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

1. Add a GitHub repository ruleset for tags matching `v*`. Restrict tag creation and updates to
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

The publishing dry run creates and inspects every package tarball. It must report the dependency
order and show no remaining `workspace:` range; it never reads or writes the npm registry.

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

## Bootstrap a new public package

npm requires a package to exist before it can have a trusted publisher. For a new workspace:

1. Build and validate the workspace.
1. Pack it with Yarn into a temporary directory.
1. Inspect the packed manifest for rewritten internal versions.
1. Publish that tarball interactively with `npm publish <tarball> --access public` and 2FA.
1. Configure the trusted publisher manually on npmjs.com, using the same settings as the other
   public packages (GitHub Actions, `richardcarls/rc-webcomponents`, `release.yml`, the `npm`
   environment, allow publish).
1. Include the package in the next normal tag-driven release.

Never use a bypass-2FA token for the bootstrap publish.
