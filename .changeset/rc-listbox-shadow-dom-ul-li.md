---
"@rcarls/rc-listbox": minor
"@rcarls/rc-common": minor
---

Refactor `rc-listbox` to shadow DOM with native `<ul>/<li>` option elements.

**Breaking changes:**

- `<div role="option">` replaced by `<li role="option">`. CSS selectors targeting the old `div[role='option']` or `[part='option']` on a `<div>` must change to `rc-listbox li[role='option']`.
- `part="option-label"` removed — label is now the direct text content of the `<li>`.
- The component now uses shadow DOM. Direct light-DOM queries inside the component shadow root are not possible. The `<ul>/<li>` option subtree remains in the host element's own light DOM and is queryable from outside.

**New features:**

- `rc-listbox` accepts a pre-rendered `<ul>` with `<li>` children as a progressive enhancement baseline. Options are bootstrapped from the DOM on first connect if the `options` property has not been set.
- `ItemsCollectionController` added to `@rcarls/rc-common` — reusable controller for managing `<ul>/<li>` option subtrees in light DOM.
- Base styles (layout, system-color selection highlight, disabled state) are injected automatically via `adoptedStyleSheets` into whichever root the component attaches to.
