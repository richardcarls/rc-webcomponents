# rc-accordion

Coordinates a group of `rc-disclosure` widgets so only one stays open at a time. Manages keyboard navigation between summaries (Arrow keys, Home, End) and copies its `name` attribute to child `<details>` elements that don't already have one.

[WAI-ARIA Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)

<AtAGlance
  package-name="@rcarls/rc-accordion"
  tag="rc-accordion"
  native="Coordinates rc-disclosure panels"
  state="Open panel coordination"
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

## Single-open accordion

`rc-accordion` coordinates direct child disclosures so only one stays open at a time. Opening one panel closes the previously open sibling.

<ClientOnly>
<div class="demo-section">
  <rc-accordion name="profile-settings">
    <rc-disclosure open>
      <details class="accordion-details" open>
        <summary class="accordion-summary">Account<span aria-hidden="true">▸</span></summary>
        <div class="accordion-body">
          <p>Account details stay in native disclosure markup and remain usable before custom elements upgrade.</p>
        </div>
      </details>
    </rc-disclosure>
    <rc-disclosure>
      <details class="accordion-details">
        <summary class="accordion-summary">Notifications<span aria-hidden="true">▸</span></summary>
        <div class="accordion-body">
          <p>Opening this panel closes the previously open sibling disclosure.</p>
        </div>
      </details>
    </rc-disclosure>
    <rc-disclosure>
      <details class="accordion-details">
        <summary class="accordion-summary">Privacy<span aria-hidden="true">▸</span></summary>
        <div class="accordion-body">
          <p>Arrow keys, Home, and End move focus between summaries when focus is inside the accordion.</p>
        </div>
      </details>
    </rc-disclosure>
  </rc-accordion>
</div>
</ClientOnly>

```html
<rc-accordion name="settings">
  <rc-disclosure open>
    <details open>
      <summary>Account</summary>
      <div>Account content.</div>
    </details>
  </rc-disclosure>
  <rc-disclosure>
    <details>
      <summary>Notifications</summary>
      <div>Notification settings.</div>
    </details>
  </rc-disclosure>
  <rc-disclosure>
    <details>
      <summary>Privacy</summary>
      <div>Privacy controls.</div>
    </details>
  </rc-disclosure>
</rc-accordion>
```

## Native group name

The accordion `name` attribute is copied to child `<details>` elements that do not already have one, enabling the browser's built-in exclusive-open behavior (Chrome 120+). Panels with an existing author-provided `name` keep their own name.

<ClientOnly>
<div class="demo-section">
  <rc-accordion name="faq">
    <rc-disclosure>
      <details class="accordion-details">
        <summary class="accordion-summary">Does this replace details?<span aria-hidden="true">▸</span></summary>
        <div class="accordion-body">
          <p>No. The native <code>&lt;details&gt;</code> elements remain the interactive controls.</p>
        </div>
      </details>
    </rc-disclosure>
    <rc-disclosure>
      <details class="accordion-details" name="custom-faq">
        <summary class="accordion-summary">Can a panel keep its own name?<span aria-hidden="true">▸</span></summary>
        <div class="accordion-body">
          <p>Yes. Existing author-provided names are preserved. This panel has <code>name="custom-faq"</code>.</p>
        </div>
      </details>
    </rc-disclosure>
  </rc-accordion>
</div>
</ClientOnly>

```html
<!-- The accordion's name="faq" flows to child <details> without a name -->
<rc-accordion name="faq">
  <rc-disclosure>
    <details><!-- gets name="faq" --></details>
  </rc-disclosure>
  <rc-disclosure>
    <details name="custom-faq"><!-- keeps its own name --></details>
  </rc-disclosure>
</rc-accordion>
```

## API

<ApiTable tag="rc-accordion" />
