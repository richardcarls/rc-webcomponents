<script setup>
import { ref, onMounted } from 'vue';

const eventLog = ref([]);

function logEvent(msg) {
  eventLog.value = [`${new Date().toLocaleTimeString()} ${msg}`, ...eventLog.value].slice(0, 30);
}

onMounted(() => {
  document.querySelectorAll('rc-dialog').forEach((d) => {
    d.addEventListener('rc-dialog-close', (e) => {
      logEvent(`close         [#${d.id}]  returnValue="${e.detail.returnValue}"`);
    });
    d.addEventListener('rc-dialog-cancel', () => {
      logEvent(`cancel        [#${d.id}]  (Escape, not prevented)`);
    });
    d.addEventListener('rc-dialog-request-close', (e) => {
      logEvent(`request-close [#${d.id}]  returnValue="${e.detail.returnValue}"${e.defaultPrevented ? ' → PREVENTED' : ''}`);
    });
  });

  const guard = document.querySelector('#guard');
  if (guard) {
    guard.addEventListener('rc-dialog-request-close', (e) => {
      const ta = document.getElementById('guard-note');
      if (ta?.value.trim()) {
        e.preventDefault();
        const warning = document.getElementById('guard-warning');
        if (warning) warning.style.display = 'block';
        ta.focus();
      } else {
        const warning = document.getElementById('guard-warning');
        if (warning) warning.style.display = 'none';
      }
    }, true);
  }
});
</script>

# rc-dialog

A draggable, resizable wrapper around a native `<dialog>`. Wraps the browser's built-in dialog behaviors — `showModal()`, `close()`, `Escape` key, `::backdrop` — and adds move/resize, a cancelable close guard, and light-dismiss.

