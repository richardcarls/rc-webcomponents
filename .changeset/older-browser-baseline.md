---
'@rcarls/rc-common': patch
'@rcarls/rc-webcomponents': patch
'@rcarls/rc-textarea': patch
---

Build core component packages for ES2021 and add optional browser API fallbacks
for ElementInternals, generated IDs, plugin stylesheets, and viewport sizing.
Document the minimum browser validation target separately from the tested
current-browser tier. Themes and plugins may declare their own requirements.

`setCustomState` now skips browsers whose CSS can't match `:state()`, including
Chromium 90–124, where the old `CustomStateSet` throws for names without `--`.
It returns whether the state was applied, and the new `supportsCustomStates`
exposes the same check. Where `:state()` doesn't match, `rc-page-turner` uses
classes and inline styles for its turn layers, and `rc-field` keys its focus
outline on `:focus-within`.
