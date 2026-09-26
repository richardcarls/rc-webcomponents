---
'@rcarls/rc-markdown-editor': patch
'@rcarls/rc-menubar': patch
'@rcarls/rc-textarea-adapters': minor
'@rcarls/rc-textarea-plugin-markdown': minor
---

Correct package dependency declarations and prevent bundled Markdown implementation types from
leaking into the editor declarations.

BREAKING CHANGE: `@rcarls/rc-textarea-adapters` now treats `@rcarls/rc-textarea` as a peer instead
of installing it as a runtime dependency. Both textarea extension packages require a compatible
pre-1 `@rcarls/rc-textarea` release; install it alongside either extension package when upgrading.
