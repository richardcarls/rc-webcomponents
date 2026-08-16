---
'@rcarls/rc-navigation-rail': major
'@rcarls/rc-webcomponents': patch
---

`rc-navigation-rail` no longer renders an internal `nav` landmark or exposes
the `label` property and attribute, matching the fix already applied to
`rc-navigation-bar`. Wrap it in a labeled native `<nav>` element instead.

BREAKING CHANGE: remove the `label` property/attribute and stop rendering an
internal `<nav aria-label>`; `rc-navigation-rail` now renders a plain `div`
for its `nav` part and expects the consumer to own landmark semantics.
