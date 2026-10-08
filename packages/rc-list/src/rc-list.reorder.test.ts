import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.js';
import { FLOW_FIXTURES, flowLabel, inFlow } from '../../../test-helpers/flow.js';
import './define.js';
import type { RCListItem } from './rc-list-item.js';
import type { RCList, RCListReorderDetail } from './rc-list.js';

const NAMES = ['Alpha', 'Beta', 'Gamma'];

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function settle(list: RCList): Promise<void> {
  await list.updateComplete;

  await Promise.all(
    Array.from(list.querySelectorAll<RCListItem>('rc-list-item'), (item) => item.updateComplete),
  );

  // The list syncs items in a microtask after slot changes.
  await Promise.resolve();
  await nextFrame();
}

function itemTemplate(name: string) {
  return html`
    <rc-list-item data-name=${name} style="min-block-size: 3rem">
      ${name}
      <button slot="trailing" type="button" data-rc-reorder-handle aria-label="Reorder ${name}">
        ⠿
      </button>
    </rc-list-item>
  `;
}

async function setup(
  template = html`
    <rc-list data-testid="list" reorderable style="inline-size: 16rem">
      ${NAMES.map(itemTemplate)}
    </rc-list>
  `,
) {
  const screen = render(template);
  const list = (await screen.getByTestId('list').element()) as RCList;

  await settle(list);

  return list;
}

function order(list: RCList): string[] {
  return Array.from(
    list.querySelectorAll<RCListItem>('rc-list-item'),
    (item) => item.dataset.name ?? '',
  );
}

function item(list: RCList, name: string): RCListItem {
  const $item = list.querySelector<RCListItem>(`rc-list-item[data-name="${name}"]`);

  if (!$item) {
    throw new Error(`No item ${name}`);
  }

  return $item;
}

function handle(list: RCList, name: string): HTMLButtonElement {
  const $handle = item(list, name).querySelector<HTMLButtonElement>('[data-rc-reorder-handle]');

  if (!$handle) {
    throw new Error(`No handle for ${name}`);
  }

  return $handle;
}

function center(element: Element): { x: number; y: number } {
  const rect = element.getBoundingClientRect();

  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function firePointer(target: EventTarget, type: string, init: PointerEventInit = {}): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'mouse',
      button: 0,
      ...init,
    }),
  );
}

function key(target: Element, keyName: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key: keyName,
    bubbles: true,
    composed: true,
    cancelable: true,
  });

  target.dispatchEvent(event);

  return event;
}

/** Drags `name`'s handle so its center lands `fraction` of the way to `toward`'s center. */
async function drag(list: RCList, name: string, toward: string, fraction = 1.2) {
  const $handle = handle(list, name);
  const start = center($handle);
  const from = center(item(list, name));
  const to = center(item(list, toward));
  const end = {
    x: start.x + (to.x - from.x) * fraction,
    y: start.y + (to.y - from.y) * fraction,
  };

  firePointer($handle, 'pointerdown', { clientX: start.x, clientY: start.y });

  firePointer($handle, 'pointermove', {
    clientX: start.x + (end.x - start.x) / 2,
    clientY: start.y + (end.y - start.y) / 2,
  });

  firePointer($handle, 'pointermove', { clientX: end.x, clientY: end.y });

  return {
    $handle,
    drop: () => firePointer($handle, 'pointerup', { clientX: end.x, clientY: end.y }),
  };
}

function announcement(): string {
  return document.querySelector('[data-rc-live-announcer]')?.textContent ?? '';
}

test('reorderable lists expose positions and describe their handles', async () => {
  const list = await setup();

  expect(item(list, 'Beta').getAttribute('aria-posinset')).toBe('2');
  expect(item(list, 'Beta').getAttribute('aria-setsize')).toBe('3');
  expect(handle(list, 'Beta').getAttribute('aria-description')).toBe('Press Space to reorder.');

  list.reorderable = false;
  await settle(list);

  expect(item(list, 'Beta').hasAttribute('aria-posinset')).toBe(false);
  expect(handle(list, 'Beta').hasAttribute('aria-description')).toBe(false);
});

