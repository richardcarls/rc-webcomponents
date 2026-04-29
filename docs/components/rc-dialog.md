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

<AtAGlance
  package-name="@rcarls/rc-dialog"
  tag="rc-dialog"
  native="Requires a native dialog child"
  state="Open state follows the native dialog"
  :events="['rc-dialog-open', 'rc-dialog-toggle', 'rc-dialog-request-close', 'rc-dialog-cancel', 'rc-dialog-close']"
  :related="[
    { label: 'Progressive enhancement', href: '/guide/progressive-enhancement' },
    { label: 'rc-disclosure', href: '/components/rc-disclosure' }
  ]"
/>

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
  <button onclick="document.querySelector('#basic').showModal()">Open dialog</button>
  <rc-dialog id="basic">
    <dialog aria-labelledby="basic-title">
      <div class="dlg-titlebar">
        <span id="basic-title">Basic Dialog</span>
        <button class="dlg-close" onclick="document.querySelector('#basic').close()" aria-label="Close">✕</button>
      </div>
      <div class="dlg-body"><p>Press <kbd>Escape</kbd> or click a button to close.</p></div>
      <div class="dlg-footer">
        <button onclick="document.querySelector('#basic').close('cancel')">Cancel</button>
        <button onclick="document.querySelector('#basic').close('ok')">OK</button>
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
      <button class="dlg-close" onclick="document.querySelector('#dlg').close()">✕</button>
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
  <button onclick="document.querySelector('#movable').showModal()">Open movable dialog</button>
  <rc-dialog id="movable" movable move-handle=".dlg-titlebar">
    <dialog aria-labelledby="movable-title">
      <div class="dlg-titlebar movable">
        <span id="movable-title">Movable Dialog</span>
        <button class="dlg-close" onclick="document.querySelector('#movable').close()" aria-label="Close">✕</button>
      </div>
      <div class="dlg-body"><p>Drag the titlebar or use arrow keys (with titlebar focused) to reposition.</p></div>
      <div class="dlg-footer">
        <button onclick="document.querySelector('#movable').close('ok')">OK</button>
      </div>
    </dialog>
  </rc-dialog>
</div>
</ClientOnly>

```html
<rc-dialog movable move-handle=".dlg-titlebar">
  <dialog>
    <div class="dlg-titlebar movable"><!-- drag handle --></div>
    <!-- ... -->
  </dialog>
</rc-dialog>
```

## Movable + resizable dialog

Add `resize="both"` to allow dragging any edge or corner. While the resize handle is focused, arrow keys resize (Shift = 10× step).

<ClientOnly>
<div class="demo-section">
  <button onclick="document.querySelector('#resizable').showModal()">Open resizable dialog</button>
  <rc-dialog id="resizable" movable move-handle=".dlg-titlebar" resize="both">
    <dialog aria-labelledby="resizable-title" style="min-height:10rem;">
      <div class="dlg-titlebar movable">
        <span id="resizable-title">Resizable Dialog</span>
        <button class="dlg-close" onclick="document.querySelector('#resizable').close()" aria-label="Close">✕</button>
      </div>
      <div class="dlg-body" style="flex:1;overflow:auto;min-height:0;"><p>Drag any edge or corner to resize.</p></div>
      <div class="dlg-footer">
        <button onclick="document.querySelector('#resizable').close('ok')">OK</button>
      </div>
    </dialog>
  </rc-dialog>
</div>
</ClientOnly>

```html
<rc-dialog movable move-handle=".dlg-titlebar" resize="both">
  <dialog style="min-height: 10rem;">
    <!-- ... -->
  </dialog>
</rc-dialog>
```

## Minimal dialog (no titlebar)

A card-style dialog with an overlaid close button. No structural titlebar or footer divs required.

<ClientOnly>
<div class="demo-section">
  <button onclick="document.querySelector('#minimal').showModal()">Open minimal dialog</button>
  <rc-dialog id="minimal">
    <dialog aria-labelledby="minimal-title" aria-describedby="minimal-desc"
      style="padding:2rem;border-radius:12px;min-width:22rem;max-width:32rem;box-shadow:0 8px 40px rgba(0,0,0,0.18);position:relative;">
      <button class="dlg-close" onclick="document.querySelector('#minimal').close()" aria-label="Close"
        style="position:absolute;top:0.5rem;right:0.5rem;">✕</button>
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
    <button class="dlg-close" onclick="document.querySelector('#dlg').close()" aria-label="Close"
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
  <button onclick="document.querySelector('#alert-dlg').showModal()">Delete item…</button>
  <rc-dialog id="alert-dlg">
    <dialog role="alertdialog" aria-labelledby="alert-title" aria-describedby="alert-desc">
      <div class="dlg-titlebar">
        <span id="alert-title">Delete item?</span>
      </div>
      <div class="dlg-body" style="text-align:center;">
        <div style="font-size:2.5rem;margin-bottom:0.5rem;" aria-hidden="true">⚠️</div>
        <p id="alert-desc">This will permanently delete the item and cannot be undone.</p>
      </div>
      <div class="dlg-footer">
        <button onclick="document.querySelector('#alert-dlg').close('cancel')">Cancel</button>
        <button onclick="document.querySelector('#alert-dlg').close('delete')"
          style="background:#c0392b;color:#fff;border-color:#c0392b;">Delete</button>
      </div>
    </dialog>
  </rc-dialog>
