---
'@rcarls/rc-page-turner': minor
'@rcarls/rc-webcomponents': minor
---

Add `@rcarls/rc-page-turner`, a page-turn view for a stack of light-DOM pages
(`<rc-page-turner>` with `<rc-page-turner-page>` children) that follows the
WAI-ARIA APG carousel pattern without automatic rotation.

One page shows at a time. Every page stays connected, so a turn never
rebuilds content, and pages that aren't shown skip their own rendering through
`content-visibility: hidden`. A turn animates only the moving page's
`transform`, through the Web Animations API: forward, the current page swings
away around the inline-start spine and uncovers the next; back, the previous
page swings in over it. The spine follows `dir` and the writing mode. Reduced
motion and forced colors get a short fade instead, and an instant change or an
engine without `Element.animate()` gets none.

`activeIndex`/`defaultActiveIndex` work controlled or uncontrolled, with
`next()`, `previous()`, `goToIndex(index, instant)`, an `rc-page-turner-change`
event, optional previous/next buttons (`navigation`), and inline-axis arrow
keys plus Home/End on the focused viewport. Keys pressed inside page content
are left to the content. Accessibility state changes when a turn starts: the
departing page becomes `inert` and `aria-hidden`, and focus inside it moves to
the arriving page. Built-in text goes through the messages API under
`rc-page-turner`.

`@rcarls/rc-webcomponents` re-exports and registers the new package, with an
`./rc-page-turner` subpath and React and Solid typings.
