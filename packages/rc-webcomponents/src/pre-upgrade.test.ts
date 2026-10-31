import { expect, test, vi } from 'vitest';

import preUpgradeCss from '../dist/pre-upgrade.css?inline';

function render(css: string | undefined): {
  $first: Element;
  $second: Element;
  cleanup: () => void;
} {
  const $style = document.createElement('style');

  $style.textContent = css ?? '';
  document.head.append($style);

  const $container = document.createElement('div');

  // Two undefined inline hosts share a line; two block hosts stack.
  $container.innerHTML = '<rc-progress>First</rc-progress><rc-progress>Second</rc-progress>';
  document.body.append($container);

  const [$first, $second] = $container.querySelectorAll('rc-progress');

  return {
    $first: $first!,
    $second: $second!,
    cleanup: () => {
      $container.remove();
      $style.remove();
    },
  };
}

const stacked = ($first: Element, $second: Element): boolean =>
  $second.getBoundingClientRect().top >= $first.getBoundingClientRect().bottom;

// This file must not register rc-progress statically: the tests observe the
// elements before their definition loads.
test('undefined hosts flow inline without the pre-upgrade styles', () => {
  const { $first, $second, cleanup } = render(undefined);

  expect($first.matches(':defined')).toBe(false);
  expect(stacked($first, $second)).toBe(false);

  cleanup();
});

test('undefined hosts take their upgraded display from the pre-upgrade styles', async () => {
  const { $first, $second, cleanup } = render(preUpgradeCss);

  expect($first.matches(':defined')).toBe(false);
  expect(getComputedStyle($first).display).toBe('block');
  expect(stacked($first, $second)).toBe(true);

  await import('@rcarls/rc-progress/define');
  await vi.waitFor(() => expect($first.matches(':defined')).toBe(true));

  expect(getComputedStyle($first).display).toBe('block');
  expect(stacked($first, $second)).toBe(true);

  cleanup();
});
