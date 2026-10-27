import { page } from 'vitest/browser';
import { userEvent } from 'vitest/browser';
import { afterEach, expect, test, vi } from 'vitest';

import '@rcarls/rc-adaptive-menu/define';
import '@rcarls/rc-button/define';
import '@rcarls/rc-chip-group/define';
import '@rcarls/rc-chip/define';
import '@rcarls/rc-combobox/define';
import '@rcarls/rc-dialog/define';
import '@rcarls/rc-field/define';
import '@rcarls/rc-list/define';
import '@rcarls/rc-menu-button/define';
import '@rcarls/rc-select/define';
import '@rcarls/rc-textarea/define';

import './theme.css';
import { logicalInsets, unexpectedOverflow } from '../../test-helpers/rendered-ui';

// Baselines come from the pinned Docker image with Roboto mounted (see
// test-helpers/fonts), which renders exactly, so any changed pixel fails.
const SCREENSHOT_OPTIONS = {
  comparatorOptions: { allowedMismatchedPixelRatio: 0 },
} as const;

afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.style.removeProperty('color-scheme');
});

async function settle(element: Element): Promise<void> {
  const updates = [element, ...element.querySelectorAll('*')]
    .map(
      (candidate) => (candidate as Element & { updateComplete?: Promise<unknown> }).updateComplete,
    )
    .filter((update): update is Promise<unknown> => update instanceof Promise);

  await Promise.all(updates);

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

test('Material fields render filled and outlined native-control compositions', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';

  scope.innerHTML = `
    <rc-field counter>
      <label slot="label">Recipe title</label>
      <input value="Soup" maxlength="80" required>
      <small slot="hint">Use a descriptive title.</small>
    </rc-field>
    <rc-field class="rc-field--outlined">
      <label slot="label">Notes</label>
      <textarea rows="3"></textarea>
    </rc-field>
    <rc-field>
      <label slot="label">Amount per serving</label>
      <input type="number">
    </rc-field>
  `;

  document.body.append(scope);
  await settle(scope);

  const [$filled, $outlined, $empty] = scope.querySelectorAll('rc-field');
  const $filledSurface = $filled.shadowRoot?.querySelector<HTMLElement>('[part="field"]');
  const $outlinedSurface = $outlined.shadowRoot?.querySelector<HTMLElement>('[part="field"]');
  const $filledLabel = $filled.shadowRoot?.querySelector<HTMLElement>('[part="label"]');
  const $filledControl = $filled.querySelector('input');
  const $emptyLabel = $empty.shadowRoot?.querySelector<HTMLElement>('[part="label"]');
  const $emptyControl = $empty.querySelector('input');

  expect($filledSurface).not.toBeNull();
  expect($outlinedSurface).not.toBeNull();
  expect($filledLabel).not.toBeNull();
  expect($filledControl).not.toBeNull();
  expect($emptyLabel).not.toBeNull();
  expect($emptyControl).not.toBeNull();
  expect($filledSurface!.getBoundingClientRect().height).toBe(56);
  expect(getComputedStyle($filledSurface!).borderBottomWidth).toBe('1px');
  expect(getComputedStyle($outlinedSurface!).borderTopWidth).toBe('1px');
  expect($outlined.hasAttribute('data-multiline')).toBe(true);
  expect($filled.querySelector('input')?.isConnected).toBe(true);

  expect($filledLabel!.getBoundingClientRect().left).toBe(
    $filledControl!.getBoundingClientRect().left,
  );

  expect($filledLabel!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    $filledControl!.getBoundingClientRect().top,
  );

  const restingTop = $emptyLabel!.getBoundingClientRect().top;

  $emptyControl!.focus();
  await settle($empty);

  expect($empty.hasAttribute('data-focused')).toBe(true);

  await expect.poll(() => $emptyLabel!.getBoundingClientRect().top).toBeLessThan(restingTop);
});

test('filled Material field aligns a textarea gutter with its floated label', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';

  scope.innerHTML = `
    <rc-field>
      <label slot="label" for="ingredient-notes">Ingredients</label>
      <rc-textarea data-rc-field-control gutter>
        <textarea id="ingredient-notes" name="ingredients">Flour\nWater</textarea>
      </rc-textarea>
    </rc-field>
  `;

  document.body.append(scope);
  await settle(scope);

  const $field = scope.querySelector('rc-field')!;
  const $textarea = scope.querySelector('textarea')!;
  const $host = scope.querySelector('rc-textarea')!;
  const $editor = $host.shadowRoot!.querySelector<HTMLElement>('#editor')!;
  const $gutter = $host.shadowRoot!.querySelector<HTMLElement>('#gutter-cells')!;
  const $label = $field.shadowRoot!.querySelector<HTMLElement>('[part="label"]')!;
  const $firstLine = $editor.querySelector<HTMLElement>('.line')!;

  expect($field.control).toBe($textarea);
  expect($textarea.isConnected).toBe(true);
  expect(getComputedStyle($editor).paddingBlockStart).toBe('0px');
  expect(getComputedStyle($editor).paddingInlineStart).toBe('16px');
  expect($gutter.getBoundingClientRect().width).toBeGreaterThanOrEqual(48);

  expect($label.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    $firstLine.getBoundingClientRect().top,
  );

  $host.style.setProperty('--rc-textarea-active-line-bg', 'rgb(1, 2, 3)');
  await userEvent.click($firstLine);

  await vi.waitFor(() => expect($firstLine.classList.contains('line--active')).toBe(true));
  expect(getComputedStyle($firstLine, '::before').insetInlineStart).toBe('-16px');
});

