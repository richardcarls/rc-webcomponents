---
'@rcarls/rc-carousel': patch
'@rcarls/rc-page-turner': patch
---

`rc-carousel` and `rc-page-turner` center their previous and next icons in
the navigation buttons. The icons sat on the text baseline and rendered
about 1.5px above center, and slotted `previous-icon` and `next-icon`
replacements are centered the same way.