</div>
</ClientOnly>

```html
<rc-dialog id="alert-dlg">
  <dialog role="alertdialog" aria-labelledby="alert-title" aria-describedby="alert-desc">
    <div class="dlg-titlebar"><span id="alert-title">Delete item?</span></div>
    <div class="dlg-body">
      <p id="alert-desc">This action cannot be undone.</p>
    </div>
    <div class="dlg-footer">
      <button onclick="document.querySelector('#alert-dlg').close('cancel')">Cancel</button>
      <button onclick="document.querySelector('#alert-dlg').close('delete')">Delete</button>
    </div>
  </dialog>
</rc-dialog>
```

## Form dialog

Uses `<form method="dialog">`. Submitting closes the dialog and sets `returnValue`.

<ClientOnly>
<div class="demo-section">
  <button onclick="document.querySelector('#formdlg').showModal()">Open form dialog</button>
  <rc-dialog id="formdlg">
    <dialog aria-labelledby="form-title" style="min-width:24rem;">
      <div class="dlg-titlebar">
        <span id="form-title">New contact</span>
        <button class="dlg-close" formmethod="dialog" form="contact-form" value="cancel" aria-label="Close">✕</button>
      </div>
      <div class="dlg-body">
        <form id="contact-form" method="dialog">
          <div>
            <label for="contact-name">Name</label>
            <input id="contact-name" name="name" type="text" placeholder="Jane Smith">
          </div>
          <div>
            <label for="contact-email">Email</label>
            <input id="contact-email" name="email" type="email" placeholder="jane@example.com">
          </div>
        </form>
      </div>
      <div class="dlg-footer">
        <button formmethod="dialog" form="contact-form" value="cancel">Cancel</button>
        <button type="submit" form="contact-form" value="save">Save</button>
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
  <button onclick="document.querySelector('#guard').showModal()">Open with guard</button>
  <rc-dialog id="guard" movable move-handle=".dlg-titlebar">
    <dialog aria-labelledby="guard-title" style="min-width:22rem;">
      <div class="dlg-titlebar movable">
        <span id="guard-title">Edit note</span>
        <button class="dlg-close" onclick="document.querySelector('#guard').requestClose('cancel')" aria-label="Close">✕</button>
      </div>
      <div class="dlg-body">
        <div>
          <label for="guard-note">Note</label>
          <textarea id="guard-note" rows="5" placeholder="Type something to trigger the guard…"></textarea>
        </div>
        <p id="guard-warning" role="alert" style="display:none;font-size:0.8rem;color:#c0392b;margin:0.25rem 0 0;">You have unsaved changes. Save or discard before closing.</p>
      </div>
      <div class="dlg-footer">
        <button onclick="document.getElementById('guard-note').value='';document.getElementById('guard-warning').style.display='none';document.querySelector('#guard').close('discard')">Discard</button>
        <button onclick="document.querySelector('#guard').close('save')">Save</button>
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
  <button onclick="document.querySelector('#infopanel').showModal()">Open info panel</button>
  <rc-dialog id="infopanel" closed-by="any" light-dismiss>
    <dialog aria-labelledby="info-title" aria-describedby="info-body"
      style="padding:0;border:none;border-radius:8px;min-width:26rem;box-shadow:0 4px 32px rgba(0,0,0,0.22);">
      <div class="info-header">
        <span aria-hidden="true">ℹ️</span>
        <span id="info-title">Keyboard shortcuts</span>
      </div>
      <div class="info-body" id="info-body">
        <p><kbd>Ctrl+K</kbd> — Open command palette</p>
        <p><kbd>Ctrl+/</kbd> — Toggle sidebar</p>
        <p><kbd>Ctrl+Shift+P</kbd> — Open settings</p>
        <p><kbd>?</kbd> — Show all shortcuts</p>
      </div>
      <div class="info-footer">Click anywhere outside to dismiss</div>
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
