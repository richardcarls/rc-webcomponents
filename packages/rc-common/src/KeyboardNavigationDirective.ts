import { nothing } from 'lit';

import { PartType, type PartInfo, type ElementPart } from 'lit/directive.js';

import { directive, AsyncDirective } from 'lit/async-directive.js';

export type KeyboardNavigationAction =
  | 'next'
  | 'prev'
  | 'start'
  | 'end'
  | 'open-to-first'
  | 'open-to-last'
  | 'escape'
  | 'activate'
  | 'toggle';

/**
 * Options for the keyNavigation directive.
 */
export interface KeyNavigationOptions {
  /**
   * Dispatch 'escape' action on Escape key.
   * @default false
   */
  handleEscape?: boolean;

  /**
   * Dispatch 'activate' action on Enter/Space.
   * When enabled, Enter/Space will dispatch 'activate' instead of 'toggle'.
   * @default false
   */
  handleActivate?: boolean;

  /**
   * Explicitly set the navigation axis, overriding role-based auto-detection.
   * The navigation axis determines which arrow keys map to 'next'/'prev'.
   * Required when the element has no ARIA role (e.g. a menu-button trigger wrapper).
   */
  navigationAxis?: 'horizontal' | 'vertical';

  /**
   * Handle navigation-axis arrow keys ('next'/'prev') and Home/End ('start'/'end').
   * Set to false for elements that don't navigate items themselves (e.g. menu buttons
   * that let the parent menubar handle navigation).
   * @default true
   */
  handleNavAxis?: boolean;

  /**
   * Handle open-axis arrow keys (perpendicular to the navigation axis).
   * Dispatches 'open-to-first' and 'open-to-last' actions.
   * For horizontal navigation axis: ArrowDown → 'open-to-first', ArrowUp → 'open-to-last'.
   * For vertical navigation axis: ArrowRight → 'open-to-first', ArrowLeft → 'open-to-last'.
   * @default false
   */
  handleOpenAxis?: boolean;
}

class KeyboardNavigationDirective extends AsyncDirective {
  private _element?: WeakRef<Element>;
  private _keyDownHandle!: (ev: KeyboardEvent) => any;
  private _callback!: (action: KeyboardNavigationAction) => void;
  private _options: KeyNavigationOptions = {};
  /**
   * The navigation axis determines which arrow keys map to 'next'/'prev'.
   * Checks the explicit `navigationAxis` option first, then auto-detects
   * from the element's ARIA role and aria-orientation attribute.
   */
  protected get navigationAxis(): 'horizontal' | 'vertical' {
    if (this._options.navigationAxis) return this._options.navigationAxis;

    switch (this._element?.deref()?.role) {
      case 'slider':
      case 'tablist':
      case 'toolbar':
      case 'menubar':
        // Horizontal by default
        return this._element?.deref()?.ariaOrientation === 'vertical'
          ? 'vertical'
          : 'horizontal';

      case 'separator':
        // Navigation axis is perpendicular to the bar orientation.
        // ARIA default bar orientation is horizontal → keyboard axis is vertical (Up/Down).
        // A vertical bar (aria-orientation="vertical") → keyboard axis is horizontal (Left/Right).
        return this._element?.deref()?.ariaOrientation === 'vertical'
          ? 'horizontal'
          : 'vertical';

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

  private _normalizeKey(key: string): string {
    switch (key) {
      case 'Up':
        return 'ArrowUp';
      case 'Down':
        return 'ArrowDown';
      case 'Left':
        return 'ArrowLeft';
      case 'Right':
        return 'ArrowRight';
      default:
        return key;
    }
  }

  protected _onKeydown(e: KeyboardEvent) {
    const key = this._normalizeKey(e.key);

    // Compute axis-based key mappings, flipping horizontal arrows for RTL reading direction.
    const axis = this.navigationAxis;
    const el = this._element?.deref();
    const rtl = axis === 'horizontal' && el != null && getComputedStyle(el).direction === 'rtl';
    const navNext = axis === 'horizontal' ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
    const navPrev = axis === 'horizontal' ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
    const openFirst = axis === 'horizontal' ? 'ArrowDown' : 'ArrowRight';
    const openLast = axis === 'horizontal' ? 'ArrowUp' : 'ArrowLeft';

    let action: KeyboardNavigationAction | undefined;

    // Navigation axis
    if (this._options.handleNavAxis !== false) {
      if (key === navNext) action = 'next';
      else if (key === navPrev) action = 'prev';
      else if (key === 'Home') action = 'start';
      else if (key === 'End') action = 'end';
    }

    // Open axis (perpendicular to navigation)
    if (!action && this._options.handleOpenAxis) {
      if (key === openFirst) action = 'open-to-first';
      else if (key === openLast) action = 'open-to-last';
    }

    // Enter / Space / Escape
    if (!action) {
      if (key === 'Enter') {
        action = this._options.handleActivate ? 'activate' : 'toggle';
      } else if (key === ' ' && this._options.handleActivate) {
        action = 'activate';
      } else if (key === 'Escape' && this._options.handleEscape) {
        action = 'escape';
      }
    }

    if (action != null) {
      this._callback(action);
      e.stopPropagation();
      e.preventDefault();
    }
  }

  protected _init() {
    const el = this._element?.deref();

    if (el != null && el instanceof HTMLElement) {
      this._keyDownHandle = this._onKeydown.bind(this);
      el.addEventListener('keydown', this._keyDownHandle);
    }
  }

  /**
   * @param _cb - Callback function invoked with the navigation action
   * @param _options - Options object or deprecated boolean (deprecated).
   * @deprecated Passing a boolean as the second parameter is deprecated.
   *             Use an options object instead.
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
    // Init listeners once on first connection
    if (this.isConnected && this._element?.deref() === undefined) {
      this._element = new WeakRef(part.element);
      this._init();
    }

    // Always update callback and options (supports reactive property changes)
    this._callback = cb.bind(part.options?.host ?? part.element);

    // Handle deprecated boolean parameter (previously controlled useInteractionModeAttr)
    if (typeof optionsOrBoolean === 'boolean') {
      if (import.meta.env?.DEV) {
        console.warn(
          '[keyNavigation] Passing a boolean as the second parameter is deprecated. ' +
            'Use an options object instead.',
        );
      }
      this._options = {};
    } else {
      this._options = { ...optionsOrBoolean };
    }
  }

  override disconnected(): void {
    const el = this._element?.deref();

    if (el != null && el instanceof HTMLElement) {
      el.removeEventListener('keydown', this._keyDownHandle);
    }
  }

  override reconnected(): void {
    this._init();
  }
}

export const keyNavigation = directive(KeyboardNavigationDirective);
export type { KeyboardNavigationDirective };

export default keyNavigation;
