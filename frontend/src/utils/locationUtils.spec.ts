import { describe, it, expect } from 'vitest';
import { parseLocation, locationToString, getLocationAddress } from './locationUtils';

describe('locationUtils.ts', () => {
  describe('parseLocation', () => {
    it('should parse known city location', () => {
      const result = parseLocation('Paris');
      expect(result.lat).toBe(48.8566);
      expect(result.lng).toBe(2.3522);
      expect(result.address).toContain('Paris');
    });

    it('should handle location with country', () => {
      const result = parseLocation('London, UK');
      expect(result.lat).toBe(51.5074);
      expect(result.lng).toBe(-0.1278);
    });

    it('should return default Tunis for null location', () => {
      const result = parseLocation(null);
      expect(result.lat).toBe(36.8065);
      expect(result.lng).toBe(10.1815);
    });

    it('should return default Tunis for undefined location', () => {
      const result = parseLocation(undefined);
      expect(result.lat).toBe(36.8065);
      expect(result.lng).toBe(10.1815);
    });

    it('should return default Tunis for empty string location', () => {
      const result = parseLocation('');
      expect(result.lat).toBe(36.8065);
      expect(result.lng).toBe(10.1815);
    });

    it('should parse single location name', () => {
      const result = parseLocation('London');
      expect(result.lat).toBe(51.5074);
      expect(result.address).toContain('London');
    });

    it('should handle case-insensitive location names', () => {
      const result = parseLocation('PARIS');
      expect(result.lat).toBe(48.8566);
    });

    it('should parse coordinates from string', () => {
      const result = parseLocation('36.8065, 10.1815');
      expect(result.lat).toBe(36.8065);
      expect(result.lng).toBe(10.1815);
    });

    it('should handle unknown location with default coords', () => {
      const result = parseLocation('Unknown City');
      expect(result.lat).toBe(36.8065);
      expect(result.address).toBe('Unknown City');
    });
  });

  describe('locationToString', () => {
    it('should convert location object to string', () => {
      const location = { lat: 48.8566, lng: 2.3522, address: 'Paris, France' };
      const result = locationToString(location);
      expect(result).toContain('48.8566');
      expect(result).toContain('2.3522');
      expect(result).toContain('Paris, France');
    });

    it('should return string as-is if already a string', () => {
      const result = locationToString('Paris, France');
      expect(result).toBe('Paris, France');
    });

    it('should format coordinates with 4 decimal places', () => {
      const location = { lat: 36.80651234, lng: 10.18151234, address: 'Tunis' };
      const result = locationToString(location);
      expect(result).toContain('36.8065');
      expect(result).toContain('10.1815');
    });
  });

  describe('getLocationAddress', () => {
    it('should extract address from formatted location string', () => {
      const result = getLocationAddress('36.8065,10.1815|Paris, France');
      expect(result).toBe('Paris, France');
    });

    it('should return location string if not formatted', () => {
      const result = getLocationAddress('Paris, France');
      expect(result).toBe('Paris, France');
    });

    it('should return default message for undefined location', () => {
      const result = getLocationAddress(undefined);
      expect(result).toBe('Non spécifié');
    });

    it('should return default message for null location', () => {
      const result = getLocationAddress(null as any);
      expect(result).toBe('Non spécifié');
    });

    it('should return default message for empty location', () => {
      const result = getLocationAddress('');
      expect(result).toBe('Non spécifié');
    });
  });
});
