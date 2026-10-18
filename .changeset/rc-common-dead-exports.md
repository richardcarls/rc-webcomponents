---
'@rcarls/rc-common': minor
---

Remove exports that no component uses.

Breaking changes and migration:

- `mouseMove` and `MouseMoveDirective` are removed. Use
  `DragGestureController`, which captures the pointer and reports deltas.
- `delegateClickTo`, `isEventFromInteractiveDescendant`, and
  `DEFAULT_INTERACTIVE_SELECTOR` are removed. Use `ClickDelegateController`,
  which now takes the `interactiveSelector` option directly. The
  `DelegateClickOptions` and `InteractiveDescendantOptions` types are removed
  with them.
- `getDirectChild(host, selector)` is removed. Use
  `host.querySelector(selector)`.
- `resolveAnchorPlacement`, `PhysicalAnchorPlacement`, `isTextEntryElement`,
  and `POPOVER_FALLBACK_OPEN` are no longer exported. They remain internal to
  `AnchorController`, `SoftKeyboardViewport`, and `PopoverController`.
- Modules no longer carry default exports, which the package entry never
  re-exported.
