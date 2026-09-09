---
'@rcarls/rc-textarea': patch
---

<!-- markdownlint-disable MD041 -->

Allow `rc-textarea` to shrink below its intrinsic content width so `word-wrap`
wraps long, unbroken lines inside narrow grid and flex layouts instead of
forcing the consumer layout to overflow.
