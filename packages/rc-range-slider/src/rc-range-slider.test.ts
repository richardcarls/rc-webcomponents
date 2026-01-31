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

function getThumbs(host: RCRangeSlider): [HTMLElement, HTMLElement] {
  const thumbs = Array.from(host.shadowRoot?.querySelectorAll<HTMLElement>('[role="slider"]') ?? []);
  if (thumbs.length !== 2) throw new Error(`Expected 2 slider thumbs, got ${thumbs.length}`);
  return [thumbs[0], thumbs[1]];
}

test('rc-range-slider renders custom thumbs with stable tab order and dynamic ARIA bounds', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host" aria-label="Price range">
      <input type="range" min="0" max="100" value="20" aria-label="Minimum price">
      <input type="range" min="0" max="100" value="80" aria-label="Maximum price">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowThumb, highThumb] = getThumbs(host);

  expect(lowThumb.getAttribute('aria-label')).toBe('Minimum price');
  expect(highThumb.getAttribute('aria-label')).toBe('Maximum price');
  expect(lowThumb.getAttribute('tabindex')).toBe('0');
  expect(highThumb.getAttribute('tabindex')).toBe('0');
  expect(lowThumb.compareDocumentPosition(highThumb)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(lowThumb.getAttribute('aria-valuemin')).toBe('0');
  expect(lowThumb.getAttribute('aria-valuemax')).toBe('80');
  expect(lowThumb.getAttribute('aria-valuenow')).toBe('20');
  expect(highThumb.getAttribute('aria-valuemin')).toBe('20');
  expect(highThumb.getAttribute('aria-valuemax')).toBe('100');
  expect(highThumb.getAttribute('aria-valuenow')).toBe('80');
});

