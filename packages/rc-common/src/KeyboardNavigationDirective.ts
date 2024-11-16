import { nothing } from 'lit';

import { PartType, type PartInfo, type ElementPart } from 'lit/directive.js';

import { directive, AsyncDirective } from 'lit/async-directive.js';

export type KeyboardNavigationAction =
  | 'next'
  | 'prev'
  | 'start'
  | 'end'
  /** @deprecated Use 'toggle' action instead. Will be removed in a future version. */
  | 'collapse'
  /** @deprecated Use 'toggle' action instead. Will be removed in a future version. */
  | 'restore'
  | 'escape'
  | 'activate'
  | 'toggle';

/**
 * Options for the keyNavigation directive.
 */
export interface KeyNavigationOptions {
  /**
   * Set data-interaction-mode attribute for keyboard vs mouse styling.
   * @default true
   */
  useInteractionModeAttr?: boolean;

  /**
   * Dispatch 'escape' action on Escape key.
   * @default false
   */
  handleEscape?: boolean;

  /**
   * Dispatch 'activate' action on Enter/Space.
   * When enabled, Enter/Space will dispatch 'activate' instead of 'collapse'/'restore'.
   * @default false
   */
  handleActivate?: boolean;
}

class KeyboardNavigationDirective extends AsyncDirective {
  private _element?: WeakRef<Element>;
  private _keyDownHandle!: (ev: KeyboardEvent) => any;
  private _mouseClickHandle!: (ev: MouseEvent) => any;
  private _callback!: (action: KeyboardNavigationAction) => void;
  private _options: KeyNavigationOptions = {};
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
        if (this._options.handleActivate) {
          this._callback('activate');
        } else {
          // TODO: Replace 'collapse'/'restore' with single 'toggle' action in future version
          this._callback(this._isCollapsed ? 'restore' : 'collapse');
          this._isCollapsed = !this._isCollapsed;
        }
        isHandled = true;
        break;

      case ' ':
        if (this._options.handleActivate) {
          this._callback('activate');
          isHandled = true;
        }
        break;

      case 'Escape':
        if (this._options.handleEscape) {
          this._callback('escape');
          isHandled = true;
        }
        break;

      // Listen to global Tab navigation events to enable keyboard-only focus styling
      case 'Tab':
        if (this._options.useInteractionModeAttr) {
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
      if (this._options.useInteractionModeAttr) {
        this._element
          ?.deref()
          ?.setAttribute('data-interaction-mode', 'keyboard');
      }

      e.stopPropagation();
      e.preventDefault();
    }
  }

  protected _onMouseClick(_e: MouseEvent) {
    if (this._options.useInteractionModeAttr) {
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

  /**
   * @param _cb - Callback function invoked with the navigation action
   * @param _options - Options object or deprecated boolean for useInteractionModeAttr
   * @deprecated Passing a boolean as the second parameter is deprecated.
   *             Use an options object instead: `{ useInteractionModeAttr: true }`
   */
  render(
    _cb: (action: KeyboardNavigationAction) => void,
    _options?: KeyNavigationOptions | boolean,
  ) {
    return nothing;
  }

  update(
    part: ElementPart,
    [cb, optionsOrBoolean]: Parameters<this['render']>,
  ) {
    if (this.isConnected && this._element?.deref() === undefined) {
      this._element = new WeakRef(part.element);
      this._callback = cb.bind(part.options?.host ?? part.element);

      // Handle deprecated boolean parameter
      if (typeof optionsOrBoolean === 'boolean') {
        if (import.meta.env?.DEV) {
          console.warn(
            '[keyNavigation] Passing a boolean as the second parameter is deprecated. ' +
              'Use an options object instead: { useInteractionModeAttr: true }',
          );
        }
        this._options = { useInteractionModeAttr: optionsOrBoolean };
      } else {
        this._options = {
          useInteractionModeAttr: true,
          ...optionsOrBoolean,
        };
      }

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
