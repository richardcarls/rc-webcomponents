import { nothing } from 'lit';

import { PartType, type PartInfo, type ElementPart } from 'lit/directive.js';

import { directive, AsyncDirective } from 'lit/async-directive.js';

import {
  HORIZONTAL_LTR_FLOW,
  arrowKeys,
  renderedOrientation,
  resolveFlow,
  type Flow,
} from './flow.js';

export type KeyboardNavigationAction =
  | 'next'
  | 'prev'
  | 'next-large'
  | 'prev-large'
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
   *
   * This is a layout orientation: `horizontal` means items run along the
   * inline axis, `vertical` along the block axis. It is converted to the
   * rendered physical orientation per keydown, so a horizontal layout in
   * vertical text navigates with ArrowUp/ArrowDown.
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
   * The physical axis whose arrow keys map to 'next'/'prev'.
   *
   * An explicit `aria-orientation` attribute is already physical and is used
   * as is. Everything else describes layout, so it is converted to the
   * orientation it renders in: an explicit `navigationAxis` option or a role
   * default of `horizontal` runs along the inline axis and turns vertical in
   * vertical writing modes, like a native range input does.
   */
  protected get navigationAxis(): 'horizontal' | 'vertical' {
    const el = this._element?.deref();

    return this._resolveAxis(el, el ? resolveFlow(el) : HORIZONTAL_LTR_FLOW);
  }

  private _resolveAxis(el: Element | undefined, flow: Flow): 'horizontal' | 'vertical' {
    if (this._options.navigationAxis) {
      return renderedOrientation(this._options.navigationAxis, flow);
    }

    const aria = el?.getAttribute('aria-orientation');
    const explicit = aria === 'horizontal' || aria === 'vertical' ? aria : null;

    switch (el?.role) {
      case 'slider':
      case 'tablist':
      case 'toolbar':
      case 'menubar':
        return explicit ?? renderedOrientation('horizontal', flow);

      case 'separator':
        // Navigation runs perpendicular to the bar. With no explicit
        // orientation the bar separates stacked blocks, so it runs along the
        // inline axis and the keys along the block axis.
        if (explicit) {
          return explicit === 'vertical' ? 'horizontal' : 'vertical';
        }

        return renderedOrientation('vertical', flow);

      default:
        // scrollbar, tree, listbox, menu, and unknown roles stack vertically.
        return explicit ?? renderedOrientation('vertical', flow);
    }
  }

  constructor(partInfo: PartInfo) {
    super(partInfo);

    if (partInfo.type !== PartType.ELEMENT) {
      throw new Error('The `keyNavigation` directive must be used on an element.');
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

    // Resolved per keydown: a dir change on an ancestor fires no event. The
    // open axis flips too, so a vertical menu in RTL opens with ArrowLeft.
    const el = this._element?.deref();
    const flow = el ? resolveFlow(el) : HORIZONTAL_LTR_FLOW;
    const {
      next: navNext,
      prev: navPrev,
      openFirst,
      openLast,
    } = arrowKeys(this._resolveAxis(el, flow), flow);

    let action: KeyboardNavigationAction | undefined;

    // Navigation axis
    if (this._options.handleNavAxis !== false) {
      if (key === navNext) action = e.shiftKey ? 'next-large' : 'next';
      else if (key === navPrev) action = e.shiftKey ? 'prev-large' : 'prev';
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
   * @param _options - Keyboard navigation behavior options.
   */
  render(_cb: (action: KeyboardNavigationAction) => void, _options?: KeyNavigationOptions) {
    return nothing;
  }

  update(part: ElementPart, [cb, options]: Parameters<this['render']>) {
    // Init listeners once on first connection
    if (this.isConnected && this._element?.deref() === undefined) {
      this._element = new WeakRef(part.element);
      this._init();
    }

    // Always update callback and options (supports reactive property changes)
    this._callback = cb.bind(part.options?.host ?? part.element);

    this._options = { ...options };
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
