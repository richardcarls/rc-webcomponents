# @rcarls/rc-scroller

Design-system-neutral native scroll region with an optional centered content
layout and fullbleed track.

```html
<rc-scroller layout="content" role="region" aria-label="Recipes">
  <header data-rc-scroller-span="fullbleed">Recipes</header>
  <article>Apple pie</article>
</rc-scroller>
```

The custom element host is the native scrollport, so `scrollTop`, `scrollTo()`,
the `scroll` event, scroll restoration, and scroll observers work directly on
`<rc-scroller>`. Give the host a definite block size when it should scroll.

`axis` accepts `block` (the default), `inline`, or `both`. `layout` accepts
`none` (the default) or `content`. In content layout, direct children use the
centered content track; a direct child with
`data-rc-scroller-span="fullbleed"` spans the available inline size.

The component intentionally adds no landmark role, accessible name, or
`tabindex`. Add native semantics to the host when the surrounding document
requires them.

## Scroll-boundary state

`at-block-start`, `at-block-end`, `at-inline-start`, and `at-inline-end` are
reflected, read-only attributes: present when the host is scrolled to (within
a few pixels of) that edge on an enabled axis, or when that axis isn't
scrollable at all (nothing more to reveal counts as already at both of its
edges). Style an edge affordance (a fade, a shadow, a border) from outside
the shadow root by targeting the attribute directly:

```css
rc-scroller[axis='inline'] {
  mask-image: linear-gradient(
    to right,
    transparent,
    black 24px,
    black calc(100% - 24px),
    transparent
  );
}

rc-scroller[axis='inline'][at-inline-start] {
  mask-image: linear-gradient(to right, black calc(100% - 24px), transparent);
}

rc-scroller[axis='inline'][at-inline-end] {
  mask-image: linear-gradient(to right, transparent, black 24px);
}
```

The component only tracks and reflects this state: it makes no visual
decision of its own about how (or whether) to show it.

Import `@rcarls/rc-scroller` to use the class without registering it, or import
`@rcarls/rc-scroller/define` to register `<rc-scroller>`.
