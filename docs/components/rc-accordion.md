# rc-accordion

Implements the [WAI-ARIA Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) by coordinating child `<details>` panels.

Also supports [`rc-disclosure`](/components/rc-disclosure) for granular control and fragment-target.

<AtAGlance
  package-name="@rcarls/rc-accordion"
  tag="rc-accordion"
  native="Coordinates native details panels"
  state="Single or multiple open panels"
  :events="[]"
  :related="[
    { label: 'rc-disclosure', href: '/components/rc-disclosure' }
  ]"
/>

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-accordion
```

```sh [yarn]
yarn add @rcarls/rc-accordion
```

:::

```js
import '@rcarls/rc-accordion/define';
```

## Single-open accordion (default)

Classic accordion behavior: opening one panel closes the previously open sibling.

::: raw
<ClientOnly>
<div class="demo-section">
  <rc-accordion name="single-open-example">
    <details open>
      <summary>Heading 1</summary>
      <div>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit a beatae, similique perspiciatis error esse voluptatem cumque voluptas animi excepturi!</p>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Harum, nobis.</p>
      </div>
    </details>
    <details>
      <summary>Heading 2</summary>
      <div>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit a beatae, similique perspiciatis error esse voluptatem cumque voluptas animi excepturi!</p>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Harum, nobis.</p>
      </div>
    </details>
    <details>
      <summary>Heading 3</summary>
      <div>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit a beatae, similique perspiciatis error esse voluptatem cumque voluptas animi excepturi!</p>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Harum, nobis.</p>
      </div>
    </details>
  </rc-accordion>
</div>
</ClientOnly>
:::

```html
<rc-accordion name="accordion-1">
  <details open>
    <summary>Heading 1</summary>

    Panel content.
  </details>

  <details>
    <summary>Heading 2</summary>

    Panel content.
  </details>

  <details>
    <summary>Heading 3</summary>

    Panel content.
  </details>
</rc-accordion>
```

### Native group name behavior

In single-open mode, the accordion `name` attribute is applied to child `<details>` elements that do not already have one, enabling the browser's built-in exclusive-open behavior. [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/details#name)

The component polyfills this behavior if not natively supported on the client.

## Multiple-open accordion

Add `multiple` when panels should open and close independently.

<ClientOnly>
<div class="demo-section">
  <rc-accordion multiple>
    <details open>
      <summary>Heading 1</summary>
      <div>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit a beatae, similique perspiciatis error esse voluptatem cumque voluptas animi excepturi!</p>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Harum, nobis.</p>
      </div>
    </details>
    <details open>
      <summary>Heading 2</summary>
      <div>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit a beatae, similique perspiciatis error esse voluptatem cumque voluptas animi excepturi!</p>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Harum, nobis.</p>
      </div>
    </details>
  </rc-accordion>
</div>
</ClientOnly>

```html
<rc-accordion multiple>
  <details open>
    <summary>Heading 1</summary>

    Panel content.
  </details>

  <details open>
    <summary>Heading 2</summary>

    Panel content.
  </details>
</rc-accordion>
```

## With rc-disclosure

Wrap each panel in `rc-disclosure` for more granular control of the accordion.

Any disclosure automatically opens and scrolls when the URL hash matches an id within it. [Try it](#fragment-example).

<ClientOnly>
<div class="demo-section">
  <rc-accordion name="rc-disclosure-example">
    <rc-disclosure>
      <details open>
        <summary>Heading 1</summary>
        <div>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit a beatae, similique perspiciatis error esse voluptatem cumque voluptas animi excepturi!</p>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Harum, nobis.</p>
        </div>
      </details>
    </rc-disclosure>
    <rc-disclosure>
      <details id="fragment-example">
        <summary>Fragment Example</summary>
        <div>
          <p>This panel opens automatically when the URL hash matches <a href="#fragment-example">#fragment-example</a>.</p>
        </div>
      </details>
    </rc-disclosure>
    <rc-disclosure>
      <details>
        <summary>Heading 3</summary>
        <div>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Sit a beatae, similique perspiciatis error esse voluptatem cumque voluptas animi excepturi!</p>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Harum, nobis.</p>
        </div>
      </details>
    </rc-disclosure>
  </rc-accordion>
</div>
</ClientOnly>

```html
<rc-accordion name="rc-disclosure-example">
  <rc-disclosure>
    <details id="fragment-1" open>
      <summary>Heading 1</summary>

      Panel content.
    </details>
  </rc-disclosure>
  <rc-disclosure>
    <details id="fragment-2">
      <summary>Heading 2</summary>

      Panel content.
    </details>
  </rc-disclosure>
  <rc-disclosure>
    <details id="fragment-3">
      <summary>Heading 3</summary>

      Panel content.
    </details>
  </rc-disclosure>
</rc-accordion>
```

## Integrating into your design system

### Material Design

`@rcarls/rc-theme-material` styles both plain `<details>` children and `rc-disclosure`-wrapped panels.

See [Theme previews](/guide/theme-previews) for integration details.

## API

<ApiTable tag="rc-accordion" />
