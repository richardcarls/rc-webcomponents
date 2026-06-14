import axe from 'axe-core';
import type { AxeResults } from 'axe-core';
import { expect } from 'vitest';

function formatViolations(results: AxeResults): string[] {
  return results.violations.map((violation) => {
    const targets = violation.nodes
      .flatMap((node) => node.target)
      .join(', ');

    return `${violation.id}: ${violation.help} (${targets})`;
  });
}

/**
 * Assert that axe-core finds no accessibility violations in `context`.
 *
 * The `region` rule is disabled because component unit tests render isolated
 * fragments instead of complete document landmarks.
 */
export async function expectNoA11yViolations(
  context: Element | Document = document,
): Promise<void> {
  const results = await axe.run(context, {
    rules: {
      region: { enabled: false },
    },
  });

  expect(formatViolations(results)).toEqual([]);
}
