import type { ReactiveController, ReactiveControllerHost } from 'lit';

import { HORIZONTAL_LTR_FLOW, resolveFlow, type Flow } from './flow.js';
import { observeDirection } from './observeDirection.js';

function sameFlow(a: Flow, b: Flow): boolean {
  return (
    a.inline === b.inline &&
    a.inlineReversed === b.inlineReversed &&
    a.blockReversed === b.blockReversed &&
    a.rtl === b.rtl
  );
}

/**
 * Keeps a host's resolved writing mode and direction current for rendering,
 * such as an `aria-orientation` that must report the rendered orientation.
 *
 * Re-resolves on connect, whenever a `dir` attribute changes in the document,
 * and whenever the host resizes, which a writing-mode switch almost always
 * causes. Requests an update only when the flow actually changed. A change
 * the document cannot see, such as `direction` set by a stylesheet, needs
 * {@link refresh}. Event handlers should resolve the flow themselves at event
 * time instead.
 */
export class FlowController implements ReactiveController {
  private readonly _host: ReactiveControllerHost & Element;

  private _flow: Flow = HORIZONTAL_LTR_FLOW;

  private _observer: ResizeObserver | null = null;

  private _unobserveDirection: (() => void) | null = null;

  constructor(host: ReactiveControllerHost & Element) {
    this._host = host;
    host.addController(this);
  }

  get flow(): Flow {
    return this._flow;
  }

  hostConnected(): void {
    this.refresh();
    this._unobserveDirection ??= observeDirection(() => this.refresh());

    if (typeof ResizeObserver === 'function') {
      this._observer ??= new ResizeObserver(() => this.refresh());
      this._observer.observe(this._host);
    }
  }

  hostDisconnected(): void {
    this._observer?.disconnect();
    this._unobserveDirection?.();
    this._unobserveDirection = null;
  }

  refresh(): void {
    const next = resolveFlow(this._host);

    if (!sameFlow(next, this._flow)) {
      this._flow = next;
      this._host.requestUpdate();
    }
  }
}

export default FlowController;
