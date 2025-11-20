import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

import './define.js';
import type { RCRangeSlider } from './rc-range-slider.js';

test('rc-range-slider renders two thumbs with correct ARIA attributes', async () => {
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

  const [lowThumb, highThumb] = Array.from(host.querySelectorAll<HTMLElement>('[role="slider"]'));

  expect(lowThumb.getAttribute('aria-valuenow')).toBe('20');
  expect(lowThumb.getAttribute('aria-valuemin')).toBe('0');
  expect(lowThumb.getAttribute('aria-valuemax')).toBe('80'); // capped at high thumb

  expect(highThumb.getAttribute('aria-valuenow')).toBe('80');
  expect(highThumb.getAttribute('aria-valuemin')).toBe('20'); // floored at low thumb
  expect(highThumb.getAttribute('aria-valuemax')).toBe('100');
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

  const [lowThumb] = Array.from(host.querySelectorAll<HTMLElement>('[role="slider"]'));
  lowThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

  expect(host.value[0]).toBe(21);
  expect(host.value[1]).toBe(80); // high unchanged
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

  const thumbs = Array.from(host.querySelectorAll<HTMLElement>('[role="slider"]'));
  const highThumb = thumbs[1];
  highThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

  expect(host.value[0]).toBe(20); // low unchanged
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

  const [lowThumb] = Array.from(host.querySelectorAll<HTMLElement>('[role="slider"]'));
  lowThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  lowThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

  expect(host.value[0]).toBe(80); // clamped at high value
});

test('rc-range-slider Page Up/Down moves by 10 steps', async () => {
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      label="Price range"
      .value=${[30, 70] as [number, number]}
    ></rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowThumb] = Array.from(host.querySelectorAll<HTMLElement>('[role="slider"]'));
  lowThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));

  expect(host.value[0]).toBe(20);
});

test('rc-range-slider Home/End jump to bounds', async () => {
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

  const thumbs = Array.from(host.querySelectorAll<HTMLElement>('[role="slider"]'));
  thumbs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));

  expect(host.value[1]).toBe(100);
});

test('rc-range-slider exposes aria-valuetext when set', async () => {
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

  const [lowThumb, highThumb] = Array.from(host.querySelectorAll<HTMLElement>('[role="slider"]'));
  expect(lowThumb.getAttribute('aria-valuetext')).toBe('$20');
  expect(highThumb.getAttribute('aria-valuetext')).toBe('$80');
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

test('rc-range-slider willUpdate clamps default value to [min, max]', async () => {
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

test('rc-range-slider thumb elements are positioned via inline style', async () => {
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

  const [lowThumb, highThumb] = Array.from(
    host.querySelectorAll<HTMLElement>('.rc-range-slider-thumb'),
  );
  expect(lowThumb.getAttribute('style')).toBe('left:25%');
  expect(highThumb.getAttribute('style')).toBe('left:75%');
});
