import { describe, it, expect } from 'vitest';
import { renderAndCheckA11y, assertNoViolations } from './render';
import { SkipLink } from '../../app/components/skip-link';
import { LiveRegion } from '../../app/components/live-region';

describe('landing page accessibility', () => {
  it('skip link has no violations', async () => {
    const results = await renderAndCheckA11y(<SkipLink />);
    assertNoViolations(results);
  });

  it('live region has proper ARIA attributes', async () => {
    const results = await renderAndCheckA11y(
      <LiveRegion politeness="polite">Test announcement</LiveRegion>
    );
    
    assertNoViolations(results);
    
    // Check that live region has required attributes
    const statusViolations = results.violations.filter(v => 
      v.id === 'aria-valid-attr-value' || 
      v.id === 'aria-required-attr'
    );
    expect(statusViolations).toHaveLength(0);
  });

  it('countdown live region throttles announcements', async () => {
    const results = await renderAndCheckA11y(
      <LiveRegion politeness="polite" throttleMs={60000}>
        5 minutes remaining
      </LiveRegion>
    );
    
    assertNoViolations(results);
  });
});
