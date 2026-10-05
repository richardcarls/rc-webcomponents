---
'@rcarls/rc-chip-group': patch
'@rcarls/rc-webcomponents': patch
---

Keep a just-selected chip in view when chips resize after the selection. An app that moves a
filter chip's check mark a frame later first shortens the row, which clamps the scroll offset,
and then widens the selected chip past the row's end. The group now reveals that chip again
after later resizes, until the user scrolls the row themselves.
