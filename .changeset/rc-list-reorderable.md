---
'@rcarls/rc-common': minor
'@rcarls/rc-list': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-webcomponents': minor
---

Add pointer and keyboard reordering to `rc-list`.

Set `reorderable` and give each item a native `<button data-rc-reorder-handle>`. People can drag
a handle, and the items it passes shift out of the way while the nearest scroll container
scrolls near its edges. On touch and pen, a long press on an item also starts a drag, while
movement before activation remains available for scrolling. Or they can focus a handle and use
Space, the block-axis arrow keys, Home, End, and Escape. Each step is announced, focus stays on
the moved item's handle, and geometry and keys follow the writing mode. `reorderable` implies
`ordered`.

Each committed move fires a cancelable `rc-list-reorder` event with `{ item, from, to }`. Left
alone, the list moves the node itself; a framework that renders the items cancels the event and
reorders its own data. `reorderMessages` overrides the announcements and the handle hint.

`rc-common` gains the `ReorderController` behind it and a `LiveAnnouncer` live-region helper.
`rc-theme-material` styles the lifted item with the dragged elevation, surface, and state layer,
animates the shifting items with standard motion, and presents plain handles as standard icon
buttons.
