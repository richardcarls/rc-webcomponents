---
'@rcarls/rc-react': patch
---

The wrappers now use React's default export, so `@lit-labs/ssr-react`'s server patch reaches
them: with it, a server render outputs each wrapper's declarative shadow root and its element
properties, such as `popupMode`. The React guide documents the setup for Next.js.
