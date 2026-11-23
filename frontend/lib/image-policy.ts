/**
 * Image optimization policy.
 * 
 * Centralizes image loading decisions so performance characteristics
 * are consistent across the site. All images should go through one of
 * these helpers rather than using <img> directly.
 */

/**
 * Configuration for an optimized image.
 */
export interface ImageConfig {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Load immediately (above fold) or lazy (below fold) */
  priority?: boolean;
  /** Sizes attribute for responsive loading */
  sizes?: string;
}

/**
 * Image policy for hero and banner images.
 * 
 * These are above the fold and affect LCP, so they should:
 * - Use priority loading (not lazy)
 * - Provide responsive sizes
 * - Use modern formats (WebP with fallback)
 */
export function heroImageConfig(
  src: string,
  alt: string,
  width: number,
  height: number
): ImageConfig {
  return {
    src,
    alt,
    width,
    height,
    priority: true,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px',
  };
}

/**
 * Image policy for avatars and profile pictures.
 * 
 * Small circular images that are repeated throughout the UI.
 * Should be:
 * - Lazy loaded (not above fold)
 * - Fixed size (no responsive breakpoints needed)
 * - Cached aggressively (long-lived)
 */
export function avatarImageConfig(
  src: string,
  alt: string,
  size: number
): ImageConfig {
  return {
    src,
    alt,
    width: size,
    height: size,
    priority: false,
    sizes: `${size}px`,
  };
}

/**
 * Image policy for project cards and thumbnails.
 * 
 * Appear in lists and grids, potentially many per page.
 * Should be:
 * - Lazy loaded (not critical)
 * - Responsive (adapt to viewport)
 * - Moderate quality (balance size vs fidelity)
 */
export function thumbnailImageConfig(
  src: string,
  alt: string,
  width: number,
  height: number
): ImageConfig {
  return {
    src,
    alt,
    width,
    height,
    priority: false,
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px',
  };
}

/**
 * Image policy for artwork and decorative images.
 * 
 * Brand mascot, landing page artwork, celebration graphics.
 * Should be:
 * - Lazy loaded unless above fold
 * - Moderate size limits
 * - Can be omitted on slow connections (not critical)
 */
export function artworkImageConfig(
  src: string,
  alt: string,
  width: number,
  height: number,
  aboveFold = false
): ImageConfig {
  return {
    src,
    alt,
    width,
    height,
    priority: aboveFold,
    sizes: '(max-width: 768px) 50vw, (max-width: 1024px) 40vw, 400px',
  };
}

/**
 * Cache control headers for static images.
 * 
 * These should be set by the server or CDN.
 */
export const IMAGE_CACHE_HEADERS = {
  /** User avatars and project thumbnails (change when user uploads new one) */
  dynamic: 'public, max-age=3600, stale-while-revalidate=86400',
  
  /** Brand assets and landing page artwork (change with deployment) */
  static: 'public, max-age=31536000, immutable',
  
  /** Temporary or seasonal graphics */
  temporary: 'public, max-age=86400, stale-while-revalidate=604800',
};
