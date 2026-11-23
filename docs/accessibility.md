# Accessibility

This document records the WCAG 2.2 Level AA baseline established for public and participant surfaces.

## Standard

**WCAG 2.2 Level AA** across all public routes and participant flows. Judge and organizer consoles follow in a separate pass.

## Covered routes

- Landing (`/`)
- Hackathon listing (`/hackathons`)
- Hackathon detail pages (`/hackathons/[slug]`)
- Project submission (`/hackathons/[slug]/submit`)
- Voting (`/hackathons/[slug]/vote`)
- Reveal (`/hackathons/[slug]/reveal`)
- Proof pages (`/hackathons/[slug]/proof`)
- User profiles (`/u/[username]`)

## Implementation

### Skip links

A skip link at the top of every page lets keyboard users bypass navigation and jump to main content. It is visually hidden until focused, then appears at the top of the viewport.

```tsx
<SkipLink />
```

Located in `frontend/app/components/skip-link.tsx`.

### Live regions

Dynamic content that changes without a page reload is announced to screen readers through ARIA live regions. Two specialized components handle the most common cases:

**Countdown timers** announce once per minute rather than every second, preventing screen reader overload while keeping users informed:

```tsx
<CountdownLiveRegion>5 minutes remaining</CountdownLiveRegion>
```

**Transaction status** uses assertive politeness so users learn immediately when a transaction succeeds or fails:

```tsx
<TransactionStatusRegion>Transaction confirmed</TransactionStatusRegion>
```

Located in `frontend/app/components/live-region.tsx`.

### Focus management

Modals trap focus within their content so keyboard navigation stays inside the active dialog. Focus returns to the triggering element when the modal closes.

The focus trap helper is located in `frontend/lib/focus-trap.ts` and integrated into the `Modal` component.

### Reduced motion

All animations respect the `prefers-reduced-motion` user preference:

- CSS animations and transitions are flattened to near-instant via a media query in `globals.css`
- JavaScript-driven animations check `useReducedMotion()` from framer-motion and skip or simplify accordingly
- Video autoplays only when reduced motion is not preferred

The reduced motion helper is located in `frontend/lib/reduced-motion.ts`.

### Keyboard operation

Every interactive element is operable by keyboard alone:

- Native buttons and links are inherently accessible
- Custom interactive elements use proper ARIA roles and keyboard handlers
- Tab field supports Enter and comma to add tags, keyboard focus to remove them
- Ballot point allocation works with keyboard alone

### Color contrast

All text and UI components meet WCAG AA contrast ratios:

- Normal text: 4.5:1 minimum
- Large text (18pt+ or 14pt+ bold): 3:1 minimum
- UI components: 3:1 minimum

Contrast checking utilities are in `frontend/lib/contrast.ts`. Theme color pairs are verified in `frontend/tests/a11y/contrast.test.ts`.

### Semantic HTML

The document structure uses semantic elements:

- `<main>` wraps page content
- Headings form a logical outline
- Landmarks (`nav`, `section`, `article`) define page regions
- Forms use `<label>` elements associated with inputs

## Testing

### Automated checks

Run the accessibility test suite:

```bash
cd frontend
npm test tests/a11y
```

The suite uses axe-core to detect violations and includes targeted tests for:

- Focus management and keyboard traps
- Live region announcements
- Reduced motion respect
- Color contrast ratios
- Keyboard operability

### Manual verification

After automated checks pass:

1. Navigate the site with keyboard only (no mouse)
2. Test with a screen reader (VoiceOver on macOS, NVDA on Windows)
3. Enable reduced motion in system preferences and verify animations stop
4. Check focus indicators are visible on all interactive elements

## Exceptions

See `docs/accessibility-exceptions.md` for known issues that do not block WCAG AA compliance but are noted for future improvement.

## Maintenance

When adding new components:

1. Use semantic HTML when possible
2. Add ARIA attributes only when semantic HTML is insufficient
3. Ensure keyboard operability
4. Test with axe-core
5. Verify with actual keyboard and screen reader use

When updating styles:

1. Run contrast tests to verify color changes still meet ratios
2. Check focus indicators remain visible
3. Test with reduced motion enabled
