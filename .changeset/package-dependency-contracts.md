---
'@rcarls/rc-markdown-editor': patch
'@rcarls/rc-menubar': patch
'@rcarls/rc-textarea-adapters': minor
'@rcarls/rc-textarea-plugin-markdown': minor
---

Correct package dependency declarations and prevent bundled Markdown implementation types from
leaking into the editor declarations.

BREAKING CHANGE: `@rcarls/rc-textarea-adapters` now treats `@rcarls/rc-textarea` as a peer instead
of installing it as a runtime dependency, and both textarea extension packages require the
matching synchronized `@rcarls/rc-textarea` release. Install the same version of
`@rcarls/rc-textarea` alongside either extension package when upgrading.
