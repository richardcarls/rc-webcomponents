import type { PropertyValues, ReactiveElement } from 'lit';

/**
 * Adds every `useDefault` property to the first update's changed map.
 *
 * A reflected property declared with `useDefault: true` keeps its default
 * value off the host attribute, so a DOM morph that strips attributes cannot
 * remove it, and removing the attribute restores the default. Lit also leaves
 * the initial value out of the first update's changed map, so first-render
 * logic keyed on `changed.has(name)` would skip it. Call this at the start of
 * `willUpdate()`; Lit passes the same map to `update()` and `updated()`.
 */
export function includeDefaults(host: ReactiveElement, changed: PropertyValues): void {
  if (host.hasUpdated) {
    return;
  }

  const ctor = host.constructor as typeof ReactiveElement;

  for (const [name, options] of ctor.elementProperties) {
    if (options.useDefault && !changed.has(name)) {
      (changed as Map<PropertyKey, unknown>).set(name, undefined);
    }
  }
}