test('filled Material field shows a read-only textarea as a focusable field without hover', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';

  scope.innerHTML = `
    <rc-field>
      <label slot="label" for="preview-notes">Ingredients</label>
      <rc-textarea data-rc-field-control>
        <textarea id="preview-notes" readonly>Flour</textarea>
      </rc-textarea>
    </rc-field>
  `;

  document.body.append(scope);
  await settle(scope);

  const $field = scope.querySelector('rc-field')!;
  const $host = scope.querySelector('rc-textarea')!;
  const $editor = $host.shadowRoot!.querySelector<HTMLElement>('#editor')!;
  const $surface = $field.shadowRoot!.querySelector<HTMLElement>('[part="field"]')!;
  const resting = getComputedStyle($surface).backgroundColor;

  await vi.waitFor(() => expect($field).toHaveAttribute('data-readonly'));
  expect($editor).toHaveAttribute('aria-readonly', 'true');
  expect($editor).toHaveAccessibleName('Ingredients');

  await userEvent.hover($surface);
  expect(getComputedStyle($surface).backgroundColor).toBe(resting);

  await userEvent.click($editor);
  await vi.waitFor(() => expect($field).toHaveAttribute('data-focused'));
});

test('filled Material field clears a page focus outline on its native control', async () => {
  const scope = document.createElement('div');
  const $reset = document.createElement('style');

  scope.className = 'rc-theme-material';

  // A page reset ordered before the theme, such as modern-normalize's Firefox
  // :-moz-focusring rule. Layer order is fixed once theme.css loads, so the
  // theme's earlier defaults sublayer stands in for the page's reset layer.
  $reset.textContent = `
    @layer rc-theme-material.defaults {
      :focus-visible { outline: 1px dotted ButtonText; }
    }
  `;

  scope.innerHTML = `
    <rc-field>
      <label slot="label" for="portion-quantity">Quantity</label>
      <input id="portion-quantity" type="number" value="1">
    </rc-field>
  `;

  document.head.append($reset);
  document.body.append(scope);
  await settle(scope);

  const $field = scope.querySelector('rc-field')!;
  const $input = scope.querySelector('input')!;

  try {
    await userEvent.click($input);
    await vi.waitFor(() => expect($field).toHaveAttribute('data-focused'));
    expect($input).toHaveFocus();
    expect($input.matches(':focus-visible')).toBe(true);
    expect(getComputedStyle($input).outlineStyle).toBe('none');
  } finally {
    $reset.remove();
  }
});

test('a grouped Material field matches a single field with its legend as the floated label', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';
  scope.style.cssText = 'display:grid;gap:16px;inline-size:20rem;';

  scope.innerHTML = `
    <rc-field>
      <label slot="label" for="single-amount">Amount per serving</label>
      <input id="single-amount" type="number" value="1">
    </rc-field>
    <rc-field>
      <fieldset>
        <legend>Serving size</legend>
        <input type="number" aria-label="Amount" value="1">
        <input type="text" aria-label="Note" placeholder="e.g. heaping">
        <select aria-label="Unit">
          <option>g</option>
          <option selected>cups</option>
        </select>
      </fieldset>
    </rc-field>
  `;

  document.body.append(scope);
  await settle(scope);

  const [$single, $group] = scope.querySelectorAll('rc-field');
  const singleLabel = $single.shadowRoot!.querySelector<HTMLElement>('[part="label"]')!;
  const singleSurface = $single.shadowRoot!.querySelector<HTMLElement>('[part="field"]')!;
  const groupSurface = $group.shadowRoot!.querySelector<HTMLElement>('[part="field"]')!;
  const legend = $group.querySelector('legend')!;
  const amount = $group.querySelector('input')!;
  const unit = $group.querySelector('select')!;
  const singleRect = singleSurface.getBoundingClientRect();
  const groupRect = groupSurface.getBoundingClientRect();
  const labelRect = singleLabel.getBoundingClientRect();
  const legendRect = legend.getBoundingClientRect();

  expect($group).toHaveAttribute('data-group');
  expect(Math.round(groupRect.height)).toBe(Math.round(singleRect.height));
  expect(legendRect.top - groupRect.top).toBeCloseTo(labelRect.top - singleRect.top, 0);
  expect(legendRect.left - groupRect.left).toBeCloseTo(labelRect.left - singleRect.left, 0);
  expect(getComputedStyle(legend).fontSize).toBe(getComputedStyle(singleLabel).fontSize);
  expect(amount.getBoundingClientRect().width).toBeGreaterThan(unit.getBoundingClientRect().width);

  expect(amount.getBoundingClientRect().right).toBeLessThanOrEqual(
    unit.getBoundingClientRect().left,
  );

  // A grouped placeholder waits for focus, like a single field's under its resting label.
  const note = $group.querySelector<HTMLInputElement>('input[aria-label="Note"]')!;

  expect(getComputedStyle(note, '::placeholder').color).toBe('rgba(0, 0, 0, 0)');

  await userEvent.click(unit);
  await vi.waitFor(() => expect($group).toHaveAttribute('data-focused'));
  expect(getComputedStyle(note, '::placeholder').color).not.toBe('rgba(0, 0, 0, 0)');
  expect(getComputedStyle(unit).outlineStyle).toBe('none');

  // The legend's color transitions with the label's.
  await vi.waitFor(() =>
    expect(getComputedStyle(legend).color).not.toBe(getComputedStyle(singleLabel).color),
  );

  await userEvent.keyboard('{Escape}');
});

