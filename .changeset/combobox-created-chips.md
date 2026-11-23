---
'@rcarls/rc-common': minor
'@rcarls/rc-select': minor
'@rcarls/rc-combobox': minor
'@rcarls/rc-theme-material': minor
---

Chips for new values stand apart from existing ones. A selectable option takes
`created: true`, and `rc-combobox` sets it on the options its Create action
adds. Their chips get the `chip-created` part beside `chip`, a leading plus
icon (`chip-created-icon`), an accent dashed outline, and the accessible name
from the new `removeCreated` message ("Remove new item X"). Style them with
`--rc-select-chip-created-*` and `--rc-combobox-chip-created-*` (`border`,
`background`, `text`). `rc-theme-material` fills them with the tertiary
container color.

