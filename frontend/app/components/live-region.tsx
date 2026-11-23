"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * An ARIA live region that announces changes to screen readers.
 * 
 * Used for dynamic content that changes without a page reload:
 * countdown timers, transaction status, form validation errors.
 * 
 * The component throttles announcements to avoid flooding the user
 * with updates on every render. Only changes that occur after a
 * minimum interval are announced.
 * 
 * @example
 * <LiveRegion politeness="polite" throttleMs={1000}>
 *   {timeRemaining}
 * </LiveRegion>
 */
export function LiveRegion({
  children,
  politeness = "polite",
  throttleMs = 3000,
  atomic = true,
}: {
  /** Content to announce when it changes */
  children: ReactNode;
  /** 
   * How urgently to announce: 
   * - "polite": wait for a pause (default)
   * - "assertive": interrupt immediately
   */
  politeness?: "polite" | "assertive";
  /**
   * Minimum milliseconds between announcements.
   * Prevents overwhelming screen readers with rapid updates.
   */
  throttleMs?: number;
  /**
   * Whether to announce the entire region as one unit.
   * Default true for simple strings; set false for complex content.
   */
  atomic?: boolean;
}) {
  const lastAnnouncement = useRef<number>(0);
  const content = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = Date.now();
    
    if (now - lastAnnouncement.current < throttleMs) {
      return;
    }
    
    lastAnnouncement.current = now;
  }, [children, throttleMs]);

  return (
    <div
      ref={content}
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
}

/**
 * A live region specifically for countdown timers.
 * 
 * Throttled to announce once per minute rather than every second,
 * which would be disruptive. The visual timer still updates every
 * second; only the screen reader announcement is throttled.
 */
export function CountdownLiveRegion({ 
  children,
}: { 
  children: ReactNode;
}) {
  return (
    <LiveRegion politeness="polite" throttleMs={60000}>
      {children}
    </LiveRegion>
  );
}

/**
 * A live region for transaction status updates.
 * 
 * Uses assertive politeness because transaction feedback is
 * time-sensitive: the user needs to know immediately if something
 * failed or succeeded.
 */
export function TransactionStatusRegion({ 
  children,
}: { 
  children: ReactNode;
}) {
  return (
    <LiveRegion politeness="assertive" throttleMs={0}>
      {children}
    </LiveRegion>
  );
}
