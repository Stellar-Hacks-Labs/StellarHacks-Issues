/**
 * Budget report generation.
 * 
 * Compares measured sizes against budgets and produces
 * pass/fail results with details.
 */

import type { RouteBudget } from './budget-schema';
import { parseSize, parseTime, formatSize, formatTime } from './budget-schema';

export interface Measurement {
  route: string;
  javascript: number;
  images: number;
  lcp: number | null;
}

export interface BudgetResult {
  route: string;
  passed: boolean;
  details: {
    javascript: ResourceResult;
    images: ResourceResult;
    lcp: TimingResult | null;
  };
}

export interface ResourceResult {
  budget: number;
  actual: number;
  passed: boolean;
  percentage: number;
}

export interface TimingResult {
  budget: number;
  actual: number;
  passed: boolean;
}

/**
 * Compare measurements against budgets.
 * 
 * @param measurements - Actual measurements from production build
 * @param budgets - Budget limits from budgets.json
 * @returns Results for each route
 */
export function compareToBudgets(
  measurements: Measurement[],
  budgets: Record<string, RouteBudget>
): BudgetResult[] {
  return measurements.map((measurement) => {
    const budget = budgets[measurement.route];
    
    if (!budget) {
      throw new Error(`No budget defined for route: ${measurement.route}`);
    }
    
    const jsBudget = parseSize(budget.javascript);
    const imageBudget = parseSize(budget.images);
    const lcpBudget = parseTime(budget.lcp);
    
    const jsResult: ResourceResult = {
      budget: jsBudget,
      actual: measurement.javascript,
      passed: measurement.javascript <= jsBudget,
      percentage: (measurement.javascript / jsBudget) * 100,
    };
    
    const imageResult: ResourceResult = {
      budget: imageBudget,
      actual: measurement.images,
      passed: measurement.images <= imageBudget,
      percentage: (measurement.images / imageBudget) * 100,
    };
    
    const lcpResult: TimingResult | null = measurement.lcp !== null
      ? {
          budget: lcpBudget,
          actual: measurement.lcp,
          passed: measurement.lcp <= lcpBudget,
        }
      : null;
    
    const passed = jsResult.passed && imageResult.passed && (lcpResult?.passed ?? true);
    
    return {
      route: measurement.route,
      passed,
      details: {
        javascript: jsResult,
        images: imageResult,
        lcp: lcpResult,
      },
    };
  });
}

/**
 * Format results as a text report.
 */
export function formatReport(results: BudgetResult[]): string {
  const lines: string[] = [];
  
  lines.push('Performance Budget Report');
  lines.push('='.repeat(60));
  lines.push('');
  
  for (const result of results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    lines.push(`${status} ${result.route}`);
    lines.push('');
    
    const { javascript, images, lcp } = result.details;
    
    lines.push(`  JavaScript: ${formatSize(javascript.actual)} / ${formatSize(javascript.budget)} (${javascript.percentage.toFixed(1)}%)`);
    if (!javascript.passed) {
      lines.push(`    ⚠ Over budget by ${formatSize(javascript.actual - javascript.budget)}`);
    }
    
    lines.push(`  Images:     ${formatSize(images.actual)} / ${formatSize(images.budget)} (${images.percentage.toFixed(1)}%)`);
    if (!images.passed) {
      lines.push(`    ⚠ Over budget by ${formatSize(images.actual - images.budget)}`);
    }
    
    if (lcp) {
      lines.push(`  LCP:        ${formatTime(lcp.actual)} / ${formatTime(lcp.budget)}`);
      if (!lcp.passed) {
        lines.push(`    ⚠ Over budget by ${formatTime(lcp.actual - lcp.budget)}`);
      }
    } else {
      lines.push(`  LCP:        Not measured`);
    }
    
    lines.push('');
  }
  
  const failedCount = results.filter((r) => !r.passed).length;
  
  if (failedCount > 0) {
    lines.push(`${failedCount} route(s) exceeded budget`);
  } else {
    lines.push('All routes within budget');
  }
  
  return lines.join('\n');
}

/**
 * Exit code: 0 if all routes pass, 1 if any fail.
 */
export function getExitCode(results: BudgetResult[]): number {
  return results.every((r) => r.passed) ? 0 : 1;
}