test('a grouped Material legend rests and floats like a single field label', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';
  scope.style.cssText = 'display:grid;gap:16px;inline-size:20rem;';

  scope.innerHTML = `
    <rc-field>
      <label slot="label" for="single-empty">Amount</label>
      <input id="single-empty" type="number">
    </rc-field>
    <rc-field>
      <fieldset>
        <legend>Serving size</legend>
        <input type="number" aria-label="Amount">
        <select aria-label="Unit"><option>cups</option></select>
      </fieldset>
    </rc-field>
    <rc-field class="rc-field--outlined">
      <label slot="label" for="outlined-empty">Amount</label>
      <input id="outlined-empty" type="number">
    </rc-field>
    <rc-field class="rc-field--outlined">
      <fieldset>
        <legend>Serving size</legend>
        <input type="number" aria-label="Amount">
        <select aria-label="Unit"><option>cups</option></select>
      </fieldset>
    </rc-field>
    <rc-field>
      <fieldset>
        <legend>Price</legend>
        <select aria-label="Currency"><option>USD</option></select>
        <input type="number" aria-label="Amount">
      </fieldset>
    </rc-field>
  `;

  document.body.append(scope);
  await settle(scope);

  const [$single, $group, $outlinedSingle, $outlinedGroup, $leading] =
    scope.querySelectorAll('rc-field');
  const label = $single.shadowRoot!.querySelector<HTMLElement>('[part="label"]')!;
  const legend = $group.querySelector('legend')!;
  const offset = ($field: Element, $text: Element) =>
    $text.getBoundingClientRect().top -
    $field.shadowRoot!.querySelector('[part="field"]')!.getBoundingClientRect().top;
  const waitForTransitions = () => new Promise((resolve) => setTimeout(resolve, 400));

  // Resting: the empty, idle group's legend sits on the input line in body-large type.
  expect(getComputedStyle(legend).fontSize).toBe(getComputedStyle(label).fontSize);
  expect(getComputedStyle(legend).fontSize).toBe('16px');
  await waitForTransitions();
  expect(offset($group, legend)).toBeCloseTo(offset($single, label), 0);

  expect(
    offset($outlinedGroup, $outlinedGroup.querySelector('legend')!) -
      offset($outlinedSingle, $outlinedSingle.shadowRoot!.querySelector('[part="label"]')!),
  ).toBeCloseTo(0, 0);

  // A group led by an addon keeps its legend floated.
  expect(getComputedStyle($leading.querySelector('legend')!).fontSize).toBe('12px');

  // Floated: focus lifts both to the caption line.
  $group.querySelector('input')!.focus();
  $single.querySelector('input')!.focus();
  $group.querySelector('input')!.focus();
  await vi.waitFor(() => expect($group).toHaveAttribute('data-focused'));
  await waitForTransitions();
  expect(getComputedStyle(legend).fontSize).toBe('12px');

  $single.querySelector('input')!.value = '1';
  $single.sync();
  await settle(scope);
  await waitForTransitions();
  expect(offset($group, legend)).toBeCloseTo(offset($single, label), 0);
});

test('rc-select and rc-combobox lose their own chrome when composed as rc-field control providers', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';

  scope.innerHTML = `
    <rc-field>
      <label slot="label">Unit</label>
      <rc-select data-rc-field-control>
        <select>
          <option value="">Choose a unit</option>
          <option value="oz">oz</option>
        </select>
      </rc-select>
    </rc-field>
    <rc-field>
      <label slot="label">Categories</label>
      <rc-combobox data-rc-field-control multiple>
        <select multiple>
          <option value="braiser">Braiser</option>
        </select>
      </rc-combobox>
    </rc-field>
  `;

  document.body.append(scope);
  await settle(scope);

  const [$selectField, $comboboxField] = scope.querySelectorAll('rc-field');
  const $select = $selectField.querySelector('rc-select')!;
  const $selectTrigger = $select.shadowRoot!.querySelector<HTMLElement>('[part="trigger"]')!;
  const $combobox = $comboboxField.querySelector('rc-combobox')!;
  const $comboboxAnchor = $combobox.shadowRoot!.querySelector<HTMLElement>('[part="anchor"]')!;

  expect($selectField.control).toBe($select.querySelector('select'));
  expect($selectField.hasAttribute('data-control-provider')).toBe(true);
  expect($comboboxField.control).toBe($combobox.querySelector('select'));
  expect($comboboxField.hasAttribute('data-control-provider')).toBe(true);

  expect(getComputedStyle($selectTrigger).borderWidth).toBe('0px');
  expect(getComputedStyle($selectTrigger).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  expect(getComputedStyle($comboboxAnchor).borderWidth).toBe('0px');
  expect(getComputedStyle($comboboxAnchor).backgroundColor).toBe('rgba(0, 0, 0, 0)');

  ($select as unknown as { focus(): void }).focus();
  await settle($selectField);

  expect($selectField.hasAttribute('data-focused')).toBe(true);

  // border-color is moot once border-width is 0 (invisible regardless of color), and
  // :focus-visible is a scripted-focus heuristic that varies by environment; border-width
  // and box-shadow are what actually determine whether chrome is visible here.
  expect(getComputedStyle($selectTrigger).borderWidth).toBe('0px');
  expect(getComputedStyle($selectTrigger).boxShadow).toBe('none');

  $combobox.shadowRoot!.querySelector<HTMLInputElement>('[part~="input"]')!.focus();
  await settle($comboboxField);

  expect($comboboxField.hasAttribute('data-focused')).toBe(true);
  expect($comboboxAnchor.matches(':focus-within')).toBe(true);
  expect(getComputedStyle($comboboxAnchor).outlineStyle).toBe('none');
});