test('keeps an authored handle description and uses message overrides', async () => {
  const list = await setup();

  handle(list, 'Alpha').setAttribute('aria-description', 'Authored hint');
  list.reorderMessages = { instructions: 'Espace pour déplacer.' };
  await settle(list);

  expect(handle(list, 'Alpha').getAttribute('aria-description')).toBe('Authored hint');
  expect(handle(list, 'Beta').getAttribute('aria-description')).toBe('Espace pour déplacer.');
});

test('a pointer drag previews the move, then moves the node on drop', async () => {
  const list = await setup();
  const events: RCListReorderDetail[] = [];

  list.addEventListener('rc-list-reorder', (event) => events.push(event.detail));

  const { drop } = await drag(list, 'Alpha', 'Beta');

  expect(list.hasAttribute('data-reordering')).toBe(true);
  expect(item(list, 'Alpha').hasAttribute('data-dragging')).toBe(true);
  expect(item(list, 'Beta').style.translate).not.toBe('');
  expect(item(list, 'Gamma').style.translate).toBe('');

  drop();
  await settle(list);

  expect(events).toEqual([{ item: item(list, 'Alpha'), from: 0, to: 1 }]);
  expect(order(list)).toEqual(['Beta', 'Alpha', 'Gamma']);
  expect(list.hasAttribute('data-reordering')).toBe(false);
  expect(item(list, 'Alpha').hasAttribute('data-dragging')).toBe(false);
  expect(NAMES.map((name) => item(list, name).style.translate)).toEqual(['', '', '']);
  expect(item(list, 'Alpha').getAttribute('aria-posinset')).toBe('2');
});

test('a lifted row paints above a later row it overlaps', async () => {
  const list = await setup();
  const $alpha = item(list, 'Alpha');
  const $alphaHandle = handle(list, 'Alpha');
  const $betaHandle = handle(list, 'Beta');
  const alphaRect = $alpha.getBoundingClientRect();
  const betaRect = item(list, 'Beta').getBoundingClientRect();

  $alpha.setAttribute('data-dragging', '');
  $alpha.style.translate = `0px ${betaRect.top - alphaRect.top}px`;
  await nextFrame();

  const point = center($betaHandle);

  expect(document.elementFromPoint(point.x, point.y)).toBe($alphaHandle);
});

test('restores authored inline translations after a drag', async () => {
  const list = await setup();
  const $alpha = item(list, 'Alpha');
  const $beta = item(list, 'Beta');

  $alpha.style.setProperty('translate', '5px 0px', 'important');
  $beta.style.setProperty('translate', '0px 7px');

  const alphaTranslation = $alpha.style.getPropertyValue('translate');
  const betaTranslation = $beta.style.getPropertyValue('translate');

  const { drop } = await drag(list, 'Alpha', 'Beta');

  drop();
  await settle(list);

  expect($alpha.style.getPropertyValue('translate')).toBe(alphaTranslation);
  expect($alpha.style.getPropertyPriority('translate')).toBe('important');
  expect($beta.style.getPropertyValue('translate')).toBe(betaTranslation);
});

test('a touch drag keeps capture on the touched icon inside its handle', async () => {
  const list = await setup();
  const $handle = handle(list, 'Alpha');
  const $icon = document.createElement('span');

  $handle.append($icon);

  const start = center($handle);
  const step = center(item(list, 'Beta')).y - center(item(list, 'Alpha')).y;
  const touch = { pointerType: 'touch', clientX: start.x };
  const iconCapture = vi.spyOn($icon, 'setPointerCapture');
  const handleCapture = vi.spyOn($handle, 'setPointerCapture');
  const listCapture = vi.spyOn(list, 'setPointerCapture');

  firePointer($icon, 'pointerdown', { ...touch, clientY: start.y });
  firePointer($icon, 'pointermove', { ...touch, clientY: start.y + 12 });
  firePointer($icon, 'pointermove', { ...touch, clientY: start.y + step * 1.2 });

  expect(iconCapture).toHaveBeenCalledWith(1);
  expect(handleCapture).not.toHaveBeenCalled();
  expect(listCapture).not.toHaveBeenCalled();
  expect(item(list, 'Alpha').hasAttribute('data-dragging')).toBe(true);

  firePointer($icon, 'pointerup', { ...touch, clientY: start.y + step * 1.2 });
  await settle(list);

  expect(order(list)).toEqual(['Beta', 'Alpha', 'Gamma']);
});

