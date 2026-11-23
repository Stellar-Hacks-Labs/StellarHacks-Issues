import { render as rtlRender } from '@testing-library/react';
import type { ReactElement } from 'react';
import axe from 'axe-core';
import type { AxeResults } from 'axe-core';

/**
 * Render a component and run axe accessibility checks.
 * 
 * @param ui - The React element to render
 * @returns The axe results showing violations, passes, and incomplete checks
 */
export async function renderAndCheckA11y(ui: ReactElement): Promise<AxeResults> {
  const { container } = rtlRender(ui);
  const results = await axe.run(container);
  return results;
}

/**
 * Assert that there are no serious or critical axe violations.
 * 
 * @param results - The axe results to check
 * @throws Error if critical or serious violations are found
 */
export function assertNoViolations(results: AxeResults): void {
  const violations = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );

  if (violations.length > 0) {
    const messages = violations.map((v) => {
      const nodes = v.nodes.map((n) => n.html).join('\n  ');
      return `${v.impact}: ${v.id} - ${v.description}\n  ${nodes}`;
    });
    throw new Error(
      `Accessibility violations found:\n${messages.join('\n\n')}`
    );
  }
}
