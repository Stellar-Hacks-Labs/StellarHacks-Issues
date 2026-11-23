/**
 * Lazy loading utilities for code splitting.
 * 
 * Defers loading of heavy components until they are needed,
 * reducing initial bundle size and improving time to interactive.
 */

import { lazy } from 'react';

/**
 * Lazy-load the wallet kit connection dialog.
 * 
 * The wallet selection UI and connection logic are only needed
 * when a user clicks "Connect Wallet", so they can be deferred
 * until that moment rather than shipped in the initial bundle.
 */
export const LazyWalletDialog = lazy(() =>
  import('../app/components/wallet-context').then((mod) => ({
    default: mod.WalletDialog || (() => null),
  }))
);

/**
 * Lazy-load the statistics dashboard.
 * 
 * Charts and visualization libraries are heavy. The dashboard
 * is only used on /statistics, so it doesn't need to be in
 * every page's bundle.
 */
export const LazyStatsDashboard = lazy(() =>
  import('../app/statistics/dashboard').then((mod) => ({
    default: mod.StatsDashboard || (() => null),
  }))
);

/**
 * Lazy-load the deck viewer.
 * 
 * PDF rendering and navigation are only needed when viewing
 * a project's pitch deck, which is a secondary action on
 * the project detail page.
 */
export const LazyDeckViewer = lazy(() =>
  import('../app/hackathons/[slug]/projects/[team]/deck').then((mod) => ({
    default: mod.DeckViewer || (() => null),
  }))
);

/**
 * Lazy-load the hero animation.
 * 
 * WebGL shaders and particle systems are decorative. They can
 * be deferred to reduce the critical path for first contentful paint.
 */
export const LazyHeroAnimation = lazy(() =>
  import('../app/components/hero-animation').then((mod) => ({
    default: mod.HeroAnimation,
  }))
);

/**
 * Lazy-load the particle text effect.
 * 
 * Like the hero animation, this is decorative and can be
 * deferred to prioritize interactive content.
 */
export const LazyParticleText = lazy(() =>
  import('../app/components/particle-text').then((mod) => ({
    default: mod.ParticleText,
  }))
);
