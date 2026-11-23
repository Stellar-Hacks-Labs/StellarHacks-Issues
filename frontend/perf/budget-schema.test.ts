import { describe, it, expect } from 'vitest';
import { parseSize, parseTime, formatSize, formatTime } from './budget-schema';

describe('budget schema utilities', () => {
  describe('parseSize', () => {
    it('parses kilobyte sizes', () => {
      expect(parseSize('250kb')).toBe(250 * 1024);
      expect(parseSize('1.5kb')).toBe(1.5 * 1024);
    });

    it('parses megabyte sizes', () => {
      expect(parseSize('1mb')).toBe(1024 * 1024);
      expect(parseSize('2.5mb')).toBe(2.5 * 1024 * 1024);
    });

    it('is case insensitive', () => {
      expect(parseSize('250KB')).toBe(250 * 1024);
      expect(parseSize('1MB')).toBe(1024 * 1024);
    });

    it('throws on invalid format', () => {
      expect(() => parseSize('250')).toThrow();
      expect(() => parseSize('250gb')).toThrow();
      expect(() => parseSize('invalid')).toThrow();
    });
  });

  describe('parseTime', () => {
    it('parses second times', () => {
      expect(parseTime('2.5s')).toBe(2500);
      expect(parseTime('1s')).toBe(1000);
    });

    it('parses millisecond times', () => {
      expect(parseTime('2500ms')).toBe(2500);
      expect(parseTime('100ms')).toBe(100);
    });

    it('is case insensitive', () => {
      expect(parseTime('2.5S')).toBe(2500);
      expect(parseTime('100MS')).toBe(100);
    });

    it('throws on invalid format', () => {
      expect(() => parseTime('2500')).toThrow();
      expect(() => parseTime('2.5m')).toThrow();
      expect(() => parseTime('invalid')).toThrow();
    });
  });

  describe('formatSize', () => {
    it('formats bytes', () => {
      expect(formatSize(512)).toBe('512B');
    });

    it('formats kilobytes', () => {
      expect(formatSize(250 * 1024)).toBe('250.0kb');
      expect(formatSize(1.5 * 1024)).toBe('1.5kb');
    });

    it('formats megabytes', () => {
      expect(formatSize(1024 * 1024)).toBe('1.00mb');
      expect(formatSize(2.5 * 1024 * 1024)).toBe('2.50mb');
    });
  });

  describe('formatTime', () => {
    it('formats milliseconds', () => {
      expect(formatTime(500)).toBe('500ms');
    });

    it('formats seconds', () => {
      expect(formatTime(2500)).toBe('2.50s');
      expect(formatTime(1000)).toBe('1.00s');
    });
  });
});
