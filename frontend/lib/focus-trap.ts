/**
 * Trap focus within a container element.
 * 
 * Used by modals and dialogs to keep keyboard navigation inside
 * the active component. When a user tabs past the last focusable
 * element, focus wraps to the first; shift-tab from the first
 * wraps to the last.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Get all focusable elements within a container.
 * 
 * @param container - The element to search within
 * @returns Array of focusable elements in document order
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/**
 * Create a focus trap within a container.
 * 
 * @param container - The element to trap focus within
 * @returns Cleanup function to remove the trap
 */
export function trapFocus(container: HTMLElement): () => void {
  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusableElements(container);
    
    if (focusable.length === 0) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  container.addEventListener('keydown', handleKeyDown);

  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

/**
 * Focus the first focusable element in a container.
 * 
 * @param container - The element to search within
 * @returns true if an element was focused
 */
export function focusFirst(container: HTMLElement): boolean {
  const focusable = getFocusableElements(container);
  
  if (focusable.length > 0) {
    focusable[0].focus();
    return true;
  }
  
  return false;
}
