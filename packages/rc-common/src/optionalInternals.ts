/** Attaches ElementInternals where available without preventing older custom elements from upgrading. */
export function optionalInternals(host: HTMLElement, role?: string): ElementInternals | undefined {
  let internals: ElementInternals | undefined;

  try {
    internals = typeof host.attachInternals === 'function' ? host.attachInternals() : undefined;
  } catch {
    // Some embedded engines expose the method before implementing it completely.
  }

  if (!role) {
    return internals;
  }

  if (internals && 'role' in internals) {
    try {
      internals.role = role;

      return internals;
    } catch {
      // A partial implementation may expose the setter without accepting a role.
    }
  }

  // Custom-element constructors may not write host attributes. Defer until upgrade finishes.
  queueMicrotask(() => {
    if (!host.hasAttribute('role')) {
      host.setAttribute('role', role);
    }
  });

  return internals;
}
