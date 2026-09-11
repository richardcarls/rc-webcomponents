# `@rcarls/rc-adaptive-menu`

Priority-aware action toolbar that preserves authored controls while moving
lower-priority actions into an overflow menu. The same light-DOM nodes remain
connected, so framework handlers, form behavior, dialog invokers, and element
references keep working when an action moves.

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-adaptive-menu](https://richardcarls.github.io/rc-webcomponents/components/rc-adaptive-menu).

## Installation

```bash
npm install @rcarls/rc-adaptive-menu
```

## Usage

```html
<rc-adaptive-menu label="Document actions" max-shown="3">
  <button type="button" data-priority="30">
    <span data-rc-menu-leading aria-hidden="true">★</span>
    <span data-rc-menu-label>Favorite</span>
  </button>
  <button type="button" data-priority="20">
    <span data-rc-menu-leading aria-hidden="true">✎</span>
    <span data-rc-menu-label>Edit</span>
  </button>
  <button type="button" slot="overflow">
    <span data-rc-menu-label>Delete</span>
  </button>
</rc-adaptive-menu>

<script type="module">
  import '@rcarls/rc-adaptive-menu/define';
</script>
```

Larger numeric `data-priority` values are promoted first, with DOM order as the
tie breaker, up to `max-shown` authored actions. Author `slot="overflow"` to
keep an action in the overflow menu regardless of `max-shown`. A negative
`data-priority` has the same effect: the action always overflows. The overflow
menu renders in authored DOM order (native slot distribution isn't
JS-ordered), so author negative-priority actions after normal-priority ones to
have them appear last. `max-shown` is a static declarative cap, re-evaluated
whenever it or an authored action's `data-priority` changes: the component
does not measure its own or its children's rendered size, so promoted actions
are not guaranteed to visually fit any particular container. A consumer that
needs the promoted count to react to available space (a breakpoint, a
container query, a window size class) owns that decision and writes the
resulting `max-shown` value down. When the authored set changes, the
component changes the actions' slot, `role`, and `tabindex`, then restores
the authored values when they return or disconnect. Demoted `rc-menu-button`
actions also receive vertical menu-row orientation while overflowed, with
their authored orientation restored when promoted or disconnected.

In horizontal mode the toolbar is a plain shrink-to-fit flex row:
`max-inline-size: 100%` keeps it constrained by its allocated space, but its
own preferred width is ordinary CSS, sized to only the actions actually
promoted. No JS-computed intrinsic-size hint is involved.

Use `data-rc-menu-leading`, `data-rc-menu-label`,
`data-rc-menu-trailing`, and `data-rc-menu-shortcut` to expose menu content
regions to themes shared with `rc-menu`.

The visible overflow button and its activation area can be sized independently
with `--rc-adaptive-menu-trigger-*` and
`--rc-adaptive-menu-touch-target-*`. The default activation-area floor is
`3rem` in both axes.

Use `default-open` for initial uncontrolled state, or write `open` and handle
`rc-adaptive-menu-toggle` for controlled state. The event reports the state
requested by user interaction; property writes and `openMenu()`, `closeMenu()`,
and `toggleMenu()` calls are silent. The `$actions`, `$promotedActions`, and
`$overflowedActions` getters expose the original nodes in current DOM order.