test('readonly Material chips keep visible space between wrapped rows', async () => {
  const $scope = document.createElement('div');

  $scope.className = 'rc-theme-material';

  $scope.innerHTML = `
    <rc-chip-group layout="auto" max-rows="1" default-expanded style="inline-size: 12rem">
      ${Array.from(
        { length: 6 },
        (_, index) => `<rc-chip readonly><span data-rc-chip-label>Chip ${index}</span></rc-chip>`,
      ).join('')}
    </rc-chip-group>
  `;

  document.body.append($scope);
  await settle($scope);

  const $group = $scope.querySelector('rc-chip-group')!;

  await vi.waitFor(() =>
    expect($group.shadowRoot!.querySelector<HTMLElement>('#toggle-wrap')!.hidden).toBe(false),
  );

  const $chips = [...$group.querySelectorAll<HTMLElement>('rc-chip')];
  const chipRows = [...new Set($chips.map(($chip) => $chip.getBoundingClientRect().top))];

  expect($chips.map(($chip) => $chip.getBoundingClientRect().height)).toEqual(Array(6).fill(48));
  expect($chips[0].querySelector('[data-rc-chip-label]')!.getBoundingClientRect().height).toBe(32);
  expect(chipRows.length).toBeGreaterThan(1);
  expect(chipRows[1] - chipRows[0]).toBe(48);

  $scope.remove();
});

test('floated field labels share one offset while chip rows grow the filled field', async () => {
  const scope = document.createElement('div');
  const options = '<option selected>Beef</option><option selected>Cheap</option>';

  scope.className = 'rc-theme-material';
  scope.style.inlineSize = '360px';

  scope.innerHTML = `
    <rc-field data-k="text"><label slot="label">Name</label><input value="Tacos"></rc-field>
    <rc-field data-k="select">
      <label slot="label">Difficulty</label>
      <rc-select data-rc-field-control>
        <select><option value=""></option><option value="easy" selected>Easy</option></select>
      </rc-select>
    </rc-field>
    <rc-field data-k="chips">
      <label slot="label">Categories</label>
      <rc-select data-rc-field-control><select multiple>${options}</select></rc-select>
    </rc-field>
    <rc-field data-k="dense">
      <label slot="label">Categories</label>
      <rc-select class="rc-select--dense" data-rc-field-control>
        <select multiple>${options}</select>
      </rc-select>
    </rc-field>
    <rc-field class="rc-field--outlined" data-k="outlined-text">
      <label slot="label">Name</label><input value="Tacos">
    </rc-field>
    <rc-field class="rc-field--outlined" data-k="outlined-select">
      <label slot="label">Difficulty</label>
      <rc-select data-rc-field-control>
        <select><option value=""></option><option value="easy" selected>Easy</option></select>
      </rc-select>
    </rc-field>
  `;

  document.body.append(scope);
  await settle(scope);

  await vi.waitFor(() =>
    expect(
      scope.querySelector('[data-k="chips"] rc-select')!.shadowRoot!.querySelector('rc-chip'),
    ).not.toBeNull(),
  );

  const geometry = (key: string) => {
    const $field = scope.querySelector<HTMLElement>(`[data-k="${key}"]`)!;
    const field = $field.shadowRoot!.querySelector('[part~="field"]')!.getBoundingClientRect();
    const label = $field.shadowRoot!.querySelector('[part~="label"]')!.getBoundingClientRect();

    return { height: Math.round(field.height), labelTop: Math.round(label.top - field.top) };
  };

  expect(geometry('text')).toEqual({ height: 56, labelTop: 8 });
  expect(geometry('select')).toEqual({ height: 56, labelTop: 8 });
  expect(geometry('chips')).toEqual({ height: 68, labelTop: 8 });
  expect(geometry('dense')).toEqual({ height: 56, labelTop: 8 });

  const $chipsField = scope.querySelector<HTMLElement>('[data-k="chips"]')!;
  const chipTop = $chipsField
    .querySelector('rc-select')!
    .shadowRoot!.querySelector('rc-chip button')!
    .getBoundingClientRect().top;
  const labelBottom = $chipsField
    .shadowRoot!.querySelector('[part~="label"]')!
    .getBoundingClientRect().bottom;

  // Full-size chips keep a small gap below the floated label.
  expect(Math.round(chipTop - labelBottom)).toBe(4);

  // Outlined labels ride the top border instead.
  expect(geometry('outlined-text').labelTop).toBeLessThan(0);
  expect(geometry('outlined-select').labelTop).toBe(geometry('outlined-text').labelTop);

  scope.remove();
});

test('dialog-mode combobox fills the current visual viewport', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';

  scope.innerHTML = `
    <rc-field>
      <label slot="label">Categories</label>
      <rc-combobox data-rc-field-control popup-mode="dialog" multiple>
        <select aria-label="Categories" multiple>
          <option value="quick">Quick meal</option>
          <option value="vegetarian">Vegetarian</option>
        </select>
      </rc-combobox>
    </rc-field>
  `;

  document.body.append(scope);
  await settle(scope);

  const $combobox = scope.querySelector<HTMLElement & { openPopup(): void }>('rc-combobox')!;

  $combobox.openPopup();
  await settle($combobox);

  const $dialogHost = $combobox.shadowRoot!.querySelector('rc-dialog')!;
  const $dialog = $dialogHost.querySelector<HTMLDialogElement>('[part~="dialog"]')!;
  const $search = $dialog.querySelector<HTMLInputElement>('[part~="dialog-input"]')!;
  const $cancel = $dialog.querySelector<HTMLButtonElement>('[part~="dialog-cancel"]')!;
  const $confirm = $dialog.querySelector<HTMLButtonElement>('[part~="dialog-confirm"]')!;
  const viewport = window.visualViewport;
  const rect = $dialog.getBoundingClientRect();

  expect($dialogHost.getAttribute('variant')).toBe('fullscreen');
  expect($dialog.open).toBe(true);
  expect(getComputedStyle($search).borderWidth).toBe('1px');
  expect($cancel.getAttribute('aria-label')).toBe('Cancel');
  expect($confirm.textContent?.trim()).toBe('Done');
  expect(rect.left).toBeCloseTo(viewport?.offsetLeft ?? 0, 0);
  expect(rect.top).toBeCloseTo(viewport?.offsetTop ?? 0, 0);
  expect(rect.width).toBeCloseTo(viewport?.width ?? window.innerWidth, 0);
  expect(rect.height).toBeCloseTo(viewport?.height ?? window.innerHeight, 0);

  $dialog.close();
});

