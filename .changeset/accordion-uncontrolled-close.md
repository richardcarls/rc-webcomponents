---
'@rcarls/rc-accordion': patch
'@rcarls/rc-webcomponents': patch
---

Single-open accordions now close a sibling `rc-disclosure` through its native `<details>`
instead of its `open` property. Writing the property switched the disclosure into
controlled mode, so a panel the accordion had closed would not reopen from its summary.
A controlled sibling now receives the close as an `rc-disclosure-toggle` request and
keeps the state its owner sets.

The Solid JSX types now declare `rc-disclosure`'s `default-open` attribute and its
`open` and `defaultOpen` properties.
