---
'@rcarls/rc-list': patch
'@rcarls/rc-common': minor
---

An `interactive` `rc-list-item` no longer forwards clicks inside its `details` region to its
action target, so a row whose action toggles its details stays open when its expanded text is
tapped. `@rcarls/rc-common` exports `DEFAULT_INTERACTIVE_SELECTOR` for click delegates that extend
the default list of self-handling descendants.
