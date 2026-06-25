import { nothing } from 'lit';

import { PartType, type PartInfo, type ElementPart } from 'lit/directive.js';

import { directive, AsyncDirective } from 'lit/async-directive.js';

/**
 * Options for the keyInteraction directive.
 */
export interface KeyInteractionOptions {
  /**
   * Element to set/remove `data-interaction-mode` on.
   * Defaults to the element the directive is applied to.
   * Pass the LitElement host (`this`) when the attribute needs to be visible
   * to external CSS (e.g. for `::part()` theming via rc-theme-material).
   */
  attributeTarget?: Element;
}

class KeyboardInteractionDirective extends AsyncDirective {
  private _element?: WeakRef<Element>;
  private _options: KeyInteractionOptions = {};
  private _isPointerFocus = false;

  private _onPointerdown = (): void => {
    this._isPointerFocus = true;
    this._target?.removeAttribute('data-interaction-mode');
  };

  private _onFocusin = (): void => {
    if (this._isPointerFocus) {
      this._isPointerFocus = false;
    } else {
      this._target?.setAttribute('data-interaction-mode', 'keyboard');
    }
  };

  private _onKeydown = (): void => {
    this._target?.setAttribute('data-interaction-mode', 'keyboard');
  };

  private get _target(): Element | undefined {
    return this._options.attributeTarget ?? this._element?.deref();
  }

  constructor(partInfo: PartInfo) {
    super(partInfo);

    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('The `keyInteraction` directive must be used on an element.');
    }
  }

  protected _init(): void {
    const el = this._element?.deref();

    if (el instanceof HTMLElement) {
      el.addEventListener('pointerdown', this._onPointerdown, { capture: true });
      el.addEventListener('focusin', this._onFocusin);
      el.addEventListener('keydown', this._onKeydown);
    }
  }

  render(_options?: KeyInteractionOptions) {
    return nothing;
  }

  update(part: ElementPart, [options]: Parameters<this['render']>) {
    if (this.isConnected && this._element?.deref() === undefined) {
      this._element = new WeakRef(part.element);
      this._init();
    }

    this._options = options ?? {};
  }

  override disconnected(): void {
    const el = this._element?.deref();

    if (el instanceof HTMLElement) {
      el.removeEventListener('pointerdown', this._onPointerdown, { capture: true });
      el.removeEventListener('focusin', this._onFocusin);
      el.removeEventListener('keydown', this._onKeydown);
    }
  }

  override reconnected(): void {
    this._init();
  }
}

export const keyInteraction = directive(KeyboardInteractionDirective);
export type { KeyboardInteractionDirective };

export default keyInteraction;
