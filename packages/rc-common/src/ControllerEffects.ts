/** Resources owned by one controller attachment. Create a new scope on reconnect. */
export class ControllerEffects {
  private readonly _cleanups: Array<() => void> = [];
  private readonly _attributes = new WeakMap<
    Element,
    Map<string, { written: string; previous: string | null }>
  >();

  private readonly _styles = new WeakMap<
    HTMLElement,
    Map<
      string,
      {
        written: string;
        writtenPriority: string;
        previous: string;
        previousPriority: string;
      }
    >
  >();

  private _disposed = false;

  add(cleanup: () => void): void {
    if (this._disposed) {
      cleanup();

      return;
    }

    this._cleanups.push(cleanup);
  }

  listen(
    $target: EventTarget,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions,
  ): void {
    if (this._disposed) {
      return;
    }

    $target.addEventListener(type, listener, options);
    this.add(() => $target.removeEventListener(type, listener, options));
  }

  append($parent: Node, $node: Node): void {
    if (this._disposed) {
      return;
    }

    $parent.appendChild($node);

    this.add(() => {
      if ($node.parentNode === $parent) {
        $parent.removeChild($node);
      }
    });
  }

  setAttribute($target: Element, name: string, value: string): void {
    if (this._disposed) {
      return;
    }

    let attributes = this._attributes.get($target);

    if (!attributes) {
      attributes = new Map();
      this._attributes.set($target, attributes);
    }

    let record = attributes.get(name);

    if (!record) {
      record = { written: value, previous: $target.getAttribute(name) };
      attributes.set(name, record);

      this.add(() => {
        if ($target.getAttribute(name) !== record?.written) {
          return;
        }

        if (record.previous === null) {
          $target.removeAttribute(name);
        } else {
          $target.setAttribute(name, record.previous);
        }
      });
    }

    record.written = value;
    $target.setAttribute(name, value);
  }

  setStyle($target: HTMLElement, name: string, value: string, priority = ''): void {
    if (this._disposed) {
      return;
    }

    let styles = this._styles.get($target);

    if (!styles) {
      styles = new Map();
      this._styles.set($target, styles);
    }

    let record = styles.get(name);

    if (!record) {
      record = {
        written: value,
        writtenPriority: priority,
        previous: $target.style.getPropertyValue(name),
        previousPriority: $target.style.getPropertyPriority(name),
      };

      styles.set(name, record);

      this.add(() => {
        if (
          $target.style.getPropertyValue(name) !== record?.written ||
          $target.style.getPropertyPriority(name) !== record.writtenPriority
        ) {
          return;
        }

        if (record.previous) {
          $target.style.setProperty(name, record.previous, record.previousPriority);
        } else {
          $target.style.removeProperty(name);
        }
      });
    }

    record.written = value;
    record.writtenPriority = priority;
    $target.style.setProperty(name, value, priority);
  }

  dispose(): void {
    if (this._disposed) {
      return;
    }

    this._disposed = true;

    for (const cleanup of this._cleanups.reverse()) {
      cleanup();
    }

    this._cleanups.length = 0;
  }

  /** Keep current effects when another owner takes over their state. */
  abandon(): void {
    this._disposed = true;
    this._cleanups.length = 0;
  }
}
