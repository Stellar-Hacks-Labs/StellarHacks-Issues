import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { trapFocus, focusFirst } from './focus-trap';

describe('trapFocus', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('wraps focus from last to first when tabbing forward', () => {
    container.innerHTML = `
      <button>First</button>
      <button>Second</button>
      <button>Last</button>
    `;

    const cleanup = trapFocus(container);
    const buttons = container.querySelectorAll('button');
    const last = buttons[buttons.length - 1] as HTMLElement;
    const first = buttons[0] as HTMLElement;

    last.focus();

    // Simulate tab key
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    container.dispatchEvent(event);

    expect(document.activeElement).toBe(first);

    cleanup();
  });

  it('wraps focus from first to last when shift-tabbing backward', () => {
    container.innerHTML = `
      <button>First</button>
      <button>Second</button>
      <button>Last</button>
    `;

    const cleanup = trapFocus(container);
    const buttons = container.querySelectorAll('button');
    const first = buttons[0] as HTMLElement;
    const last = buttons[buttons.length - 1] as HTMLElement;

    first.focus();

    // Simulate shift-tab key
    const event = new KeyboardEvent('keydown', { 
      key: 'Tab', 
      shiftKey: true, 
      bubbles: true 
    });
    container.dispatchEvent(event);

    expect(document.activeElement).toBe(last);

    cleanup();
  });

  it('ignores disabled elements', () => {
    container.innerHTML = `
      <button>First</button>
      <button disabled>Disabled</button>
      <button>Last</button>
    `;

    const cleanup = trapFocus(container);
    const buttons = Array.from(container.querySelectorAll('button'));
    const enabled = buttons.filter(b => !b.disabled) as HTMLElement[];

    expect(enabled).toHaveLength(2);

    cleanup();
  });
});

describe('focusFirst', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('focuses the first focusable element', () => {
    container.innerHTML = `
      <span>Text</span>
      <button>First</button>
      <button>Second</button>
    `;

    const result = focusFirst(container);
    const first = container.querySelector('button') as HTMLElement;

    expect(result).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it('returns false when no focusable elements exist', () => {
    container.innerHTML = '<span>No buttons here</span>';

    const result = focusFirst(container);

    expect(result).toBe(false);
  });
});
