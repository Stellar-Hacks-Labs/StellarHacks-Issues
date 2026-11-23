import { randomUUID } from "crypto";

/**
 * Correlation identifier generator and tracker.
 * Assigns an opaque correlation identifier per HTTP request or scheduler clock tick.
 */

let currentCorrelationId: string | null = null;

export function generateCorrelationId(): string {
  return randomUUID();
}

export function setCorrelationId(id: string): void {
  currentCorrelationId = id;
}

export function getCorrelationId(): string {
  return currentCorrelationId || generateCorrelationId();
}

export function clearCorrelationId(): void {
  currentCorrelationId = null;
}

export function withCorrelationId<T>(id: string, fn: () => T): T {
  const previous = currentCorrelationId;
  currentCorrelationId = id;
  try {
    return fn();
  } finally {
    currentCorrelationId = previous;
  }
}
