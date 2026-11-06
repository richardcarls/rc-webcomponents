---
'@rcarls/rc-textarea': minor
---

**Breaking:** a line action with an `iconName` but no `createIcon` result now
shows its `label` as button text. It no longer renders an empty button carrying
a `data-icon` attribute.

Migration: pass `createIcon`, or `renderButton`, to render action icons.
