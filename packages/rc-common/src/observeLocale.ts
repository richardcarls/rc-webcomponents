type LocaleListener = () => void;
type LocaleRoot = Document | ShadowRoot;
/** The elements whose locale a listener follows; none means any change. */
type LocaleScope = () => ReadonlyArray<Element | null | undefined>;

interface RootObservation {
  observer: MutationObserver;
  listeners: Map<LocaleListener, LocaleScope | undefined>;
}

const listeners = new Set<LocaleListener>();
const roots = new Map<LocaleRoot, RootObservation>();

/**
 * Whether a `dir` or `lang` change on `target` can change what `host` reads:
 * `target` is the host, one of its ancestors across shadow boundaries, or
 * inside the host's own subtree.
 */
function affects(target: Node, host: Element): boolean {
  if (host.contains(target)) {
    return true;
  }

  let node: Node = host;

  for (;;) {
    if (target.contains(node)) {
      return true;
    }

    const root = node.getRootNode();

    if (root.nodeType !== 11) {
      return false;
    }

    node = (root as ShadowRoot).host;
  }
}

function inScope(records: MutationRecord[], scope: LocaleScope | undefined): boolean {
  if (!scope) {
    return true;
  }

  const elements = scope().filter((element): element is Element => Boolean(element));

  return records.some(({ target }) => elements.some((element) => affects(target, element)));
}

function watchRoot(root: LocaleRoot, listener: LocaleListener, scope?: LocaleScope): () => void {
  let observation = roots.get(root);

  if (!observation) {
    const rootListeners = new Map<LocaleListener, LocaleScope | undefined>();
    const observer = new MutationObserver((records) => {
      for (const [subscriber, subscriberScope] of Array.from(rootListeners)) {
        if (inScope(records, subscriberScope)) {
          subscriber();
        }
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

  observation.listeners.set(listener, scope);

  return () => {
    observation.listeners.delete(listener);

    if (observation.listeners.size === 0) {
      observation.observer.disconnect();
      roots.delete(root);
    }
  };
}

/**
 * Calls `listener` when a `dir` or `lang` attribute changes on `host`, one of
 * its ancestors in its document or any shadow tree containing it, or inside
 * its subtree, or when messages are registered. A change elsewhere, such as a
 * `lang` on unrelated content, cannot change the host's locale or flow and
 * notifies nothing. Without a host, any change in the current document
 * notifies, for compatibility.
 *
 * `scope` names the elements whose locale matters when it isn't only the
 * host's, such as a popup positioned in its anchor's direction. The host still
 * picks the trees to observe.
 *
 * Each tree shares one observer. A stylesheet changing `direction` or
 * `writing-mode` does not create a mutation; geometry owners must also refresh
 * at interaction or measurement time.
 */
export function observeLocale(
  listener: LocaleListener,
  host?: Element,
  scope: LocaleScope | undefined = host ? () => [host] : undefined,
): () => void {
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
        unwatch.push(watchRoot(localeRoot, subscriber, scope));
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
