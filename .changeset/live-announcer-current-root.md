---
'@rcarls/rc-common': minor
'@rcarls/rc-data-table': patch
'@rcarls/rc-pagination': patch
---

`LiveAnnouncer` mounts its region before each announcement in the open dialog or
popover around its host, else the document's current body, and creates it on
first use. An announcement after Turbo replaces `document.body` around a
permanent element, or after a DOM morph removes the region, now reaches
assistive technology instead of a detached node. `rc-pagination` and
`rc-data-table` with `announce` also announce from inside an open modal dialog,
where the body was inert. `announcerRootFor()` is exported for custom roots.

Breaking changes:

- `LiveAnnouncer` takes the host element and an optional `{ root }` resolver
  instead of a mount node. Replace `new LiveAnnouncer($root)` with
  `new LiveAnnouncer($host, { root: () => $root })`, or drop `root` to use the
  dialog-aware default.
