import { afterEach, expect, test } from 'vitest';

import '@rcarls/rc-accordion/define';
import '@rcarls/rc-disclosure/define';
import { FLOW_FIXTURES } from '../../test-helpers/flow';

import './components.css';

afterEach(() => {
  document.body.replaceChildren();
});

function renderScope(dir: 'ltr' | 'rtl', writingMode: string): HTMLElement {
  const $scope = document.createElement('div');

  $scope.className = 'rc-theme-material';
  $scope.dir = dir;
  $scope.style.writingMode = writingMode;
  document.body.append($scope);

  return $scope;
}

function panelMarkup(label: string, wrapped: boolean): string {
  const details = `<details><summary>${label}</summary><p>Body</p></details>`;

  return wrapped ? `<rc-disclosure>${details}</rc-disclosure>` : details;
}

function panelAt($accordion: HTMLElement, index: number): HTMLDetailsElement {
  const $item = $accordion.children.item(index);
  const $details = $item?.matches('details') ? $item : $item?.querySelector('details');

  if (!($details instanceof HTMLDetailsElement)) {
    throw new Error(`No native details panel at index ${index}`);
  }

  return $details;
}

function corners($element: HTMLElement): string[] {
  const styles = getComputedStyle($element);

  return [
    'border-start-start-radius',
    'border-start-end-radius',
    'border-end-start-radius',
    'border-end-end-radius',
  ].map((property) => styles.getPropertyValue(property));
}

async function settleLayout(): Promise<void> {
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

test.each(FLOW_FIXTURES)(
  'segmented accordion corners follow $writingMode $dir for direct and wrapped panels',
  async ({ dir, writingMode }) => {
    const $scope = renderScope(dir, writingMode);

    for (const wrapped of [false, true]) {
      const $accordion = document.createElement('rc-accordion');

      $accordion.innerHTML = ['First', 'Middle', 'Last']
        .map((label) => panelMarkup(label, wrapped))
        .join('');

      $scope.append($accordion);
      await settleLayout();

      const $first = panelAt($accordion, 0);
      const $middle = panelAt($accordion, 1);
      const $last = panelAt($accordion, 2);

      expect(getComputedStyle($accordion).rowGap).toBe('2px');
      expect(getComputedStyle($first).borderTopWidth).toBe('0px');
      expect(corners($first)).toEqual(['28px', '28px', '4px', '4px']);
      expect(corners($middle)).toEqual(['4px', '4px', '4px', '4px']);
      expect(corners($last)).toEqual(['4px', '4px', '28px', '28px']);

      const $firstSummary = $first.querySelector('summary');
      const $lastSummary = $last.querySelector('summary');

      if (!$firstSummary || !$lastSummary) {
        throw new Error('No native accordion summaries found');
      }

      expect(corners($firstSummary)).toEqual(corners($first));
      expect(corners($lastSummary)).toEqual(corners($last));

      if (writingMode === 'vertical-rl') {
        expect($first.getBoundingClientRect().right).toBeGreaterThan(
          $last.getBoundingClientRect().right,
        );
      } else if (writingMode === 'vertical-lr') {
        expect($first.getBoundingClientRect().left).toBeLessThan(
          $last.getBoundingClientRect().left,
        );
      }

      $scope.dir = dir === 'ltr' ? 'rtl' : 'ltr';
      await settleLayout();

      expect(corners($first)).toEqual(['28px', '28px', '4px', '4px']);
      expect(corners($last)).toEqual(['4px', '4px', '28px', '28px']);
      $scope.dir = dir;
      $accordion.remove();
    }
  },
);

test.each(FLOW_FIXTURES)(
  'a single accordion panel rounds every $writingMode $dir corner',
  async ({ dir, writingMode }) => {
    const $scope = renderScope(dir, writingMode);

    for (const wrapped of [false, true]) {
      const $accordion = document.createElement('rc-accordion');

      $accordion.innerHTML = panelMarkup('Only', wrapped);
      $scope.append($accordion);
      await settleLayout();

      expect(corners(panelAt($accordion, 0))).toEqual(['28px', '28px', '28px', '28px']);
      $accordion.remove();
    }
  },
);

test.each(FLOW_FIXTURES)(
  'the disclosure chevron stays down/up in $writingMode $dir and after direction changes',
  async ({ dir, writingMode }) => {
    const $scope = renderScope(dir, writingMode);

    $scope.style.setProperty('--rc-motion-spatial-duration-fast', '0ms');
    $scope.innerHTML = panelMarkup('Details', true);
    await settleLayout();

    const $details = $scope.querySelector('details');
    const $summary = $details?.querySelector('summary');

    if (!($details instanceof HTMLDetailsElement) || !$summary) {
      throw new Error('No native disclosure summary found');
    }

    const chevron = () => getComputedStyle($summary, '::after');

    expect(chevron().writingMode).toBe('horizontal-tb');
    expect(chevron().direction).toBe('ltr');
    expect(chevron().borderTopWidth).toBe('2px');
    expect(chevron().borderRightWidth).toBe('2px');
    expect(chevron().borderBottomWidth).toBe('0px');
    expect(chevron().borderLeftWidth).toBe('0px');
    expect(chevron().rotate).toBe('135deg');
    expect(chevron().transitionDuration).toBe('0s, 0s');

    $details.open = true;
    expect(chevron().rotate).toBe('315deg');

    $scope.dir = dir === 'ltr' ? 'rtl' : 'ltr';
    await settleLayout();

    expect(chevron().borderTopWidth).toBe('2px');
    expect(chevron().borderRightWidth).toBe('2px');
    expect(chevron().borderLeftWidth).toBe('0px');
    expect(chevron().rotate).toBe('315deg');
  },
);
