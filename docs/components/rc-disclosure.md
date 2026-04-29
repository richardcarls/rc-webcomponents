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

<AtAGlance
  package-name="@rcarls/rc-disclosure"
  tag="rc-disclosure"
  native="Requires native details and summary content"
  state="Controlled or uncontrolled open state"
  :events="['rc-disclosure-toggle']"
  :related="[
    { label: 'Progressive enhancement', href: '/guide/progressive-enhancement' },
    { label: 'rc-accordion', href: '/components/rc-accordion' }
  ]"
/>

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
    <details class="accordion-details">
      <summary class="accordion-summary">
        What is rc-disclosure?
      </summary>
      <div class="accordion-body">
        <p>A lightweight behavioral wrapper around the native <code>&lt;details&gt;</code> element.
        The browser owns open/close behavior and accessibility; this element adds a consistent custom event
        and optional fragment-hash targeting.</p>
      </div>
    </details>
  </rc-disclosure>
  <div class="demo-row" style="margin-top:0.75em;">
    <button @click="openDisclosure">Open</button>
    <button @click="closeDisclosure">Close</button>
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
    <details id="fragment-target" class="accordion-details">
      <summary class="accordion-summary">
        Opens via #fragment-target in URL
      </summary>
      <div class="accordion-body">
        <p>This disclosure opens automatically when the page loads with <code>#fragment-target</code> in the URL, or when the hash changes to match.</p>
      </div>
    </details>
  </rc-disclosure>
  <p style="margin-top:0.75em;"><a href="#fragment-target">Navigate to #fragment-target</a></p>
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
