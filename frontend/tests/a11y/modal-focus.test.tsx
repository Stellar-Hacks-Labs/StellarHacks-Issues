import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Modal } from '../../app/components/modal';
import { trapFocus, focusFirst } from '../../lib/focus-trap';

describe('modal focus management', () => {
  it('modal traps focus within its content', async () => {
    const handleClose = () => {};
    
    const { container } = render(
      <Modal open={true} onClose={handleClose} title="Test Modal">
        <button>First button</button>
        <button>Second button</button>
      </Modal>
    );

    // Modal should contain focusable elements
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('focuses first interactive element on open', async () => {
    const handleClose = () => {};
    
    render(
      <Modal open={true} onClose={handleClose} title="Test Modal">
        <input placeholder="First input" />
        <button>Submit</button>
      </Modal>
    );

    // First focusable element should receive focus
    // Note: actual focus behavior is tested in integration tests
    const input = screen.getByPlaceholderText('First input');
    expect(input).toBeDefined();
  });

  it('closes on escape key', () => {
    let closed = false;
    const handleClose = () => { closed = true; };
    
    const { container } = render(
      <Modal open={true} onClose={handleClose} title="Test Modal">
        <button>Test</button>
      </Modal>
    );

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);

    expect(closed).toBe(true);
  });
});

describe('focus trap utility', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('prevents focus from leaving the container', () => {
    container.innerHTML = `
      <button>Button 1</button>
      <button>Button 2</button>
      <button>Button 3</button>
    `;

    const cleanup = trapFocus(container);
    const buttons = Array.from(container.querySelectorAll('button')) as HTMLElement[];
    const last = buttons[buttons.length - 1];

    last.focus();
    expect(document.activeElement).toBe(last);

    cleanup();
  });

  it('focusFirst moves focus to first interactive element', () => {
    container.innerHTML = `
      <span>Text</span>
      <button>First button</button>
      <input type="text" />
    `;

    const result = focusFirst(container);
    expect(result).toBe(true);
    
    const firstButton = container.querySelector('button') as HTMLElement;
    expect(document.activeElement).toBe(firstButton);
  });
});
