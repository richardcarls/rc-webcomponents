---
'@rcarls/rc-webcomponents': minor
---

**Breaking:** the React and Solid JSX typings (`@rcarls/rc-webcomponents/react` and
`/solid`) are now generated from the Custom Elements Manifest and typed from each component's
own class and `HTMLElementEventMap` entries. They no longer export the hand-maintained
`RC*Ref`, `RC*Detail`, or shared value types.

Migration: import element and event types from the component packages, or from the
aggregate's per-component subpaths.

- `RCSelectRef` becomes `RCSelect` from `@rcarls/rc-select` (or
  `@rcarls/rc-webcomponents/rc-select`); every other `RC<Name>Ref` becomes the `RC<Name>`
  class the same way.
- Event detail types use each package's names, for example `RCSelectChangeDetail` becomes
  `RCSelectChangeEvent`, `RCComboboxCreateDetail` becomes `RCComboboxCreateEvent`,
  `RCMenuActivateDetail` becomes `RCMenuActivateEvent`, `RCTransferListChangeDetail` becomes
  `RCTransferListChangeEvent`, and `RCVirtualCanvasRenderDetail` and
  `RCVirtualCanvasPointerDetail` become `RCVirtualCanvasRenderInit` and
  `RCVirtualCanvasPointerInit`. Event handler props such as `onrc-select-change` are now
  typed, so most casts can be dropped.
- Value types such as `RCSelectOption` and `RCSelectValue` come from their packages.

The typings also cover every element property, accept numeric strings for numeric
attributes, and type the components' CSS custom properties in `style` objects.
