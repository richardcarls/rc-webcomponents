# @rcarls/rc-carousel

A swipe-driven slide carousel following the [WAI-ARIA APG Carousel
pattern](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/), built on native
CSS scroll-snap. `rc-carousel` is the track and chrome; `rc-carousel-item`
is the slide wrapper, keeping authored light-DOM content directly available
to assistive technology.

```html
<rc-carousel navigation pagination loop aria-label="Recipe photos">
  <rc-carousel-item><img src="/pie.jpg" alt="Apple pie, sliced" /></rc-carousel-item>
  <rc-carousel-item><img src="/risotto.jpg" alt="Mushroom risotto" /></rc-carousel-item>
</rc-carousel>
```

Give the host a definite `inline-size`/`block-size` (`navigation` and
`pagination` are absolutely positioned over the track).

`active-index`/`default-active-index` follow this monorepo's controlled/
uncontrolled property convention; settling reports the new index via
`rc-carousel-change` (`detail: { index, trigger }`). `loop` wraps
seamlessly past the first/last slide via cloned lead/trail slides, rather
than a discontinuous index jump. `variant="hero"` (default) shows one slide
at a time; `variant="multi-browse"` peeks several. `mouse-dragging` adds
desktop click-and-drag scrolling, with drag-vs-click disambiguation so
interactive slide content stays clickable.

Navigation and pagination buttons use `aria-disabled`, never native
`disabled`, so a boundary stays Tab-reachable. Off-screen and peeking
slides get `aria-hidden`/`inert` via an `IntersectionObserver`. The picker
is APG's "grouped" (non-tab) style, deliberately not `role="tablist"`.

See the [full documentation](https://richardcarls.github.io/rc-webcomponents/components/rc-carousel)
for the complete API, accessibility notes, and live demo.

Import `@rcarls/rc-carousel` to use the classes without registering them, or
import `@rcarls/rc-carousel/define` to register `<rc-carousel>` and
`<rc-carousel-item>`.
