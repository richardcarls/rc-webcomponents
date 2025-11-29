import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

import './define.js';
import type { RCSlider } from './rc-slider.js';

test('rc-slider renders progress fill and float value display', async () => {
  const screen = render(html`<rc-slider data-testid="host" label="Fuel" display="float" value="25" value-text="25 of 100"></rc-slider>`);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;

  await expect.element(screen.getByText('25 of 100')).toBeInTheDocument();
  expect(host.querySelector('[part="progress"]')).toBeTruthy();
});

test('rc-slider fires input and change events', async () => {
  const inputSpy = vi.fn();
  const changeSpy = vi.fn();
  const screen = render(html`
    <rc-slider
      data-testid="host"
      label="Fuel"
      value="5"
      @rc-slider-input=${inputSpy}
      @rc-slider-change=${changeSpy}
    ></rc-slider>
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
  const screen = render(html`<rc-slider data-testid="host" label="Fuel" value="5" readonly></rc-slider>`);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;
  const input = host.querySelector('input') as HTMLInputElement;

  input.value = '9';
  input.dispatchEvent(new Event('input', { bubbles: true }));

  expect(host.value).toBe(5);
  expect(input.value).toBe('5');
});

test('rc-slider exposes aria-valuetext and aria-orientation', async () => {
  const screen = render(html`
    <rc-slider data-testid="host" label="Volume" value="25" value-text="Low" orientation="vertical"></rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;
  const input = host.querySelector('input') as HTMLInputElement;

  expect(input.getAttribute('aria-valuetext')).toBe('Low');
  expect(input.getAttribute('aria-orientation')).toBe('vertical');
});

test('rc-slider Page Down adjusts value by 10 and fires rc-slider-input', async () => {
  const inputSpy = vi.fn();
  const screen = render(html`
    <rc-slider data-testid="host" label="Volume" value="50" @rc-slider-input=${inputSpy}></rc-slider>
  `);
  const host = screen.getByTestId('host').element() as RCSlider;
  await host.updateComplete;
  const input = host.querySelector('input') as HTMLInputElement;

  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));

  expect(host.value).toBe(40);
  expect(inputSpy).toHaveBeenCalledOnce();
});

test('rc-slider has no automated accessibility violations', async () => {
  const screen = render(html`<rc-slider data-testid="host" label="Fuel" value="5"></rc-slider>`);
  await expectNoA11yViolations(screen.getByTestId('host').element());
});