test('a canceled reorder event leaves the nodes to the consumer', async () => {
  const list = await setup();
  const listener = vi.fn((event: Event) => event.preventDefault());

  list.addEventListener('rc-list-reorder', listener);

  const { drop } = await drag(list, 'Gamma', 'Alpha');

  drop();
  await settle(list);

  expect(listener).toHaveBeenCalledOnce();

  expect((listener.mock.calls[0][0] as CustomEvent<RCListReorderDetail>).detail).toMatchObject({
    from: 2,
    to: 0,
  });

  expect(order(list)).toEqual(NAMES);
});

test('a handle press without movement does not reorder', async () => {
  const list = await setup();
  const listener = vi.fn();

  list.addEventListener('rc-list-reorder', listener);

  const $handle = handle(list, 'Alpha');
  const point = center($handle);

  firePointer($handle, 'pointerdown', { clientX: point.x, clientY: point.y });
  firePointer($handle, 'pointerup', { clientX: point.x, clientY: point.y });
  await settle(list);

  expect(listener).not.toHaveBeenCalled();
  expect(list.hasAttribute('data-reordering')).toBe(false);
});

test('Escape cancels a pointer drag without closing an enclosing surface', async () => {
  const list = await setup();
  const listener = vi.fn();
  const outer = vi.fn();

  list.addEventListener('rc-list-reorder', listener);
  list.parentElement?.addEventListener('keydown', outer);

  const { $handle, drop } = await drag(list, 'Alpha', 'Gamma');
  const escape = key($handle, 'Escape');

  drop();
  await settle(list);

  expect(escape.defaultPrevented).toBe(true);
  expect(outer).not.toHaveBeenCalled();
  expect(listener).not.toHaveBeenCalled();
  expect(order(list)).toEqual(NAMES);
  expect(NAMES.map((name) => item(list, name).style.translate)).toEqual(['', '', '']);
});

test('the keyboard picks up, moves, and drops with announcements', async () => {
  const list = await setup();
  const events: RCListReorderDetail[] = [];

  list.addEventListener('rc-list-reorder', (event) => events.push(event.detail));
  handle(list, 'Alpha').focus();

  expect(key(handle(list, 'Alpha'), ' ').defaultPrevented).toBe(true);
  expect(item(list, 'Alpha').hasAttribute('data-dragging')).toBe(true);
  await vi.waitFor(() => expect(announcement()).toMatch(/Picked up, position 1 of 3/));

  key(handle(list, 'Alpha'), 'ArrowDown');
  await settle(list);
  key(handle(list, 'Alpha'), 'ArrowDown');
  await settle(list);

  expect(order(list)).toEqual(['Beta', 'Gamma', 'Alpha']);

  expect(events.map(({ from, to }) => [from, to])).toEqual([
    [0, 1],
    [1, 2],
  ]);

  expect(document.activeElement).toBe(handle(list, 'Alpha'));
  await vi.waitFor(() => expect(announcement()).toBe('Moved to position 3 of 3.'));

  key(handle(list, 'Alpha'), 'Enter');

  expect(item(list, 'Alpha').hasAttribute('data-dragging')).toBe(false);
  await vi.waitFor(() => expect(announcement()).toBe('Dropped at position 3 of 3.'));
});

test('Escape returns a keyboard-lifted item to where it started', async () => {
  const list = await setup();
  const outer = vi.fn();

  list.parentElement?.addEventListener('keydown', outer);
  handle(list, 'Gamma').focus();
  key(handle(list, 'Gamma'), 'Enter');
  key(handle(list, 'Gamma'), 'Home');
  await settle(list);

  expect(order(list)).toEqual(['Gamma', 'Alpha', 'Beta']);
  outer.mockClear();

  key(handle(list, 'Gamma'), 'Escape');
  await settle(list);

  expect(outer).not.toHaveBeenCalled();
  expect(order(list)).toEqual(NAMES);
  expect(document.activeElement).toBe(handle(list, 'Gamma'));
  await vi.waitFor(() => expect(announcement()).toMatch(/canceled\. Back at position 3/));
});

