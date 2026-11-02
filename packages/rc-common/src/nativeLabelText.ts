/** A native control that `<label>` elements can name. */
export type LabelableControl =
  | HTMLInputElement
  | HTMLSelectElement
  | HTMLTextAreaElement
  | HTMLButtonElement
  | HTMLOutputElement
  | HTMLMeterElement
  | HTMLProgressElement;

/**
 * Returns the text that names a native control, for copying onto a shadow-DOM
 * surface that stands in for it: the control's `aria-label`, else the joined
 * text of its `<label>` elements, excluding the control's own subtree.
 * Returns `undefined` when neither names it.
 *
 * An ID reference cannot cross into a shadow root, so a stand-in surface copies
 * the text as its own `aria-label` instead of pointing `aria-labelledby` at the
 * light-DOM label.
 */
export function nativeLabelText($control?: LabelableControl | null): string | undefined {
  if (!$control) {
    return undefined;
  }

  const ariaLabel = $control.getAttribute('aria-label')?.trim();

  if (ariaLabel) {
    return ariaLabel;
  }

  const labelText = Array.from($control.labels ?? [])
    .map(($label) => textOutsideControl($label, $control).trim())
    .filter(Boolean)
    .join(' ');

  return labelText || undefined;
}

/** Omits a wrapped control's initial text and options without modifying the author's DOM. */
function textOutsideControl($node: Node, $control: LabelableControl): string {
  if ($node === $control) {
    return '';
  }

  if ($node.nodeType === 3) {
    return $node.textContent ?? '';
  }

  return Array.from($node.childNodes, ($child) => textOutsideControl($child, $control)).join('');
}
