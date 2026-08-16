---
'@rcarls/rc-menu-button': patch
---

Fix `defaultOpen` so it no longer reopens the menu after an explicit controlled
`open = false` write. The setter compared against the live `_open` value
instead of tracking whether a controlled write had occurred, so a common
pattern like React always passing `open={false}` left the component thinking
it was still uncontrolled.
