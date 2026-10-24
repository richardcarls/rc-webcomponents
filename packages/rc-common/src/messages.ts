import type { ReactiveController, ReactiveControllerHost } from 'lit';

import { notifyLocaleChange, observeLocale } from './observeLocale.js';
import type { ReorderMessages } from './ReorderController.js';
import type { ResizeMessages } from './ResizeController.js';

/**
 * The built-in text of every component and controller, keyed by element tag
 * or controller name. Each package adds its own entry by augmenting this
 * interface, so `registerMessages()` type-checks every key it is given.
 *
 * ```ts
 * declare module '@rcarls/rc-common' {
 *   interface RcMessageCatalog {
 *     'rc-carousel': RCCarouselMessages;
 *   }
 * }
 * ```
 */
export interface RcMessageCatalog {
  reorder: ReorderMessages;
  resize: ResizeMessages;
}

/** Message overrides for some scopes of {@link RcMessageCatalog}. */
export type RcMessageCatalogInput = {
  [K in keyof RcMessageCatalog]?: Partial<RcMessageCatalog[K]>;
};

const registry = new Map<string, RcMessageCatalogInput>();

let registryVersion = 0;

/**
 * Registers translated text for `locale`, such as `de` or `pt-BR`. Later
 * calls for the same locale merge into earlier ones, key by key. Components
 * already on the page re-render with the new text.
 *
 * Only English ships built in. Call this before components connect, or at
 * least before the first paint, so the defaults never flash.
 */
export function registerMessages(locale: string, catalog: RcMessageCatalogInput): void {
  const key = locale.toLowerCase();
  const entry: Record<string, object | undefined> = { ...registry.get(key) };

  for (const [scope, messages] of Object.entries(catalog)) {
    entry[scope] = { ...entry[scope], ...messages };
  }

  registry.set(key, entry);
  registryVersion += 1;
  notifyLocaleChange();
}

/**
 * The UI locale of `host`: its own `lang` attribute, else `<html lang>`.
 *
 * An ancestor's `lang` is deliberately skipped. It usually marks the
 * language of content, such as a German recipe, while component chrome
 * stays in the language of the interface around it.
 */
export function messagesLocale(host: Element): string {
  return host.getAttribute('lang') ?? host.ownerDocument.documentElement.lang ?? '';
}

/** Isolates an unknown-direction phrase inside a plain-text message. */
export function bidiIsolate(text: string): string {
  return `\u2068${text}\u2069`;
}

/** `de-CH` gives `de`, then `de-ch`: least specific first, so later ones win. */
function localeChain(locale: string): string[] {
  const parts = locale.toLowerCase().split('-').filter(Boolean);

  return parts.map((_, index) => parts.slice(0, index + 1).join('-'));
}

export interface ResolveMessagesOptions {
  /**
   * A scope whose registered text this one falls back to, such as
   * `rc-select` for `rc-combobox`. Only keys the scope's defaults name are
   * taken from it. Within each locale the scope's own text wins; a more
   * specific locale wins over a less specific one either way.
   */
  inherit?: keyof RcMessageCatalog;
}

/**
 * Resolves the text for one scope. Each key comes from `overrides`, else
 * the registry for the host's locale (exact tag, then its base language),
 * else `defaults`.
 */
export function resolveMessages<K extends keyof RcMessageCatalog>(
  host: Element,
  scope: K,
  defaults: Readonly<RcMessageCatalog[K]>,
  overrides?: Partial<RcMessageCatalog[K]>,
  options: ResolveMessagesOptions = {},
): RcMessageCatalog[K] {
  const resolved = { ...defaults } as RcMessageCatalog[K];
  const keys = new Set(Object.keys(defaults));

  for (const locale of localeChain(messagesLocale(host))) {
    const entry = registry.get(locale);

    if (options.inherit) {
      assignDefined(resolved, entry?.[options.inherit] as Partial<RcMessageCatalog[K]>, keys);
    }

    assignDefined(resolved, entry?.[scope]);
  }

  assignDefined(resolved, overrides);

  return resolved;
}

