import type { ReactiveController, ReactiveControllerHost } from 'lit';

export interface NavigationIndicatorControllerOptions {
  slot: () => HTMLSlotElement | null;
  container: () => HTMLElement | null;
  indicator: () => HTMLElement | null;
  activeSelector: () => string;
  indicatorTargetSelector: () => string;
}

/**
 * Tracks slotted navigation links and positions an owned active indicator.
 *
 * The controller never moves or mutates consumer links. It only observes link
 * state and writes geometry styles to the component-owned indicator element.
 */
export class NavigationIndicatorController implements ReactiveController {
  private readonly _host: ReactiveControllerHost & HTMLElement;

  private readonly _options: NavigationIndicatorControllerOptions;

  private _mutationObserver?: MutationObserver;

  private _resizeObserver?: ResizeObserver;

  private _frame = 0;

  private _links: HTMLAnchorElement[] = [];

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    options: NavigationIndicatorControllerOptions,
  ) {
    this._host = host;
    this._options = options;
    host.addController(this);
  }

  hostConnected(): void {
    this.sync();
  }

  hostDisconnected(): void {
    this._mutationObserver?.disconnect();
    this._resizeObserver?.disconnect();
    this._mutationObserver = undefined;
    this._resizeObserver = undefined;

    if (this._frame) {
      cancelAnimationFrame(this._frame);
    }

    this._frame = 0;
  }

  sync(): void {
    this._collectLinks();
    this._observeLinks();
    this.update();
  }

  update(): void {
    if (this._frame) {
      cancelAnimationFrame(this._frame);
    }

    this._frame = requestAnimationFrame(() => {
      this._frame = 0;
      this._positionIndicator();
    });
  }

  private _collectLinks(): void {
    const slot = this._options.slot();
    const assigned = slot?.assignedElements({ flatten: true }) ?? [];
    const links = new Set<HTMLAnchorElement>();

    for (const element of assigned) {
      if (element instanceof HTMLAnchorElement) {
        links.add(element);
      }

      element.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => links.add(link));
    }

    this._links = Array.from(links);
  }

  private _observeLinks(): void {
    this._mutationObserver?.disconnect();
    this._resizeObserver?.disconnect();

    this._mutationObserver = new MutationObserver(() => {
      this._collectLinks();
      this._observeLinks();
      this.update();
    });

    this._resizeObserver = new ResizeObserver(() => this.update());
    this._resizeObserver.observe(this._host);

    for (const link of this._links) {
      this._mutationObserver.observe(link, {
        attributes: true,
        attributeFilter: ['aria-current', 'class', 'data-active'],
        childList: true,
        subtree: true,
      });

      this._resizeObserver.observe(link);

      const target = this._targetFor(link);

      if (target && target !== link) {
        this._resizeObserver.observe(target);
      }
    }
  }

  private _activeLink(): HTMLAnchorElement | null {
    const selector = this._options.activeSelector().trim();

    if (selector) {
      const active = this._links.find((link) => link.matches(selector));

      if (active) {
        return active;
      }
    }

    return (
      this._links.find((link) => {
        const current = link.getAttribute('aria-current');

        return current !== null && current !== '' && current !== 'false';
      }) ?? null
    );
  }

  private _targetFor(link: HTMLAnchorElement): HTMLElement {
    const selector = this._options.indicatorTargetSelector().trim();

    if (selector) {
      const target = link.matches(selector) ? link : link.querySelector<HTMLElement>(selector);

      if (target) {
        return target;
      }
    }

    return (
      link.querySelector<HTMLElement>('[data-rc-navigation-indicator]') ??
      link.querySelector<HTMLElement>('[data-rc-navigation-icon]') ??
      link
    );
  }

  private _positionIndicator(): void {
    const container = this._options.container();
    const indicator = this._options.indicator();
    const activeLink = this._activeLink();

    this._host.toggleAttribute('has-active', !!activeLink);

    if (!container || !indicator || !activeLink) {
      indicator?.toggleAttribute('hidden', true);

      return;
    }

    const target = this._targetFor(activeLink);
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    if (!targetRect.width || !targetRect.height) {
      indicator.toggleAttribute('hidden', true);

      return;
    }

    indicator.toggleAttribute('hidden', false);
    indicator.style.inlineSize = `${targetRect.width}px`;
    indicator.style.blockSize = `${targetRect.height}px`;

    indicator.style.transform = `translate(${targetRect.left - containerRect.left}px, ${
      targetRect.top - containerRect.top
    }px)`;
  }
}

export default NavigationIndicatorController;
