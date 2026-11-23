import { describe, it, expect } from 'vitest';
import { compareToBudgets, formatReport, getExitCode } from './report';
import type { Measurement } from './report';
import type { RouteBudget } from './budget-schema';

describe('budget comparison', () => {
  const budgets: Record<string, RouteBudget> = {
    '/': {
      javascript: '250kb',
      images: '500kb',
      lcp: '2.5s',
      description: 'Landing page',
    },
  };

  it('passes when all measurements are under budget', () => {
    const measurements: Measurement[] = [
      {
        route: '/',
        javascript: 200 * 1024,
        images: 400 * 1024,
        lcp: 2000,
      },
    ];

    const results = compareToBudgets(measurements, budgets);

    expect(results[0].passed).toBe(true);
    expect(results[0].details.javascript.passed).toBe(true);
    expect(results[0].details.images.passed).toBe(true);
    expect(results[0].details.lcp?.passed).toBe(true);
  });

  it('fails when JavaScript is over budget', () => {
    const measurements: Measurement[] = [
      {
        route: '/',
        javascript: 300 * 1024,
        images: 400 * 1024,
        lcp: 2000,
      },
    ];

    const results = compareToBudgets(measurements, budgets);

    expect(results[0].passed).toBe(false);
    expect(results[0].details.javascript.passed).toBe(false);
  });

  it('fails when images are over budget', () => {
    const measurements: Measurement[] = [
      {
        route: '/',
        javascript: 200 * 1024,
        images: 600 * 1024,
        lcp: 2000,
      },
    ];

    const results = compareToBudgets(measurements, budgets);

    expect(results[0].passed).toBe(false);
    expect(results[0].details.images.passed).toBe(false);
  });

  it('fails when LCP is over budget', () => {
    const measurements: Measurement[] = [
      {
        route: '/',
        javascript: 200 * 1024,
        images: 400 * 1024,
        lcp: 3000,
      },
    ];

    const results = compareToBudgets(measurements, budgets);

    expect(results[0].passed).toBe(false);
    expect(results[0].details.lcp?.passed).toBe(false);
  });

  it('calculates percentage of budget used', () => {
    const measurements: Measurement[] = [
      {
        route: '/',
        javascript: 125 * 1024, // 50% of budget
        images: 250 * 1024, // 50% of budget
        lcp: 2000,
      },
    ];

    const results = compareToBudgets(measurements, budgets);

    expect(results[0].details.javascript.percentage).toBeCloseTo(50, 1);
    expect(results[0].details.images.percentage).toBeCloseTo(50, 1);
  });

  it('handles missing LCP measurements', () => {
    const measurements: Measurement[] = [
      {
        route: '/',
        javascript: 200 * 1024,
        images: 400 * 1024,
        lcp: null,
      },
    ];

    const results = compareToBudgets(measurements, budgets);

    expect(results[0].passed).toBe(true);
    expect(results[0].details.lcp).toBeNull();
  });
});

describe('report formatting', () => {
  it('generates a readable text report', () => {
    const measurements: Measurement[] = [
      {
        route: '/',
        javascript: 200 * 1024,
        images: 400 * 1024,
        lcp: 2000,
      },
    ];

    const budgets: Record<string, RouteBudget> = {
      '/': {
        javascript: '250kb',
        images: '500kb',
        lcp: '2.5s',
        description: 'Landing',
      },
    };

    const results = compareToBudgets(measurements, budgets);
    const report = formatReport(results);

    expect(report).toContain('Performance Budget Report');
    expect(report).toContain('✓ PASS');
    expect(report).toContain('JavaScript:');
    expect(report).toContain('Images:');
    expect(report).toContain('LCP:');
  });
});

describe('exit code determination', () => {
  it('returns 0 when all routes pass', () => {
    const results = [
      { route: '/', passed: true, details: {} as any },
      { route: '/hackathons', passed: true, details: {} as any },
    ];

    expect(getExitCode(results)).toBe(0);
  });

  it('returns 1 when any route fails', () => {
    const results = [
      { route: '/', passed: true, details: {} as any },
      { route: '/hackathons', passed: false, details: {} as any },
    ];

    expect(getExitCode(results)).toBe(1);
  });
});