test('standalone fullscreen dialog uses the Material visual viewport surface', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';

  scope.innerHTML = `
    <rc-dialog variant="fullscreen">
      <dialog aria-label="Fullscreen example"><button>Close</button></dialog>
    </rc-dialog>
  `;

  document.body.append(scope);
  await settle(scope);

  const $host = scope.querySelector<HTMLElement & { showModal(): void }>('rc-dialog')!;

  $host.showModal();
  await settle($host);

  const $dialog = $host.querySelector('dialog')!;
  const viewport = window.visualViewport;
  const rect = $dialog.getBoundingClientRect();

  expect(rect.left).toBeCloseTo(viewport?.offsetLeft ?? 0, 0);
  expect(rect.top).toBeCloseTo(viewport?.offsetTop ?? 0, 0);
  expect(rect.width).toBeCloseTo(viewport?.width ?? window.innerWidth, 0);
  expect(rect.height).toBeCloseTo(viewport?.height ?? window.innerHeight, 0);
  expect(getComputedStyle($dialog).borderRadius).toBe('0px');

  $dialog.close();
});

test('Material fields preserve label separation with increased text metrics', async () => {
  const $scope = document.createElement('div');

  $scope.className = 'rc-theme-material';
  $scope.style.setProperty('--md-sys-typescale-body-small-size', '24px');
  $scope.style.setProperty('--md-sys-typescale-body-small-line-height', '32px');
  $scope.style.setProperty('--md-sys-typescale-body-large-size', '32px');
  $scope.style.setProperty('--md-sys-typescale-body-large-line-height', '48px');

  $scope.innerHTML = `
    <rc-field>
      <label slot="label">Recipe title</label>
      <input value="Soup">
    </rc-field>
    <rc-field>
      <label slot="label">Amount per serving</label>
      <input type="number">
    </rc-field>
  `;

  document.body.append($scope);
  await settle($scope);

  const [$populated, $empty] = $scope.querySelectorAll('rc-field');
  const $populatedSurface = $populated.shadowRoot!.querySelector<HTMLElement>('[part="field"]')!;
  const $populatedLabel = $populated.shadowRoot!.querySelector<HTMLElement>('[part="label"]')!;
  const $populatedControl = $populated.querySelector('input')!;
  const $emptySurface = $empty.shadowRoot!.querySelector<HTMLElement>('[part="field"]')!;
  const $emptyLabel = $empty.shadowRoot!.querySelector<HTMLElement>('[part="label"]')!;
  const $emptyControl = $empty.querySelector('input')!;
  const emptySurfaceBox = $emptySurface.getBoundingClientRect();
  const restingLabelBox = $emptyLabel.getBoundingClientRect();

  expect($populatedSurface.getBoundingClientRect().height).toBeGreaterThanOrEqual(80);

  expect($populatedLabel.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    $populatedControl.getBoundingClientRect().top,
  );

  expect(
    Math.abs(
      restingLabelBox.top +
        restingLabelBox.height / 2 -
        (emptySurfaceBox.top + emptySurfaceBox.height / 2),
    ),
  ).toBeLessThanOrEqual(0.5);

  $emptyControl.focus();
  await settle($empty);

  await expect
    .poll(() => $emptyLabel.getBoundingClientRect().bottom)
    .toBeLessThanOrEqual($emptyControl.getBoundingClientRect().top);
});

test('segmented Material list rows render with 16px inline content padding', async () => {
  const scope = document.createElement('div');
  const list = document.createElement('rc-list');
  const iconList = document.createElement('rc-list');
  const item = document.createElement('rc-list-item');
  const iconItem = document.createElement('rc-list-item');
  const leading = document.createElement('span');

  scope.className = 'rc-theme-material';
  list.setAttribute('variant', 'segmented');
  iconList.setAttribute('variant', 'segmented');
  item.textContent = 'Padded setting';
  leading.slot = 'leading';
  leading.dataset.rcListLeading = '';
  leading.textContent = '★';
  iconItem.textContent = 'Icon setting';
  iconItem.prepend(leading);
  list.append(item);
  iconList.append(iconItem);
  scope.append(list, iconList);
  document.body.append(scope);
  await settle(scope);

  const content = item.shadowRoot?.querySelector<HTMLElement>('[part="content"]');

  expect(content).not.toBeNull();

  const insets = logicalInsets(item, content!);

  expect(insets.inlineStart).toBe(16);
  expect(insets.inlineEnd).toBe(16);
  expect(leading.getBoundingClientRect().width).toBe(24);
  expect(leading.getBoundingClientRect().height).toBe(24);
  expect(getComputedStyle(leading).fontSize).toBe('24px');
});

