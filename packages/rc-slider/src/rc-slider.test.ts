import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

import './define.js';
import type { RCSlider } from './rc-slider.js';

test('rc-slider renders ranges and value display', async () => {
  const screen = render(html`<rc-slider data-testid="host" label="Fuel" display="overlay" value="25" value-text="25 of 100"></rc-slider>`);
  const host = screen.getByTestId('host').element() as RCSlider;

  host.ranges = [{ from: 0, to: 50, part: 'low', label: 'Low range' }];
  await host.updateComplete;

  await expect.element(screen.getByText('25 of 100')).toBeInTheDocument();
  expect(host.querySelectorAll('[part~="range"]')).toHaveLength(1);
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

test('rc-slider has no automated accessibility violations', async () => {
  const screen = render(html`<rc-slider data-testid="host" label="Fuel" value="5"></rc-slider>`);
  await expectNoA11yViolations(screen.getByTestId('host').element());
});
