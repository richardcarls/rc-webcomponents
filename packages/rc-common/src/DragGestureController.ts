import type { ReactiveController, ReactiveControllerHost } from 'lit';

export type DragGestureAxis = 'both' | 'x' | 'y';
export type DragGestureActivation = 'axis' | 'immediate';

export interface DragGestureDetail {
  /** Pointer event that produced this lifecycle update. */
  event: PointerEvent;

  /** Pointer identifier for the active gesture. */
  pointerId: number;

  /** Pointer device type reported by Pointer Events. */
  pointerType: string;

  /** Horizontal coordinate where the gesture began. */
  startX: number;

  /** Vertical coordinate where the gesture began. */
  startY: number;

  /** Current horizontal coordinate. */
  x: number;

  /** Current vertical coordinate. */
  y: number;

  /** Horizontal distance from the starting coordinate. */
  deltaX: number;

  /** Vertical distance from the starting coordinate. */
  deltaY: number;

  /** Elapsed gesture duration in milliseconds. */
  duration: number;

  /** Recent horizontal velocity in pixels per second. */
  velocityX: number;

  /** Recent vertical velocity in pixels per second. */
  velocityY: number;
}

export type DragGestureTarget = Element | null | (() => Element | null);

export interface DragGestureOptions {
  /** Element that receives pointer input, or a resolver for a rendered element. */
  target: DragGestureTarget;

  /** Allowed drag axis. Defaults to both axes. */
  axis?: DragGestureAxis;

  /**
   * Whether to activate immediately or wait for dominant-axis intent.
   * Delayed axis activation preserves cross-axis scrolling.
   */
  activation?: DragGestureActivation;

  /** Distance required before delayed axis activation. Defaults to 8 pixels. */
  activationDistance?: number;

  /** Required allowed-axis dominance over the cross axis. Defaults to 1.25. */
  axisLockRatio?: number;

  /** Recent sample window used for velocity. Defaults to 100 milliseconds. */
  velocityWindow?: number;

  /** Minimum sample duration used for velocity. Defaults to 8 milliseconds. */
  minVelocityDuration?: number;

  /** Whether pointerdown listeners run during capture. */
  capture?: boolean;

  /** Whether activation stops pointer event propagation. */
  stopPropagation?: boolean;

  /** Whether active gesture events prevent their browser default. */
  preventDefault?: boolean;

  /** Whether activation focuses the target element. */
  focusOnStart?: boolean;

  /** Rejects pointerdown before the controller starts tracking it. */
  canStart?: (event: PointerEvent) => boolean;

  /** Called once when the gesture activates. */
  onStart?: (detail: DragGestureDetail) => void;
  /** Called for each active pointer move. */
  onMove?: (detail: DragGestureDetail) => void;
  /** Called when the active pointer is released. */
  onEnd?: (detail: DragGestureDetail) => void;
  /** Called when the active gesture is cancelled or loses pointer capture. */
  onCancel?: (detail: DragGestureDetail) => void;
}

type PointerSample = { x: number; y: number; time: number };

/**
 * Tracks a single-pointer drag gesture without assigning component meaning.
 *
 * The controller owns pointer capture, intent activation, lifecycle cleanup,
 * deltas, and recent velocity. Consumers remain responsible for geometry,
 * snapping, dismissal, and other semantic actions.
 */
export class DragGestureController implements ReactiveController {
  private _options: Required<
    Omit<DragGestureOptions, 'target' | 'canStart' | 'onStart' | 'onMove' | 'onEnd' | 'onCancel'>
  > &
    Pick<DragGestureOptions, 'target' | 'canStart' | 'onStart' | 'onMove' | 'onEnd' | 'onCancel'>;

  private _$target: HTMLElement | null = null;
  private _pointerId: number | null = null;
  private _startX = 0;
  private _startY = 0;
  private _startTime = 0;
  private _samples: PointerSample[] = [];
  private _activated = false;
  private _rejected = false;

  constructor(host: ReactiveControllerHost, options: DragGestureOptions) {
    this._options = {
      axis: 'both',
      activation: 'immediate',
      activationDistance: 8,
      axisLockRatio: 1.25,
      velocityWindow: 100,
      minVelocityDuration: 8,
      capture: false,
      stopPropagation: false,
      preventDefault: true,
      focusOnStart: false,
      ...options,
    };

    host.addController(this);
  }

  /** Updates behavior or the target resolver and safely rebinds listeners. */
  setOptions(options: Partial<DragGestureOptions>): void {
    Object.assign(this._options, options);
    this._bindTarget();
  }

  hostConnected(): void {
    this._bindTarget();
  }

  hostUpdated(): void {
    this._bindTarget();
  }

  hostDisconnected(): void {
    this._unbindTarget();
  }

  private _resolveTarget(): HTMLElement | null {
    const target =
      typeof this._options.target === 'function' ? this._options.target() : this._options.target;

    return target instanceof HTMLElement ? target : null;
  }

  private _bindTarget(): void {
    const $target = this._resolveTarget();

    if ($target === this._$target) {
      return;
    }

    this._unbindTarget();
    this._$target = $target;

    this._$target?.addEventListener('pointerdown', this._onPointerDown, {
      capture: this._options.capture,
    });
  }

  private _unbindTarget(): void {
    if (!this._$target) {
      return;
    }

    this._$target.removeEventListener('pointerdown', this._onPointerDown, {
      capture: this._options.capture,
    });

    this._removeCycleListeners(this._$target);
    this._reset();
    this._$target = null;
  }

