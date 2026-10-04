import { html, type ReactiveControllerHost } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { ResizeController, pinElementBox } from './ResizeController.js';

test('pinElementBox preserves visual geometry inside a containing block', async () => {
  const screen = render(html`
    <div data-testid="container" style="position: fixed; inset: 6rem 1rem 2rem; contain: layout;">
      <div
        data-testid="target"
        style="position: fixed; inset: auto 0 0; inline-size: 12rem; block-size: 8rem;"
      ></div>
    </div>
  `);
  const $container = (await screen.getByTestId('container').element()) as HTMLElement;
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const before = $target.getBoundingClientRect();

  pinElementBox($target);

  const after = $target.getBoundingClientRect();

  expect(Math.round(after.left)).toBe(Math.round(before.left));

  expect(Math.round(after.top)).toBe(Math.round(before.top));

  expect(Math.round(after.right)).toBe(Math.round(before.right));

  expect(Math.round(after.bottom)).toBe(Math.round(before.bottom));

  expect(Number.parseFloat($target.style.top)).toBeCloseTo(
    before.top - $container.getBoundingClientRect().top,
  );
});

function createHost(): ReactiveControllerHost {
  return {
    addController() {},
    removeController() {},
    requestUpdate() {},
    updateComplete: Promise.resolve(true),
  };
}

test('puts the resize grip at the end corner and resizes from it in RTL', async () => {
  const screen = render(html`
    <div
      dir="rtl"
      data-testid="target"
      style="position: fixed; top: 50px; left: 100px; inline-size: 200px; block-size: 100px;"
    ></div>
  `);
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const ctl = new ResizeController(createHost(), { target: $target, direction: 'both' });

  ctl.hostConnected();

  const $grip = $target.querySelector<HTMLElement>('[data-rc-resize-corner]');

  expect($grip).not.toBeNull();

  const box = $target.getBoundingClientRect();
  const grip = $grip!.getBoundingClientRect();

  // Bottom-left: the inline-end, block-end corner in RTL, as for native resize.
  expect(grip.left).toBeCloseTo(box.left, 0);
  expect(grip.bottom).toBeCloseTo(box.bottom, 0);

  // ArrowLeft drags that corner outward, widening the box from its left edge.
  $grip!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

  const after = $target.getBoundingClientRect();

  expect(after.width).toBeGreaterThan(box.width);
  expect(after.right).toBeCloseTo(box.right, 0);

  ctl.hostDisconnected();
});

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/** A ResizeObserver reports once after observe(); flip only after that. */
async function settle() {
  await nextFrame();
  await nextFrame();
}

async function mountInWrapper({
  direction = 'both',
  useHandle = false,
}: {
  direction?: 'both' | 'horizontal' | 'vertical';
  useHandle?: boolean;
} = {}) {
  const screen = render(html`
    <div data-testid="wrapper" dir="ltr">
      <div
        data-testid="target"
        style="position: fixed; top: 50px; left: 100px; inline-size: 200px; block-size: 100px;"
      >
        <div data-testid="handle" style="inline-size: 8px; block-size: 8px;"></div>
      </div>
    </div>
  `);
  const wrapper = (await screen.getByTestId('wrapper').element()) as HTMLElement;
  const target = (await screen.getByTestId('target').element()) as HTMLElement;
  const handle = (await screen.getByTestId('handle').element()) as HTMLElement;
  const ctl = new ResizeController(createHost(), {
    target,
    direction,
    handle: useHandle ? handle : null,
  });

  ctl.hostConnected();
  await settle();

  return { wrapper, target, handle, ctl };
}

function getGrip(target: HTMLElement): HTMLElement {
  const grip = target.querySelector<HTMLElement>('[data-rc-resize-corner]');

  if (!grip) {
    throw new Error('Expected an injected resize grip');
  }

  return grip;
}

test('moves the corner grip and its cursor when the direction flips at runtime', async () => {
  const { wrapper, target, ctl } = await mountInWrapper();
  const grip = getGrip(target);

  expect(grip.getBoundingClientRect().right).toBeCloseTo(target.getBoundingClientRect().right, 0);
  expect(grip.style.cursor).toBe('se-resize');

  // Nothing resizes, so only a direction observer can move the grip.
  wrapper.dir = 'rtl';

  await vi.waitFor(() => {
    expect(grip.getBoundingClientRect().left).toBeCloseTo(target.getBoundingClientRect().left, 0);
    expect(grip.style.cursor).toBe('sw-resize');
  });

  // The keyboard already resolves the edge per key: ArrowLeft widens leftward.
  const before = target.getBoundingClientRect();

  grip.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

  expect(target.getBoundingClientRect().width).toBeGreaterThan(before.width);
  expect(target.getBoundingClientRect().right).toBeCloseTo(before.right, 0);

  ctl.hostDisconnected();
});

