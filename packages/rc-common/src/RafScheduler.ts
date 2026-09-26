import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type RafSchedulerCallback = (timestamp: DOMHighResTimeStamp) => void;

/**
 * Samples browser state during the shared read phase.
 *
 * @callback RafSchedulerSample
 * @typeParam T - Snapshot returned for the matching apply callback.
 * @param timestamp - The animation frame timestamp.
 * @returns A snapshot containing everything the apply callback needs.
 */
export type RafSchedulerSample<T> = (timestamp: DOMHighResTimeStamp) => T;

/**
 * Applies a previously sampled snapshot during the shared write phase.
 *
 * @callback RafSchedulerApply
 * @typeParam T - Snapshot produced by the matching sample callback.
 * @param sample - The snapshot produced during the read phase.
 * @param timestamp - The animation frame timestamp.
 */
export type RafSchedulerApply<T> = (sample: T, timestamp: DOMHighResTimeStamp) => void;

interface PhasedTask<T = unknown> {
  scheduler: RafScheduler;
  sample: RafSchedulerSample<T>;
  apply: RafSchedulerApply<T>;
  active: boolean;
}

const phasedTasks = new Map<RafScheduler, PhasedTask>();
const currentPhasedTasks = new WeakMap<RafScheduler, PhasedTask>();
let phasedFrame = 0;

function reportError(error: unknown): void {
  queueMicrotask(() => {
    throw error;
  });
}

function schedulePhasedFrame(): void {
  if (phasedFrame) {
    return;
  }

  phasedFrame = requestAnimationFrame((timestamp) => {
    phasedFrame = 0;

    const tasks = [...phasedTasks.values()];
    const samples = new Map<PhasedTask, unknown>();

    phasedTasks.clear();

    for (const task of tasks) {
      if (!task.active || currentPhasedTasks.get(task.scheduler) !== task) {
        continue;
      }

      try {
        samples.set(task, task.sample(timestamp));
      } catch (error) {
        finishPhasedTask(task);
        reportError(error);
      }
    }

    for (const task of tasks) {
      if (!samples.has(task) || !task.active || currentPhasedTasks.get(task.scheduler) !== task) {
        continue;
      }

      const sample = samples.get(task);

      finishPhasedTask(task);

      try {
        task.apply(sample, timestamp);
      } catch (error) {
        reportError(error);
      }
    }
  });
}

function finishPhasedTask(task: PhasedTask): void {
  if (currentPhasedTasks.get(task.scheduler) === task) {
    task.active = false;
    currentPhasedTasks.delete(task.scheduler);
  }
}

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
    return this._frame !== 0 || currentPhasedTasks.has(this);
  }

  schedule(callback: RafSchedulerCallback): void {
    this._cancelPhased();

    this._callback = callback;

    if (this._frame) {
      return;
    }

    this._frame = requestAnimationFrame((timestamp) => {
      const callback = this._callback;

      this._frame = 0;
      this._callback = null;
      callback?.(timestamp);
    });
  }

  /**
   * Coalesces measurement and mutation into a shared animation frame.
   * Every queued sample runs before any queued apply, including work from
   * other scheduler instances. Repeated calls keep only the latest task.
   *
   * @typeParam T - Snapshot returned by `sample` and passed to `apply`.
   * @param sample - Reads browser state and returns a compact snapshot.
   * @param apply - Mutates state or DOM from the sampled snapshot.
   * @example
   * ```ts
   * scheduler.schedulePhased(
   *   () => element.getBoundingClientRect(),
   *   (rect) => element.style.setProperty('--measured-width', `${rect.width}px`),
   * );
   * ```
   */
  schedulePhased<T>(sample: RafSchedulerSample<T>, apply: RafSchedulerApply<T>): void {
    if (this._frame) {
      cancelAnimationFrame(this._frame);
      this._frame = 0;
      this._callback = null;
    }

    this._cancelPhased();

    const task: PhasedTask<T> = { scheduler: this, sample, apply, active: true };

    currentPhasedTasks.set(this, task as PhasedTask);
    phasedTasks.set(this, task as PhasedTask);
    schedulePhasedFrame();
  }

  cancel(): void {
    if (this._frame) {
      cancelAnimationFrame(this._frame);
      this._frame = 0;
      this._callback = null;
    }

    this._cancelPhased();
  }

  hostDisconnected(): void {
    this.cancel();
  }

  private _cancelPhased(): void {
    const task = currentPhasedTasks.get(this);

    if (!task) {
      return;
    }

    task.active = false;
    currentPhasedTasks.delete(this);
    phasedTasks.delete(this);

    if (phasedFrame && phasedTasks.size === 0) {
      cancelAnimationFrame(phasedFrame);
      phasedFrame = 0;
    }
  }
}

export default RafScheduler;
