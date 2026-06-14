import { test, expect, describe, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './define';
import type { RCSplitter } from './rc-splitter';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';

// Helper to get elements from shadow DOM
function getSeparator(host: RCSplitter): HTMLElement {
  return host.shadowRoot!.querySelector('[role="separator"]') as HTMLElement;
}

function getPrimary(host: RCSplitter): HTMLElement {
  return host.shadowRoot!.querySelector('#primary') as HTMLElement;
}

async function focusSeparator(separator: HTMLElement): Promise<void> {
  separator.focus({ preventScroll: true });
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function pressKey(target: HTMLElement, keyToken: string): Promise<void> {
  const key = keyToken.startsWith('{') && keyToken.endsWith('}')
    ? keyToken.slice(1, -1)
    : keyToken;

  target.dispatchEvent(
    new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      composed: true,
      key: key === 'Space' ? ' ' : key,
    }),
  );

  await new Promise((resolve) => setTimeout(resolve, 0));
}

function firePointerEvent(
  target: EventTarget,
  type: string,
  init?: PointerEventInit,
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'mouse',
      ...init,
    }),
  );
}

describe('RCSplitter', () => {
  describe('basic rendering and ARIA', () => {
    test('renders with correct ARIA attributes', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));
      host.value = 100;

      const separator = getSeparator(host);

      expect(host).toBeInstanceOf(HTMLElement);
      expect(separator).not.toBeNull();
      expect(separator.getAttribute('tabindex')).toBe('0');
      expect(separator.getAttribute('aria-orientation')).toBe('horizontal');
      expect(separator.getAttribute('aria-controls')).toBe('primary');
      expect(separator.getAttribute('aria-labelledby')).toBe('primary');
    });

    test('has no automated accessibility violations', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          label="Resize panels"
          style="width: 400px; height: 300px;"
        >
          <section>Primary</section>
          <section slot="secondary">Secondary</section>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      await expectNoA11yViolations(host);
    });

    test('renders with custom label', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          label="Custom Splitter"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      const primary = getPrimary(host);
      expect(primary.getAttribute('aria-label')).toBe('Custom Splitter');
    });

    test('renders with vertical orientation', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          orientation="vertical"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);
      expect(separator.getAttribute('aria-orientation')).toBe('vertical');
    });

    test('hides separator when no secondary content', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary Only</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      const separator = getSeparator(host);
      expect(separator.hasAttribute('hidden')).toBe(true);
    });
  });

  describe('keyboard navigation - horizontal', () => {
    test('Right arrow increases value', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);

      await vi.waitFor(() => {
        expect(Number(separator.getAttribute('aria-valuemax'))).toBeGreaterThan(
          0,
        );
      });

      host.value = 100;

      const initialValue = host.value;

      await focusSeparator(separator);
      await pressKey(separator, '{ArrowRight}');

      expect(host.value).toBeGreaterThan(initialValue);
    });

    test('Left arrow decreases value', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      // Wait for resize observer
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);
      await vi.waitFor(() => {
        expect(Number(separator.getAttribute('aria-valuemax'))).toBeGreaterThan(
          0,
        );
      });

      // Set a value that can be decreased
      host.value = 100;
      const initialValue = host.value;

      await focusSeparator(separator);
      await pressKey(separator, '{ArrowLeft}');

      expect(host.value).toBeLessThan(initialValue);
    });

    test('Home collapses to minimum', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      // Wait for resize observer
      await new Promise((r) => setTimeout(r, 50));

      // Set a value that can be collapsed
      host.value = 100;

      const separator = getSeparator(host);
      await focusSeparator(separator);
      await pressKey(separator, '{Home}');

      expect(host.value).toBe(0);
    });

    test('End expands to maximum', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      // Wait for resize observer to calculate max
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);

      await focusSeparator(separator);
      await pressKey(separator, '{End}');

      // Value should be at max (400px container width)
      expect(host.value).toBeGreaterThan(100);
    });

    test('Enter toggles collapse and restore', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      // Wait for resize observer
      await new Promise((r) => setTimeout(r, 50));

      // Set a value that can be collapsed/restored
      host.value = 150;
      const initialValue = host.value;

      const separator = getSeparator(host);
      await focusSeparator(separator);

      // First Enter collapses
      await pressKey(separator, '{Enter}');
      expect(host.value).toBe(0);

      // Second Enter restores
      await pressKey(separator, '{Enter}');
      expect(host.value).toBe(initialValue);
    });
  });

  describe('keyboard navigation - vertical', () => {
    test('Down arrow increases value', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          orientation="vertical"
          value="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      const separator = getSeparator(host);
      const initialValue = host.value;

      await focusSeparator(separator);
      await pressKey(separator, '{ArrowDown}');

      expect(host.value).toBeGreaterThan(initialValue);
    });

    test('Up arrow decreases value', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          orientation="vertical"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      // Wait for resize observer
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);
      await vi.waitFor(() => {
        expect(Number(separator.getAttribute('aria-valuemax'))).toBeGreaterThan(
          0,
        );
      });

      // Set a value that can be decreased
      host.value = 100;
      const initialValue = host.value;

      await focusSeparator(separator);
      await pressKey(separator, '{ArrowUp}');

      expect(host.value).toBeLessThan(initialValue);
    });

    test('Home and End work in vertical orientation', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          orientation="vertical"
          value="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      // Wait for resize observer
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);

      await focusSeparator(separator);

      await pressKey(separator, '{Home}');
      expect(host.value).toBe(0);

      await pressKey(separator, '{End}');
      expect(host.value).toBeGreaterThan(0);
    });
  });

  describe('fixed property', () => {
    test('prevents keyboard resizing when fixed', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          fixed
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      // Wait for resize observer
      await new Promise((r) => setTimeout(r, 50));

      // Set a specific value
      host.value = 100;
      const initialValue = host.value;

      const separator = getSeparator(host);
      await focusSeparator(separator);

      await pressKey(separator, '{ArrowRight}');
      expect(host.value).toBe(initialValue);

      await pressKey(separator, '{Home}');
      expect(host.value).toBe(initialValue);

      await pressKey(separator, '{End}');
      expect(host.value).toBe(initialValue);
    });
  });

  describe('step property', () => {
    test('respects custom step size', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          step="10"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      // Wait for resize observer
      await new Promise((r) => setTimeout(r, 50));

      // Set a specific value
      host.value = 100;
      const initialValue = host.value;

      const separator = getSeparator(host);
      await focusSeparator(separator);

      await pressKey(separator, '{ArrowRight}');
      expect(host.value).toBe(initialValue + 10);

      await pressKey(separator, '{ArrowLeft}');
      expect(host.value).toBe(initialValue);
    });
  });

  describe('mode property', () => {
    test('valueText shows pixels in length mode', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          mode="length"
          value="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      expect(host.valueText).toBe(`${host.value}px`);
    });

    test('valueText shows percentage in percent mode', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          mode="percent"
          value="50"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      expect(host.valueText).toBe(`${host.value}%`);
    });

    test('percent mode has max of 100', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          mode="percent"
          value="50"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      // Wait for resize observer
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);

      await focusSeparator(separator);
      await pressKey(separator, '{End}');

      expect(host.value).toBe(100);
    });
  });

  describe('events', () => {
    test('dispatches rc-splitter-change on value change', async () => {
      const handleChange = vi.fn() as unknown as EventListener;

      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      host.addEventListener('rc-splitter-change', handleChange);
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));
      host.value = 100;

      const separator = getSeparator(host);

      await focusSeparator(separator);
      await pressKey(separator, '{ArrowRight}');

      expect(handleChange).toHaveBeenCalled();
      const event = (handleChange as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(event.detail).toHaveProperty('value');
      expect(event.detail).toHaveProperty('valueText');
    });

    test('does not dispatch event when value unchanged', async () => {
      const handleChange = vi.fn() as unknown as EventListener;

      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="0"
          style="width: 400px; height: 300px;"
          @rc-splitter-change=${handleChange}
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      const separator = getSeparator(host);

      await focusSeparator(separator);

      // Clear any initial change events
      (handleChange as ReturnType<typeof vi.fn>).mockClear();

      // Already at minimum, left arrow should not change value
      await pressKey(separator, '{ArrowLeft}');
      await pressKey(separator, '{Home}');

      // Neither action should have triggered a change
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('ARIA value attributes', () => {
    test('updates aria-valuenow and aria-valuetext on change', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      const separator = getSeparator(host);

      await focusSeparator(separator);
      await pressKey(separator, '{ArrowRight}');
      await host.updateComplete;

      expect(separator.getAttribute('aria-valuenow')).toBe(String(host.value));
      expect(separator.getAttribute('aria-valuetext')).toBe(host.valueText);
    });

    test('has aria-valuemin and aria-valuemax', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      // Wait for resize observer
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);

      expect(separator.getAttribute('aria-valuemin')).toBe('0');
      const maxValue = separator.getAttribute('aria-valuemax');
      expect(Number(maxValue)).toBeGreaterThan(0);
    });
  });

  describe('interaction mode', () => {
    test('sets keyboard interaction mode on keyboard focus', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      // Wait for resize observer
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);

      await focusSeparator(separator);
      // Dispatch keyboard event directly on the separator
      separator.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );

      expect(separator.getAttribute('data-interaction-mode')).toBe('keyboard');
    });

    test('clears interaction mode on mouse click', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      // Wait for resize observer
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);

      // First trigger keyboard mode
      await focusSeparator(separator);
      separator.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      );
      expect(separator.getAttribute('data-interaction-mode')).toBe('keyboard');

      // Mouse click should clear it
      separator.click();
      expect(separator.hasAttribute('data-interaction-mode')).toBe(false);
    });
  });

  describe('pointer drag resizing - horizontal', () => {
    test('pointer drag changes value', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);
      const initialValue = host.value;

      firePointerEvent(separator, 'pointerdown');

      const hostRect = host.getBoundingClientRect();

      firePointerEvent(separator, 'pointermove', {
        clientX: hostRect.left + 300,
        clientY: hostRect.top + 150,
      });
      firePointerEvent(separator, 'pointerup');

      expect(host.value).not.toBe(initialValue);
    });

    test('pointer drag is prevented when fixed', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          fixed
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      host.value = 100;
      const initialValue = host.value;

      const separator = getSeparator(host);

      firePointerEvent(separator, 'pointerdown');

      const hostRect = host.getBoundingClientRect();

      firePointerEvent(separator, 'pointermove', {
        clientX: hostRect.left + 300,
        clientY: hostRect.top + 150,
      });
      firePointerEvent(separator, 'pointerup');

      expect(host.value).toBe(initialValue);
    });
  });

  describe('pointer drag resizing - vertical', () => {
    test('pointer drag changes value vertically', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          orientation="vertical"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);
      const initialValue = host.value;

      firePointerEvent(separator, 'pointerdown');

      const hostRect = host.getBoundingClientRect();

      firePointerEvent(separator, 'pointermove', {
        clientX: hostRect.left + 200,
        clientY: hostRect.top + 200,
      });
      firePointerEvent(separator, 'pointerup');

      expect(host.value).not.toBe(initialValue);
    });
  });

  describe('value clamping and boundaries', () => {
    test('clamps value to minimum (0)', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      host.value = -100;

      expect(host.value).toBe(0);
    });

    test('clamps value to maximum', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const maxValue = 400; // container width
      host.value = 1000;

      expect(host.value).toBeLessThanOrEqual(maxValue);
    });

    test('arrow key at minimum does not go below zero', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="0"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);
      await focusSeparator(separator);

      await pressKey(separator, '{ArrowLeft}');

      expect(host.value).toBe(0);
    });

    test('arrow key at maximum does not exceed max', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      // Press End to go to max
      const separator = getSeparator(host);
      await focusSeparator(separator);
      await pressKey(separator, '{End}');
      const maxValue = host.value;

      await pressKey(separator, '{ArrowRight}');

      expect(host.value).toBe(maxValue);
    });
  });

  describe('step rounding', () => {
    test('rounds value to nearest step', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          step="10"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      // Set a value that's not a multiple of step
      host.value = 103;

      expect(host.value).toBe(100);
    });

    test('rounds up when closer to next step', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          step="10"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      host.value = 107;

      expect(host.value).toBe(110);
    });

    test('large step size limits movement options', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          step="100"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      host.value = 100;
      const separator = getSeparator(host);
      await focusSeparator(separator);

      await pressKey(separator, '{ArrowRight}');

      expect(host.value).toBe(200);
    });
  });

  describe('initial value behavior', () => {
    test('uses initial value attribute when provided', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="150"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      expect(host.value).toBe(150);
    });

    test('defaults to half of max when no initial value', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      // Default should be max/2 = 400/2 = 200
      expect(host.value).toBe(200);
    });

    test('clamps initial value if exceeds max', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="1000"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      expect(host.value).toBeLessThanOrEqual(400);
    });
  });

  describe('pane visibility', () => {
    test('hides primary pane when value is 0', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="0"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      const primary = getPrimary(host);
      expect(primary.hasAttribute('hidden')).toBe(true);
    });

    test('hides secondary pane when value is at max', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const separator = getSeparator(host);
      await focusSeparator(separator);
      await pressKey(separator, '{End}');
      await host.updateComplete;

      const secondary = host.shadowRoot!.querySelector(
        '#secondary',
      ) as HTMLElement;
      expect(secondary.hasAttribute('hidden')).toBe(true);
    });
  });

  describe('empty and edge case content', () => {
    test('handles empty splitter gracefully', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      // Should not throw and separator should be hidden
      const separator = getSeparator(host);
      expect(separator.hasAttribute('hidden')).toBe(true);
    });

    test('secondary-only content moves to primary', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div slot="secondary" data-testid="content">Only Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      const content = screen.getByTestId('content').element();

      // Content should have been moved to primary (slot removed)
      expect(content.getAttribute('slot')).toBeNull();
    });
  });

  describe('keyboard edge cases', () => {
    test('unrelated keys do not affect value', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      host.value = 100;
      const initialValue = host.value;

      const separator = getSeparator(host);
      await focusSeparator(separator);

      await pressKey(separator, '{Escape}');
      expect(host.value).toBe(initialValue);

      await pressKey(separator, 'a');
      expect(host.value).toBe(initialValue);

      await pressKey(separator, '{Space}');
      expect(host.value).toBe(initialValue);
    });

    test('multiple sequential arrow presses accumulate', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          step="10"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      host.value = 100;

      const separator = getSeparator(host);
      await focusSeparator(separator);

      await pressKey(separator, '{ArrowRight}');
      await pressKey(separator, '{ArrowRight}');
      await pressKey(separator, '{ArrowRight}');

      expect(host.value).toBe(130);
    });

    test('wrong orientation arrows are ignored', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      host.value = 100;
      const initialValue = host.value;

      const separator = getSeparator(host);
      await focusSeparator(separator);

      // Vertical arrows should be ignored for horizontal splitter
      await pressKey(separator, '{ArrowUp}');
      expect(host.value).toBe(initialValue);

      await pressKey(separator, '{ArrowDown}');
      expect(host.value).toBe(initialValue);
    });

    test('vertical splitter ignores horizontal arrows', async () => {
      const screen = render(html`
        <rc-splitter
          data-testid="host"
          orientation="vertical"
          style="width: 400px; height: 300px;"
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      host.value = 100;
      const initialValue = host.value;

      const separator = getSeparator(host);
      await focusSeparator(separator);

      // Horizontal arrows should be ignored for vertical splitter
      await pressKey(separator, '{ArrowLeft}');
      expect(host.value).toBe(initialValue);

      await pressKey(separator, '{ArrowRight}');
      expect(host.value).toBe(initialValue);
    });
  });

  describe('programmatic value changes', () => {
    test('does not dispatch event on programmatic value change', async () => {
      const handleChange = vi.fn() as unknown as EventListener;

      const screen = render(html`
        <rc-splitter
          data-testid="host"
          style="width: 400px; height: 300px;"
          @rc-splitter-change=${handleChange}
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      (handleChange as ReturnType<typeof vi.fn>).mockClear();

      host.value = 250;

      expect(handleChange).not.toHaveBeenCalled();
      expect(host.value).toBe(250);
    });

    test('setting same value does not dispatch event', async () => {
      const handleChange = vi.fn() as unknown as EventListener;

      const screen = render(html`
        <rc-splitter
          data-testid="host"
          value="100"
          style="width: 400px; height: 300px;"
          @rc-splitter-change=${handleChange}
        >
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      (handleChange as ReturnType<typeof vi.fn>).mockClear();

      // Set same value
      host.value = 100;

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('collapse and restore edge cases', () => {
    test('Enter at zero restores to previous value', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      host.value = 180;

      const separator = getSeparator(host);
      await focusSeparator(separator);

      // Press Home to collapse
      await pressKey(separator, '{Home}');
      expect(host.value).toBe(0);

      // Press Enter should restore
      await pressKey(separator, '{Enter}');
      expect(host.value).toBe(180);
    });

    test('collapse remembers last non-zero value', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary</div>
          <div slot="secondary">Secondary</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;
      await new Promise((r) => setTimeout(r, 50));

      host.value = 120;

      const separator = getSeparator(host);
      await focusSeparator(separator);

      // Move a bit
      await pressKey(separator, '{ArrowRight}');
      const lastValue = host.value;

      // Collapse
      await pressKey(separator, '{Enter}');
      expect(host.value).toBe(0);

      // Restore
      await pressKey(separator, '{Enter}');
      expect(host.value).toBe(lastValue);
    });
  });

  describe('slots', () => {
    test('renders primary and secondary slot content', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div data-testid="primary-content">Primary Content</div>
          <div slot="secondary" data-testid="secondary-content">
            Secondary Content
          </div>
        </rc-splitter>
      `);

      const primaryContent = screen.getByTestId('primary-content');
      const secondaryContent = screen.getByTestId('secondary-content');

      await expect.element(primaryContent).toBeInTheDocument();
      await expect.element(secondaryContent).toBeInTheDocument();
    });

    test('exposes primary and secondary pane parts', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div>Primary Content</div>
          <div slot="secondary">Secondary Content</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      expect(host.shadowRoot!.querySelector('#primary')?.getAttribute('part')).toBe('primary');
      expect(host.shadowRoot!.querySelector('#secondary')?.getAttribute('part')).toBe('secondary');
    });

    test('moves extra primary elements to secondary slot', async () => {
      const screen = render(html`
        <rc-splitter data-testid="host" style="width: 400px; height: 300px;">
          <div data-testid="first">First</div>
          <div data-testid="second">Second</div>
          <div data-testid="third">Third</div>
        </rc-splitter>
      `);

      const host = screen.getByTestId('host').element() as RCSplitter;
      await host.updateComplete;

      // Wait for slot change to process
      await new Promise((resolve) => setTimeout(resolve, 50));

      const first = screen.getByTestId('first');
      const second = screen.getByTestId('second');
      const third = screen.getByTestId('third');

      // First element stays in primary (no slot attribute)
      expect(first.element().getAttribute('slot')).toBeNull();

      // Additional elements moved to secondary
      expect(second.element().getAttribute('slot')).toBe('secondary');
      expect(third.element().getAttribute('slot')).toBe('secondary');
    });
  });
});
