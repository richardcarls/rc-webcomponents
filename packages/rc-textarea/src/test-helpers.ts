import type { RCTextarea } from './rc-textarea.ts';

// ─── Shadow DOM helpers ────────────────────────────────────────────────────────

export function getMirror(host: RCTextarea): HTMLDivElement {
  return host.shadowRoot!.querySelector('#mirror') as HTMLDivElement;
}

export function getGutter(host: RCTextarea): HTMLDivElement {
  return host.shadowRoot!.querySelector('#gutter') as HTMLDivElement;
}

export function getLineNumbers(host: RCTextarea): HTMLDivElement {
  return host.shadowRoot!.querySelector('#line-numbers') as HTMLDivElement;
}

export function getDiagnosticStatus(host: RCTextarea): HTMLDivElement {
  return host.shadowRoot!.querySelector('#diagnostic-status') as HTMLDivElement;
}

export function getSlottedTextarea(host: RCTextarea): HTMLTextAreaElement {
  return host.querySelector('textarea') as HTMLTextAreaElement;
}

/** Wait one animation frame for _performUpdate to run. */
export function waitRAF(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