test('moving focus away drops a keyboard-lifted item', async () => {
  const list = await setup();

  handle(list, 'Alpha').focus();
  key(handle(list, 'Alpha'), ' ');
  key(handle(list, 'Alpha'), 'ArrowDown');
  await settle(list);

  handle(list, 'Gamma').focus();

  expect(list.hasAttribute('data-reordering')).toBe(false);
  expect(order(list)).toEqual(['Beta', 'Alpha', 'Gamma']);
});

test('moving focus to another control in the same item drops without stealing its keys', async () => {
  const list = await setup();
  const $other = document.createElement('button');

  $other.type = 'button';
  $other.textContent = 'More';
  item(list, 'Alpha').append($other);

  handle(list, 'Alpha').focus();
  key(handle(list, 'Alpha'), ' ');
  expect(list.hasAttribute('data-reordering')).toBe(true);

  $other.focus();

  const arrow = key($other, 'ArrowDown');
  const space = key($other, ' ');

  expect(list.hasAttribute('data-reordering')).toBe(false);
  expect(arrow.defaultPrevented).toBe(false);
  expect(space.defaultPrevented).toBe(false);
  expect(order(list)).toEqual(NAMES);
});

test('a press outside the lifted item drops it', async () => {
  const list = await setup();

  handle(list, 'Alpha').focus();
  key(handle(list, 'Alpha'), ' ');
  key(handle(list, 'Alpha'), 'ArrowDown');
  await settle(list);

  firePointer(document.body, 'pointerdown');

  expect(list.hasAttribute('data-reordering')).toBe(false);
  expect(order(list)).toEqual(['Beta', 'Alpha', 'Gamma']);
});

test('focus follows the item when a consumer re-creates its nodes', async () => {
  const list = await setup();

  list.addEventListener('rc-list-reorder', (event) => {
    event.preventDefault();

    const { item: $moved, to } = event.detail;
    const $clone = $moved.cloneNode(true) as RCListItem;
    const rest = Array.from(list.querySelectorAll('rc-list-item')).filter(
      ($item) => $item !== $moved,
    );

    $moved.remove();
    rest[to - 1 < 0 ? 0 : to - 1][to === 0 ? 'before' : 'after']($clone);
  });

  handle(list, 'Alpha').focus();
  key(handle(list, 'Alpha'), ' ');
  key(handle(list, 'Alpha'), 'ArrowDown');
  await settle(list);
  await nextFrame();

  expect(order(list)).toEqual(['Beta', 'Alpha', 'Gamma']);
  expect(document.activeElement).toBe(handle(list, 'Alpha'));
  expect(list.hasAttribute('data-reordering')).toBe(true);

  key(handle(list, 'Alpha'), 'ArrowDown');
  await settle(list);
  await nextFrame();

  expect(order(list)).toEqual(['Beta', 'Gamma', 'Alpha']);
});

