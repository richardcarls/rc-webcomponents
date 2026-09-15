/**
 * Light-DOM base styles for the accordion group box.
 *
 * The panels themselves are not styled here. Both supported child forms, a
 * native `<details>` directly inside `rc-accordion` and one wrapped in
 * `rc-disclosure`, consume the shared `--rc-disclosure-*` properties through the
 * recipe that `rc-disclosure` installs, so there is no parallel accordion-panel
 * vocabulary to keep in step.
 */
export const ACCORDION_BASE_CSS = `
@layer rc-base {
  rc-accordion {
    display: grid;
    gap: var(--rc-accordion-gap, 0);
  }

  rc-accordion > rc-disclosure {
    display: block;
  }
}
`;

const styledRoots = new WeakSet<Document | ShadowRoot>();

/** Installs the accordion group styles once per containing root. */
export function ensureAccordionBaseStyles(root: Document | ShadowRoot): void {
  if (styledRoots.has(root)) {
    return;
  }

  styledRoots.add(root);

  const $style = (root instanceof Document ? root : root.ownerDocument).createElement('style');

  $style.setAttribute('data-rc-light-dom-base', 'rc-accordion');
  $style.textContent = ACCORDION_BASE_CSS;

  if (root instanceof Document) {
    root.head.append($style);
  } else {
    root.append($style);
  }
}
