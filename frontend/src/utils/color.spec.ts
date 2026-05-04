import { describe, it, expect } from 'vitest';
import { hexToHsl } from './color';

describe('color.ts', () => {
  describe('hexToHsl', () => {
    it('should convert white hex to HSL', () => {
      const result = hexToHsl('#FFFFFF');
      expect(result.h).toBe(0);
      expect(result.s).toBe(0);
      expect(result.l).toBe(100);
    });

    it('should convert black hex to HSL', () => {
      const result = hexToHsl('#000000');
      expect(result.h).toBe(0);
      expect(result.s).toBe(0);
      expect(result.l).toBe(0);
    });

    it('should convert red hex to HSL', () => {
      const result = hexToHsl('#FF0000');
      expect(result.h).toBe(0);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should convert green hex to HSL', () => {
      const result = hexToHsl('#00FF00');
      expect(result.h).toBe(120);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should convert blue hex to HSL', () => {
      const result = hexToHsl('#0000FF');
      expect(result.h).toBe(240);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should handle lowercase hex values', () => {
      const result = hexToHsl('#ff0000');
      expect(result.h).toBe(0);
      expect(result.s).toBe(100);
      expect(result.l).toBe(50);
    });

    it('should convert gray hex to HSL', () => {
      const result = hexToHsl('#808080');
      expect(result.h).toBe(0);
      expect(result.s).toBe(0);
      expect(result.l).toBeCloseTo(50, 1);
    });
  });
});
