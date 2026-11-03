---
'@rcarls/rc-common': minor
---

**Breaking:** the message catalog types `RcMessageCatalog` and `RcMessageCatalogInput` are
renamed `RCMessageCatalog` and `RCMessageCatalogInput`, matching the `RC` prefix of every
other exported type.

Migration: rename imports and module augmentations, for example
`declare module '@rcarls/rc-common' { interface RCMessageCatalog { ... } }`.
