# `@rcarls/rc-dialog`

A WAI-ARIA compliant web component that enhances a consumer-provided `<dialog>` element with drag, resize, cancelable close events, and light-dismiss. Built with [Lit 3](https://lit.dev).

The component is a **headless wrapper** — it injects no HTML of its own. Your `<dialog>` stays in the document's light DOM with full CSS and assistive-technology access.

---

## Installation

```bash
npm install @rcarls/rc-dialog
```

## Import

```js
import '@rcarls/rc-dialog';          // side-effect: registers <rc-dialog>
import { RCDialog } from '@rcarls/rc-dialog'; // named class export
```

---

## Basic usage

Place a `<dialog>` element directly inside `<rc-dialog>`. The inner `<dialog>` must have `aria-labelledby` or `aria-label` to satisfy the [WAI-ARIA Dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

```html
<rc-dialog id="my-dialog">
  <dialog aria-labelledby="dlg-title">
    <h2 id="dlg-title">Hello</h2>
    <p>Dialog content.</p>
    <button onclick="document.querySelector('#my-dialog').close()">Close</button>
  </dialog>
</rc-dialog>

<button onclick="document.querySelector('#my-dialog').showModal()">Open</button>
```

---

## API

### Properties / attributes

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `movable` | `movable` | `boolean` | `false` | Enable drag-to-move. Named `movable` (not `draggable`) to avoid colliding with the HTML `draggable` attribute. |
| `moveHandle` | `move-handle` | `string` | `''` | CSS selector for the drag handle within the inner `<dialog>` (e.g. `'.titlebar'`). Defaults to the whole dialog. |
| `moveBounds` | `move-bounds` | `'viewport' \| 'parent'` | `'viewport'` | Constrains drag within the viewport or the nearest positioned ancestor. |
| `moveStep` | `move-step` | `number` | `4` | Keyboard arrow-key step in px when moving. Shift multiplies by 10×. |
| `resize` | `resize` | `'none' \| 'both' \| 'horizontal' \| 'vertical'` | `'none'` | Enables edge/corner resizing, mirroring CSS `resize` semantics. |
| `resizeThreshold` | `resize-threshold` | `number` | `8` | Edge hit-test band in px (straddles the border — half inside, half outside). |
| `resizeStep` | `resize-step` | `number` | `4` | Keyboard arrow-key step in px when resizing. Shift multiplies by 10×. |
| `closedBy` | `closed-by` | `'any' \| 'closerequest' \| 'none' \| ''` | `''` | Proxied to the inner `<dialog closedby="...">` attribute (Chrome 134+, Safari 18.4+, Firefox 139+). `'any'` = Escape or backdrop click; `'closerequest'` = Escape only; `'none'` = programmatic only. |
| `lightDismiss` | `light-dismiss` | `boolean` | `false` | JS fallback for backdrop-click dismissal. Detects clicks whose target is the `<dialog>` element itself and calls `requestClose()`. Works in all browsers alongside or instead of `closed-by`. |

### Methods

```ts
showModal(): void          // Opens as modal (traps focus, shows backdrop).
show(): void               // Opens as non-modal.
close(returnValue?): void  // Closes immediately; sets returnValue.
requestClose(returnValue?): void
  // Requests close: fires rc-dialog-request-close first. If not prevented,
  // proceeds to close. Falls back to a synthesized cancel event on older
  // browsers that lack native HTMLDialogElement.requestClose().
```

### Read-only getters

```ts
open: boolean        // Whether the inner <dialog> is currently open.
returnValue: string  // The return value set when the dialog last closed.
```

### Events

| Event | Cancelable | Detail | Description |
|---|---|---|---|
| `rc-dialog-request-close` | **Yes** | `{ returnValue: string }` | Fired before close (Escape, backdrop click, or `requestClose()`). Call `preventDefault()` to block. |
| `rc-dialog-cancel` | No | — | Fired after `rc-dialog-request-close` when the close was not prevented. Backward-compatible alias. |
| `rc-dialog-close` | No | `{ returnValue: string }` | Fired after the dialog has closed. |

---

## Examples

### Movable dialog with a drag handle

```html
<rc-dialog id="dlg" movable move-handle=".titlebar">
  <dialog aria-labelledby="dlg-title">
    <div class="titlebar">
      <span id="dlg-title">Settings</span>
      <button onclick="document.querySelector('#dlg').close()">✕</button>
    </div>
    <div class="body">…</div>
  </dialog>
</rc-dialog>
```

Drag the `.titlebar` to reposition. Focus the titlebar and use **Arrow keys** to move it (Shift = 10× step).

### Movable + resizable

```html
<rc-dialog id="dlg" movable move-handle=".titlebar" resize="both">
  <dialog aria-labelledby="dlg-title" style="min-width: 20rem; min-height: 10rem;">
    …
  </dialog>
</rc-dialog>
```

All 8 resize handles are active (n, s, e, w, ne, nw, se, sw). Opposite-edge handles anchor the far side and move `left`/`top`, mirroring OS-window resize semantics. A small keyboard-accessible resize button is injected at the bottom-right corner.

### Minimal / no-header dialog

No titlebar or footer structure is required. Any layout is valid.

```html
<rc-dialog id="dlg">
  <dialog aria-labelledby="dlg-title" aria-describedby="dlg-desc"
          style="border-radius: 12px; padding: 2rem; position: relative;">
    <button style="position:absolute;top:.5rem;right:.5rem;"
            onclick="document.querySelector('#dlg').close()"
            aria-label="Close">✕</button>
    <h3 id="dlg-title">Quick note</h3>
    <p id="dlg-desc">Content here.</p>
  </dialog>
</rc-dialog>
```

### Alert / confirm dialog

Use `role="alertdialog"` with `aria-describedby` pointing to the message text. Assistive technology treats this with higher urgency.

```html
<rc-dialog id="confirm">
  <dialog role="alertdialog"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-msg">
    <div class="titlebar"><span id="confirm-title">Delete item?</span></div>
    <p id="confirm-msg">This action cannot be undone.</p>
    <div class="footer">
      <button onclick="document.querySelector('#confirm').close('cancel')">Cancel</button>
      <button onclick="document.querySelector('#confirm').close('delete')">Delete</button>
    </div>
  </dialog>
</rc-dialog>
```

### Native form integration

`<form method="dialog">` submits to the dialog: the submit button's `value` becomes `returnValue` and the dialog closes — no JavaScript needed.

```html
<rc-dialog id="dlg">
  <dialog aria-labelledby="dlg-title">
    <div class="titlebar">
      <span id="dlg-title">New contact</span>
      <button formmethod="dialog" form="contact-form" value="cancel">✕</button>
    </div>
    <form id="contact-form" method="dialog">
      <label>Name <input name="name" type="text" /></label>
      <label>Email <input name="email" type="email" /></label>
    </form>
    <div class="footer">
      <button formmethod="dialog" form="contact-form" value="cancel">Cancel</button>
      <button type="submit" form="contact-form" value="save">Save</button>
    </div>
  </dialog>
</rc-dialog>
```

### Cancelable close guard (unsaved changes)

```html
<rc-dialog id="dlg" movable move-handle=".titlebar">
  <dialog aria-labelledby="dlg-title">
    <div class="titlebar">
      <span id="dlg-title">Edit note</span>
      <!-- requestClose() fires rc-dialog-request-close; close() bypasses it -->
      <button onclick="document.querySelector('#dlg').requestClose('cancel')">✕</button>
    </div>
    <textarea id="note" rows="5"></textarea>
    <p id="warning" hidden role="alert">Unsaved changes — save or discard first.</p>
    <div class="footer">
      <button onclick="note.value=''; dlg.close('discard')">Discard</button>
      <button onclick="dlg.close('save')">Save</button>
    </div>
  </dialog>
</rc-dialog>

<script>
  document.querySelector('#dlg').addEventListener('rc-dialog-request-close', (e) => {
    if (document.querySelector('#note').value.trim()) {
      e.preventDefault();
      document.querySelector('#warning').hidden = false;
    }
  });
</script>
```

### Light-dismiss (click backdrop to close)

```html
<!-- Native (Chrome 134+ / Safari 18.4+ / Firefox 139+) + JS fallback -->
<rc-dialog id="dlg" closed-by="any" light-dismiss>
  <dialog aria-labelledby="dlg-title" aria-describedby="dlg-body">
    <div class="header"><span id="dlg-title">Info</span></div>
    <div id="dlg-body">Click the backdrop or press Escape to dismiss.</div>
  </dialog>
</rc-dialog>
```

`closed-by="any"` delegates to the browser's native light-dismiss on supporting browsers. `light-dismiss` adds a JS click-on-backdrop fallback that works everywhere and routes through `requestClose()` (so close guards still apply).

---

## Accessibility

`<rc-dialog>` delegates entirely to the native `<dialog>` element:

- **Focus trapping** — built into `showModal()` (Tab/Shift+Tab stays inside the dialog).
- **Focus restoration** — the browser returns focus to the triggering element on close.
- **Escape to close** — native behaviour; routes through `rc-dialog-request-close` so guards still apply.
- **`aria-modal`** — `showModal()` implies `aria-modal="true"` without an explicit attribute.

**Required:** The inner `<dialog>` must have `aria-labelledby` or `aria-label`. In development mode the component logs a console warning if either is absent.

**Alert dialogs:** When `role="alertdialog"` is set, add `aria-describedby` pointing to the message text. A dev-mode warning fires if it is missing.

---

## CSS layout for scrollable dialogs

When the dialog needs scrollable body content (especially when resizable), use flex layout so the body grows and the header/footer stay fixed:

```css
dialog[open] {
  display: flex;
  flex-direction: column;
  overflow: hidden;   /* dialog box doesn't scroll; body does */
}

.dlg-header,
.dlg-footer {
  flex-shrink: 0;
}

.dlg-body {
  flex: 1;
  overflow: auto;
  min-height: 0;      /* lets flex child shrink below content height */
}
```

> **Note:** `display: flex` must be scoped to `dialog[open]`, not `dialog`. Author styles take precedence over the UA `dialog:not([open]) { display: none }` rule — scoping to `[open]` prevents all dialogs from being visible on page load.

---

## Browser support

| Feature | Requirement |
|---|---|
| Core (`<dialog>` delegation, events) | Chrome 37+, Firefox 98+, Safari 15.4+ |
| Drag / resize | Any browser supporting Pointer Events |
| `closed-by` attribute proxy | Chrome 134+, Safari 18.4+, Firefox 139+ |
| `requestClose()` native method | Chrome 134+, Safari 18.4+, Firefox 139+ (fallback active on older browsers) |
| `light-dismiss` JS fallback | All browsers |
