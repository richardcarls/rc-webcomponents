/**
 * Adds or removes a custom state, selectable as `:state(name)`, on an element's
 * `ElementInternals`. Does nothing where the browser has no `CustomStateSet`.
 */
export function setCustomState(internals: ElementInternals, name: string, active: boolean): void {
  const states = internals.states;

  if (!states) {
    return;
  }

  if (active) {
    states.add(name);
  } else {
    states.delete(name);
  }
}
