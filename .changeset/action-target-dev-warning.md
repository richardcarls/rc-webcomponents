---
'@rcarls/rc-card': patch
'@rcarls/rc-list': patch
---

<!-- markdownlint-disable MD041 -->

Warn in development when `rc-card`/`rc-list-item` has `interactive` set but
no way to resolve a click target: no `action-target`, and for
`rc-list-item`, no native child checkbox/radio either. Surface clicks
silently go nowhere in that state; the warning now says so at the point
the row or card is set up wrong, instead of leaving it to be discovered
by a user tapping a dead row or card.
