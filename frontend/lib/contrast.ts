/**
 * Color contrast checking utilities for WCAG 2.2 AA compliance.
 * 
 * WCAG 2.2 Level AA requires:
 * - 4.5:1 for normal text (< 18pt or < 14pt bold)
 * - 3:1 for large text (>= 18pt or >= 14pt bold)
 * - 3:1 for UI components and graphical objects
 */

/**
 * Parse a hex color string to RGB components.
 * 
 * @param hex - Color in #RRGGBB or #RGB format
 * @returns RGB components as [r, g, b] where each is 0-255
 */
export function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  
  let r: number, g: number, b: number;
  
  if (cleaned.length === 3) {
    r = parseInt(cleaned[0] + cleaned[0], 16);
    g = parseInt(cleaned[1] + cleaned[1], 16);
    b = parseInt(cleaned[2] + cleaned[2], 16);
  } else {
    r = parseInt(cleaned.substring(0, 2), 16);
    g = parseInt(cleaned.substring(2, 4), 16);
    b = parseInt(cleaned.substring(4, 6), 16);
  }
  
  return [r, g, b];
}

/**
 * Calculate relative luminance of an RGB color.
 * 
 * Uses the WCAG formula: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 * 
 * @param rgb - RGB components as [r, g, b] where each is 0-255
 * @returns Relative luminance from 0 to 1
 */
export function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((component) => {
    const srgb = component / 255;
    
    return srgb <= 0.03928
      ? srgb / 12.92
      : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors.
 * 
 * Uses the WCAG formula: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 * 
 * @param color1 - First color in #RRGGBB format
 * @param color2 - Second color in #RRGGBB format
 * @returns Contrast ratio from 1 to 21
 */
export function contrastRatio(color1: string, color2: string): number {
  const lum1 = relativeLuminance(hexToRgb(color1));
  const lum2 = relativeLuminance(hexToRgb(color2));
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color pair meets WCAG AA standards.
 * 
 * @param foreground - Text color in #RRGGBB format
 * @param background - Background color in #RRGGBB format
 * @param largeText - Whether the text is large (18pt+ or 14pt+ bold)
 * @returns Object with pass/fail and the actual ratio
 */
export function meetsWCAG_AA(
  foreground: string,
  background: string,
  largeText = false
): { pass: boolean; ratio: number; required: number } {
  const ratio = contrastRatio(foreground, background);
  const required = largeText ? 3 : 4.5;
  
  return {
    pass: ratio >= required,
    ratio,
    required,
  };
}

/**
 * Color pairs from the theme that must meet WCAG AA standards.
 * 
 * These are extracted from globals.css and tailwind.config.
 * Each theme (light and dark) must have sufficient contrast.
 */
export const THEME_COLOR_PAIRS = {
  light: {
    'text-on-background': { foreground: '#1a1a1a', background: '#ffffff' },
    'text-faint': { foreground: '#6b6b6b', background: '#ffffff' },
    'text-soft': { foreground: '#4a4a4a', background: '#ffffff' },
    'button-primary': { foreground: '#ffffff', background: '#1a1a1a' },
    'button-hover': { foreground: '#ffffff', background: '#2a2a2a' },
  },
  dark: {
    'text-on-background': { foreground: '#f5f5f5', background: '#0a0a0a' },
    'text-faint': { foreground: '#8a8a8a', background: '#0a0a0a' },
    'text-soft': { foreground: '#b5b5b5', background: '#0a0a0a' },
    'button-primary': { foreground: '#0a0a0a', background: '#f5f5f5' },
    'button-hover': { foreground: '#0a0a0a', background: '#d5d5d5' },
  },
} as const;
