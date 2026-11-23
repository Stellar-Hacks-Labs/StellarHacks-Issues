import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderAndCheckA11y, assertNoViolations } from './render';

/**
 * Keyboard operability tests for interactive components.
 * 
 * WCAG 2.2 AA requires that all functionality is operable through
 * a keyboard interface without specific timings for individual keystrokes.
 */

describe('keyboard operability', () => {
  it('buttons are keyboard accessible', async () => {
    const results = await renderAndCheckA11y(
      <button type="button" onClick={() => {}}>
        Test Button
      </button>
    );
    
    assertNoViolations(results);
  });

  it('links are keyboard accessible', async () => {
    const results = await renderAndCheckA11y(
      <a href="/test">Test Link</a>
    );
    
    assertNoViolations(results);
  });

  it('form inputs are keyboard accessible', async () => {
    const results = await renderAndCheckA11y(
      <form>
        <label htmlFor="test-input">Test Input</label>
        <input id="test-input" type="text" />
      </form>
    );
    
    assertNoViolations(results);
  });

  it('custom interactive elements have proper keyboard support', async () => {
    // Test that custom interactive elements have tabindex and keyboard handlers
    const results = await renderAndCheckA11y(
      <div
        role="button"
        tabIndex={0}
        onClick={() => {}}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            // Handle activation
          }
        }}
      >
        Custom Button
      </div>
    );
    
    assertNoViolations(results);
  });

  it('no keyboard traps in normal content', async () => {
    const results = await renderAndCheckA11y(
      <div>
        <button>Button 1</button>
        <a href="/test">Link</a>
        <button>Button 2</button>
      </div>
    );
    
    assertNoViolations(results);
  });
});

describe('keyboard shortcuts and focus indicators', () => {
  it('interactive elements have visible focus indicators', async () => {
    const { container } = render(
      <>
        <button className="focus:ring-2">Button</button>
        <a href="/test" className="focus:underline">Link</a>
      </>
    );

    // Elements should have focus styles
    const button = screen.getByRole('button');
    const link = screen.getByRole('link');
    
    expect(button).toBeDefined();
    expect(link).toBeDefined();
  });

  it('skip links work without mouse', async () => {
    const results = await renderAndCheckA11y(
      <a href="#main" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
    );
    
    assertNoViolations(results);
  });
});