test('adaptive menu actions fit their container without unexpected overflow', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';

  scope.innerHTML = `
    <div style="inline-size: 184px">
      <rc-adaptive-menu max-shown="3" data-testid="adaptive-menu">
        <rc-button icon-only class="rc-icon-button--standard" data-priority="30">
          <button type="button" aria-label="Favorite">
            <span data-rc-menu-leading aria-hidden="true">★</span>
            <span data-rc-menu-label>Favorite</span>
          </button>
        </rc-button>
        <rc-button icon-only class="rc-icon-button--standard" data-priority="20">
          <button type="button" aria-label="Edit">
            <span data-rc-menu-leading aria-hidden="true">✎</span>
            <span data-rc-menu-label>Edit</span>
          </button>
        </rc-button>
        <rc-button icon-only class="rc-icon-button--standard" data-priority="10">
          <button type="button" aria-label="Share">
            <span data-rc-menu-leading aria-hidden="true">↗</span>
            <span data-rc-menu-label>Share</span>
          </button>
        </rc-button>
      </rc-adaptive-menu>
    </div>
  `;

  document.body.append(scope);
  await settle(scope);

  const menu = scope.querySelector('rc-adaptive-menu');

  expect(menu).not.toBeNull();

  expect(
    unexpectedOverflow(menu!, {
      // Each icon-only rc-button's touch-target hit-slop is an invisible,
      // absolutely-positioned pseudo-element that intentionally extends past
      // its own visible box up to the accessible 48dp tap target (see
      // rc-button's own touch-target docs) — real DOM geometry with no
      // visible paint. That geometry is what rc-adaptive-menu's own
      // scrollWidth picks up for its edge-most promoted buttons, the same
      // way it already does for the buttons themselves, so the host needs
      // the same exemption.
      ignore: (element) =>
        element.matches(
          'rc-adaptive-menu, rc-button[icon-only], rc-button[icon-only] *, [data-rc-menu-label]',
        ),
    }),
  ).toEqual([]);

  expect(menu!.querySelectorAll('[data-rc-action-promoted]')).toHaveLength(3);
});

test('adaptive overflow labels use Material menu-item typography', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';

  scope.innerHTML = `
    <rc-adaptive-menu>
      <rc-button icon-only class="rc-icon-button--standard" slot="overflow">
        <button type="button" aria-label="Settings">
          <span data-rc-menu-leading aria-hidden="true">⚙</span>
          <span data-rc-menu-label>Settings</span>
        </button>
      </rc-button>
      <rc-menu-button icon-only slot="overflow">
        <button type="button" slot="trigger" aria-label="View">
          <span data-rc-menu-leading aria-hidden="true">☷</span>
          <span data-rc-menu-label>View</span>
        </button>
        <span slot="indicator" aria-hidden="true">›</span>
        <rc-menu label="View">
          <button type="button" role="menuitem">Cards</button>
        </rc-menu>
      </rc-menu-button>
    </rc-adaptive-menu>
  `;

  document.body.append(scope);
  await settle(scope);

  const menu = scope.querySelector('rc-adaptive-menu');

  expect(menu).not.toBeNull();
  menu!.openMenu();
  await settle(scope);

  const labels = scope.querySelectorAll<HTMLElement>('[data-rc-menu-label]');
  const icons = scope.querySelectorAll<HTMLElement>('[data-rc-menu-leading]');
  const overflowTrigger = menu!.shadowRoot?.querySelector<HTMLElement>('#overflow-trigger');
  const overflowTarget = menu!.shadowRoot?.querySelector<HTMLElement>('#overflow-trigger-target');

  expect(labels).toHaveLength(2);
  expect(icons).toHaveLength(2);
  expect(Math.round(overflowTrigger!.getBoundingClientRect().width)).toBe(32);
  expect(Math.round(overflowTrigger!.getBoundingClientRect().height)).toBe(40);
  expect(Math.round(overflowTarget!.getBoundingClientRect().width)).toBe(48);
  expect(Math.round(overflowTarget!.getBoundingClientRect().height)).toBe(48);

  for (const label of labels) {
    const style = getComputedStyle(label);

    expect(style.fontSize).toBe('16px');
    expect(style.fontWeight).toBe('400');
    expect(style.lineHeight).toBe('24px');
    expect(style.letterSpacing).toBe('0.5px');
  }

  for (const icon of icons) {
    const style = getComputedStyle(icon);

    expect(style.fontSize).toBe('24px');
    expect(style.lineHeight).toBe('24px');
  }

  // Overflow rows take the adaptive menu's item tokens, not icon-button sizing
  // and colors, whatever order the page declares its cascade layers in.
  const overflowButton = scope.querySelector<HTMLElement>('rc-button')!;
  const overflowButtonStyle = getComputedStyle(overflowButton);

  expect(overflowButton).toHaveAttribute('data-rc-action-overflowed');
  expect(overflowButtonStyle.getPropertyValue('--rc-button-icon-size').trim()).toBe('100%');
  expect(overflowButtonStyle.getPropertyValue('--rc-button-bg').trim()).toBe('transparent');

  const submenu = scope.querySelector('rc-menu-button');
  const submenuTrigger = submenu?.querySelector<HTMLButtonElement>('[slot="trigger"]');

  expect(submenu).not.toBeNull();
  expect(submenu).toHaveAttribute('orientation', 'vertical');

  const indicator = submenu!.shadowRoot?.querySelector<HTMLElement>('slot[name="indicator"]');
  const triggerWrap = submenu!.shadowRoot?.querySelector<HTMLElement>('#trigger-wrap');
  const submenuRect = submenu!.getBoundingClientRect();
  const indicatorRect = indicator!.getBoundingClientRect();
  const triggerWrapRect = triggerWrap!.getBoundingClientRect();

  expect(Math.round(triggerWrapRect.right - indicatorRect.right)).toBe(12);
  expect(submenuRect.width - triggerWrapRect.width).toBeLessThanOrEqual(20);

  submenuTrigger!.click();
  await settle(scope);

  expect(submenu!.open).toBe(true);
  expect(menu!.shadowRoot?.querySelector('#popup')?.matches(':popover-open')).toBe(true);
});

