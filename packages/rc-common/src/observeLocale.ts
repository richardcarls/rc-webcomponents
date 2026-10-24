type LocaleListener = () => void;
type LocaleRoot = Document | ShadowRoot;

interface RootObservation {
  observer: MutationObserver;
  listeners: Set<LocaleListener>;
}

const listeners = new Set<LocaleListener>();
const roots = new Map<LocaleRoot, RootObservation>();

function watchRoot(root: LocaleRoot, listener: LocaleListener): () => void {
  let observation = roots.get(root);

  if (!observation) {
    const rootListeners = new Set<LocaleListener>();
    const observer = new MutationObserver(() => {
      for (const subscriber of Array.from(rootListeners)) {
        subscriber();
      }
    });

    observer.observe(root.nodeType === 9 ? (root as Document).documentElement : root, {
      attributes: true,
      attributeFilter: ['dir', 'lang'],
      subtree: true,
    });

    observation = { observer, listeners: rootListeners };
    roots.set(root, observation);
  }

  observation.listeners.add(listener);

  return () => {
    observation.listeners.delete(listener);

    if (observation.listeners.size === 0) {
      observation.observer.disconnect();
      roots.delete(root);
    }
  };
}

/**
 * Calls `listener` when a `dir` or `lang` attribute changes in `host`'s
 * document or any shadow tree containing it, or when messages are registered.
 * Without a host, observes the current document for compatibility.
 *
 * Each tree shares one observer. A stylesheet changing `direction` or
 * `writing-mode` does not create a mutation; geometry owners must also refresh
 * at interaction or measurement time.
 */
export function observeLocale(listener: LocaleListener, host?: Element): () => void {
  const subscriber = (): void => listener();
  const unwatch: Array<() => void> = [];
  const observed = new Set<LocaleRoot>();

  listeners.add(subscriber);

  if (typeof MutationObserver === 'function') {
    const ownerDocument =
      host?.ownerDocument ?? (typeof document === 'undefined' ? null : document);

    if (ownerDocument) {
      observed.add(ownerDocument);

      let root: Node | null = host?.getRootNode() ?? null;

      while (root?.nodeType === 11) {
        const shadowRoot = root as ShadowRoot;

        observed.add(shadowRoot);
        root = shadowRoot.host.getRootNode();
      }

      for (const localeRoot of observed) {
        unwatch.push(watchRoot(localeRoot, subscriber));
      }
    }
  }

  return () => {
    listeners.delete(subscriber);
    unwatch.forEach((stop) => stop());
  };
}

/** Notifies every {@link observeLocale} subscriber, as a `lang` change would. */
export function notifyLocaleChange(): void {
  for (const listener of Array.from(listeners)) {
    listener();
  }
}
