import { collator } from './localeFormat.js';

export interface TypeaheadControllerOptions<T> {
  /** Items searched by typeahead. */
  items: () => readonly T[];
  /** Text used for matching each item. */
  text: (item: T) => string;
  /** Called with the matched item and index. */
  onMatch: (item: T, index: number) => void;
  /** Search start index for the next key. Defaults to `0`. */
  startIndex?: () => number;
  /** Buffer clear delay in milliseconds. Defaults to `500`. */
  timeout?: number;
  /**
   * Locale whose collation decides a match, such as `messagesLocale(host)`.
   * Defaults to the runtime locale.
   */
  locale?: () => string | undefined;
}

/**
 * Small APG-style typeahead buffer for composite widgets.
 *
 * It handles printable-key buffering and timeout reset; consumers keep control
 * of focus, active descendant, and selection behavior. Prefixes match with an
 * `Intl.Collator` at base sensitivity, so case and accents are ignored the way
 * the locale ignores them: typing `e` finds `Éclair`.
 */
export class TypeaheadController<T> {
  private _buffer = '';

  private _timer = 0;

  private readonly _options: TypeaheadControllerOptions<T>;

  constructor(options: TypeaheadControllerOptions<T>) {
    this._options = options;
  }

  get buffer(): string {
    return this._buffer;
  }

  reset(): void {
    this._buffer = '';
    this._clearTimer();
  }

  handleKeydown(event: KeyboardEvent): boolean {
    if (event.key.length !== 1 || event.altKey || event.ctrlKey || event.metaKey) {
      return false;
    }

    this.search(event.key);
    event.preventDefault();

    return true;
  }

  search(char: string): T | null {
    this._buffer += char;
    this._scheduleReset();

    const items = this._options.items();

    if (!items.length) {
      return null;
    }

    const startIndex = this._options.startIndex?.() ?? 0;
    const count = items.length;
    const compare = collator(this._options.locale?.(), { sensitivity: 'base', usage: 'search' });

    for (let offset = 1; offset <= count; offset += 1) {
      const index = (startIndex + offset) % count;
      const item = items[index];
      const text = this._options.text(item).trim();

      if (compare.compare(text.slice(0, this._buffer.length), this._buffer) === 0) {
        this._options.onMatch(item, index);

        return item;
      }
    }

    return null;
  }

  private _scheduleReset(): void {
    this._clearTimer();
    this._timer = window.setTimeout(() => this.reset(), this._options.timeout ?? 500);
  }

  private _clearTimer(): void {
    if (!this._timer) {
      return;
    }

    window.clearTimeout(this._timer);
    this._timer = 0;
  }
}
