---
'@rcarls/rc-menu-button': patch
---

`rc-menu-button` lifts only the trigger `tabindex="-1"` it wrote itself. A tabindex another owner
sets on the trigger, such as the roving tab stop `rc-adaptive-menu` gives a promoted menu button,
now survives the element's resync after closing its menu, which also no longer forces a layout by
removing it from the focused trigger.
