---
"@rcarls/rc-common": minor
"@rcarls/rc-listbox": minor
"@rcarls/rc-select": minor
"@rcarls/rc-combobox": minor
"@rcarls/rc-transfer-list": minor
"@rcarls/rc-webcomponents": minor
---

Add typed listbox action options and discriminated `rc-listbox-change` details.

`rc-listbox` option data now supports selectable option rows and action rows. Change
events narrow on `detail.reason`, so consumers can branch between selection updates and
commands such as create without relying on sentinel option values. Selection-only
consumers ignore action details, while `rc-combobox` uses the action branch for
`allow-create`.
