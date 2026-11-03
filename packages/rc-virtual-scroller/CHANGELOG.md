# @rcarls/rc-virtual-scroller

## 0.7.0

### Minor Changes

- aed2034: Add `rc-virtual-scroller`, a headless virtualization wrapper.

  Mounting a large collection as custom elements costs real time regardless of
  `content-visibility: auto`: upgrade happens at parse and insertion, before
  style resolves, so containment cannot prevent element construction. This
  package stops the count of mounted elements from scaling with collection
  size, without taking over rendering.

  The element measures geometry against a slotted container and dispatches
  `rc-virtual-scroller-range` with the visible `[start, end)` index range; the
  consumer renders that slice into its own container with whatever it already
  uses, and two spacer parts reserve the off-range scroll space. Items per line
  and line pitch are measured from the container's own grid tracks rather than
  configured, so `auto-fill` and container queries stay authoritative. The
  focused item is never dropped from the reported range, so scrolling never
  silently resets keyboard focus to `<body>`.

  `axis="block|inline"` is logical: `block` windows stacked lines, `inline`
  windows a row of items such as a horizontal shelf. Direction and writing mode
  are read from computed style, so RTL pages and vertical text work without
  configuration.

- 11ef1ad: Harden virtual scrolling for document and element scroll containers, viewport resizing,
  shadow-root focus, hidden panes, and uniform spanning grids. Separate layout
  sampling from range calculation and avoid repeating item measurements during
  unchanged scroll frames. Scroll ancestor discovery now follows slots and shadow hosts.

  Breaking: `first` and `last` are read-only computed outputs. Use `scrollToIndex()`
  for navigation and read `range` for rendering instead of assigning output values.
  Virtualization requires uniform line pitch and capacity in sequential DOM order;
  detected unsupported layouts render the full collection. Set `items-per-line`
  for ambiguous uniform grid capacity, or remove it to restore automatic inference.
  Numeric inputs now normalize invalid values and floor integer configuration.

### Patch Changes

- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

- 0c9d563: Re-resolve the writing direction when a `dir` attribute changes, and at the
  start of every `scrollToIndex` call, so an inline-axis scroller keeps the
  right range and scrolls to the right item after a page switches direction.
- 16420f9: Count items per line from where items render instead of from the grid's
  track count, so a collection whose items span several tracks, such as a
  shelf of cards aligned through subgrid across its rows, windows one item per
  line instead of one per track.
- 7c1c7c4: Keep the rendered window on screen under CSS `zoom`, such as an app-wide
  interface size set on the root. The view position, scrollport size, and line
  pitch were read in viewport pixels but the spacers were written in the host's
  own CSS pixels, so the window drifted off screen by the zoom error as the list
  scrolled, leaving a growing blank gap. All geometry is now converted to host
  pixels, and `scrollToIndex()` scrolls in the scroll container's own pixels.
- Updated dependencies [e3dfa59]
- Updated dependencies [50d5610]
- Updated dependencies [9ee769c]
- Updated dependencies [1179f24]
- Updated dependencies [595fe37]
- Updated dependencies [38cd00c]
- Updated dependencies [5c006de]
- Updated dependencies [a6553ff]
- Updated dependencies [2205478]
- Updated dependencies [4341311]
- Updated dependencies [899bb5e]
- Updated dependencies [25fcfe0]
- Updated dependencies [51f6403]
- Updated dependencies [9caca6b]
- Updated dependencies [b764a3c]
- Updated dependencies [54d9ead]
- Updated dependencies [b9175e9]
- Updated dependencies [c8b762b]
- Updated dependencies [55e1e7f]
- Updated dependencies [f1ca82d]
- Updated dependencies [b87f27b]
- Updated dependencies [32ebead]
- Updated dependencies [bfefedd]
- Updated dependencies [c130173]
- Updated dependencies [11680b6]
- Updated dependencies [223d36c]
- Updated dependencies [7b91a44]
- Updated dependencies [aa04ead]
- Updated dependencies [ac65b5b]
- Updated dependencies [afcfef8]
- Updated dependencies [11ef1ad]
  - @rcarls/rc-common@0.7.0
