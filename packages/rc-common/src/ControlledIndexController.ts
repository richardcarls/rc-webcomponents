import type { ReactiveElement } from 'lit';

export interface ControlledIndexOptions {
  /** Component-specific bounds or wrapping, applied when reading or requesting an index. */
  normalize: (index: number) => number;
  /** Name of the component's composed, bubbling user-request event. */
  eventName: string;
}

/**
 * Owns the controlled/uncontrolled `activeIndex` and `defaultActiveIndex`
 * contract shared by carousel-like components. Host writes are silent;
 * `request()` changes uncontrolled state and reports user actions, while a
 * controlled host must write the requested index itself. The component owns
 * its decorated accessors, normalization, and visual presentation.
 */
export class ControlledIndexController<TTrigger extends string> {
  private readonly _host: Pick<ReactiveElement, 'requestUpdate'> & EventTarget;
  private readonly _options: ControlledIndexOptions;
  private _controlledIndex: number | undefined;
  private _defaultIndex = 0;
  private _uncontrolledIndex: number | undefined;
  private _initialized = false;

  constructor(
    host: Pick<ReactiveElement, 'requestUpdate'> & EventTarget,
    options: ControlledIndexOptions,
  ) {
    this._host = host;
    this._options = options;
  }

  /** The current index after the component's normalization rule. */
  get value(): number {
    return this._options.normalize(
      this._controlledIndex ?? this._uncontrolledIndex ?? this._defaultIndex,
    );
  }

  /** The default used until an uncontrolled user action establishes state. */
  get defaultValue(): number {
    return this._defaultIndex;
  }

  /** Whether the host currently owns the index. */
  get isControlled(): boolean {
    return this._controlledIndex !== undefined;
  }

  /** Records a host-owned index, or releases control when set to `undefined`. */
  setControlled(value: number | undefined): void {
    const oldValue = this.value;

    this._controlledIndex = value;
    this._initialized = true;
    this._host.requestUpdate('activeIndex', oldValue);
  }

  /** Sets the initial uncontrolled index; host writes never emit a user event. */
  setDefault(value: number): void {
    const oldValue = this._defaultIndex;

    this._defaultIndex = value;

    if (
      !this._initialized &&
      this._controlledIndex === undefined &&
      this._uncontrolledIndex === undefined
    ) {
      this._host.requestUpdate('activeIndex', oldValue);
    }

    this._host.requestUpdate('defaultActiveIndex', oldValue);
  }

  /** Reports a user-requested index; returns false when it is already current. */
  request(index: number, trigger: TTrigger): boolean {
    const next = this._options.normalize(index);
    const oldValue = this.value;

    if (oldValue === next) {
      return false;
    }

    if (this._controlledIndex === undefined) {
      this._uncontrolledIndex = next;
      this._host.requestUpdate('activeIndex', oldValue);
    }

    this._host.dispatchEvent(
      new CustomEvent<{ index: number; trigger: TTrigger }>(this._options.eventName, {
        bubbles: true,
        composed: true,
        detail: { index: next, trigger },
      }),
    );

    return true;
  }
}