test('turns an author handle cursor when the direction flips at runtime', async () => {
  const { wrapper, handle, ctl } = await mountInWrapper({
    direction: 'horizontal',
    useHandle: true,
  });

  expect(handle.style.cursor).toBe('e-resize');

  wrapper.dir = 'rtl';

  await vi.waitFor(() => expect(handle.style.cursor).toBe('w-resize'));

  ctl.hostDisconnected();
});

test('moves the corner grip after a writing-mode change once a pointer enters', async () => {
  const { wrapper, target, ctl } = await mountInWrapper();
  const grip = getGrip(target);

  // No event reports this: the target keeps its logical size, so even a
  // ResizeObserver stays silent. A pointer has to enter before it can reach
  // the grip, which is when the corner is re-derived.
  wrapper.style.writingMode = 'vertical-rl';

  await settle();
  target.dispatchEvent(new PointerEvent('pointerenter'));

  // vertical-rl puts the block end on the left and the inline end at the bottom.
  await vi.waitFor(() => {
    expect(grip.getBoundingClientRect().left).toBeCloseTo(target.getBoundingClientRect().left, 0);

    expect(grip.getBoundingClientRect().bottom).toBeCloseTo(
      target.getBoundingClientRect().bottom,
      0,
    );
  });

  ctl.hostDisconnected();
});

test('dispose restores the handle and removes the controller from its host', async () => {
  const screen = render(html`
    <div data-testid="target" style="position: fixed; inline-size: 200px; block-size: 100px;">
      <span data-testid="handle">Resize</span>
    </div>
  `);
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const $handle = (await screen.getByTestId('handle').element()) as HTMLElement;
  const host = createHost();
  const removeController = vi.spyOn(host, 'removeController');
  const ctl = new ResizeController(host, {
    target: $target,
    handle: $handle,
    direction: 'vertical',
  });

  ctl.hostConnected();

  expect($handle.getAttribute('tabindex')).toBe('0');
  expect($handle.style.touchAction).toBe('none');

  ctl.dispose();

  expect($handle.hasAttribute('tabindex')).toBe(false);
  expect($handle.style.cursor).toBe('');
  expect($handle.style.touchAction).toBe('');
  // The controller and its pointer gesture both leave the host.
  expect(removeController).toHaveBeenCalledTimes(2);
  expect(removeController).toHaveBeenCalledWith(ctl);

  const before = $target.getBoundingClientRect();

  $handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

  expect($target.getBoundingClientRect().height).toBe(before.height);
});

test('dispose keeps an author tabindex on the handle', async () => {
  const screen = render(html`
    <div data-testid="target" style="position: fixed; inline-size: 200px; block-size: 100px;">
      <span data-testid="handle" tabindex="-1">Resize</span>
    </div>
  `);
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const $handle = (await screen.getByTestId('handle').element()) as HTMLElement;
  const ctl = new ResizeController(createHost(), {
    target: $target,
    handle: $handle,
    direction: 'vertical',
  });

  ctl.hostConnected();
  ctl.dispose();

  expect($handle.getAttribute('tabindex')).toBe('-1');
});

test('dispose restores authored handle styles and keeps later tabindex changes', async () => {
  const screen = render(html`
    <div data-testid="target">
      <span data-testid="handle" style="cursor: grab; touch-action: pan-x">Resize</span>
    </div>
  `);
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const $handle = (await screen.getByTestId('handle').element()) as HTMLElement;
  const ctl = new ResizeController(createHost(), {
    target: $target,
    handle: $handle,
    direction: 'vertical',
  });

  ctl.hostConnected();
  $handle.setAttribute('tabindex', '-1');
  ctl.dispose();
  ctl.dispose();

  expect($handle.getAttribute('tabindex')).toBe('-1');
  expect($handle.style.cursor).toBe('grab');
  expect($handle.style.touchAction).toBe('pan-x');
});

test('dispose keeps handle styles changed by the author after attachment', async () => {
  const screen = render(html`
    <div data-testid="target"><span data-testid="handle">Resize</span></div>
  `);
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const $handle = (await screen.getByTestId('handle').element()) as HTMLElement;
  const ctl = new ResizeController(createHost(), {
    target: $target,
    handle: $handle,
    direction: 'vertical',
  });

  ctl.hostConnected();
  $handle.style.cursor = 'grab';
  $handle.style.touchAction = 'pan-y';
  ctl.dispose();

  expect($handle.style.cursor).toBe('grab');
  expect($handle.style.touchAction).toBe('pan-y');
});

