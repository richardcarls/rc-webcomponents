<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  document.addEventListener('rc-disclosure-toggle', (e) => {
    console.log('rc-disclosure-toggle:', e.detail);
  });
});

function openDisclosure() {
  document.getElementById('basic-disclosure').open = true;
}
function closeDisclosure() {
  document.getElementById('basic-disclosure').open = false;
}
</script>

# rc-disclosure

A behavioral wrapper around the native `<details>`/`<summary>` element. Adds a consistent `rc-disclosure-toggle` event and optional fragment-hash targeting. The browser owns all open/close behavior and accessibility.

[WAI-ARIA Disclosure Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-disclosure
```

```sh [yarn]
yarn add @rcarls/rc-disclosure
```

:::

```js
import '@rcarls/rc-disclosure/define';
```

## Basic disclosure

Wraps a native `<details>` element and fires `rc-disclosure-toggle` on open/close. Control it programmatically via the `open` property.

<ClientOnly>
<div class="demo-section">
  <rc-disclosure id="basic-disclosure">
    <details style="border:1px solid ButtonBorder;border-radius:4px;padding:0;max-width:480px;">
      <summary style="padding:0.6em 1em;cursor:pointer;font-weight:500;list-style:none;display:flex;justify-content:space-between;align-items:center;user-select:none;">
        What is rc-disclosure?
        <span aria-hidden="true" style="font-size:0.8em;">▸</span>
      </summary>
      <div style="padding:0.75em 1em;border-top:1px solid ButtonBorder;">
        <p style="margin:0;">A lightweight behavioral wrapper around the native <code>&lt;details&gt;</code> element.
        The browser owns open/close behavior and accessibility; this element adds a consistent custom event
        and optional fragment-hash targeting.</p>
      </div>
    </details>
  </rc-disclosure>
  <div style="display:flex;gap:0.5em;margin-top:0.75em;">
    <button @click="openDisclosure"
      style="padding:0.35em 0.75em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">Open</button>
    <button @click="closeDisclosure"
      style="padding:0.35em 0.75em;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">Close</button>
  </div>
</div>
</ClientOnly>

```html
<rc-disclosure id="my-disclosure">
  <details>
    <summary>Toggle me</summary>
    <div>Content revealed on open.</div>
  </details>
</rc-disclosure>
```

```js
// Programmatic control
document.getElementById('my-disclosure').open = true;

// Event
document.addEventListener('rc-disclosure-toggle', (e) => {
  console.log(e.detail); // { open: true }
});
```

## Fragment targeting

Set the `fragment` attribute to automatically open when the URL hash matches the `id` of the inner `<details>`. Useful for deep-linking to FAQ entries or documentation sections.

<ClientOnly>
<div class="demo-section">
  <rc-disclosure fragment>
    <details id="fragment-target" style="border:1px solid ButtonBorder;border-radius:4px;padding:0;max-width:480px;">
      <summary style="padding:0.6em 1em;cursor:pointer;font-weight:500;list-style:none;display:flex;justify-content:space-between;align-items:center;user-select:none;">
        Opens via #fragment-target in URL
        <span aria-hidden="true" style="font-size:0.8em;">▸</span>
      </summary>
      <div style="padding:0.75em 1em;border-top:1px solid ButtonBorder;">
        <p style="margin:0;">This disclosure opens automatically when the page loads with <code>#fragment-target</code> in the URL, or when the hash changes to match.</p>
      </div>
    </details>
  </rc-disclosure>
  <div style="margin-top:0.75em;">
    <a href="#fragment-target" style="font-size:0.875rem;">Navigate to #fragment-target</a>
  </div>
</div>
</ClientOnly>

```html
<rc-disclosure fragment>
  <details id="my-section">
    <summary>Opens on #my-section</summary>
    <div>Deep-linked content.</div>
  </details>
</rc-disclosure>
```

## API

<ApiTable tag="rc-disclosure" />