  private _onPointerDown = (event: PointerEvent): void => {
    if (
      this._pointerId !== null ||
      (!event.isPrimary && event.pointerId !== 1) ||
      (event.pointerType === 'mouse' && event.button !== 0) ||
      this._options.canStart?.(event) === false
    ) {
      return;
    }

    this._pointerId = event.pointerId;
    this._startX = event.clientX;
    this._startY = event.clientY;
    this._startTime = event.timeStamp;
    this._samples = [{ x: event.clientX, y: event.clientY, time: event.timeStamp }];
    this._activated = false;
    this._rejected = false;

    const $target = this._$target;

    if (!$target) {
      return;
    }

    $target.addEventListener('pointermove', this._onPointerMove);
    $target.addEventListener('pointerup', this._onPointerUp);
    $target.addEventListener('pointercancel', this._onPointerCancel);
    $target.addEventListener('lostpointercapture', this._onLostPointerCapture);

    if (this._options.activation === 'immediate') {
      this._activate(event);
    }
  };

  private _onPointerMove = (event: PointerEvent): void => {
    if (event.pointerId !== this._pointerId || this._rejected) {
      return;
    }

    this._recordSample(event);

    if (!this._activated && !this._resolveIntent(event)) {
      return;
    }

    this._options.onMove?.(this._detail(event));

    if (this._options.preventDefault) {
      event.preventDefault();
    }
  };

  private _onPointerUp = (event: PointerEvent): void => {
    if (event.pointerId !== this._pointerId) {
      return;
    }

    this._recordSample(event);

    if (this._activated) {
      this._options.onEnd?.(this._detail(event));
    }

    this._finish();
  };

  private _onPointerCancel = (event: PointerEvent): void => {
    this._cancel(event);
  };

  private _onLostPointerCapture = (event: PointerEvent): void => {
    if (event.pointerId === this._pointerId) {
      this._cancel(event);
    }
  };

  private _resolveIntent(event: PointerEvent): boolean {
    const deltaX = event.clientX - this._startX;
    const deltaY = event.clientY - this._startY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance < this._options.activationDistance) {
      return false;
    }

    const { axis, axisLockRatio } = this._options;
    const absoluteX = Math.abs(deltaX);
    const absoluteY = Math.abs(deltaY);

    if (
      (axis === 'x' && absoluteX < absoluteY * axisLockRatio) ||
      (axis === 'y' && absoluteY < absoluteX * axisLockRatio)
    ) {
      this._rejected = true;
      this._finish();

      return false;
    }

    this._activate(event);

    return true;
  }

  private _activate(event: PointerEvent): void {
    const $target = this._$target;

    if (!$target || this._activated) {
      return;
    }

    this._activated = true;
    this._capturePointer($target, event.pointerId);

    if (this._options.focusOnStart) {
      $target.focus();
    }

    if (this._options.stopPropagation) {
      event.stopPropagation();
    }

    if (this._options.preventDefault) {
      event.preventDefault();
    }

    this._options.onStart?.(this._detail(event));
  }

  private _cancel(event: PointerEvent): void {
    if (event.pointerId !== this._pointerId) {
      return;
    }

    if (this._activated) {
      this._options.onCancel?.(this._detail(event));
    }

    this._finish();
  }

  private _finish(): void {
    const $target = this._$target;
    const pointerId = this._pointerId;

    if ($target) {
      this._removeCycleListeners($target);

      if (pointerId !== null) {
        this._releasePointer($target, pointerId);
      }
    }

    this._reset();
  }

  private _removeCycleListeners($target: HTMLElement): void {
    $target.removeEventListener('pointermove', this._onPointerMove);
    $target.removeEventListener('pointerup', this._onPointerUp);
    $target.removeEventListener('pointercancel', this._onPointerCancel);
    $target.removeEventListener('lostpointercapture', this._onLostPointerCapture);
  }

  private _recordSample(event: PointerEvent): void {
    this._samples.push({ x: event.clientX, y: event.clientY, time: event.timeStamp });

    const cutoff = event.timeStamp - this._options.velocityWindow;

    while (this._samples.length > 2 && this._samples[0].time < cutoff) {
      this._samples.shift();
    }
  }

  private _detail(event: PointerEvent): DragGestureDetail {
    const first = this._samples[0];
    const last = this._samples.at(-1) ?? first;
    const elapsed = last.time - first.time;
    const hasVelocity = elapsed >= this._options.minVelocityDuration;

    return {
      event,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: this._startX,
      startY: this._startY,
      x: event.clientX,
      y: event.clientY,
      deltaX: event.clientX - this._startX,
      deltaY: event.clientY - this._startY,
      duration: Math.max(0, event.timeStamp - this._startTime),
      velocityX: hasVelocity ? ((last.x - first.x) / elapsed) * 1000 : 0,
      velocityY: hasVelocity ? ((last.y - first.y) / elapsed) * 1000 : 0,
    };
  }

  private _capturePointer($target: HTMLElement, pointerId: number): void {
    try {
      $target.setPointerCapture(pointerId);
    } catch (error) {
      if (!(error instanceof DOMException) || error.name !== 'NotFoundError') {
        throw error;
      }
    }
  }

  private _releasePointer($target: HTMLElement, pointerId: number): void {
    try {
      if ($target.hasPointerCapture(pointerId)) {
        $target.releasePointerCapture(pointerId);
      }
    } catch {
      // The active pointer can disappear before teardown.
    }
  }

  private _reset(): void {
    this._pointerId = null;
    this._samples = [];
    this._activated = false;
    this._rejected = false;
  }
}

export default DragGestureController;
