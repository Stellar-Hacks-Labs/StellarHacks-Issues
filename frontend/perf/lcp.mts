#!/usr/bin/env node
/**
 * Measure Largest Contentful Paint (LCP) for each route.
 * 
 * Requires a running production server and browser automation.
 * Uses Playwright to load each route and capture LCP timing.
 * 
 * Run after `npm run build && npm start`.
 */

import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import type { Budget } from './budget-schema.ts';
import { ROUTES } from './routes.ts';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Server URL (defaults to localhost:3000)
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Read budgets
const budgetsPath = join(__dirname, 'budgets.json');
const budgetsRaw = readFileSync(budgetsPath, 'utf-8');
const budgets: Budget = JSON.parse(budgetsRaw);

/**
 * Measure LCP for a single URL.
 */
async function measureLCP(url: string): Promise<number | null> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate and wait for load
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Capture LCP from performance observer
    const lcp = await page.evaluate(() => {
      return new Promise<number | null>((resolve) => {
        let lcpValue: number | null = null;
        
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          
          if (lastEntry && lastEntry.renderTime) {
            lcpValue = lastEntry.renderTime;
          }
        });
        
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        
        // Wait a bit for LCP to settle
        setTimeout(() => {
          observer.disconnect();
          resolve(lcpValue);
        }, 2000);
      });
    });
    
    return lcp;
  } catch (error) {
    console.error(`Error measuring LCP for ${url}:`, error);
    return null;
  } finally {
    await browser.close();
  }
}

// Main measurement loop
async function measureAllRoutes() {
  console.log('Measuring LCP for all routes...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('');
  
  for (const route of ROUTES) {
    const url = `${BASE_URL}${route.url}`;
    console.log(`Measuring ${route.name} (${route.url})...`);
    
    const lcp = await measureLCP(url);
    
    if (lcp !== null) {
      const budget = budgets.routes[route.budgetKey];
      console.log(`  LCP: ${lcp.toFixed(0)}ms (budget: ${budget.lcp})`);
    } else {
      console.log(`  LCP: Failed to measure`);
    }
  }
}

measureAllRoutes().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
