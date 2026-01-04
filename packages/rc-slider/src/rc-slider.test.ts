import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

import './define.js';
import type { RCSlider } from './rc-slider.js';

test('rc-slider renders progress fill', async () => {
  const screen = render(html`
    <rc-slider data-testid="host" display="float">
      <input type="range" min="0" max="100" value="25" aria-label="Fuel">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;

  expect(host.querySelector('[part="progress"]')).toBeTruthy();
});

test('rc-slider renders float value display using value-text', async () => {
  const screen = render(html`
    <rc-slider data-testid="host" display="float" value-text="25 of 100">
      <input type="range" min="0" max="100" value="25" aria-label="Fuel">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;

  await expect.element(screen.getByText('25 of 100')).toBeInTheDocument();
});

test('rc-slider keeps the native input in the DOM after upgrade', async () => {
  const screen = render(html`
    <rc-slider data-testid="host">
      <input type="range" name="fuel" min="0" max="100" value="40" aria-label="Fuel">
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
      @rc-slider-input=${inputSpy}
      @rc-slider-change=${changeSpy}
    >
      <input type="range" value="5" aria-label="Fuel">
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
    <rc-slider data-testid="host" readonly>
      <input type="range" value="5" aria-label="Fuel">
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
    <rc-slider data-testid="host" value-text="Low" orientation="vertical">
      <input type="range" value="25" aria-label="Volume">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;
  const input = host.querySelector('input') as HTMLInputElement;

  expect(input.getAttribute('aria-valuetext')).toBe('Low');
  expect(input.getAttribute('aria-orientation')).toBe('vertical');
});

test('rc-slider native for/id label association survives component upgrade', async () => {
  const screen = render(html`
    <div data-testid="wrapper">
      <label for="test-slider-input">Volume</label>
      <rc-slider data-testid="host">
        <input id="test-slider-input" type="range" value="50">
      </rc-slider>
    </div>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;

  const input = host.querySelector<HTMLInputElement>('input');
  expect(input?.isConnected).toBe(true);
  expect(input?.id).toBe('test-slider-input');
  // The label element resolves to the input via the document label registry.
  const wrapper = screen.getByTestId('wrapper').element();
  const labelEl = wrapper.querySelector<HTMLLabelElement>('label[for="test-slider-input"]');
  expect(labelEl?.control).toBe(input);
});

test('rc-slider Page Down adjusts value by 10 and fires rc-slider-input', async () => {
  const inputSpy = vi.fn();
  const screen = render(html`
    <rc-slider data-testid="host" @rc-slider-input=${inputSpy}>
      <input type="range" min="0" max="100" value="50" aria-label="Volume">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;
  const input = host.querySelector('input') as HTMLInputElement;

  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));

  expect(host.value).toBe(40);
  expect(inputSpy).toHaveBeenCalledOnce();
});

test('rc-slider progress fill reflects initial value at first render', async () => {
  const screen = render(html`
    <rc-slider data-testid="host">
      <input type="range" min="0" max="100" value="25" aria-label="Fuel">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;

  const progress = host.querySelector<HTMLElement>('[part="progress"]');
  expect(progress?.getAttribute('style')).toContain('width:25');
});

test('rc-slider disabled syncs to native input', async () => {
  const screen = render(html`
    <rc-slider data-testid="host" .disabled=${true}>
      <input type="range" aria-label="Fuel">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;

  const input = host.querySelector('input') as HTMLInputElement;
  expect(input.disabled).toBe(true);
});

test('rc-slider Page Up adjusts value by 10 and fires rc-slider-input', async () => {
  const inputSpy = vi.fn();
  const screen = render(html`
    <rc-slider data-testid="host" @rc-slider-input=${inputSpy}>
      <input type="range" min="0" max="100" value="50" aria-label="Volume">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;
  const input = host.querySelector('input') as HTMLInputElement;

  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));

  expect(host.value).toBe(60);
  expect(inputSpy).toHaveBeenCalledOnce();
});

test('rc-slider display="inline-end" renders value display', async () => {
  const screen = render(html`
    <rc-slider data-testid="host" display="inline-end">
      <input type="range" min="0" max="100" value="75" aria-label="Volume">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;

  const display = host.querySelector('[part="value-display"]');
  expect(display).toBeTruthy();
  await expect.element(screen.getByText('75')).toBeInTheDocument();
});

test('rc-slider has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-slider data-testid="host">
      <input type="range" value="5" aria-label="Fuel">
    </rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;
  await expectNoA11yViolations(host);
});

test('rc-slider defaultValue sets initial value without controlling', async () => {
  const screen = render(html`
    <rc-slider data-testid="host" label="Fuel" default-value="30"></rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;

  const input = host.querySelector('input') as HTMLInputElement;
  expect(host.value).toBe(30);
  expect(input.valueAsNumber).toBe(30);
});

test('rc-slider controlled value overrides defaultValue', async () => {
  const screen = render(html`
    <rc-slider data-testid="host" label="Fuel" default-value="30"></rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  host.value = 60;
  await host.updateComplete;

  expect(host.value).toBe(60);
  expect((host.querySelector('input') as HTMLInputElement).valueAsNumber).toBe(60);
});

test('rc-slider user input in uncontrolled mode updates value and fires rc-slider-change', async () => {
  const changeSpy = vi.fn();
  const screen = render(html`
    <rc-slider data-testid="host" label="Fuel" default-value="10" @rc-slider-change=${changeSpy}></rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;

  const input = host.querySelector('input') as HTMLInputElement;
  input.value = '20';
  input.dispatchEvent(new Event('change', { bubbles: true }));

  expect(host.value).toBe(20);
  expect(changeSpy).toHaveBeenCalledOnce();
  expect(changeSpy.mock.calls[0][0].detail.value).toBe(20);
});

test('rc-slider without defaultValue falls back to 0', async () => {
  const screen = render(html`<rc-slider data-testid="host" label="Fuel"></rc-slider>`);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;

  expect(host.value).toBe(0);
});
