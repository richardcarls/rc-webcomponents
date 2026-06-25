---
"@rcarls/rc-transfer-list": patch
"@rcarls/rc-theme-material": patch
"@rcarls/rc-webcomponents": patch
---

Move transfer-list owned UI into shadow DOM with static styles, add an explicit compact layout variant, polish docs, and move native child observation onto shared `rc-common` primitives.

Update Material theme to match: add listbox background and corner rounding, fix action button border-radius to use `shape-corner-medium` instead of `shape-corner-full` so focus rings are no longer pill-shaped.
