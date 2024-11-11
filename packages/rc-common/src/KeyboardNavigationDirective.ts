import { nothing } from 'lit';

import { PartType, type PartInfo, type ElementPart } from 'lit/directive.js';

import { directive, AsyncDirective } from 'lit/async-directive.js';

export type KeyboardNavigationAction =
  | 'next'
  | 'prev'
  | 'start'
  | 'end'
  | 'collapse'
  | 'restore';

class KeyboardNavigationDirective extends AsyncDirective {
  private _element?: WeakRef<Element>;
  private _keyDownHandle!: (ev: KeyboardEvent) => any;
  private _mouseClickHandle!: (ev: MouseEvent) => any;
  private _callback!: (action: KeyboardNavigationAction) => void;
  private _useInteractionModeAttr?: boolean;
  private _isCollapsed: boolean = false;

  protected get orientation() {
    switch (this._element?.deref()?.role) {
      case 'slider':
      case 'tablist':
      case 'toolbar':
      case 'menubar':
        // Horizontal by default
        return this._element?.deref()?.ariaOrientation === 'vertical'
          ? 'vertical'
          : 'horizontal';

      case 'scrollbar':
      case 'tree':
      case 'listbox':
      case 'menu':
      default:
        // Vertical by default
        return this._element?.deref()?.ariaOrientation === 'horizontal'
          ? 'horizontal'
          : 'vertical';
    }
  }

  constructor(partInfo: PartInfo) {
    super(partInfo);

    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error(
        'The `keyNavigation` directive must be used on an element.',
      );
    }
  }

  protected _onKeydown(e: KeyboardEvent) {
    let isHandled = false;

    switch (e.key) {
      case 'ArrowUp':
      case 'Up':
        if (this.orientation === 'vertical') {
          this._callback('prev');
          isHandled = true;
        }
        break;

      case 'ArrowDown':
      case 'Down':
        if (this.orientation === 'vertical') {
          this._callback('next');
          isHandled = true;
        }
        break;

      case 'ArrowRight':
      case 'Right':
        if (this.orientation !== 'vertical') {
          this._callback('next');
          isHandled = true;
        }
        break;

      case 'ArrowLeft':
      case 'Left':
        if (this.orientation !== 'vertical') {
          this._callback('prev');
          isHandled = true;
        }
        break;

      case 'Home':
        this._callback('start');
        this._isCollapsed = true;
        isHandled = true;
        break;

      case 'End':
        this._callback('end');
        this._isCollapsed = true;
        isHandled = true;
        break;

      case 'Enter':
        this._callback(this._isCollapsed ? 'restore' : 'collapse');
        this._isCollapsed = !this._isCollapsed;
        isHandled = true;
        break;

      // Listen to global Tab navigation events to enable keyboard-only focus styling
      case 'Tab':
        if (this._useInteractionModeAttr) {
          this._element
            ?.deref()
            ?.setAttribute('data-interaction-mode', 'keyboard');
        }

        // Don't mark as handled to let event bubble up
        break;

      default:
        break;
    }

    if (isHandled) {
      if (this._useInteractionModeAttr) {
        this._element
          ?.deref()
          ?.setAttribute('data-interaction-mode', 'keyboard');
      }

      e.stopPropagation();
      e.preventDefault();
    }
  }

  protected _onMouseClick(_e: MouseEvent) {
    if (this._useInteractionModeAttr) {
      // For :focus-within styling only when focused item is :focus-visible
      this._element?.deref()?.removeAttribute('data-interaction-mode');
    }
  }

  protected _init() {
    const el = this._element?.deref();

    if (el != null && el instanceof HTMLElement) {
      this._keyDownHandle = this._onKeydown.bind(this);
      this._mouseClickHandle = this._onMouseClick.bind(this);
      el.addEventListener('keydown', this._keyDownHandle);
      el.addEventListener('click', this._mouseClickHandle);
    }
  }

  render(
    _cb: (action: KeyboardNavigationAction) => void,
    _useInteractionModeAttr?: boolean,
  ) {
    return nothing;
  }

  update(
    part: ElementPart,
    [cb, useInteractionModeAttr]: Parameters<this['render']>,
  ) {
    if (this.isConnected && this._element?.deref() === undefined) {
      this._element = new WeakRef(part.element);
      this._callback = cb.bind(part.options?.host ?? part.element);
      this._useInteractionModeAttr = useInteractionModeAttr ?? true;

      this._init();
    }
  }

  override disconnected(): void {
    const el = this._element?.deref();

    if (el != null && el instanceof HTMLElement) {
      el.removeEventListener('keydown', this._keyDownHandle);
      el.removeEventListener('click', this._mouseClickHandle);
    }
  }

  override reconnected(): void {
    this._init();
  }
}

export const keyNavigation = directive(KeyboardNavigationDirective);
export type { KeyboardNavigationDirective };

export default keyNavigation;
