import { html } from 'lit';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-lit';

import { LineActionsController } from './line-actions-controller.js';
import type { RCTextareaPluginAPI } from './types.js';

test.each(['ltr', 'rtl'] as const)(
  'aligns the popover to the host inline start in %s',
  async (dir) => {
    const screen = render(html`
      <div
        data-testid="host"
        dir=${dir}
        style="position: fixed; top: 40px; left: 60px; inline-size: 300px; block-size: 80px;"
      ></div>
    `);
    const host = (await screen.getByTestId('host').element()) as HTMLElement;
    // Popover mode only reaches the host, stylesheet adoption, and the cursor rect.
    const api = {
      host,
      adoptStyleSheet() {},
      getCursorRect: () => null,
    } as unknown as RCTextareaPluginAPI;
    const controller = new LineActionsController(api);

    controller.getDecorations(0, [{ id: 'lock', label: 'Lock', onClick() {} }], 'x', 'popover');

    const popover = document.querySelector<HTMLElement>('.rc-line-actions-popover');
    const box = host.getBoundingClientRect();
    const panel = popover?.getBoundingClientRect();

    expect(panel).toBeDefined();

    if (dir === 'rtl') {
      expect(panel?.right).toBeCloseTo(box.right, 0);
    } else {
      expect(panel?.left).toBeCloseTo(box.left, 0);
    }

    controller.destroy();
  },
);
