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
choose **Run workflow**, select the original `vX.Y.Z` tag, and enter that same tag as the release
tag. Leave the provenance exception empty. The publisher verifies and skips correct packages,
then publishes only missing versions.

Registry, authentication, parsing, or invalid immutable-version errors stop the run immediately.
After a successful publish, provenance verification retries with exponentially increasing delays
for roughly 12.5 minutes before treating a still-missing attestation as a transient failure. The
workflow logs each scheduled retry; let that bounded wait finish before manually rerunning it.
If an existing version contains incorrect metadata, it cannot be overwritten; correct the issue
in a new patch release.

If a release version was published manually before Trusted Publishing was configured, npm cannot
replace that immutable version or attach provenance afterward. First merge an approved recovery
hotfix to `main`. Then manually run the workflow from `main`, enter the original `vX.Y.Z` release
tag, and enter each affected package as an exact comma-separated `@scope/name@X.Y.Z` provenance
exception. The workflow validates the published manifest before skipping the exception and
continues publishing any missing packages through OIDC.

Recovery runs accept only release-workflow, publisher, validation, test, and release-guide changes
between the release tag and the selected `main` commit. Normal tag-triggered runs cannot use
provenance exceptions. The exception records an unavoidable provenance gap for that immutable
version; the package's next release must publish through Trusted Publishing normally.

## Publish a @next snapshot release

A snapshot release publishes every public package under the npm `next` dist-tag from whatever
`develop` currently looks like, without a git tag, a commit, or a coherent version bump. It exists
so in-development work is reachable (`yarn up '@rcarls/*@next'` in a consuming project) without
waiting for a stable release, and without documenting unpublished components on the stable docs
site in the meantime.

To trigger one: open the `Publish to npm` workflow, choose **Run workflow**, pick the ref to
publish from (usually `develop`), check **snapshot**, and leave `release_tag` and
`provenance_exception` empty. `snapshot_tag` defaults to `next`; change it only for a deliberately
different dist-tag.

This publishes all public packages at a fresh, unique `X.Y.Z-<tag>-<datecode>`-shaped version
(Changesets' snapshot format) under the chosen npm dist-tag, in dependency order, through the same
OIDC Trusted Publishing and tarball-packing path a stable release uses. It reuses `release.yml`'s
own file and `npm` environment specifically so no per-package Trusted Publisher re-registration is
needed: the tuple registered on npmjs.com is keyed on repository, workflow filename, and
environment name only.

It explicitly does **not**: create a git tag, commit, or push anything, or leave a retained
CHANGELOG entry. `changeset version --snapshot` computes the version and consumes pending
`.changeset/*.md` files the same way a real `changeset version` would, but only inside the
workflow run's own ephemeral checkout; nothing is ever pushed back (the job's `permissions` stay
`contents: read`), so `develop`'s committed state and its pending changesets are untouched. This
is what makes running a snapshot publish repeatedly, including right before cutting a real
release, safe.

To build and deploy the matching in-development docs, run the `Deploy docs to GitHub Pages`
workflow's **Run workflow** with `next_ref` set to the same ref (defaults to `develop`). It
publishes to `https://richardcarls.github.io/rc-webcomponents/next/`, alongside the stable site,
which continues to deploy automatically on a `v*` tag push.

## Disable automation-token publishing

Only after one complete OIDC release is verified, enforce package-level 2FA and disallow token
bypass. For every public package, open its npmjs.com settings page and require two-factor
authentication for publishing (disallow the automation-token bypass). Do this manually, one
package at a time; there is no scripted equivalent, for the same OTP-per-invocation reason
described above.

Then remove the old npm token from the repository or `npm` GitHub environment and revoke the
granular automation token on npm.

## Bootstrap Trusted Publishing for a new package

npm requires a package name to exist before it can have a trusted publisher, and its staged
publishing feature has the same prerequisite, so nothing in npm itself can create a brand-new
package's Trusted Publisher ahead of a real publish. This is a confirmed, still-open npm platform
gap ([npm/cli#8544](https://github.com/npm/cli/issues/8544)), not something this repository's
tooling works around; PyPI supports registering a "pending" publisher for a name that doesn't
exist yet, npm does not. If the package name already exists on npm at any version, do not
bootstrap it again; configure or verify its trusted publisher and continue with the normal
release.

For a brand-new package name, publish a minimal placeholder, not the real package. The placeholder
contains no code, no dependencies, and is never installed by anything; its only purpose is to
claim the name so a Trusted Publisher can be configured, the same approach the community tool
[`setup-npm-trusted-publish`](https://github.com/azu/setup-npm-trusted-publish) takes for the same
reason. Publishing the package's own real, unreleased content manually was considered and
rejected: npm versions are immutable, so a manually published version can never later gain SLSA
provenance, permanently leaving the package's actual first release without it. A throwaway
placeholder avoids that entirely, and it needs no build output, so it can be prepared before the
real package's source even exists in the repository.

Never use a bypass-2FA token for the bootstrap publish.

```bash
yarn bootstrap:trusted-publisher @rcarls/<package-name>
```

```powershell
yarn.cmd bootstrap:trusted-publisher @rcarls/<package-name>
```

This writes a placeholder `package.json` (version `0.0.0` by default; override with
`--version <version>` only if `0.0.0` is somehow already taken) and README into a temporary
directory and prints the exact `npm publish` command. It never authenticates to npm or publishes
anything itself.

Run the printed command interactively and complete its 2FA prompt. Then:

1. Confirm the placeholder version is visible on npmjs.com.
1. Configure the trusted publisher with GitHub Actions, `richardcarls/rc-webcomponents`,
   `release.yml`, the `npm` environment, and permission to run `npm publish`.
1. Leave the placeholder version published; do not `npm unpublish` it. Its `package.json` and README
   make its purpose clear to anyone who finds it, and it never satisfies the fixed group's version
   pattern, so it can never be mistaken for a real release by the tooling.
1. Continue with the normal release steps above (or a `@next` snapshot release). Nothing further
   is needed: the real package's first content publishes automatically the next time this
   repository releases, through the same OIDC path as every other package, with full provenance.
