const litDevModeWarning =
  'Lit is in dev mode. Not recommended for production! See https://lit.dev/msg/dev-mode for more information.';
const litGlobals = globalThis as typeof globalThis & { litIssuedWarnings?: Set<string> };

litGlobals.litIssuedWarnings ??= new Set<string>();
litGlobals.litIssuedWarnings.add(litDevModeWarning);
