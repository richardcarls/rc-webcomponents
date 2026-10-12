import { afterEach, expect, test } from 'vitest';

import './bridge.css';

afterEach(() => {
  document.body.replaceChildren();
});

function style($scope: Element, selector: string): CSSStyleDeclaration {
  const $element = $scope.querySelector(selector);

  if (!$element) {
    throw new Error(`Missing element: ${selector}`);
  }

  return getComputedStyle($element);
}

test('bridge-only regions scale RC text from application Material tokens', () => {
  const $scope = document.createElement('div');

  $scope.className = 'rc-theme-material';

  $scope.style.cssText = `
    --md-sys-typescale-body-large-size: 20px;
    --md-sys-typescale-body-large-line-height: 30px;
    --md-sys-typescale-body-medium-size: 18px;
    --md-sys-typescale-body-medium-line-height: 27px;
    --md-sys-typescale-label-large-size: 16px;
    --md-sys-typescale-label-large-line-height: 24px;
    --md-sys-typescale-body-medium-font: Arial;
  `;

  $scope.innerHTML = `
    <p id="outside" style="font-size: var(--rc-item-font-size); line-height: var(--rc-item-line-height)">Outside</p>
    <section data-rc-type-scale style="--rc-type-scale: 1.5">
      <p id="inside" style="font-size: var(--rc-item-font-size); line-height: var(--rc-item-line-height)">Inside</p>
      <p id="body" style="font-size: var(--rc-font-size); line-height: var(--rc-line-height)">Body</p>
      <button style="font: var(--rc-button-font)">Button</button>
      <span id="material" style="font-size: var(--md-sys-typescale-body-large-size)">Material</span>
    </section>
  `;

  document.body.append($scope);

  const outside = style($scope, '#outside');
  const inside = style($scope, '#inside');
  const body = style($scope, '#body');
  const button = style($scope, 'button');
  const material = style($scope, '#material');

  expect([outside.fontSize, outside.lineHeight]).toEqual(['20px', '30px']);
  expect([inside.fontSize, inside.lineHeight]).toEqual(['30px', '45px']);
  expect([body.fontSize, body.lineHeight]).toEqual(['27px', '40.5px']);
  expect([button.fontSize, button.lineHeight]).toEqual(['24px', '36px']);
  expect(material.fontSize).toBe('20px');
});

test('bridge-only scaling also applies when the theme root is marked', () => {
  const $scope = document.createElement('div');

  $scope.className = 'rc-theme-material';
  $scope.setAttribute('data-rc-type-scale', '');

  $scope.style.cssText = `
    --rc-type-scale: 0.75;
    --md-sys-typescale-body-large-size: 20px;
    --md-sys-typescale-body-large-line-height: 30px;
  `;

  $scope.innerHTML =
    '<p style="font-size: var(--rc-item-font-size); line-height: var(--rc-item-line-height)">Scaled</p>';

  document.body.append($scope);

  const text = style($scope, 'p');

  expect([text.fontSize, text.lineHeight]).toEqual(['15px', '22.5px']);
});
