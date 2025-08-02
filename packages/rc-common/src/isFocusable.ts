export type FocusableElement =
  | HTMLAnchorElement
  | HTMLAreaElement
  | HTMLButtonElement
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

/**
 * Returns true if `el` is a natively focusable element or a custom element
 * that opts in to keyboard navigation via `tabindex`.
 *
 * Note: does not check `tabindex >= 0` because rc-common components mutate
 * tabindex values during roving-tabindex management — any `tabindex` attribute
 * presence is sufficient signal.
 */
export function isFocusable(el?: Element | null): el is FocusableElement {
  if (el == null) return false;

  if (el.hasAttribute('disabled')) return false;

  if (
    (el instanceof HTMLAnchorElement || el instanceof HTMLAreaElement) &&
    el.hasAttribute('href')
  ) {
    return true;
  }

  if (
    el instanceof HTMLButtonElement ||
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  ) {
    return true;
  }

  if (el.hasAttribute('tabindex')) return true;

  // Custom elements that declare delegatesFocus on their shadow root are
  // focusable — the browser delegates focus() to their first focusable
  // shadow/slotted descendant, making the host a valid roving-tabindex item.
  if (el.shadowRoot?.delegatesFocus === true) return true;

  return false;
}