test('a drag near the scroll container edge scrolls it', async () => {
  const screen = render(html`
    <div data-testid="scroller" style="block-size: 8rem; overflow: auto">
      <rc-list data-testid="list" reorderable style="inline-size: 16rem">
        ${['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(itemTemplate)}
      </rc-list>
    </div>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;
  const scroller = await screen.getByTestId('scroller').element();

  await settle(list);

  const $handle = handle(list, 'A');
  const start = center($handle);
  const bottom = scroller.getBoundingClientRect().bottom - 4;

  firePointer($handle, 'pointerdown', { clientX: start.x, clientY: start.y });
  firePointer($handle, 'pointermove', { clientX: start.x, clientY: start.y + 20 });
  firePointer($handle, 'pointermove', { clientX: start.x, clientY: bottom });

  await vi.waitFor(() => expect(scroller.scrollTop).toBeGreaterThan(40));

  firePointer($handle, 'pointerup', { clientX: start.x, clientY: bottom });
  await settle(list);

  expect(order(list).indexOf('A')).toBeGreaterThan(1);
});

test('reads mixed-flow scroll movement along the list block axis', async () => {
  const screen = render(html`
    <div data-testid="scroller" style="width: 8rem; height: 16rem; overflow: auto">
      <rc-list
        data-testid="list"
        reorderable
        style="writing-mode: vertical-rl; width: 28rem; height: 16rem"
      >
        ${NAMES.map(itemTemplate)}
      </rc-list>
    </div>
  `);
  const list = (await screen.getByTestId('list').element()) as RCList;
  const scroller = await screen.getByTestId('scroller').element();

  await settle(list);
  scroller.scrollLeft = 200;

  const scrollStart = scroller.scrollLeft;

  expect(scrollStart).toBeGreaterThan(100);

  const $handle = handle(list, 'Alpha');
  const start = center($handle);

  firePointer($handle, 'pointerdown', { clientX: start.x, clientY: start.y });
  firePointer($handle, 'pointermove', { clientX: start.x - 20, clientY: start.y });

  const before = parseFloat(item(list, 'Alpha').style.translate);

  scroller.scrollLeft = 160;
  firePointer($handle, 'pointermove', { clientX: start.x - 20, clientY: start.y });

  const after = parseFloat(item(list, 'Alpha').style.translate);

  expect(after - before).toBeCloseTo(scroller.scrollLeft - scrollStart, 0);

  firePointer($handle, 'pointercancel', { clientX: start.x - 20, clientY: start.y });
});

test('announces inside an open modal dialog', async () => {
  const screen = render(html`
    <dialog data-testid="dialog">
      <rc-list data-testid="list" reorderable>${NAMES.map(itemTemplate)}</rc-list>
    </dialog>
  `);
  const dialog = (await screen.getByTestId('dialog').element()) as HTMLDialogElement;
  const list = (await screen.getByTestId('list').element()) as RCList;

  dialog.showModal();
  await settle(list);
  handle(list, 'Alpha').focus();
  key(handle(list, 'Alpha'), ' ');

  await vi.waitFor(() =>
    expect(dialog.querySelector('[data-rc-live-announcer]')?.textContent).toMatch(/Picked up/),
  );

  key(handle(list, 'Alpha'), 'Enter');
  dialog.close();
});

test('has no accessibility violations while an item is lifted', async () => {
  const list = await setup();

  handle(list, 'Beta').focus();
  key(handle(list, 'Beta'), ' ');
  await settle(list);

  await expectNoA11yViolations(list);
});

const NEXT_KEY: Record<string, string> = {
  'horizontal-tb': 'ArrowDown',
  'vertical-rl': 'ArrowLeft',
  'vertical-lr': 'ArrowRight',
};

for (const fixture of FLOW_FIXTURES) {
  test(`reorders along the block axis in ${flowLabel(fixture)}`, async () => {
    const list = await setup(
      inFlow(
        html`<rc-list data-testid="list" reorderable style="block-size: auto">
          ${NAMES.map(itemTemplate)}
        </rc-list>`,
        fixture,
      ),
    );

    const { drop } = await drag(list, 'Alpha', 'Beta');

    drop();
    await settle(list);

    expect(order(list)).toEqual(['Beta', 'Alpha', 'Gamma']);

    handle(list, 'Alpha').focus();
    key(handle(list, 'Alpha'), ' ');
    key(handle(list, 'Alpha'), NEXT_KEY[fixture.writingMode]);
    key(handle(list, 'Alpha'), 'Enter');
    await settle(list);

    expect(order(list)).toEqual(['Beta', 'Gamma', 'Alpha']);
  });
}

test('resolves the block axis when a lift starts, after a runtime writing-mode change', async () => {
  const list = await setup(
    inFlow(html`<rc-list data-testid="list" reorderable>${NAMES.map(itemTemplate)}</rc-list>`, {
      dir: 'ltr',
      writingMode: 'horizontal-tb',
    }),
  );
  const $flow = list.parentElement as HTMLElement;

  $flow.style.writingMode = 'vertical-rl';
  await settle(list);

  handle(list, 'Alpha').focus();
  key(handle(list, 'Alpha'), ' ');
  key(handle(list, 'Alpha'), 'ArrowDown');
  key(handle(list, 'Alpha'), 'ArrowLeft');
  key(handle(list, 'Alpha'), 'Enter');
  await settle(list);

  expect(order(list)).toEqual(['Beta', 'Alpha', 'Gamma']);
});
