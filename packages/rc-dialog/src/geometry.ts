import type { ReactiveControllerHost } from 'lit';

import {
  DragController,
  ResizeController,
  type ResizeDirection,
  type ResizeLifecycleDetail,
  type ResizeOrigin,
} from '@rcarls/rc-common';

/** Move and resize options a dialog passes to {@link DialogGeometry.sync}. */
export interface DialogGeometryOptions {
  movable: boolean;
  moveHandle: string;
  moveBounds: 'viewport' | 'parent';
  moveStep: number;
  resize: ResizeDirection;
  resizeOrigin: ResizeOrigin;
  resizeHandle: string;
  resizeThreshold: number;
  resizeStep: number;
  onResizeStart: (detail: ResizeLifecycleDetail) => void;
  onResize: (detail: ResizeLifecycleDetail) => void;
  onResizeEnd: (detail: ResizeLifecycleDetail) => void;
}

/**
 * Pointer and keyboard move and resize behavior for an `rc-dialog` surface.
 *
 * `rc-dialog` loads this module on demand the first time `movable`,
 * `move-handle`, or `resize` asks for it, so dialogs that never move or resize
 * do not ship the drag and resize controllers. A subclass that always resizes,
 * such as `rc-bottom-sheet`, imports `@rcarls/rc-dialog/geometry` and assigns
 * this class to its static `_geometryClass`, which makes the behavior
 * available synchronously.
 */
export class DialogGeometry {
  private readonly _host: ReactiveControllerHost & HTMLElement;
  private _dragController: DragController | null = null;
  // Move-relevant options the current controller was built from.
  private _dragConfig: readonly ConfigValue[] = [];
  private _resizeControllers: ResizeController[] = [];
  // Resize-relevant options the current controllers were built from.
  private _resizeConfig: readonly ConfigValue[] = [];

  constructor(host: ReactiveControllerHost & HTMLElement) {
    this._host = host;
  }

  /**
   * Rebuilds the move and resize controllers when their options differ from
   * the ones they were built from, or unconditionally when `force` is set (a
   * newly wired or torn-down `<dialog>`). A `null` dialog disposes both.
   */
  sync($dialog: HTMLDialogElement | null, options: DialogGeometryOptions, force = false): void {
    this._syncDragController($dialog, options, force);
    this._syncResizeControllers($dialog, options, force);
  }

  /**
   * Resolves `move-bounds`, which limits both moving and resizing. The controllers read `parent`
   * as the target's parent, which for the inner `<dialog>` is the inline `rc-dialog` host with an
   * empty box, so `parent` names the element that contains the host instead.
   */
  private _bounds(options: DialogGeometryOptions): 'viewport' | Element {
    return options.moveBounds === 'parent' ? (this._host.parentElement ?? 'viewport') : 'viewport';
  }

  /** Disposes every controller this instance created. */
  dispose(): void {
    this._dragController?.dispose();
    this._dragController = null;
    this._dragConfig = [];

    for (const controller of this._resizeControllers) {
      controller.dispose();
    }

    this._resizeControllers = [];
    this._resizeConfig = [];
  }

  private _syncDragController(
    $dialog: HTMLDialogElement | null,
    options: DialogGeometryOptions,
    force: boolean,
  ): void {
    const enabled = !!$dialog && (options.movable || !!options.moveHandle);
    const bounds = this._bounds(options);
    const config = enabled ? [options.moveHandle, bounds, options.moveStep] : [];

    if (!force && sameConfig(config, this._dragConfig)) {
      return;
    }

    this._dragConfig = config;
    this._dragController?.dispose();
    this._dragController = null;

    if (!enabled) {
      return;
    }

    const $handle = options.moveHandle
      ? ($dialog.querySelector<Element>(options.moveHandle) ?? $dialog)
      : $dialog;

    this._dragController = new DragController(this._host, {
      target: $dialog,
      handle: $handle,
      bounds,
      step: options.moveStep,
    });
  }

  private _syncResizeControllers(
    $dialog: HTMLDialogElement | null,
    options: DialogGeometryOptions,
    force: boolean,
  ): void {
    const bounds = this._bounds(options);
    const config = $dialog
      ? [
          options.resize,
          options.resizeOrigin,
          options.resizeHandle,
          options.resizeThreshold,
          options.resizeStep,
          bounds,
        ]
      : [];

    if (!force && sameConfig(config, this._resizeConfig)) {
      return;
    }

    this._resizeConfig = config;

    for (const controller of this._resizeControllers) {
      controller.dispose();
    }

    this._resizeControllers = [];

    if (!$dialog || options.resize === 'none') {
      return;
    }

    const $handles = resizeHandles($dialog, options.resizeHandle);
    const shared = {
      target: $dialog,
      threshold: options.resizeThreshold,
      step: options.resizeStep,
      bounds,
      onResizeStart: options.onResizeStart,
      onResize: options.onResize,
      onResizeEnd: options.onResizeEnd,
    };

    if ($handles.length === 0) {
      this._resizeControllers.push(
        new ResizeController(this._host, {
          ...shared,
          direction: options.resize,
          origin: options.resizeOrigin,
        }),
      );

      return;
    }

    for (const $handle of $handles) {
      this._resizeControllers.push(
        new ResizeController(this._host, {
          ...shared,
          direction: resizeDirectionForHandle($handle, options.resize),
          handle: $handle,
          origin: resizeOriginForHandle($handle, options.resizeOrigin),
        }),
      );
    }
  }
}

type ConfigValue = string | number | Element;

function sameConfig(current: readonly ConfigValue[], previous: readonly ConfigValue[]): boolean {
  return (
    current.length === previous.length && current.every((value, index) => value === previous[index])
  );
}

function resizeHandles($dialog: HTMLDialogElement, selector: string): Element[] {
  if (!selector) {
    return [];
  }

  try {
    return [...$dialog.querySelectorAll(selector)];
  } catch {
    if (import.meta.env.DEV) {
      console.warn('[rc-dialog] Invalid resize-handle selector.', selector);
    }

    return [];
  }
}

function resizeDirectionForHandle($handle: Element, fallback: ResizeDirection): ResizeDirection {
  switch ($handle.getAttribute('data-rc-dialog-resize-axis')) {
    case 'x':
      return 'horizontal';
    case 'y':
      return 'vertical';
    case 'both':
      return 'both';
    default:
      return fallback;
  }
}

function resizeOriginForHandle($handle: Element, fallback: ResizeOrigin): ResizeOrigin {
  return ($handle.getAttribute('data-rc-dialog-resize-origin') as ResizeOrigin | null) ?? fallback;
}
