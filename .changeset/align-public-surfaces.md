---
"@rcarls/rc-webcomponents": patch
"@rcarls/rc-common": patch
"@rcarls/rc-app-bar": patch
"@rcarls/rc-fab": patch
"@rcarls/rc-slider": patch
"@rcarls/rc-range-slider": patch
---

Align aggregate React and Solid typings for `rc-listbox` and `rc-menubar`, and add an API surface audit for docs/type drift.

Expand `rc-common` with small native-child, observer, animation-frame, and typeahead primitives, then migrate low-risk direct-child warnings and app-bar layout scheduling to the shared helpers.
