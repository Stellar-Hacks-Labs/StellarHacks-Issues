/**
 * Check if the user prefers reduced motion.
 * 
 * This helper centralizes the check so motion-sensitive components
 * can respect the user's preference consistently. Used by animations,
 * transitions, and any visual movement.
 * 
 * @returns true if the user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Subscribe to changes in the user's motion preference.
 * 
 * @param callback - Called when the preference changes
 * @returns Cleanup function to unsubscribe
 */
export function onReducedMotionChange(callback: (reduced: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (event: MediaQueryListEvent) => callback(event.matches);
  
  mediaQuery.addEventListener('change', handler);
  
  return () => mediaQuery.removeEventListener('change', handler);
}
