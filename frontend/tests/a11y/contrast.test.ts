import { describe, it, expect } from 'vitest';
import { 
  contrastRatio, 
  meetsWCAG_AA, 
  THEME_COLOR_PAIRS,
  hexToRgb,
  relativeLuminance,
} from '../../lib/contrast';

describe('contrast utilities', () => {
  describe('hexToRgb', () => {
    it('converts 6-character hex colors', () => {
      expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]);
      expect(hexToRgb('#000000')).toEqual([0, 0, 0]);
      expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
    });

    it('converts 3-character hex colors', () => {
      expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
      expect(hexToRgb('#000')).toEqual([0, 0, 0]);
      expect(hexToRgb('#f00')).toEqual([255, 0, 0]);
    });

    it('handles hex colors with or without hash', () => {
      expect(hexToRgb('ffffff')).toEqual([255, 255, 255]);
      expect(hexToRgb('#ffffff')).toEqual([255, 255, 255]);
    });
  });

  describe('relativeLuminance', () => {
    it('calculates luminance for white', () => {
      const lum = relativeLuminance([255, 255, 255]);
      expect(lum).toBeCloseTo(1, 2);
    });

    it('calculates luminance for black', () => {
      const lum = relativeLuminance([0, 0, 0]);
      expect(lum).toBe(0);
    });
  });

  describe('contrastRatio', () => {
    it('calculates 21:1 for black on white', () => {
      const ratio = contrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('calculates the same ratio regardless of order', () => {
      const ratio1 = contrastRatio('#000000', '#ffffff');
      const ratio2 = contrastRatio('#ffffff', '#000000');
      expect(ratio1).toBe(ratio2);
    });

    it('calculates 1:1 for identical colors', () => {
      const ratio = contrastRatio('#aaaaaa', '#aaaaaa');
      expect(ratio).toBeCloseTo(1, 2);
    });
  });

  describe('meetsWCAG_AA', () => {
    it('passes for black text on white background', () => {
      const result = meetsWCAG_AA('#000000', '#ffffff');
      expect(result.pass).toBe(true);
      expect(result.ratio).toBeGreaterThan(4.5);
    });

    it('requires 4.5:1 for normal text', () => {
      const result = meetsWCAG_AA('#767676', '#ffffff');
      expect(result.pass).toBe(true);
      expect(result.required).toBe(4.5);
    });

    it('requires 3:1 for large text', () => {
      const result = meetsWCAG_AA('#767676', '#ffffff', true);
      expect(result.pass).toBe(true);
      expect(result.required).toBe(3);
    });

    it('fails for insufficient contrast', () => {
      const result = meetsWCAG_AA('#e0e0e0', '#ffffff');
      expect(result.pass).toBe(false);
    });
  });

  describe('theme color pairs', () => {
    it('all light theme pairs meet WCAG AA for normal text', () => {
      const failures: string[] = [];

      for (const [name, colors] of Object.entries(THEME_COLOR_PAIRS.light)) {
        const result = meetsWCAG_AA(colors.foreground, colors.background);
        
        if (!result.pass) {
          failures.push(
            `${name}: ${result.ratio.toFixed(2)}:1 (requires ${result.required}:1)`
          );
        }
      }

      expect(failures).toEqual([]);
    });

    it('all dark theme pairs meet WCAG AA for normal text', () => {
      const failures: string[] = [];

      for (const [name, colors] of Object.entries(THEME_COLOR_PAIRS.dark)) {
        const result = meetsWCAG_AA(colors.foreground, colors.background);
        
        if (!result.pass) {
          failures.push(
            `${name}: ${result.ratio.toFixed(2)}:1 (requires ${result.required}:1)`
          );
        }
      }

      expect(failures).toEqual([]);
    });
  });
});
