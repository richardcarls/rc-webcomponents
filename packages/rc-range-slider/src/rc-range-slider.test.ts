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

test('rc-range-slider renders two inputs with correct cross-constraint ARIA attributes', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host">
      <input type="range" min="0" max="100" value="20" aria-label="Minimum price">
      <input type="range" min="0" max="100" value="80" aria-label="Maximum price">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput, highInput] = getInputs(host);

  expect(lowInput.valueAsNumber).toBe(20);
  expect(highInput.valueAsNumber).toBe(80);

  // Cross-constraints are set via aria-valuemax / aria-valuemin, not via the native max/min.
  expect(lowInput.getAttribute('aria-valuemax')).toBe('80');
  expect(highInput.getAttribute('aria-valuemin')).toBe('20');
});

test('rc-range-slider keeps both native inputs in the DOM after upgrade', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host">
      <input type="range" name="price-min" min="10" max="500" value="50" aria-label="Minimum">
      <input type="range" name="price-max" min="10" max="500" value="400" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  expect(host.value[0]).toBe(50);
  expect(host.value[1]).toBe(400);

  const [lowInput] = getInputs(host);
  expect(lowInput.getAttribute('name')).toBe('price-min');
  expect(lowInput.isConnected).toBe(true);
});

test('rc-range-slider low thumb ArrowRight increments low value', async () => {
  const inputSpy = vi.fn();
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      @rc-range-slider-input=${inputSpy}
    >
      <input type="range" min="0" max="100" value="20" aria-label="Minimum">
      <input type="range" min="0" max="100" value="80" aria-label="Maximum">
    </rc-range-slider>
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
      @rc-range-slider-input=${inputSpy}
    >
      <input type="range" min="0" max="100" value="20" aria-label="Minimum">
      <input type="range" min="0" max="100" value="80" aria-label="Maximum">
    </rc-range-slider>
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
    <rc-range-slider data-testid="host">
      <input type="range" min="0" max="100" value="79" aria-label="Minimum">
      <input type="range" min="0" max="100" value="80" aria-label="Maximum">
    </rc-range-slider>
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
    <rc-range-slider data-testid="host">
      <input type="range" min="0" max="100" value="20" aria-label="Minimum">
      <input type="range" min="0" max="100" value="21" aria-label="Maximum">
    </rc-range-slider>
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
    <rc-range-slider data-testid="host">
      <input type="range" min="0" max="100" value="30" aria-label="Minimum">
      <input type="range" min="0" max="100" value="70" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput] = getInputs(host);
  lowInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));

  expect(host.value[0]).toBe(20);
});

test('rc-range-slider Page Up moves high thumb by 10 steps', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host">
      <input type="range" min="0" max="100" value="30" aria-label="Minimum">
      <input type="range" min="0" max="100" value="70" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [, highInput] = getInputs(host);
  highInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));

  expect(host.value[1]).toBe(80);
});

test('rc-range-slider Home/End jump low thumb to bounds', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host">
      <input type="range" min="0" max="100" value="30" aria-label="Minimum">
      <input type="range" min="0" max="100" value="70" aria-label="Maximum">
    </rc-range-slider>
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
    <rc-range-slider data-testid="host">
      <input type="range" min="0" max="100" value="30" aria-label="Minimum">
      <input type="range" min="0" max="100" value="70" aria-label="Maximum">
    </rc-range-slider>
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
      @rc-range-slider-input=${inputSpy}
      @rc-range-slider-change=${changeSpy}
    >
      <input type="range" min="0" max="100" value="20" aria-label="Minimum">
      <input type="range" min="0" max="100" value="80" aria-label="Maximum">
    </rc-range-slider>
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
      low-value-text="$20"
      high-value-text="$80"
    >
      <input type="range" min="0" max="100" value="20" aria-label="Minimum">
      <input type="range" min="0" max="100" value="80" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput, highInput] = getInputs(host);
  expect(lowInput.getAttribute('aria-valuetext')).toBe('$20');
  expect(highInput.getAttribute('aria-valuetext')).toBe('$80');
});

test('rc-range-slider range fill style reflects current values', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host">
      <input type="range" min="0" max="100" value="25" aria-label="Minimum">
      <input type="range" min="0" max="100" value="75" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const rangeEl = host.querySelector<HTMLElement>('[part~="range"]');
  expect(rangeEl?.getAttribute('style')).toContain('left:25');
  expect(rangeEl?.getAttribute('style')).toContain('width:50');
});

test('rc-range-slider consumer-provided aria-label is not overwritten by low-label/high-label', async () => {
  const screen = render(html`
    <rc-range-slider
      data-testid="host"
      low-label="Minimum budget"
      high-label="Maximum budget"
    >
      <input type="range" min="0" max="1000" value="100" aria-label="From">
      <input type="range" min="0" max="1000" value="900" aria-label="To">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput, highInput] = getInputs(host);
  // Consumer's own aria-label takes precedence; low-label / high-label are not applied.
  expect(lowInput.getAttribute('aria-label')).toBe('From');
  expect(highInput.getAttribute('aria-label')).toBe('To');
});

test('rc-range-slider disabled syncs to both native inputs', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host" .disabled=${true}>
      <input type="range" min="0" max="100" value="20" aria-label="Minimum">
      <input type="range" min="0" max="100" value="80" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput, highInput] = getInputs(host);
  expect(lowInput.disabled).toBe(true);
  expect(highInput.disabled).toBe(true);
});

test('rc-range-slider readonly suppresses value updates on low thumb', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host" readonly>
      <input type="range" min="0" max="100" value="20" aria-label="Minimum">
      <input type="range" min="0" max="100" value="80" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput] = getInputs(host);
  lowInput.value = '50';
  lowInput.dispatchEvent(new Event('input', { bubbles: true }));

  expect(host.value[0]).toBe(20);
  expect(lowInput.value).toBe('20'); // reset by readonly handler
});

test('rc-range-slider applies default low-label and high-label when no aria-label', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host">
      <input type="range" min="0" max="100" value="20">
      <input type="range" min="0" max="100" value="80">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput, highInput] = getInputs(host);
  expect(lowInput.getAttribute('aria-label')).toBe('Minimum');
  expect(highInput.getAttribute('aria-label')).toBe('Maximum');
});

test('rc-range-slider display="float" renders value displays for both thumbs', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host" display="float">
      <input type="range" min="0" max="100" value="25" aria-label="Minimum">
      <input type="range" min="0" max="100" value="75" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const displays = host.querySelectorAll('[part~="value-display"]');
  expect(displays.length).toBe(2);
  await expect.element(screen.getByText('25')).toBeInTheDocument();
  await expect.element(screen.getByText('75')).toBeInTheDocument();
});

test('rc-range-slider has no automated accessibility violations', async () => {
  // Wrap in a fieldset/legend to provide an accessible group name without JavaScript.
  const screen = render(html`
    <fieldset data-testid="wrapper">
      <legend>Price range</legend>
      <rc-range-slider data-testid="host">
        <input type="range" min="0" max="100" value="20" aria-label="Minimum">
        <input type="range" min="0" max="100" value="80" aria-label="Maximum">
      </rc-range-slider>
    </fieldset>
  `);
  await expectNoA11yViolations(screen.getByTestId('wrapper').element());
});