function assignDefined<T extends object>(
  target: T,
  source: Partial<T> | undefined,
  keys?: ReadonlySet<string>,
): void {
  if (!source) {
    return;
  }

  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined && (!keys || keys.has(key))) {
      (target as Record<string, unknown>)[key] = value;
    }
  }
}

export interface LocaleControllerOptions {
  /** Called when the host's locale or the registered text changes. Defaults to `host.requestUpdate()`. */
  onChange?: () => void;
}

/**
 * Tracks a host's UI locale, as {@link messagesLocale} resolves it, and
 * requests an update when it or the registered text changes. Use it for
 * `Intl` formatting; {@link MessagesController} adds the text itself.
 */
export class LocaleController implements ReactiveController {
  protected readonly _host: ReactiveControllerHost & Element;
  private readonly _onChange: (() => void) | undefined;
  private _unobserveLocale: (() => void) | null = null;
  private _key = '';

  constructor(host: ReactiveControllerHost & Element, options: LocaleControllerOptions = {}) {
    this._host = host;
    this._onChange = options.onChange;
    host.addController(this);
  }

  /** The host's UI locale, or `undefined` for the runtime default. Read it while rendering. */
  get locale(): string | undefined {
    this._key = this._currentKey();

    return messagesLocale(this._host) || undefined;
  }

  hostConnected(): void {
    this._unobserveLocale ??= observeLocale(() => {
      const key = this._currentKey();

      if (this._key === key) {
        return;
      }

      this._key = key;

      if (this._onChange) {
        this._onChange();
      } else {
        this._host.requestUpdate();
      }
    }, this._host);
  }

  hostDisconnected(): void {
    this._unobserveLocale?.();
    this._unobserveLocale = null;
  }

  private _currentKey(): string {
    return `${messagesLocale(this._host)}|${registryVersion}`;
  }
}

export interface MessagesControllerOptions<
  K extends keyof RcMessageCatalog,
> extends LocaleControllerOptions {
  /** Per-element overrides, usually the element's `messages` property. */
  overrides?: () => Partial<RcMessageCatalog[K]> | undefined;
  /** See {@link ResolveMessagesOptions.inherit}. */
  inherit?: keyof RcMessageCatalog;
}

/**
 * Resolves a host's text for one scope of {@link RcMessageCatalog} and
 * requests an update when its locale or the registered text changes.
 */
export class MessagesController<K extends keyof RcMessageCatalog> extends LocaleController {
  private readonly _scope: K;
  private readonly _defaults: Readonly<RcMessageCatalog[K]>;
  private readonly _overrides: (() => Partial<RcMessageCatalog[K]> | undefined) | undefined;
  private readonly _inherit: keyof RcMessageCatalog | undefined;

  constructor(
    host: ReactiveControllerHost & Element,
    scope: K,
    defaults: Readonly<RcMessageCatalog[K]>,
    options: MessagesControllerOptions<K> = {},
  ) {
    super(host, options);
    this._scope = scope;
    this._defaults = defaults;
    this._overrides = options.overrides;
    this._inherit = options.inherit;
  }

  /** The resolved text. Read it while rendering. */
  get value(): RcMessageCatalog[K] {
    // Reading the locale marks it current, so only a later change notifies.
    void this.locale;

    return resolveMessages(this._host, this._scope, this._defaults, this._overrides?.(), {
      inherit: this._inherit,
    });
  }
}

/**
 * Writes a default attribute the component owns, such as an
 * `aria-roledescription` in the current locale: only when the attribute is
 * absent or still holds the value the component last wrote, so an authored
 * value is never replaced. Pass the previous return value as `written`.
 */
export function syncDefaultAttribute(
  el: Element,
  name: string,
  value: string,
  written: string | null,
): string | null {
  const current = el.getAttribute(name);

  if (current !== null && current !== written) {
    return null;
  }

  if (current !== value) {
    el.setAttribute(name, value);
  }

  return value;
}
