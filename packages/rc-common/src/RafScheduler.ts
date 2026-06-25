import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type RafSchedulerCallback = (timestamp: DOMHighResTimeStamp) => void;

/**
 * Coalesces repeated work into one `requestAnimationFrame` callback and
 * cancels pending work when the host disconnects.
 */
export class RafScheduler implements ReactiveController {
  private _callback: RafSchedulerCallback | null = null;

  private _frame = 0;

  constructor(host?: ReactiveControllerHost) {
    host?.addController(this);
  }

  get pending(): boolean {
    return this._frame !== 0;
  }

  schedule(callback: RafSchedulerCallback): void {
    this._callback = callback;

    if (this._frame) return;

    this._frame = requestAnimationFrame((timestamp) => {
      const callback = this._callback;

      this._frame = 0;
      this._callback = null;
      callback?.(timestamp);
    });
  }

  cancel(): void {
    if (!this._frame) return;

    cancelAnimationFrame(this._frame);
    this._frame = 0;
    this._callback = null;
  }

  hostDisconnected(): void {
    this.cancel();
  }
}

export default RafScheduler;
