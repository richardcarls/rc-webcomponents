---
"@rcarls/rc-dialog": minor
---

# rc-dialog WAI-ARIA review and API improvements

**rc-dialog:** `show()` opens the inner `<dialog>` as non-modal and fires `rc-dialog-open`; `modal` JS property controls whether controlled `open` / `defaultOpen` uses `showModal()` or `show()` (default `true`); focus restoration falls back to `document.body` when the opener element is removed from the DOM while the dialog is open; DEV warning added for missing enabled `<button>` inside the inner `<dialog>` (APG recommended practice); `rc-dialog-open` and `rc-dialog-toggle` events documented in JSDoc and README; properties table in README expanded with `open`, `defaultOpen`, and `modal` entries.
