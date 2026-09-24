import { html, type TemplateResult } from 'lit';

export type FlowFixture = {
  dir: 'ltr' | 'rtl';
  writingMode: 'horizontal-tb' | 'vertical-rl' | 'vertical-lr';
};

/** The direction and writing-mode combinations every flow-aware component is tested in. */
export const FLOW_FIXTURES: readonly FlowFixture[] = [
  { dir: 'ltr', writingMode: 'horizontal-tb' },
  { dir: 'rtl', writingMode: 'horizontal-tb' },
  { dir: 'ltr', writingMode: 'vertical-rl' },
  { dir: 'rtl', writingMode: 'vertical-rl' },
  { dir: 'ltr', writingMode: 'vertical-lr' },
];

export function flowLabel({ dir, writingMode }: FlowFixture): string {
  return `${writingMode} ${dir}`;
}

/**
 * Wraps a fixture in a given direction and writing mode, the way a page or an
 * ancestor would set them. Both are inherited, so the component under test
 * sees them exactly as it would in real use.
 */
export function inFlow(template: TemplateResult, { dir, writingMode }: FlowFixture) {
  return html`<div data-testid="flow" dir=${dir} style="writing-mode: ${writingMode};">
    ${template}
  </div>`;
}
