---
'@rcarls/rc-bottom-sheet': patch
---

Fix an edge case left in the 0.4.2 resize-repin fix: the window-resize re-pin re-measured
via `getBoundingClientRect()` on the box that was still carrying its *previous* inline pin,
so a fixed (non-`dvh`) snap point (for example a `132px` peek height, common for a
persistent summary sheet) computed the exact same, now-stale target, since neither the
requested height nor the stale box's edges had changed. Only `dvh`-based snap points were
actually re-deriving correctly. Now clears the previous `top`/`height` pin before
re-measuring on resize, so the dialog reverts to its CSS-driven (`inset-block-end`-anchored)
position first, the same as a sheet that has never been pinned. Added a regression test
covering this specific case (confirmed it fails without the fix).
