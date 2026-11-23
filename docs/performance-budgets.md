# Performance Budgets

This document defines the performance standards for StelHacks routes and explains how to measure and maintain them.

## Standards

Every route has budgets for:

- **JavaScript bundle size**: Total JS shipped to the browser
- **Image payload**: Total image bytes loaded
- **Largest Contentful Paint (LCP)**: Time to main content visibility

Budgets are defined in `frontend/perf/budgets.json` and enforced in CI.

## Route Budgets

| Route | JavaScript | Images | LCP | Notes |
|-------|-----------|--------|-----|-------|
| `/` | 250kb | 500kb | 2.5s | Landing with hero animation |
| `/hackathons` | 200kb | 300kb | 2.5s | Listing with filters |
| `/hackathons/[slug]` | 220kb | 400kb | 2.5s | Detail page with tabs |
| `/hackathons/[slug]/submit` | 280kb | 200kb | 2.5s | Form with validation |
| `/hackathons/[slug]/vote` | 240kb | 250kb | 2.5s | Ballot interface |
| `/hackathons/[slug]/projects/[team]` | 300kb | 400kb | 2.5s | Project detail + deck viewer (lazy) |
| `/statistics` | 280kb | 100kb | 2.5s | Dashboard (lazy loaded) |
| `/u/[username]` | 180kb | 200kb | 2.5s | User profile |

## Measurement

### Automated checks

Run the measurement script after building:

```bash
cd frontend
npm run build
npm run perf
```

The script:
1. Reads `budgets.json`
2. Analyzes `.next/build-manifest.json` for JS sizes
3. Scans `public/` for image usage
4. Compares actual sizes to budgets
5. Fails if any route exceeds its budget

### LCP measurement

LCP requires a running server and browser automation:

```bash
cd frontend
npm run build
npm start  # In one terminal
npm run perf:lcp  # In another terminal
```

This uses Playwright to load each route in Chromium and capture LCP timing.

## Optimization Strategies

### JavaScript

1. **Lazy loading**: Defer non-critical components
   - Wallet kits loaded on connect click
   - Deck viewer loaded on demand
   - Statistics charts loaded when visiting /statistics
   
2. **Code splitting**: Next.js automatic per-route
   - Each page gets its own bundle
   - Shared code extracted to commons chunk
   
3. **Tree shaking**: Remove unused code
   - Import only needed functions from libraries
   - Avoid star imports (`import *`)

### Images

1. **Modern formats**: WebP with PNG/JPEG fallback
   - Use `<picture>` for format selection
   - Next.js Image component handles this
   
2. **Responsive loading**: Right size for viewport
   - `srcset` and `sizes` attributes
   - Different resolutions for mobile/desktop
   
3. **Lazy loading**: Below-fold images deferred
   - `loading="lazy"` attribute
   - Above-fold images use `priority`
   
4. **Compression**: Optimize before upload
   - WebP at 80% quality
   - Progressive JPEG for photos

### LCP

1. **Priority hints**: Mark LCP candidate
   ```tsx
   <img src="/hero.jpg" loading="eager" fetchpriority="high" />
   ```
   
2. **Inline critical CSS**: Reduce render blocking
   - Tailwind's JIT includes only used styles
   - Consider critical CSS extraction for large pages
   
3. **Preload key resources**: Hint to browser
   ```html
   <link rel="preload" as="image" href="/hero.webp" />
   ```

## Raising a Budget

Budgets should be raised deliberately, not reactively.

**Before raising**:
1. Profile the route to understand what changed
2. Attempt optimization first
3. Document why the increase is justified
4. Get approval from a maintainer

**To raise**:
1. Update `frontend/perf/budgets.json`
2. Document the reason in the commit message
3. Include before/after measurements in PR

**Example**:

```json
{
  "/hackathons/[slug]/projects/[team]": {
    "javascript": "350kb",  // Was 300kb
    "images": "400kb",
    "lcp": "2.5s",
    "description": "Project detail + deck viewer (lazy); increased for 3D model viewer"
  }
}
```

Commit message:
```
chore(perf): raise project detail JS budget to 350kb

Added 3D model viewer for CAD submissions. Viewer library
adds 50kb gzipped. Lazy loaded, only when project includes
a .obj or .stl file.

Before: 300kb actual
After: 345kb actual
Budget: 350kb (15% headroom)
```

## Caching

Static assets are cached aggressively to reduce repeat visits' impact:

| Asset Type | Cache-Control |
|-----------|---------------|
| Brand assets, landing artwork | `public, max-age=31536000, immutable` |
| User avatars, thumbnails | `public, max-age=3600, stale-while-revalidate=86400` |
| Seasonal graphics | `public, max-age=86400, stale-while-revalidate=604800` |

Configured in `frontend/next.config.ts` headers section.

## Monitoring

After deployment:
1. Run Lighthouse CI on key routes
2. Check Real User Monitoring (RUM) if available
3. Watch for budget regressions in PR checks

The measurement script runs in CI on every pull request.
