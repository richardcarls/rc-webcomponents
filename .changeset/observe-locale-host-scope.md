---
'@rcarls/rc-common': patch
'@rcarls/rc-webcomponents': patch
---

`observeLocale(listener, host)` notifies only for a `dir` or `lang` change on the host, one of its
ancestors across shadow roots, or inside its subtree. A `lang` on unrelated content no longer
makes every component on the page re-read its writing direction, a forced layout each, including
components inside a `content-visibility: hidden` subtree. An optional `scope` names extra elements
whose locale matters; `AnchorController` passes the popup and its anchor. Subscribers without a host
still hear every change.
