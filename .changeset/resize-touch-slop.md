---
'@rcarls/rc-common': patch
'@rcarls/rc-dialog': patch
'@rcarls/rc-bottom-sheet': patch
'@rcarls/rc-webcomponents': patch
---

A pointer resize now starts only after the pointer moves 8 pixels, like Android's touch slop.
A tap on a resize handle that is also a button, such as a bottom sheet's drag handle, stays a
click: it no longer starts a resize, settles the sheet to its nearest snap point, and fires
resize events before the click runs.