test('rc-range-slider keeps native inputs in the DOM as hidden form reflectors', async () => {
  const screen = render(html`
    <form data-testid="form">
      <rc-range-slider data-testid="host">
        <input type="range" name="price-min" min="10" max="500" value="50" aria-label="Minimum">
        <input type="range" name="price-max" min="10" max="500" value="400" aria-label="Maximum">
      </rc-range-slider>
    </form>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput, highInput] = getInputs(host);
  const form = screen.getByTestId('form').element() as HTMLFormElement;
  const data = new FormData(form);

  expect(lowInput.isConnected).toBe(true);
  expect(lowInput.getAttribute('name')).toBe('price-min');
  expect(lowInput.tabIndex).toBe(-1);
  expect(lowInput.getAttribute('aria-hidden')).toBe('true');
  expect(data.get('price-min')).toBe('50');
  expect(data.get('price-max')).toBe('400');
  expect(highInput.getAttribute('data-rc-range-slider-reflector')).toBe('');
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

  const [lowThumb] = getThumbs(host);
  lowThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await host.updateComplete;

  expect(host.value[0]).toBe(21);
  expect(lowThumb.getAttribute('aria-valuenow')).toBe('21');
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

  const [, highThumb] = getThumbs(host);
  highThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  await host.updateComplete;

  expect(host.value[0]).toBe(20);
  expect(host.value[1]).toBe(79);
  expect(inputSpy).toHaveBeenCalledOnce();
});

test('rc-range-slider keyboard clamps low and high thumbs at each other', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host">
      <input type="range" min="0" max="100" value="79" aria-label="Minimum">
      <input type="range" min="0" max="100" value="80" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowThumb, highThumb] = getThumbs(host);
  lowThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await host.updateComplete;
  lowThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await host.updateComplete;

  expect(host.value[0]).toBe(80);

  highThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  await host.updateComplete;

  expect(host.value[1]).toBe(80);
});

test('rc-range-slider Page and Home/End keys follow the APG bounds', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host">
      <input type="range" min="0" max="100" step="5" value="30" aria-label="Minimum">
      <input type="range" min="0" max="100" step="5" value="70" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowThumb, highThumb] = getThumbs(host);

  lowThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown', bubbles: true }));
  expect(host.value[0]).toBe(0);

  highThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'PageUp', bubbles: true }));
  expect(host.value[1]).toBe(100);

  lowThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
  expect(host.value[0]).toBe(100);

  highThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  expect(host.value[1]).toBe(100);
});

test('rc-range-slider pointer drag updates nearest thumb without swapping tab order', async () => {
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

  const group = host.shadowRoot?.querySelector<HTMLElement>('.rc-range-slider-group');
  const [lowThumb, highThumb] = getThumbs(host);
  if (!group) throw new Error('Expected slider group');

  group.getBoundingClientRect = () => new DOMRect(0, 0, 100, 20);
  group.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true,
    button: 0,
    clientX: 25,
    clientY: 10,
    pointerId: 1,
  }));
  group.dispatchEvent(new PointerEvent('pointermove', {
    bubbles: true,
    clientX: 40,
    clientY: 10,
    pointerId: 1,
  }));
  group.dispatchEvent(new PointerEvent('pointerup', {
    bubbles: true,
    clientX: 40,
    clientY: 10,
    pointerId: 1,
  }));
  await host.updateComplete;

  expect(host.value).toEqual([40, 80]);
  expect(getInputs(host)[0].valueAsNumber).toBe(40);
  expect(lowThumb.compareDocumentPosition(highThumb)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(inputSpy).toHaveBeenCalled();
  expect(changeSpy).toHaveBeenCalledOnce();
});

test('rc-range-slider fires input and change events via native input reflector', async () => {
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

test('rc-range-slider exposes aria-valuetext on each custom thumb', async () => {
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

  const [lowThumb, highThumb] = getThumbs(host);
  expect(lowThumb.getAttribute('aria-valuetext')).toBe('$20');
  expect(highThumb.getAttribute('aria-valuetext')).toBe('$80');
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

  const rangeEl = host.shadowRoot?.querySelector<HTMLElement>('[part~="range"]');
  expect(rangeEl?.getAttribute('style')).toContain('left:calc(25.000%');
  expect(rangeEl?.getAttribute('style')).toContain('width:max(0px');
  expect(rangeEl?.getAttribute('style')).toContain('calc(75.000%');
});

test('rc-range-slider vertical range fill spans between thumb centers', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host" orientation="vertical">
      <input type="range" min="0" max="100" value="25" aria-label="Minimum">
      <input type="range" min="0" max="100" value="75" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const rangeEl = host.shadowRoot?.querySelector<HTMLElement>('[part~="range"]');
  expect(rangeEl?.getAttribute('style')).toContain('bottom:calc(25.000%');
  expect(rangeEl?.getAttribute('style')).toContain('height:max(0px');
  expect(rangeEl?.getAttribute('style')).toContain('calc(75.000%');

  const trackEl = host.shadowRoot?.querySelector<HTMLElement>('[part~="track"]');
  const rangeRect = rangeEl!.getBoundingClientRect();
  const trackRect = trackEl!.getBoundingClientRect();
  expect(rangeRect.top).toBeGreaterThan(trackRect.top);
  expect(rangeRect.bottom).toBeLessThan(trackRect.bottom);
});

test('rc-range-slider selected range and thumbs use the accent token with Highlight fallback', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host" style="--rc-accent: rgb(1, 2, 3);">
      <input type="range" min="0" max="100" value="25" aria-label="Minimum">
      <input type="range" min="0" max="100" value="75" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const rangeEl = host.shadowRoot?.querySelector<HTMLElement>('[part~="range"]');
  const thumbEl = host.shadowRoot?.querySelector<HTMLElement>('[part~="thumb"]');

  expect(getComputedStyle(rangeEl!).backgroundColor).toBe('rgb(1, 2, 3)');
  expect(getComputedStyle(rangeEl!).backgroundColor).not.toBe(getComputedStyle(host.shadowRoot!.querySelector<HTMLElement>('[part~="track"]')!).backgroundColor);
  expect(getComputedStyle(thumbEl!).borderTopColor).toBe(getComputedStyle(rangeEl!).backgroundColor);
});

test('rc-range-slider renders track-background slot before range', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host">
      <span slot="track-background" data-testid="background"></span>
      <input type="range" min="0" max="100" value="25" aria-label="Minimum">
      <input type="range" min="0" max="100" value="75" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const track = host.shadowRoot?.querySelector('[part="track"]');
  const slot = track?.querySelector('slot[name="track-background"]') as HTMLSlotElement | null;
  const range = track?.querySelector('[part="range"]');

  expect(slot).toBeTruthy();
  expect(range).toBeTruthy();
  expect(slot?.compareDocumentPosition(range!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(slot?.assignedElements()[0]).toBe(host.querySelector('[data-testid="background"]'));
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

  const [lowThumb, highThumb] = getThumbs(host);
  expect(lowThumb.getAttribute('aria-label')).toBe('From');
  expect(highThumb.getAttribute('aria-label')).toBe('To');
});

test('rc-range-slider disabled syncs to both native inputs and custom thumbs', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host" .disabled=${true}>
      <input type="range" min="0" max="100" value="20" aria-label="Minimum">
      <input type="range" min="0" max="100" value="80" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowInput, highInput] = getInputs(host);
  const [lowThumb, highThumb] = getThumbs(host);
  expect(lowInput.disabled).toBe(true);
  expect(highInput.disabled).toBe(true);
  expect(lowThumb.getAttribute('aria-disabled')).toBe('true');
  expect(highThumb.getAttribute('tabindex')).toBe('-1');
});

test('rc-range-slider readonly suppresses value updates on low thumb', async () => {
  const inputSpy = vi.fn();
  const screen = render(html`
    <rc-range-slider data-testid="host" readonly @rc-range-slider-input=${inputSpy}>
      <input type="range" min="0" max="100" value="20" aria-label="Minimum">
      <input type="range" min="0" max="100" value="80" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowThumb] = getThumbs(host);
  lowThumb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

  expect(host.value[0]).toBe(20);
  expect(inputSpy).not.toHaveBeenCalled();
});