test('edge resize disposal restores the cursor and removes an idle grip', async () => {
  const screen = render(html`
    <div data-testid="target" style="width: 200px; height: 100px; cursor: grab"></div>
  `);
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const ctl = new ResizeController(createHost(), { target: $target, direction: 'both' });

  ctl.hostConnected();

  const box = $target.getBoundingClientRect();

  $target.dispatchEvent(
    new PointerEvent('pointermove', {
      bubbles: true,
      clientX: box.right - 2,
      clientY: box.top + box.height / 2,
    }),
  );

  expect($target.style.cursor).toBe('e-resize');
  expect($target.querySelector('[data-rc-resize-corner]')).not.toBeNull();

  ctl.dispose();

  expect($target.style.cursor).toBe('grab');
  expect($target.querySelector('[data-rc-resize-corner]')).toBeNull();
  expect($target.style.position).toBe('');
});

test('setOptions replaces the handle and restores the previous handle', async () => {
  const screen = render(html`
    <div data-testid="target">
      <span data-testid="first">First</span>
      <span data-testid="second">Second</span>
    </div>
  `);
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const $first = (await screen.getByTestId('first').element()) as HTMLElement;
  const $second = (await screen.getByTestId('second').element()) as HTMLElement;
  const ctl = new ResizeController(createHost(), {
    target: $target,
    handle: $first,
    direction: 'vertical',
  });

  ctl.hostConnected();
  ctl.setOptions({ handle: $second });

  expect($first.hasAttribute('tabindex')).toBe(false);
  expect($first.style.touchAction).toBe('');
  expect($second.getAttribute('tabindex')).toBe('0');
  expect($second.style.touchAction).toBe('none');

  ctl.dispose();

  expect($second.hasAttribute('tabindex')).toBe(false);
});

test('setOptions disables and re-enables pointer resizing on an explicit handle', async () => {
  const screen = render(html`
    <div data-testid="target" style="position: fixed; width: 200px; height: 100px">
      <span data-testid="handle">Resize</span>
    </div>
  `);
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const $handle = (await screen.getByTestId('handle').element()) as HTMLElement;
  const onResizeStart = vi.fn();
  const host = createHost();

  vi.spyOn(host, 'addController').mockImplementation((controller) => controller.hostConnected?.());

  const ctl = new ResizeController(host, {
    target: $target,
    handle: $handle,
    direction: 'vertical',
    onResizeStart,
  });

  ctl.setOptions({ direction: 'none' });
  expect($handle.hasAttribute('tabindex')).toBe(false);

  $handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
  expect(onResizeStart).not.toHaveBeenCalled();

  ctl.setOptions({ direction: 'vertical' });
  $handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
  expect(onResizeStart).toHaveBeenCalledOnce();

  ctl.dispose();
});

test('disconnect restores handle styles and reconnect reapplies them', async () => {
  const screen = render(html`
    <div data-testid="target"><span data-testid="handle" style="cursor: grab">Resize</span></div>
  `);
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const $handle = (await screen.getByTestId('handle').element()) as HTMLElement;
  const ctl = new ResizeController(createHost(), {
    target: $target,
    handle: $handle,
    direction: 'vertical',
  });

  ctl.hostConnected();
  ctl.hostDisconnected();
  expect($handle.style.cursor).toBe('grab');

  ctl.hostConnected();
  expect($handle.style.cursor).toBe('s-resize');

  ctl.dispose();
  expect($handle.style.cursor).toBe('grab');
});

test('dispose stops an active resize and releases its pointer', async () => {
  const screen = render(html`
    <div data-testid="target" style="position: fixed; width: 200px; height: 100px">
      <span data-testid="handle">Resize</span>
    </div>
  `);
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const $handle = (await screen.getByTestId('handle').element()) as HTMLElement;
  const release = vi.spyOn($handle, 'releasePointerCapture').mockImplementation(() => {});
  const onResize = vi.fn();

  vi.spyOn($handle, 'hasPointerCapture').mockReturnValue(true);

  const host = createHost();

  vi.spyOn(host, 'addController').mockImplementation((controller) => controller.hostConnected?.());

  const ctl = new ResizeController(host, {
    target: $target,
    handle: $handle,
    direction: 'vertical',
    onResize,
  });

  $handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
  ctl.dispose();

  $handle.dispatchEvent(
    new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientY: 40 }),
  );

  expect(onResize).not.toHaveBeenCalled();
  expect(release).toHaveBeenCalledWith(1);
});
