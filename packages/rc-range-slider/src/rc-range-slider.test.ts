import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

import './define.js';
import type { RCRangeSlider } from './rc-range-slider.js';

function getInputs(host: RCRangeSlider): [HTMLInputElement, HTMLInputElement] {
  const inputs = Array.from(host.querySelectorAll<HTMLInputElement>('input[type="range"]'));
  if (inputs.length !== 2) throw new Error(`Expected 2 range inputs, got ${inputs.length}`);
  return [inputs[0], inputs[1]];
}

test('rc-range-slider renders two inputs with correct ARIA attributes', async () => {
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      label="Price range"
      .value=${[20, 80] as [number, number]}
      min="0"
      max="100"
    ></rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput, highInput] = getInputs(host);

  // Low input: value correct, max capped at high (cross-constraint via attribute)
  expect(lowInput.valueAsNumber).toBe(20);
  expect(parseInt(lowInput.getAttribute('min')!)).toBe(0);
  expect(parseInt(lowInput.getAttribute('max')!)).toBe(80); // capped at high

  // High input: value correct, min floored at low
  expect(highInput.valueAsNumber).toBe(80);
  expect(parseInt(highInput.getAttribute('min')!)).toBe(20); // floored at low
  expect(parseInt(highInput.getAttribute('max')!)).toBe(100);
});

test('rc-range-slider low thumb ArrowRight increments low value', async () => {
  const inputSpy = vi.fn();
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      label="Price range"
      .value=${[20, 80] as [number, number]}
      @rc-range-slider-input=${inputSpy}
    ></rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput] = getInputs(host);
  lowInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

  expect(host.value[0]).toBe(21);
  expect(host.value[1]).toBe(80);
  expect(inputSpy).toHaveBeenCalledOnce();
});

test('rc-range-slider high thumb ArrowLeft decrements high value', async () => {
  const inputSpy = vi.fn();
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      label="Price range"
      .value=${[20, 80] as [number, number]}
      @rc-range-slider-input=${inputSpy}
    ></rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [, highInput] = getInputs(host);
  highInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

  expect(host.value[0]).toBe(20);
  expect(host.value[1]).toBe(79);
  expect(inputSpy).toHaveBeenCalledOnce();
});

test('rc-range-slider low thumb cannot exceed high thumb value', async () => {
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      label="Price range"
      .value=${[79, 80] as [number, number]}
    ></rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput] = getInputs(host);
  lowInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await host.updateComplete;
  lowInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

  expect(host.value[0]).toBe(80); // clamped at high
});

test('rc-range-slider high thumb cannot go below low thumb value', async () => {
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      label="Price range"
      .value=${[20, 21] as [number, number]}
    ></rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [, highInput] = getInputs(host);
  highInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  await host.updateComplete;
  highInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

  expect(host.value[1]).toBe(20); // clamped at low
});

test('rc-range-slider Page Down moves low thumb by 10 steps', async () => {
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      label="Price range"
      .value=${[30, 70] as [number, number]}
    ></rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput] = getInputs(host);
  lowInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));

  expect(host.value[0]).toBe(20);
});

test('rc-range-slider Page Up moves high thumb by 10 steps', async () => {
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      label="Price range"
      .value=${[30, 70] as [number, number]}
    ></rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [, highInput] = getInputs(host);
  highInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));

  expect(host.value[1]).toBe(80);
});

test('rc-range-slider Home/End jump low thumb to bounds', async () => {
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      label="Price range"
      .value=${[30, 70] as [number, number]}
      min="0"
      max="100"
    ></rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput] = getInputs(host);

  lowInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  expect(host.value[0]).toBe(0);

  lowInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  expect(host.value[0]).toBe(70); // low's End = high
});

test('rc-range-slider Home/End jump high thumb to bounds', async () => {
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      label="Price range"
      .value=${[30, 70] as [number, number]}
      min="0"
      max="100"
    ></rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [, highInput] = getInputs(host);

  highInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  expect(host.value[1]).toBe(100);

  highInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  // After End, high=100 and low=30, so Home → high = low (30)
  expect(host.value[1]).toBe(30);
});

test('rc-range-slider fires input and change events via native input', async () => {
  const inputSpy = vi.fn();
  const changeSpy = vi.fn();
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      label="Price range"
      .value=${[20, 80] as [number, number]}
      @rc-range-slider-input=${inputSpy}
      @rc-range-slider-change=${changeSpy}
    ></rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput] = getInputs(host);

  lowInput.value = '25';
  lowInput.dispatchEvent(new Event('input', { bubbles: true }));
  lowInput.dispatchEvent(new Event('change', { bubbles: true }));

  expect(host.value[0]).toBe(25);
  expect(inputSpy).toHaveBeenCalledOnce();
  expect(changeSpy).toHaveBeenCalledOnce();
});

test('rc-range-slider exposes aria-valuetext on each input', async () => {
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      label="Price range"
      .value=${[20, 80] as [number, number]}
      low-value-text="$20"
      high-value-text="$80"
    ></rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput, highInput] = getInputs(host);
  expect(lowInput.getAttribute('aria-valuetext')).toBe('$20');
  expect(highInput.getAttribute('aria-valuetext')).toBe('$80');
});

test('rc-range-slider willUpdate clamps values to [min, max]', async () => {
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      label="Year range"
      min="2000"
      max="2030"
    ></rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  expect(host.value[0]).toBeGreaterThanOrEqual(2000);
  expect(host.value[1]).toBeLessThanOrEqual(2030);
});

test('rc-range-slider range fill style reflects current values', async () => {
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      label="Price range"
      .value=${[25, 75] as [number, number]}
      min="0"
      max="100"
    ></rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const rangeEl = host.querySelector<HTMLElement>('[part~="range"]');
  expect(rangeEl?.getAttribute('style')).toContain('left:25');
  expect(rangeEl?.getAttribute('style')).toContain('width:50');
});

test('rc-range-slider progressive enhancement reads child input config', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host" label="Price">
      <input type="range" name="price-min" min="10" max="500" value="50">
      <input type="range" name="price-max" min="10" max="500" value="400">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  expect(host.min).toBe(10);
  expect(host.max).toBe(500);
  expect(host.value[0]).toBe(50);
  expect(host.value[1]).toBe(400);

  const [lowInput] = getInputs(host);
  expect(lowInput.getAttribute('name')).toBe('price-min');
});

test('rc-range-slider name attribute derives low/high input names', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host" label="Price" name="price"></rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput, highInput] = getInputs(host);
  expect(lowInput.getAttribute('name')).toBe('price-low');
  expect(highInput.getAttribute('name')).toBe('price-high');
});

test('rc-range-slider has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      label="Price range"
      .value=${[20, 80] as [number, number]}
    ></rc-range-slider>
  `);
  await expectNoA11yViolations(screen.getByTestId('host').element());
});
