---
"@rcarls/rc-virtual-canvas": minor
"@rcarls/rc-webcomponents": minor
---

Add `canvasScaleX` and `canvasScaleY` read-only getters to `RCVirtualCanvas`.

Returns the ratio of canvas backing-store pixels to CSS pixels along each axis — equal to `devicePixelRatio` when `autoResizeCanvas` is `true`. Eliminates the need for consumers to manually compute `canvas.width / canvas.clientWidth` before scaling the canvas context.

Update React and Solid aggregate type definitions to include the new getters on `RCVirtualCanvasRef`.
