/**
 * Whether custom states work end to end: an element accepts plain state names
 * and CSS matches them with `:state()`. Chromium 90–124 has a `CustomStateSet`
 * that throws for names without a `--` prefix and has no `:state()` selector,
 * so checking for `states` alone is not enough. Checked on each call, not
 * cached, so it stays correct where `CSS` is missing at import (server
 * rendering) and tests can stub `CSS.supports`.
 */
export function supportsCustomStates(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('selector(:state(x))')
  );
}

/**
 * Adds or removes a custom state, selectable as `:state(name)`, on an element's
 * `ElementInternals`. Does nothing where custom states are unsupported (see
 * {@link supportsCustomStates}). Returns whether the state was applied, so a
 * caller can fall back to another styling hook.
 */
export function setCustomState(
  internals: ElementInternals | undefined,
  name: string,
  active: boolean,
): boolean {
  const states = internals?.states;

  if (!states || !supportsCustomStates()) {
    return false;
  }

  if (active) {
    states.add(name);
  } else {
    states.delete(name);
  }

  return true;
}
