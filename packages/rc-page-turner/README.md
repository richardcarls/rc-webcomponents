# @rcarls/rc-page-turner

Page-turn view for a stack of light-DOM pages: one page at a time, turned with
a compositor-only 3D flip, following the WAI-ARIA APG carousel pattern.

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-page-turner](https://richardcarls.github.io/rc-webcomponents/components/rc-page-turner).

```html
<rc-page-turner navigation aria-label="Recipe steps">
  <rc-page-turner-page><h2>Heat the oven to 350°F.</h2></rc-page-turner-page>
  <rc-page-turner-page><h2>Cream the butter and sugar.</h2></rc-page-turner-page>
</rc-page-turner>
```

Every page stays connected, so a turn never rebuilds content. Pages that
aren't shown skip their rendering with `content-visibility: hidden`, and a
turn animates only the moving page's `transform` through the Web Animations
API. Reduced motion and forced colors get a short fade instead.

`active-index`/`default-active-index` work controlled or uncontrolled, and
`rc-page-turner-change` reports requests from the buttons, the keyboard, and
`next()`, `previous()`, and `goToIndex(index, instant?)`.
