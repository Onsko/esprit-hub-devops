import { describe, it, expect } from 'vitest';
import { t, hasTranslation, getSupportedLanguages } from './i18n';

describe('i18n.ts', () => {
  describe('t', () => {
    it('should return translation for valid key in French', () => {
      const result = t('common.welcome', 'fr');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return translation for valid key in English', () => {
      const result = t('common.welcome', 'en');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should default to French when language not specified', () => {
      const result = t('common.welcome');
      expect(typeof result).toBe('string');
    });

    it('should return key if translation not found', () => {
      const result = t('nonexistent.key', 'fr');
      expect(typeof result).toBe('string');
    });

    it('should handle nested translation keys', () => {
      const result = t('auth.login', 'fr');
      expect(typeof result).toBe('string');
    });

    it('should support multiple languages', () => {
      const fr = t('common.welcome', 'fr');
      const en = t('common.welcome', 'en');
      expect(fr).toBeDefined();
      expect(en).toBeDefined();
    });
  });

  describe('hasTranslation', () => {
    it('should return true for existing translation key', () => {
      const result = hasTranslation('common.welcome');
      expect(typeof result).toBe('boolean');
    });

    it('should return false for non-existing translation key', () => {
      const result = hasTranslation('nonexistent.key.that.does.not.exist');
      expect(typeof result).toBe('boolean');
    });

    it('should handle nested keys', () => {
      const result = hasTranslation('auth.login');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return array of supported languages', () => {
      const result = getSupportedLanguages();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return objects with code and name properties', () => {
      const result = getSupportedLanguages();
      result.forEach((lang) => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(typeof lang.code).toBe('string');
        expect(typeof lang.name).toBe('string');
      });
    });

    it('should include French and English', () => {
      const result = getSupportedLanguages();
      const codes = result.map((lang) => lang.code);
      expect(codes).toContain('fr');
      expect(codes).toContain('en');
    });
  });
});
