import { cssText, defineLightDomBaseStyles } from '@rcarls/rc-common';

/**
 * Light-DOM base styles for the accordion group box.
 *
 * The panels themselves are not styled here. Both supported child forms, a
 * native `<details>` directly inside `rc-accordion` and one wrapped in
 * `rc-disclosure`, consume the shared `--rc-disclosure-*` properties through the
 * recipe that `rc-disclosure` installs, so there is no parallel accordion-panel
 * vocabulary to keep in step.
 */
export const ACCORDION_BASE_CSS = cssText`
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

/** Installs the accordion group styles once per containing root. */
export const ensureAccordionBaseStyles: (root: Document | ShadowRoot) => void =
  defineLightDomBaseStyles('rc-accordion', ACCORDION_BASE_CSS);
