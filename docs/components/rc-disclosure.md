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

A behavioral wrapper around the native [WAI-ARIA Disclosure Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) with the `<details>`/`<summary>` element. Enhances the native `<details>` with a consistent `rc-disclosure-toggle` toggle event and implements automatic fragment-hash targeting (opens the disclosure to reveal target).

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

## Usage

Wrap a native `<details>` element. Control it programmatically via the `open` property and listen for `rc-disclosure-toggle` events.

<ClientOnly>
<div class="demo-section">
  <rc-disclosure id="basic-disclosure">
    <details>
      <summary>
        Heading
      </summary>
      <div>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit a beatae, similique perspiciatis error esse voluptatem cumque voluptas animi excepturi!</p>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Harum, nobis.</p>
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
    <summary>Heading</summary>

    Panel content.
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

## Text fragment targeting

`rc-disclosure` automatically opens and scrolls into view when the URL hash matches any `id` within its subtree. This is analogous to the native browser behavior of `hidden="until-found"`, revealing matched text hidden inside a closed `<details>` when a user invokes find-in-page.

<ClientOnly>
<div class="demo-section">
  <rc-disclosure>
    <details id="fragment-target">
      <summary>
        Opens via #fragment-target in URL
      </summary>
      <div>
        <p>This disclosure opens automatically when the page loads with <code>#fragment-target</code> in the URL, or when the hash changes to match.</p>
      </div>
    </details>
  </rc-disclosure>
  <p style="margin-top:0.75em;"><a href="#fragment-target">Navigate to #fragment-target</a></p>
</div>
</ClientOnly>

```html
<rc-disclosure>
  <details id="my-section">
    <summary>Opens on #my-section</summary>

    Panel content.
  </details>
</rc-disclosure>
```

## Integrating into your design system

### Material Design

`@rcarls/rc-theme-material` styles both plain `<details>` children and `rc-disclosure`-wrapped panels.

See [Theme previews](/guide/theme-previews) for integration details.

## API

<ApiTable tag="rc-disclosure" />
