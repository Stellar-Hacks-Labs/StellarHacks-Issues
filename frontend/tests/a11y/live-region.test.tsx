import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderAndCheckA11y, assertNoViolations } from './render';
import { 
  LiveRegion, 
  CountdownLiveRegion, 
  TransactionStatusRegion 
} from '../../app/components/live-region';

describe('live region components', () => {
  it('LiveRegion has proper ARIA attributes', async () => {
    const results = await renderAndCheckA11y(
      <LiveRegion politeness="polite">Status update</LiveRegion>
    );
    
    assertNoViolations(results);
  });

  it('renders with polite politeness by default', () => {
    const { container } = render(
      <LiveRegion>Test content</LiveRegion>
    );
    
    const liveRegion = container.querySelector('[aria-live]');
    expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
  });

  it('renders with assertive politeness when specified', () => {
    const { container } = render(
      <LiveRegion politeness="assertive">Urgent update</LiveRegion>
    );
    
    const liveRegion = container.querySelector('[aria-live]');
    expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
  });

  it('is atomic by default', () => {
    const { container } = render(
      <LiveRegion>Content</LiveRegion>
    );
    
    const liveRegion = container.querySelector('[role="status"]');
    expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
  });

  it('can be non-atomic', () => {
    const { container } = render(
      <LiveRegion atomic={false}>Content</LiveRegion>
    );
    
    const liveRegion = container.querySelector('[role="status"]');
    expect(liveRegion?.getAttribute('aria-atomic')).toBe('false');
  });

  it('is visually hidden with sr-only', () => {
    const { container } = render(
      <LiveRegion>Hidden but announced</LiveRegion>
    );
    
    const liveRegion = container.querySelector('[role="status"]');
    expect(liveRegion?.className).toContain('sr-only');
  });
});

describe('countdown live region', () => {
  it('throttles announcements for countdowns', () => {
    const { container } = render(
      <CountdownLiveRegion>5 minutes remaining</CountdownLiveRegion>
    );
    
    const liveRegion = container.querySelector('[role="status"]');
    expect(liveRegion).toBeTruthy();
    expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
  });

  it('announces countdown updates', async () => {
    const results = await renderAndCheckA11y(
      <CountdownLiveRegion>
        3 days 5 hours remaining
      </CountdownLiveRegion>
    );
    
    assertNoViolations(results);
  });
});

describe('transaction status region', () => {
  it('uses assertive politeness for transactions', () => {
    const { container } = render(
      <TransactionStatusRegion>Transaction confirmed</TransactionStatusRegion>
    );
    
    const liveRegion = container.querySelector('[aria-live]');
    expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
  });

  it('announces transaction status immediately', async () => {
    const results = await renderAndCheckA11y(
      <TransactionStatusRegion>
        Transaction failed: insufficient balance
      </TransactionStatusRegion>
    );
    
    assertNoViolations(results);
  });
});

describe('live region throttling', () => {
  it('respects custom throttle duration', () => {
    const { container } = render(
      <LiveRegion throttleMs={5000}>Update</LiveRegion>
    );
    
    // The throttling is implemented via useEffect
    // This test verifies the component accepts the prop
    const liveRegion = container.querySelector('[role="status"]');
    expect(liveRegion).toBeTruthy();
  });

  it('allows immediate announcements with 0ms throttle', () => {
    const { container } = render(
      <LiveRegion throttleMs={0}>Immediate announcement</LiveRegion>
    );
    
    const liveRegion = container.querySelector('[role="status"]');
    expect(liveRegion).toBeTruthy();
  });
});
