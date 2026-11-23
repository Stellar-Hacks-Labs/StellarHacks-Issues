# Raising a Performance Budget

Performance budgets exist to prevent regressions. When a route legitimately needs more resources, the budget can be raised—but deliberately, with justification.

## When to Raise

**Good reasons**:
- New feature with unavoidable weight (e.g., PDF viewer, 3D model support)
- Library update with better functionality but slightly larger size
- Accessibility improvement that adds weight (e.g., better screen reader support)

**Bad reasons**:
- Lazy optimization ("we can optimize later")
- Convenience over performance
- Accumulation of small additions without review

## Process

### 1. Attempt optimization first

Before raising a budget, try to stay within it:

**For JavaScript**:
- Lazy load the new code
- Split it into a separate chunk
- Find an alternative library
- Remove something else

**For images**:
- Use WebP instead of PNG
- Compress more aggressively
- Use CSS or SVG instead of raster
- Remove unused images

**For LCP**:
- Prioritize critical resources
- Defer non-critical work
- Optimize the LCP element itself

### 2. Measure before and after

Document what the change added:

```bash
# Before the feature
cd frontend
npm run build
npm run perf

# After the feature
npm run build
npm run perf
```

Include both reports in the PR.

### 3. Justify the increase

In the PR description, explain:
- What the feature does
- Why it needs the extra budget
- What optimization was attempted
- Why the trade-off is worth it

Example:

> This PR adds a 3D model viewer for CAD project submissions. The viewer library (three.js) adds 50kb gzipped. We evaluated lighter alternatives (babylon.js, model-viewer) but three.js offers better Soroban integration and broader format support.
>
> The viewer is lazy-loaded and only appears when a project includes .obj or .stl files, so most routes are unaffected.
>
> Before: 300kb JS actual
> After: 345kb JS actual
> Raising budget: 300kb → 350kb (15% headroom)

### 4. Update budgets.json

```json
{
  "/hackathons/[slug]/projects/[team]": {
    "javascript": "350kb",
    "images": "400kb",
    "lcp": "2.5s",
    "description": "Project detail + deck viewer + 3D viewer (lazy)"
  }
}
```

### 5. Update documentation

If the reason is not obvious from the description field, add a note to `docs/performance-budgets.md`.

## Commit Message Format

```
chore(perf): raise [route] [resource] budget to [new limit]

[1-2 sentence explanation of what changed]

Before: [old actual]
After: [new actual]
Budget: [new limit] ([percentage] headroom)
```

Example:

```
chore(perf): raise project detail JS budget to 350kb

Added 3D model viewer for CAD submissions. Viewer library
adds 50kb gzipped. Lazy loaded, only when project includes
a .obj or .stl file.

Before: 300kb actual
After: 345kb actual
Budget: 350kb (15% headroom)
```

## Review Criteria

Maintainers will check:
1. Was optimization attempted?
2. Is the increase justified?
3. Is the new budget reasonable (not excessive headroom)?
4. Are measurements included?
5. Is the change isolated (doesn't affect unrelated routes)?

## Headroom

Leave ~10-15% headroom above the new actual size:
- Allows for minor fluctuations
- Prevents immediate re-raise on next change
- Too much headroom defeats the purpose

Example:
- Actual after change: 345kb
- Budget: 350kb (1.4% over, good)
- Not: 400kb (13% over, too loose)

## Reverting

If a feature is removed, revert its budget increase in the same PR.

If an optimization brings a route back under budget, consider lowering the budget to lock in the improvement.
