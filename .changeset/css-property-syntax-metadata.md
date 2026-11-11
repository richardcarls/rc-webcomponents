---
'@rcarls/rc-webcomponents': minor
---

Component manifests record the CSS syntax each custom property accepts in the
schema's `syntax` field, including shared tokens an element documents. The
aggregate package adds `dist/css-custom-data.json` (exported as
`./css-custom-data.json`), VS Code CSS custom data for every shared and
component token with its description, syntax, default, and the elements that
read it. Add it to `css.customData` for completion and hover documentation.
