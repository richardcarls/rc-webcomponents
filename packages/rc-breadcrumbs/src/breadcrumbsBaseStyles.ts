import { cssText, defineLightDomBaseStyles } from '@rcarls/rc-common';

/**
 * Light-DOM base styles for the breadcrumb trail.
 *
 * The consumer's `<nav>`, list, and links stay in light DOM, where shadow
 * styles cannot reach them. These rules lay the list out as a wrapping inline
 * row and draw each separator in CSS, so the separators never enter the
 * accessibility tree or the text content. Defaults stay close to a plain list
 * of links: no colors, no decoration beyond the separator.
 */
export const BREADCRUMBS_BASE_CSS = cssText`
@layer rc-base {
  rc-breadcrumbs {
    display: block;
  }

  rc-breadcrumbs > nav > ol {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--rc-breadcrumbs-gap, 0.5em);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  rc-breadcrumbs > nav > ol > li {
    display: inline-flex;
    align-items: center;
    gap: var(--rc-breadcrumbs-gap, 0.5em);
  }

  rc-breadcrumbs > nav > ol > li + li::before {
    content: var(--rc-breadcrumbs-separator, '/') / '';
    color: var(--rc-breadcrumbs-separator-color, currentColor);
  }

  rc-breadcrumbs [aria-current='page'] {
    color: var(--rc-breadcrumbs-current-color, inherit);
  }
}
`;

/** Installs the breadcrumb trail styles once per containing root. */
export const ensureBreadcrumbsBaseStyles: (root: Document | ShadowRoot) => void =
  defineLightDomBaseStyles('rc-breadcrumbs', BREADCRUMBS_BASE_CSS);
