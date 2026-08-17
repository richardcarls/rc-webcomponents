---
'@rcarls/rc-webcomponents': patch
---

Fix internal `workspace:*` dependency ranges shipping unresolved in published packages.
`changeset publish` shells out to plain `npm publish` for any package manager other than
pnpm, which doesn't understand Yarn's `workspace:` protocol, so every previously published
version referenced sibling packages as the literal string `workspace:*` (uninstallable
outside this workspace). Releases now let Yarn pack each workspace so those ranges become
real versions, then publish the resulting tarballs with npm's CLI through GitHub Actions
Trusted Publishing. The flow verifies registry metadata and provenance and safely resumes a
partially completed release.
