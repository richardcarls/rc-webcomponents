import type { RCDisclosureToggleEvent } from '@rcarls/rc-disclosure';
import type { RCDisclosure } from '@rcarls/rc-disclosure';

declare global {
  interface HTMLElementTagNameMap {
    'rc-accordion': RCAccordion;
  }
}

/**
 * Coordinates direct child disclosures so only one stays open at a time.
 *
 * Child disclosures remain light-DOM behavioral wrappers around native
 * `<details>` elements. The accordion only adds group behavior and optional
 * arrow-key navigation between summaries.
 */
export class RCAccordion extends HTMLElement {
  connectedCallback(): void {
    this.addEventListener('rc-disclosure-toggle', this._onDisclosureToggle as EventListener);
    this.addEventListener('keydown', this._onKeydown);
    this._syncNativeGroupNames();
  }

  disconnectedCallback(): void {
    this.removeEventListener('rc-disclosure-toggle', this._onDisclosureToggle as EventListener);
    this.removeEventListener('keydown', this._onKeydown);
  }

  private _details(): HTMLDetailsElement[] {
    return Array.from(
      this.querySelectorAll<HTMLDetailsElement>(':scope > rc-disclosure > details'),
    );
  }

  private _summaries(): HTMLElement[] {
    return this._details()
      .map((details) => details.querySelector<HTMLElement>(':scope > summary'))
      .filter((summary): summary is HTMLElement => summary !== null);
  }

  private _syncNativeGroupNames(): void {
    const name = this.getAttribute('name');
    if (!name) return;

    for (const details of this._details()) {
      if (!details.hasAttribute('name')) details.setAttribute('name', name);
    }
  }

  private _onKeydown = (e: KeyboardEvent): void => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;

    const summaries = this._summaries();
    if (summaries.length === 0) return;

    const active = document.activeElement as HTMLElement | null;
    const idx = active ? summaries.indexOf(active) : -1;
    if (idx === -1) return;

    e.preventDefault();

    if (e.key === 'Home') {
      summaries[0].focus();
      return;
    }

    if (e.key === 'End') {
      summaries[summaries.length - 1].focus();
      return;
    }

    const next = e.key === 'ArrowDown'
      ? (idx + 1) % summaries.length
      : (idx - 1 + summaries.length) % summaries.length;

    summaries[next].focus();
  };

  private _onDisclosureToggle = (e: CustomEvent<RCDisclosureToggleEvent>): void => {
    if (!e.detail.open) return;

    const opened = e.target;
    for (const disclosure of this.querySelectorAll<RCDisclosure>(':scope > rc-disclosure')) {
      if (disclosure !== opened) disclosure.open = false;
    }
  };
}

export default RCAccordion;