test('rc-range-slider applies default low-label and high-label when no label source is present', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host">
      <input type="range" min="0" max="100" value="20">
      <input type="range" min="0" max="100" value="80">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  const [lowThumb, highThumb] = getThumbs(host);
  expect(lowThumb.getAttribute('aria-label')).toBe('Minimum');
  expect(highThumb.getAttribute('aria-label')).toBe('Maximum');
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

  const displays = host.shadowRoot?.querySelectorAll('[part~="value-display"]');
  expect(displays?.length).toBe(2);
  await expect.element(screen.getByText('25')).toBeInTheDocument();
  await expect.element(screen.getByText('75')).toBeInTheDocument();
});

test('rc-range-slider has no automated accessibility violations', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host" aria-label="Price range">
      <input type="range" min="0" max="100" value="20" aria-label="Minimum">
      <input type="range" min="0" max="100" value="80" aria-label="Maximum">
    </rc-range-slider>
  `);
  await expectNoA11yViolations(screen.getByTestId('host').element());
});

test('rc-range-slider defaultValue sets initial [low, high] without controlling', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host">
      <input type="range" min="0" max="100" value="0" aria-label="Minimum">
      <input type="range" min="0" max="100" value="100" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  host.defaultValue = [15, 75];
  await host.updateComplete;

  expect(host.value).toEqual([15, 75]);

  const [lowInput, highInput] = getInputs(host);
  expect(lowInput.valueAsNumber).toBe(15);
  expect(highInput.valueAsNumber).toBe(75);
});

test('rc-range-slider controlled value overrides defaultValue', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host">
      <input type="range" min="0" max="100" value="0" aria-label="Minimum">
      <input type="range" min="0" max="100" value="100" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  host.defaultValue = [15, 75];
  host.value = [25, 85];
  await host.updateComplete;

  expect(host.value).toEqual([25, 85]);
});

test('rc-range-slider setting defaultValue does not fire rc-range-slider-input', async () => {
  const inputSpy = vi.fn();
  const screen = render(html`
    <rc-range-slider data-testid="host" @rc-range-slider-input=${inputSpy}>
      <input type="range" min="0" max="100" value="0" aria-label="Minimum">
      <input type="range" min="0" max="100" value="100" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  host.defaultValue = [10, 90];
  await host.updateComplete;

  expect(inputSpy).not.toHaveBeenCalled();
});

test('rc-range-slider without defaultValue falls back to [0, 100]', async () => {
  const screen = render(html`
    <rc-range-slider data-testid="host">
      <input type="range" min="0" max="100" value="0" aria-label="Minimum">
      <input type="range" min="0" max="100" value="100" aria-label="Maximum">
    </rc-range-slider>
  `);
  const host = screen.getByTestId('host').element() as RCRangeSlider;
  await host.updateComplete;

  expect(host.value).toEqual([0, 100]);
});