const isChromium = navigator.userAgent.includes('Chrome');

test.runIf(isChromium).each(['light', 'dark'] as const)(
  'Material adaptive overflow visual baseline in %s mode',
  async (mode) => {
    document.documentElement.style.colorScheme = mode;

    const scope = document.createElement('section');

    scope.className = 'rc-theme-material';
    scope.dataset.testid = 'adaptive-menu-contract';

    scope.style.cssText = [
      'box-sizing:border-box',
      'display:grid',
      'justify-items:end',
      'align-items:start',
      'inline-size:300px',
      'block-size:220px',
      'padding:16px',
      'background:var(--md-sys-color-surface)',
      'color:var(--md-sys-color-on-surface)',
    ].join(';');

    scope.style.colorScheme = mode;

    scope.innerHTML = `
      <rc-adaptive-menu>
        <rc-button icon-only class="rc-icon-button--standard" slot="overflow">
          <button type="button" aria-label="Settings">
            <span data-rc-menu-leading aria-hidden="true">⚙</span>
            <span data-rc-menu-label>Settings</span>
          </button>
        </rc-button>
        <rc-menu-button icon-only slot="overflow">
          <button type="button" slot="trigger" aria-label="View">
            <span data-rc-menu-leading aria-hidden="true">☷</span>
            <span data-rc-menu-label>View</span>
          </button>
          <span slot="indicator" aria-hidden="true">›</span>
          <rc-menu label="View">
            <button type="button" role="menuitem">Cards</button>
          </rc-menu>
        </rc-menu-button>
      </rc-adaptive-menu>
    `;

    document.body.append(scope);
    await settle(scope);

    const menu = scope.querySelector('rc-adaptive-menu');

    expect(menu).not.toBeNull();
    menu!.openMenu();
    await settle(scope);

    await expect(page.getByTestId('adaptive-menu-contract')).toMatchScreenshot(
      `adaptive-menu-contract-${mode}`,
      SCREENSHOT_OPTIONS,
    );
  },
);

