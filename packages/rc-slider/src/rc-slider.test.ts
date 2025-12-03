import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

import './define.js';
import type { RCSlider } from './rc-slider.js';

test('rc-slider renders progress fill', async () => {
  const screen = render(html`
    <rc-slider data-testid="host" label="Fuel" display="float">
      <input type="range" min="0" max="100" value="25">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;

  expect(host.querySelector('[part="progress"]')).toBeTruthy();
});

test('rc-slider renders float value display using value-text', async () => {
  const screen = render(html`
    <rc-slider data-testid="host" label="Fuel" display="float" value-text="25 of 100">
      <input type="range" min="0" max="100" value="25">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;

  await expect.element(screen.getByText('25 of 100')).toBeInTheDocument();
});

test('rc-slider keeps the native input in the DOM after upgrade', async () => {
  const screen = render(html`
    <rc-slider data-testid="host" label="Fuel">
      <input type="range" name="fuel" min="0" max="100" value="40">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;

  const input = host.querySelector<HTMLInputElement>('input[type="range"]');
  expect(input).toBeTruthy();
  expect(input?.isConnected).toBe(true);
  expect(input?.getAttribute('name')).toBe('fuel');
});

test('rc-slider fires input and change events', async () => {
  const inputSpy = vi.fn();
  const changeSpy = vi.fn();
  const screen = render(html`
    <rc-slider
      data-testid="host"
      label="Fuel"
      @rc-slider-input=${inputSpy}
      @rc-slider-change=${changeSpy}
    >
      <input type="range" value="5">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;
  const input = host.querySelector('input') as HTMLInputElement;

  input.value = '7';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));

  expect(inputSpy).toHaveBeenCalledOnce();
  expect(changeSpy).toHaveBeenCalledOnce();
});

test('rc-slider readonly suppresses value updates', async () => {
  const screen = render(html`
    <rc-slider data-testid="host" label="Fuel" readonly>
      <input type="range" value="5">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;
  const input = host.querySelector('input') as HTMLInputElement;

  input.value = '9';
  input.dispatchEvent(new Event('input', { bubbles: true }));

  expect(host.value).toBe(5);
  expect(input.value).toBe('5');
});

test('rc-slider exposes aria-valuetext and aria-orientation via updated()', async () => {
  const screen = render(html`
    <rc-slider data-testid="host" label="Volume" value-text="Low" orientation="vertical">
      <input type="range" value="25">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;
  const input = host.querySelector('input') as HTMLInputElement;

  expect(input.getAttribute('aria-valuetext')).toBe('Low');
  expect(input.getAttribute('aria-orientation')).toBe('vertical');
});

test('rc-slider label property wires aria-labelledby to the native input', async () => {
  const screen = render(html`
    <rc-slider data-testid="host" label="Volume">
      <input type="range" value="50">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;

  const labelSpan = host.querySelector<HTMLElement>('[part="label"]');
  const input = host.querySelector<HTMLInputElement>('input');
  expect(labelSpan).toBeTruthy();
  expect(input?.getAttribute('aria-labelledby')).toBe(labelSpan?.id);
});

test('rc-slider Page Down adjusts value by 10 and fires rc-slider-input', async () => {
  const inputSpy = vi.fn();
  const screen = render(html`
    <rc-slider data-testid="host" label="Volume" @rc-slider-input=${inputSpy}>
      <input type="range" min="0" max="100" value="50">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;
  const input = host.querySelector('input') as HTMLInputElement;

  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));

  expect(host.value).toBe(40);
  expect(inputSpy).toHaveBeenCalledOnce();
});

test('rc-slider has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-slider data-testid="host" label="Fuel">
      <input type="range" value="5">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  // Wait for updated() to run so aria-labelledby is applied to the native input.
  await host.updateComplete;
  await expectNoA11yViolations(host);
});
