# Accessibility Exceptions

This document records known accessibility issues that do not block WCAG 2.2 Level AA compliance but are noted for transparency and future improvement.

## Noted but not blocking

### Particle animations

**Issue**: The hero particle text and landing page animations use WebGL shaders that cannot be fully described to screen readers.

**Mitigation**: 
- All animated content is decorative; no information is conveyed through animation alone
- Text alternatives are provided for all meaningful content
- Animations respect `prefers-reduced-motion` and stop entirely when that preference is set

**Future work**: None required. Decorative animations are explicitly allowed by WCAG when they do not convey information.

### PDF viewer

**Issue**: The PDF preview in project deck viewing uses an iframe that may have accessibility limitations depending on the PDF's internal structure.

**Mitigation**:
- PDFs are always available for download
- Alternative text descriptions are required during project submission
- The deck viewer is supplementary; all project information is available in structured HTML

**Future work**: Consider implementing a fallback HTML view for PDFs that do not have proper accessibility tags.

### Wallet connection flow

**Issue**: The wallet selection modal depends on third-party wallet extensions whose accessibility varies by provider.

**Mitigation**:
- The connection trigger and modal are fully keyboard accessible
- Alternative authentication methods are available (email linking)
- Wallet providers are encouraged to improve their own accessibility

**Future work**: Monitor wallet kit updates and test with assistive technology as providers improve.

### Chart and visualization components

**Issue**: Some statistics charts and visualization components may not fully convey their data to screen readers.

**Mitigation**:
- All charts include text summaries of key data points
- Raw data tables are provided alongside visual representations
- Charts are supplementary; all information is available in structured text

**Future work**: Consider adding data table toggles for complex visualizations.

## Out of scope for this baseline

The following surfaces are excluded from the current WCAG AA baseline and will be addressed in a separate pass:

### Judge console

Judge-specific features including:
- AI review interface
- Scorecard submission
- Ballot tracking

### Organizer console

Organizer-specific features including:
- Hackathon creation wizard
- Screening interface
- Phase advancement controls
- Sponsor queue management

### Admin surfaces

Administrative features including:
- Organizer approval queue
- System-wide settings

## Reporting new issues

If you discover an accessibility issue:

1. Check if it affects a covered route (see `docs/accessibility.md`)
2. Verify it's not already noted above
3. File an issue with:
   - What you were trying to do
   - What assistive technology you were using
   - What happened vs. what you expected
   - Steps to reproduce

## Review schedule

This document is reviewed:
- After each major feature addition
- When WCAG guidelines are updated
- Following user feedback about accessibility

Last reviewed: 2024-11-23
