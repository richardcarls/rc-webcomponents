import type { ReactiveController, ReactiveControllerHost } from 'lit';

import { RafScheduler } from './RafScheduler.js';

export type ScrollObserverTarget = Element | Document | Window;

/**
 * @callback ScrollObserverChangeCB
 * @param scrolled - whether the target is scrolled past the threshold
 * @param scrollTop - the scroll offset read on the last evaluated frame
 */
export type ScrollObserverChangeCB = (scrolled: boolean, scrollTop: number) => void;

/**
 * @callback ScrollObserverScrollCB
 * @param scrollTop - current scroll offset
 * @param delta - change from the previously evaluated scroll offset
 */
export type ScrollObserverScrollCB = (scrollTop: number, delta: number) => void;

export type ScrollObserverInitialEvaluation = 'sync' | 'frame';

export interface ScrollObserverOptions {
  /** The scroll container to observe. Accepts an element reference or getter. */
  target: ScrollObserverTarget | (() => ScrollObserverTarget | null) | null;
  /** Scroll offset in px past which `scrolled` becomes true (strict `>`). Defaults to `4`. */
  threshold?: number;
  /** Invoked only when the boolean state crosses the threshold. */
  onChange?: ScrollObserverChangeCB;
  /** Invoked on every evaluated scroll event, including the initial attach. */
  onScroll?: ScrollObserverScrollCB;
  /** When to resolve and read the initial target. Defaults to `'sync'`. */
  initialEvaluation?: ScrollObserverInitialEvaluation;
  /** When true, detaches the listener entirely (e.g. host-controlled state). */
  disabled?: boolean;
}

/**
 * Observes a scroll container and tracks whether it is scrolled past a
 * threshold, for scroll-driven UI state such as app-bar elevation.
 *
 * Uses a single passive scroll listener evaluated synchronously per event;
 * browsers already coalesce scroll events to one per frame per target, and
 * the evaluation is a scroll-offset read plus a boolean compare. `onChange`
 * fires only when the boolean state flips, including immediately on attach
 * when the target mounts already scrolled (bfcache restore, fragment
 * navigation). Set `initialEvaluation: 'frame'` to move target resolution and
 * the initial scroll-offset read out of a DOM insertion task; callbacks then
 * run in the next animation frame before paint.
 *
 * A null or missing target is silently inert; the controller never throws.
 */
export class ScrollObserverController implements ReactiveController {
  private _host: ReactiveControllerHost;

  private _opts: ScrollObserverOptions;

  /** Target resolved at attach time, so detach unsubscribes the right node. */
  private _attached: ScrollObserverTarget | null = null;

  private _scrolled = false;

  private _lastScrollTop: number | undefined;

  private readonly _initialFrame = new RafScheduler();

  private readonly _onScroll = () => this._evaluate();

  constructor(host: ReactiveControllerHost, options: ScrollObserverOptions) {
    this._host = host;
    this._opts = options;
    host.addController(this);
  }

  /** Whether the observed target is currently scrolled past the threshold. */
  get scrolled(): boolean {
    return this._scrolled;
  }

  /** Reconfigure the controller: detaches, merges options, and reattaches. */
  setOptions(next: Partial<ScrollObserverOptions>): void {
    this._detach();
    Object.assign(this._opts, next);
    this._attach();
  }

  hostConnected(): void {
    this._attach();
  }

  hostDisconnected(): void {
    this._detach();
  }

  private _resolveTarget(): ScrollObserverTarget | null {
    const { target } = this._opts;

    return typeof target === 'function' ? target() : (target ?? null);
  }

  private _attach(): void {
    if (this._opts.disabled || this._attached) {
      return;
    }

    if (this._opts.initialEvaluation === 'frame') {
      this._queueAttach();

      return;
    }

    this._attachNow();
  }

  private _attachNow(): void {
    if (this._opts.disabled || this._attached) {
      return;
    }

    const target = this._resolveTarget();

    if (!target) {
      return;
    }

    this._attached = target;
    target.addEventListener('scroll', this._onScroll, { passive: true });

    // The target may mount already scrolled (bfcache restore, fragment
    // navigation); a flip here invokes onChange just like a scroll would.
    this._evaluate();
  }

  private _queueAttach(): void {
    this._initialFrame.schedulePhased(
      () => {
        const target = this._resolveTarget();

        return target ? { target, scrollTop: this._scrollTop(target) } : null;
      },
      (sample) => {
        if (!sample || this._opts.disabled || this._attached) {
          return;
        }

        // A getter target may change while work is queued. Reschedule instead
        // of attaching the listener to a stale node.
        if (this._resolveTarget() !== sample.target) {
          this._attach();

          return;
        }

        this._attached = sample.target;
        sample.target.addEventListener('scroll', this._onScroll, { passive: true });
        this._applyScrollTop(sample.scrollTop);
      },
    );
  }

  private _detach(): void {
    this._initialFrame.cancel();
    this._attached?.removeEventListener('scroll', this._onScroll);
    this._attached = null;
    this._lastScrollTop = undefined;
  }

  private _scrollTop(target: ScrollObserverTarget | null = this._attached): number {
    if (target instanceof Element) {
      return target.scrollTop;
    }

    if (target instanceof Document) {
      return target.scrollingElement?.scrollTop ?? 0;
    }

    return target?.scrollY ?? 0;
  }

  private _evaluate(): void {
    if (!this._attached) {
      return;
    }

    this._applyScrollTop(this._scrollTop());
  }

  private _applyScrollTop(scrollTop: number): void {
    const delta = scrollTop - (this._lastScrollTop ?? scrollTop);

    this._lastScrollTop = scrollTop;
    this._opts.onScroll?.(scrollTop, delta);

    const scrolled = scrollTop > (this._opts.threshold ?? 4);

    if (scrolled === this._scrolled) {
      return;
    }

    this._scrolled = scrolled;
    this._opts.onChange?.(scrolled, scrollTop);
    this._host.requestUpdate();
  }
}

export default ScrollObserverController;