[WAI-ARIA Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-dialog
```

```sh [yarn]
yarn add @rcarls/rc-dialog
```

:::

```js
import '@rcarls/rc-dialog/define';
```

## Basic modal dialog

Native `showModal()`, Escape closes.

<ClientOnly>
<div class="demo-section">
  <button onclick="document.querySelector('#basic').showModal()"
    style="padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">
    Open dialog
  </button>
  <rc-dialog id="basic">
    <dialog aria-labelledby="basic-title" style="padding:0;border:1px solid ButtonBorder;border-radius:4px;box-shadow:0 4px 24px rgba(0,0,0,0.2);min-width:20rem;">
      <div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;background:Canvas;border-bottom:1px solid ButtonBorder;">
        <span id="basic-title" style="flex:1;font-weight:600;">Basic Dialog</span>
        <button onclick="document.querySelector('#basic').close()" style="border:none;background:none;cursor:pointer;font-size:1.1rem;line-height:1;">✕</button>
      </div>
      <div style="padding:1rem;"><p style="margin:0;">Press <kbd>Escape</kbd> or click a button to close.</p></div>
      <div style="display:flex;justify-content:flex-end;gap:0.5rem;padding:0.75rem 1rem;border-top:1px solid ButtonBorder;">
        <button onclick="document.querySelector('#basic').close('cancel')" style="padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">Cancel</button>
        <button onclick="document.querySelector('#basic').close('ok')" style="padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">OK</button>
      </div>
    </dialog>
  </rc-dialog>
</div>
</ClientOnly>

```html
<button onclick="document.querySelector('#dlg').showModal()">Open</button>

<rc-dialog id="dlg">
  <dialog aria-labelledby="dlg-title">
    <div class="dlg-titlebar">
      <span id="dlg-title">Dialog</span>
      <button onclick="document.querySelector('#dlg').close()">✕</button>
    </div>
    <div class="dlg-body"><p>Dialog content.</p></div>
    <div class="dlg-footer">
      <button onclick="document.querySelector('#dlg').close('cancel')">Cancel</button>
      <button onclick="document.querySelector('#dlg').close('ok')">OK</button>
    </div>
  </dialog>
</rc-dialog>
```

## Movable dialog

Set `movable` and `move-handle` to enable dragging by the titlebar. While the titlebar is focused, arrow keys move the dialog (Shift = 10× step).

<ClientOnly>
<div class="demo-section">
  <button onclick="document.querySelector('#movable').showModal()"
    style="padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">
    Open movable dialog
  </button>
  <rc-dialog id="movable" movable move-handle=".dlg-titlebar">
    <dialog aria-labelledby="movable-title" style="padding:0;border:1px solid ButtonBorder;border-radius:4px;box-shadow:0 4px 24px rgba(0,0,0,0.2);min-width:20rem;">
      <div class="dlg-titlebar" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;background:Canvas;border-bottom:1px solid ButtonBorder;cursor:move;user-select:none;">
        <span id="movable-title" style="flex:1;font-weight:600;">Movable Dialog</span>
        <button onclick="document.querySelector('#movable').close()" style="border:none;background:none;cursor:pointer;font-size:1.1rem;line-height:1;">✕</button>
      </div>
      <div style="padding:1rem;"><p style="margin:0;">Drag the titlebar or use arrow keys (with titlebar focused) to reposition.</p></div>
      <div style="display:flex;justify-content:flex-end;padding:0.75rem 1rem;border-top:1px solid ButtonBorder;">
        <button onclick="document.querySelector('#movable').close('ok')" style="padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">OK</button>
      </div>
    </dialog>
  </rc-dialog>
</div>
</ClientOnly>

```html
<rc-dialog movable move-handle=".dlg-titlebar">
  <dialog>
    <div class="dlg-titlebar"><!-- drag handle --></div>
    <!-- ... -->
  </dialog>
</rc-dialog>
```

## Movable + resizable dialog

Add `resize="both"` to allow dragging any edge or corner. While the resize handle is focused, arrow keys resize (Shift = 10× step).

<ClientOnly>
<div class="demo-section">
  <button onclick="document.querySelector('#resizable').showModal()"
    style="padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">
    Open resizable dialog
  </button>
  <rc-dialog id="resizable" movable move-handle=".dlg-titlebar" resize="both">
    <dialog aria-labelledby="resizable-title" style="padding:0;border:1px solid ButtonBorder;border-radius:4px;box-shadow:0 4px 24px rgba(0,0,0,0.2);min-width:20rem;min-height:10rem;display:none;">
      <div class="dlg-titlebar" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;background:Canvas;border-bottom:1px solid ButtonBorder;cursor:move;user-select:none;flex-shrink:0;">
        <span id="resizable-title" style="flex:1;font-weight:600;">Resizable Dialog</span>
        <button onclick="document.querySelector('#resizable').close()" style="border:none;background:none;cursor:pointer;font-size:1.1rem;line-height:1;">✕</button>
      </div>
      <div style="padding:1rem;flex:1;overflow:auto;min-height:0;"><p style="margin:0;">Drag any edge or corner to resize.</p></div>
      <div style="display:flex;justify-content:flex-end;padding:0.75rem 1rem;border-top:1px solid ButtonBorder;flex-shrink:0;">
        <button onclick="document.querySelector('#resizable').close('ok')" style="padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">OK</button>
      </div>
    </dialog>
  </rc-dialog>
</div>
</ClientOnly>

```html
<rc-dialog movable move-handle=".dlg-titlebar" resize="both">
  <dialog style="min-width: 20rem; min-height: 10rem;">
    <!-- ... -->
  </dialog>
</rc-dialog>
```

## Minimal dialog (no titlebar)

A card-style dialog with an overlaid close button. No structural titlebar or footer divs required.

<ClientOnly>
<div class="demo-section">
  <button onclick="document.querySelector('#minimal').showModal()"
    style="padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">
    Open minimal dialog
  </button>
  <rc-dialog id="minimal">
    <dialog aria-labelledby="minimal-title" aria-describedby="minimal-desc"
      style="padding:2rem;border:none;border-radius:12px;min-width:22rem;max-width:32rem;box-shadow:0 8px 40px rgba(0,0,0,0.18);position:relative;">
      <button onclick="document.querySelector('#minimal').close()" aria-label="Close"
        style="position:absolute;top:0.5rem;right:0.5rem;border:none;background:none;cursor:pointer;font-size:1.25rem;line-height:1;padding:0.25rem;border-radius:50%;">✕</button>
      <h3 id="minimal-title" style="margin:0 0 0.75rem;">Quick note</h3>
      <p id="minimal-desc" style="margin:0 0 0.5rem;">No structural titlebar or footer — just content and an overlaid ✕ button.</p>
      <p style="margin:0;">Press <kbd>Escape</kbd> or ✕ to close.</p>
    </dialog>
  </rc-dialog>
</div>
</ClientOnly>

```html
<rc-dialog id="dlg">
  <dialog aria-labelledby="title" style="position: relative; padding: 2rem;">
    <button onclick="document.querySelector('#dlg').close()" aria-label="Close"
      style="position: absolute; top: 0.5rem; right: 0.5rem;">✕</button>
    <h3 id="title">Quick note</h3>
    <p>Content here.</p>
  </dialog>
</rc-dialog>
```

## Alert / Confirm dialog

Uses `role="alertdialog"` and `aria-describedby` for the alert message.

<ClientOnly>
<div class="demo-section">
  <button onclick="document.querySelector('#alert-dlg').showModal()"
    style="padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">
    Delete item…
  </button>
  <rc-dialog id="alert-dlg">
    <dialog role="alertdialog" aria-labelledby="alert-title" aria-describedby="alert-desc"
      style="padding:0;border:1px solid ButtonBorder;border-radius:4px;box-shadow:0 4px 24px rgba(0,0,0,0.2);min-width:20rem;">
      <div style="display:flex;align-items:center;padding:0.5rem 1rem;background:Canvas;border-bottom:1px solid ButtonBorder;">
        <span id="alert-title" style="font-weight:600;">Delete item?</span>
      </div>
      <div style="padding:1rem;text-align:center;">
        <div style="font-size:2.5rem;margin-bottom:0.5rem;" aria-hidden="true">⚠️</div>
        <p id="alert-desc" style="margin:0 0 1.25rem;">This will permanently delete the item and cannot be undone.</p>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:0.5rem;padding:0.75rem 1rem;border-top:1px solid ButtonBorder;">
        <button onclick="document.querySelector('#alert-dlg').close('cancel')"
          style="padding:0.5rem 1.25rem;background:none;border:1px solid ButtonBorder;border-radius:4px;cursor:pointer;font-size:1rem;">Cancel</button>
        <button onclick="document.querySelector('#alert-dlg').close('delete')"
          style="padding:0.5rem 1.25rem;background:#c0392b;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:1rem;">Delete</button>
      </div>
    </dialog>
  </rc-dialog>
</div>
</ClientOnly>

```html
<rc-dialog id="alert-dlg">
  <dialog role="alertdialog"
          aria-labelledby="alert-title"
          aria-describedby="alert-desc">
    <div id="alert-title">Delete item?</div>
    <p id="alert-desc">This action cannot be undone.</p>
    <button onclick="document.querySelector('#alert-dlg').close('cancel')">Cancel</button>
    <button onclick="document.querySelector('#alert-dlg').close('delete')">Delete</button>
  </dialog>
</rc-dialog>
```

## Form dialog

Uses `<form method="dialog">`. Submitting closes the dialog and sets `returnValue`.

<ClientOnly>
<div class="demo-section">
  <button onclick="document.querySelector('#formdlg').showModal()"
    style="padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">
    Open form dialog
  </button>
  <rc-dialog id="formdlg">
    <dialog aria-labelledby="form-title" style="padding:0;border:1px solid ButtonBorder;border-radius:4px;box-shadow:0 4px 24px rgba(0,0,0,0.2);min-width:24rem;">
      <div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;background:Canvas;border-bottom:1px solid ButtonBorder;">
        <span id="form-title" style="flex:1;font-weight:600;">New contact</span>
        <button formmethod="dialog" form="contact-form" value="cancel" aria-label="Close" style="border:none;background:none;cursor:pointer;font-size:1.1rem;line-height:1;">✕</button>
      </div>
      <div style="padding:1rem;">
        <form id="contact-form" method="dialog" style="display:flex;flex-direction:column;gap:0.75rem;">
          <div style="display:flex;flex-direction:column;gap:0.25rem;">
            <label for="contact-name" style="font-weight:600;font-size:0.875rem;">Name</label>
            <input id="contact-name" name="name" type="text" placeholder="Jane Smith"
              style="padding:0.375rem 0.5rem;border:1px solid ButtonBorder;border-radius:4px;font-size:1rem;font-family:inherit;" />
          </div>
          <div style="display:flex;flex-direction:column;gap:0.25rem;">
            <label for="contact-email" style="font-weight:600;font-size:0.875rem;">Email</label>
            <input id="contact-email" name="email" type="email" placeholder="jane@example.com"
              style="padding:0.375rem 0.5rem;border:1px solid ButtonBorder;border-radius:4px;font-size:1rem;font-family:inherit;" />
          </div>
        </form>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:0.5rem;padding:0.75rem 1rem;border-top:1px solid ButtonBorder;">
        <button formmethod="dialog" form="contact-form" value="cancel" style="padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">Cancel</button>
        <button type="submit" form="contact-form" value="save" style="padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">Save</button>
      </div>
    </dialog>
  </rc-dialog>
</div>
</ClientOnly>

```html
<rc-dialog id="dlg">
  <dialog>
    <form id="dlg-form" method="dialog">
      <input name="name" type="text" />
    </form>
    <button type="submit" form="dlg-form" value="save">Save</button>
    <button formmethod="dialog" form="dlg-form" value="cancel">Cancel</button>
  </dialog>
</rc-dialog>
```

## Close guard

Listens for `rc-dialog-request-close` (cancelable). When the textarea has content, `preventDefault()` blocks the close.

<ClientOnly>
<div class="demo-section">
  <button onclick="document.querySelector('#guard').showModal()"
    style="padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">
    Open with guard
  </button>
  <rc-dialog id="guard" movable move-handle=".guard-titlebar">
    <dialog aria-labelledby="guard-title" style="padding:0;border:1px solid ButtonBorder;border-radius:4px;box-shadow:0 4px 24px rgba(0,0,0,0.2);min-width:22rem;">
      <div class="guard-titlebar" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 1rem;background:Canvas;border-bottom:1px solid ButtonBorder;cursor:move;user-select:none;">
        <span id="guard-title" style="flex:1;font-weight:600;">Edit note</span>
        <button onclick="document.querySelector('#guard').requestClose('cancel')" style="border:none;background:none;cursor:pointer;font-size:1.1rem;line-height:1;">✕</button>
      </div>
      <div style="padding:1rem;">
        <div style="display:flex;flex-direction:column;gap:0.25rem;">
          <label for="guard-note" style="font-weight:600;font-size:0.875rem;">Note</label>
          <textarea id="guard-note" rows="5" placeholder="Type something to trigger the guard…"
            style="resize:vertical;padding:0.375rem 0.5rem;border:1px solid ButtonBorder;border-radius:4px;font-size:1rem;font-family:inherit;"></textarea>
        </div>
        <p id="guard-warning" role="alert" style="display:none;font-size:0.8rem;color:#c0392b;margin:0.25rem 0 0;">You have unsaved changes. Save or discard before closing.</p>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:0.5rem;padding:0.75rem 1rem;border-top:1px solid ButtonBorder;">
        <button onclick="document.getElementById('guard-note').value='';document.getElementById('guard-warning').style.display='none';document.querySelector('#guard').close('discard')"
          style="padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">Discard</button>
        <button onclick="document.querySelector('#guard').close('save')"
          style="padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">Save</button>
      </div>
    </dialog>
  </rc-dialog>
</div>
</ClientOnly>

```js
document.querySelector('#guard').addEventListener(
  'rc-dialog-request-close',
  (e) => {
    if (document.getElementById('note').value.trim()) {
      e.preventDefault(); // block the close
    }
  },
  true,
);
```

## Light-dismiss

`closed-by="any"` (Chrome 134+/Safari 18.4+/Firefox 139+) plus `light-dismiss` JS fallback. Click the backdrop or press Escape to dismiss.

<ClientOnly>
<div class="demo-section">
  <button onclick="document.querySelector('#infopanel').showModal()"
    style="padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">
    Open info panel
  </button>
  <rc-dialog id="infopanel" closed-by="any" light-dismiss>
    <dialog aria-labelledby="info-title" aria-describedby="info-body"
      style="padding:0;border:none;border-radius:8px;min-width:26rem;box-shadow:0 4px 32px rgba(0,0,0,0.22);">
      <div style="background:#1a73e8;color:#fff;padding:1rem 1.25rem;font-weight:600;font-size:1.1rem;border-radius:8px 8px 0 0;display:flex;align-items:center;gap:0.5rem;">
        <span aria-hidden="true">ℹ️</span>
        <span id="info-title">Keyboard shortcuts</span>
      </div>
      <div id="info-body" style="background:#f8faff;padding:1.25rem;line-height:1.7;color:#2c3e50;">
        <p style="margin:0 0 0.5rem;"><kbd>Ctrl+K</kbd> — Open command palette</p>
        <p style="margin:0 0 0.5rem;"><kbd>Ctrl+/</kbd> — Toggle sidebar</p>
        <p style="margin:0 0 0.5rem;"><kbd>Ctrl+Shift+P</kbd> — Open settings</p>
        <p style="margin:0;"><kbd>?</kbd> — Show all shortcuts</p>
      </div>
      <div style="font-size:0.8rem;color:#888;text-align:center;padding:0.5rem;border-top:1px solid #e0e6f0;">Click anywhere outside to dismiss</div>
    </dialog>
  </rc-dialog>
</div>
</ClientOnly>

```html
<rc-dialog closed-by="any" light-dismiss>
  <dialog><!-- ... --></dialog>
</rc-dialog>
```

## Events

All `rc-dialog-*` events from the dialogs above (newest first).

<ClientOnly>
<div class="demo-section">
  <pre style="font-size:0.8rem;max-height:10rem;overflow-y:auto;font-family:var(--vp-font-family-mono);margin:0;"><span v-if="!eventLog.length" style="color:var(--vp-c-text-3);">Open a dialog above to see events…</span><span v-for="line in eventLog" :key="line">{{ line }}<br></span></pre>
</div>
</ClientOnly>

## API

<ApiTable tag="rc-dialog" />
