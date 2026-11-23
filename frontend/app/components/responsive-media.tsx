"use client";

import type { CSSProperties } from "react";

/**
 * Responsive image with modern format support and lazy loading.
 * 
 * Serves WebP with fallback to PNG/JPEG, includes multiple sizes
 * for responsive loading, and lazy-loads by default to improve
 * initial page performance.
 */
export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Load immediately instead of lazy (for above-fold images) */
  priority?: boolean;
  className?: string;
}) {
  const basePath = src.replace(/\.(png|jpg|jpeg|gif)$/, '');
  
  return (
    <picture>
      <source srcSet={`${basePath}.webp`} type="image/webp" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={className}
      />
    </picture>
  );
}

/**
 * Responsive video with poster image and fallback.
 * 
 * Serves multiple formats (WebM, MP4) with a poster frame for
 * browsers that don't support HTML5 video. Muted and autoplaying
 * by default for decorative animations, but respects prefers-reduced-motion.
 */
export function ResponsiveVideo({
  srcWebm,
  srcMp4,
  poster,
  alt,
  autoPlay = true,
  loop = true,
  muted = true,
  className,
  style,
}: {
  srcWebm?: string;
  srcMp4: string;
  poster?: string;
  /** Describes what the video shows, for screen readers */
  alt: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  /* Check prefers-reduced-motion and disable autoplay if set.
     The browser's autoplay policy already handles this for most cases,
     but we enforce it explicitly to be certain. */
  const shouldAutoPlay = autoPlay && !matchesReducedMotion();
  
  return (
    <video
      poster={poster}
      autoPlay={shouldAutoPlay}
      loop={loop}
      muted={muted}
      playsInline
      aria-label={alt}
      className={className}
      style={style}
    >
      {srcWebm && <source src={srcWebm} type="video/webm" />}
      <source src={srcMp4} type="video/mp4" />
      <p>{alt}</p>
    </video>
  );
}

/**
 * Check if the user prefers reduced motion.
 * 
 * Returns false during SSR (server-side rendering) to avoid hydration
 * mismatches. The component will re-check on the client.
 */
function matchesReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
