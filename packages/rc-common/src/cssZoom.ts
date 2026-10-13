/**
 * Returns the element's effective CSS zoom: the product of its own `zoom` and
 * every ancestor's, such as an app-wide interface size set on the root.
 *
 * Geometry APIs (`getBoundingClientRect()`, pointer `clientX`/`clientY`,
 * `innerWidth`/`innerHeight`) report viewport pixels, while a length written to
 * the element's own style is multiplied by this factor. Divide viewport values
 * by it before writing them as the element's `left`, `top`, `width`, or
 * `height`. Returns 1 where `currentCSSZoom` is unsupported.
 */
export function cssZoom(element: Element): number {
  return (element as Element & { currentCSSZoom?: number }).currentCSSZoom || 1;
}