test.runIf(isChromium).each(['light', 'dark'] as const)(
  'Material component contract visual baseline in %s mode',
  async (mode) => {
    document.documentElement.style.colorScheme = mode;

    const scope = document.createElement('section');

    scope.className = 'rc-theme-material';
    scope.dataset.testid = 'material-contract';

    scope.style.cssText = [
      'box-sizing:border-box',
      'display:grid',
      'gap:16px',
      'inline-size:420px',
      'padding:16px',
      'background:var(--md-sys-color-surface)',
      'color:var(--md-sys-color-on-surface)',
      'font:var(--md-sys-typescale-body-medium)',
    ].join(';');

    scope.style.colorScheme = mode;

    scope.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <rc-button class="rc-button--filled"><button type="button">Filled</button></rc-button>
        <rc-button class="rc-button--tonal"><button type="button">Tonal</button></rc-button>
        <rc-button class="rc-button--outlined"><button type="button">Outlined</button></rc-button>
        <rc-button class="rc-button--text"><button type="button">Text</button></rc-button>
      </div>
      <rc-list variant="segmented">
        <rc-list-item>
          <span data-rc-list-headline>Theme</span>
          <small data-rc-list-supporting>Use device setting</small>
        </rc-list-item>
        <rc-list-item>
          <span data-rc-list-headline>Sync</span>
          <small data-rc-list-supporting>Connected to cloud storage</small>
        </rc-list-item>
      </rc-list>
      <div style="inline-size:184px;justify-self:end">
        <rc-adaptive-menu max-shown="2">
          <rc-button icon-only class="rc-icon-button--standard" data-priority="20">
            <button type="button" aria-label="Favorite">
              <span data-rc-menu-leading aria-hidden="true">★</span>
              <span data-rc-menu-label>Favorite</span>
            </button>
          </rc-button>
          <rc-button icon-only class="rc-icon-button--standard" data-priority="10">
            <button type="button" aria-label="Edit">
              <span data-rc-menu-leading aria-hidden="true">✎</span>
              <span data-rc-menu-label>Edit</span>
            </button>
          </rc-button>
          <rc-button icon-only class="rc-icon-button--standard" slot="overflow">
            <button type="button" aria-label="Delete">
              <span data-rc-menu-leading aria-hidden="true">×</span>
              <span data-rc-menu-label>Delete</span>
            </button>
          </rc-button>
        </rc-adaptive-menu>
      </div>
    `;

    document.body.append(scope);
    await settle(scope);

    await expect(page.getByTestId('material-contract')).toMatchScreenshot(
      `material-contract-${mode}`,
      SCREENSHOT_OPTIONS,
    );
  },
);

test('popups and their items keep the Material menu style inside foreign shadow roots', async () => {
  const scope = document.createElement('div');
  const host = document.createElement('div');
  const shadowRoot = host.attachShadow({ mode: 'open' });
  const adaptiveMenu = document.createElement('rc-adaptive-menu');
  const menuButton = document.createElement('rc-menu-button');
  const menu = document.createElement('rc-menu');

  scope.className = 'rc-theme-material';
  adaptiveMenu.setAttribute('max-shown', '0');

  const label = Object.assign(document.createElement('span'), { textContent: 'Edit' });
  const action = document.createElement('button');

  label.setAttribute('data-rc-menu-label', '');
  action.append(label);
  adaptiveMenu.append(action);
  menuButton.append(menu);
  shadowRoot.append(adaptiveMenu, menuButton);
  scope.append(host);
  document.body.append(scope);
  await settle(shadowRoot.host);

  await Promise.all(
    [adaptiveMenu, menuButton, menu].map(
      (element) => (element as Element & { updateComplete?: Promise<unknown> }).updateComplete,
    ),
  );

  const popup = adaptiveMenu.shadowRoot!.querySelector<HTMLElement>('#popup')!;
  const popupShadow = getComputedStyle(scope).getPropertyValue('--rc-adaptive-menu-popup-shadow');

  expect(popupShadow).toContain('0 1px 2px');
  expect(popupShadow).toContain('0 2px 6px 2px');
  expect(getComputedStyle(popup).boxShadow).not.toBe(getComputedStyle(menu).boxShadow);

  // The theme's control radius is fully rounded; popups must not inherit it.
  for (const surface of [popup, menu]) {
    const styles = getComputedStyle(surface);

    expect(styles.borderStartStartRadius).toBe('4px');
    expect(styles.borderTopWidth).toBe('0px');
    expect(styles.paddingBlockStart).toBe('8px');
  }

  // MD3 menu items use the body-large type scale.
  for (const text of [label, menu]) {
    const styles = getComputedStyle(text);

    expect(styles.fontSize).toBe('16px');
    expect(styles.lineHeight).toBe('24px');
  }

  expect(getComputedStyle(label).letterSpacing).toBe('0.5px');
});

test('reorderable list handles and lifted items follow the Material dragged state', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';

  scope.innerHTML = `
    <rc-list reorderable>
      <rc-list-item data-testid="lifted">
        Alpha
        <button slot="trailing" type="button" data-rc-reorder-handle aria-label="Reorder Alpha">⠿</button>
      </rc-list-item>
      <rc-list-item>
        Beta
        <button slot="trailing" type="button" data-rc-reorder-handle aria-label="Reorder Beta">⠿</button>
      </rc-list-item>
    </rc-list>
  `;

  document.body.append(scope);
  await settle(scope);

  const $item = scope.querySelector('rc-list-item') as HTMLElement;
  const $handle = $item.querySelector('button') as HTMLButtonElement;
  const $row = $item.shadowRoot?.querySelector('[part="row"]') as HTMLElement;
  const handleStyles = getComputedStyle($handle);

  expect(handleStyles.touchAction).toBe('none');
  expect(handleStyles.minBlockSize).toBe('48px');
  expect(handleStyles.minInlineSize).toBe('48px');
  expect(getComputedStyle($row).boxShadow).toBe('none');

  $item.toggleAttribute('data-dragging', true);

  const probe = document.createElement('div');

  probe.style.background = 'var(--md-sys-color-surface-container-high)';
  scope.append(probe);

  // The row transitions its surface, so wait for it to settle.
  await vi.waitFor(() => {
    expect(getComputedStyle($row).boxShadow).not.toBe('none');
    expect(getComputedStyle($row).backgroundColor).toBe(getComputedStyle(probe).backgroundColor);
  });

  expect(getComputedStyle($item).zIndex).toBe('1');

  scope.remove();
});

test('a data-rc-type-scale region scales Material type and RC text tokens', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';

  scope.innerHTML = `
    <p data-testid="outside" style="font: var(--md-sys-typescale-body-large-size) / var(--md-sys-typescale-body-large-line-height) sans-serif">Outside</p>
    <section data-rc-type-scale style="--rc-type-scale: 1.5">
      <p data-testid="inside" style="font: var(--md-sys-typescale-body-large-size) / var(--md-sys-typescale-body-large-line-height) sans-serif">Inside</p>
      <rc-list>
        <rc-list-item>Scaled row</rc-list-item>
      </rc-list>
      <rc-button><button type="button">Scaled button</button></rc-button>
    </section>
    <rc-list data-testid="outside-list">
      <rc-list-item>Unscaled row</rc-list-item>
    </rc-list>
  `;
  document.body.append(scope);
  await settle(scope);

  const outside = getComputedStyle(scope.querySelector('[data-testid="outside"]')!);
  const inside = getComputedStyle(scope.querySelector('[data-testid="inside"]')!);

  expect(outside.fontSize).toBe('16px');
  expect(outside.lineHeight).toBe('24px');
  expect(inside.fontSize).toBe('24px');
  expect(inside.lineHeight).toBe('36px');

  // RC tokens derived on the theme root are derived again inside the region.
  const rowContent = (selector: string) =>
    scope.querySelector(selector)!.shadowRoot!.querySelector('[part~="content"]')!;
  const scaledRow = getComputedStyle(rowContent('section rc-list-item'));
  const unscaledRow = getComputedStyle(rowContent('[data-testid="outside-list"] rc-list-item'));

  expect(unscaledRow.fontSize).toBe('16px');
  expect(scaledRow.fontSize).toBe('24px');

  const button = scope.querySelector('section rc-button button')!;

  expect(getComputedStyle(button).fontSize).toBe('21px');
});

test('a theme root marked data-rc-type-scale scales its own type tokens', async () => {
  const scope = document.createElement('div');

  scope.className = 'rc-theme-material';
  scope.setAttribute('data-rc-type-scale', '');
  scope.style.setProperty('--rc-type-scale', '0.75');
  scope.innerHTML = `
    <p style="font: var(--md-sys-typescale-body-large-size) / var(--md-sys-typescale-body-large-line-height) sans-serif">Scaled</p>
    <rc-button><button type="button">Scaled button</button></rc-button>
  `;
  document.body.append(scope);
  await settle(scope);

  const text = getComputedStyle(scope.querySelector('p')!);

  expect(text.fontSize).toBe('12px');
  expect(text.lineHeight).toBe('18px');
  expect(getComputedStyle(scope.querySelector('rc-button button')!).fontSize).toBe('10.5px');
});
