/**
 * Structural light-DOM stylesheets, one per component, installed once per
 * containing `Document` or `ShadowRoot`.
 *
 * Components whose styled parts are consumer-authored light-DOM children
 * cannot reach them from shadow styles, so each one injects a small
 * `@layer rc-base` stylesheet into the root it connects in. Registering that
 * stylesheet here, at module scope, also records it so a build can write the
 * same CSS to a static `base.css` file. A server-rendered page can link that
 * file and get the structural layout before any element upgrades.
 */

type StyleRoot = Document | ShadowRoot;

const registry = new Map<string, string>();

/** The attribute that marks a light-DOM base stylesheet and names what it covers. */
export const LIGHT_DOM_BASE_ATTRIBUTE = 'data-rc-light-dom-base';

/**
 * Registers a component's light-DOM base stylesheet and returns the function
 * that installs it into a root.
 *
 * The installer does nothing for a root it has already handled, and nothing
 * for a root that already holds a stylesheet whose `data-rc-light-dom-base`
 * lists `name` or `all`. That second check lets a page that links the static
 * `base.css` files skip the runtime copy.
 *
 * @param name - The component tag the stylesheet belongs to, such as `rc-button`.
 * @param css - The stylesheet text, already wrapped in `@layer rc-base`.
 */
export function defineLightDomBaseStyles(name: string, css: string): (root: Node) => void {
  registry.set(name, css);

  const handledRoots = new WeakSet<StyleRoot>();

  return (root: Node): void => {
    if (!(root instanceof Document || root instanceof ShadowRoot) || handledRoots.has(root)) {
      return;
    }

    handledRoots.add(root);

    if (
      root.querySelector(
        `[${LIGHT_DOM_BASE_ATTRIBUTE}~="${name}"], [${LIGHT_DOM_BASE_ATTRIBUTE}~="all"]`,
      )
    ) {
      return;
    }

    const $style = (root instanceof Document ? root : root.ownerDocument).createElement('style');

    $style.setAttribute(LIGHT_DOM_BASE_ATTRIBUTE, name);
    $style.textContent = css;

    if (root instanceof Document) {
      root.head.append($style);
    } else {
      root.append($style);
    }
  };
}

/**
 * Every light-DOM base stylesheet registered so far, keyed by component tag.
 * Build tooling reads this after importing a package to emit its `base.css`.
 */
export function registeredLightDomBaseStyles(): ReadonlyMap<string, string> {
  return registry;
}
