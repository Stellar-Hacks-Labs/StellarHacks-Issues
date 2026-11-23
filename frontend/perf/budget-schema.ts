/**
 * Performance budget schema.
 * 
 * Each route has limits for:
 * - JavaScript bundle size
 * - Total image size
 * - Largest Contentful Paint (LCP) timing
 */

export interface Budget {
  routes: Record<string, RouteBudget>;
}

export interface RouteBudget {
  /** Maximum JavaScript bundle size (e.g., "250kb") */
  javascript: string;
  /** Maximum total image size (e.g., "500kb") */
  images: string;
  /** Maximum LCP time (e.g., "2.5s") */
  lcp: string;
  /** Description of what this route does */
  description: string;
}

/**
 * Parse a size string like "250kb" into bytes.
 */
export function parseSize(size: string): number {
  const match = size.match(/^(\d+(?:\.\d+)?)(kb|mb)$/i);
  
  if (!match) {
    throw new Error(`Invalid size format: ${size}. Expected format: "250kb" or "1.5mb"`);
  }
  
  const [, value, unit] = match;
  const bytes = parseFloat(value);
  
  return unit.toLowerCase() === 'kb' ? bytes * 1024 : bytes * 1024 * 1024;
}

/**
 * Parse a time string like "2.5s" into milliseconds.
 */
export function parseTime(time: string): number {
  const match = time.match(/^(\d+(?:\.\d+)?)(s|ms)$/i);
  
  if (!match) {
    throw new Error(`Invalid time format: ${time}. Expected format: "2.5s" or "2500ms"`);
  }
  
  const [, value, unit] = match;
  const ms = parseFloat(value);
  
  return unit.toLowerCase() === 's' ? ms * 1000 : ms;
}

/**
 * Format bytes into a human-readable string.
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes}B`;
  }
  
  const kb = bytes / 1024;
  
  if (kb < 1024) {
    return `${kb.toFixed(1)}kb`;
  }
  
  const mb = kb / 1024;
  return `${mb.toFixed(2)}mb`;
}

/**
 * Format milliseconds into a human-readable string.
 */
export function formatTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = ms / 1000;
  return `${seconds.toFixed(2)}s`;
}
