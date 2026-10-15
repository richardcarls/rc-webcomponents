/**
 * Returns the element's effective CSS zoom: the product of its own `zoom` and
 * every ancestor's, such as an app-wide interface size set on the root.
 *
 * Geometry APIs (`getBoundingClientRect()`, pointer `clientX`/`clientY`,
 * `innerWidth`/`innerHeight`) report viewport pixels, while a length written to
 * the element's own style is multiplied by this factor. Divide viewport values
 * by it before writing them as the element's `left`, `top`, `width`, or
 * `height`. Where `currentCSSZoom` is unsupported, multiplies the computed
 * zoom of the element and its ancestors, including shadow hosts.
 */
export function cssZoom(element: Element): number {
  const currentZoom = (element as Element & { currentCSSZoom?: number }).currentCSSZoom;

  if (currentZoom && Number.isFinite(currentZoom)) {
    return currentZoom;
  }

  let zoom = 1;
  let current: Element | null = element;

  while (current) {
    const computedZoom = Number.parseFloat(getComputedStyle(current).zoom);

    if (Number.isFinite(computedZoom) && computedZoom > 0) {
      zoom *= computedZoom;
    }

    const root = current.getRootNode();

    current = current.parentElement ?? (root instanceof ShadowRoot ? root.host : null);
  }

  return zoom;
}
