---
'@rcarls/rc-textarea': patch
---

`LineActionsOptions.createIcon` and `FoldingActionControllerOptions.createTriggerIcon`
now accept any `Element`, so an icon can be a plain inline `<svg>` rather than an
`HTMLElement` such as an icon custom element. Existing callbacks still type-check.
