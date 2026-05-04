import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GestureValidator } from './gestureValidator';

describe('GestureValidator', () => {
  let validator: GestureValidator;

  beforeEach(() => {
    validator = new GestureValidator();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(validator).toBeDefined();
      expect(validator.isInCooldown()).toBe(false);
    });
  });

  describe('update', () => {
    it('should return validation result object', () => {
      const result = validator.update('thumbs_up');
      expect(result).toBeDefined();
      expect(result).toHaveProperty('isValidated');
      expect(result).toHaveProperty('progress');
      expect(result).toHaveProperty('isUnstable');
    });

    it('should return isValidated false initially', () => {
      const result = validator.update('thumbs_up');
      expect(result.isValidated).toBe(false);
    });

    it('should return progress 0 for new gesture', () => {
      const result = validator.update('thumbs_up');
      expect(result.progress).toBe(0);
    });

    it('should track gesture changes', () => {
      const result1 = validator.update('thumbs_up');
      const result2 = validator.update('thumbs_down');
      expect(result1.isValidated).toBe(false);
      expect(result2.isValidated).toBe(false);
    });

    it('should increase progress over time', async () => {
      const result1 = validator.update('thumbs_up');
      expect(result1.progress).toBe(0);
      
      // Simulate time passing
      await new Promise(resolve => setTimeout(resolve, 100));
      const result2 = validator.update('thumbs_up');
      expect(result2.progress).toBeGreaterThan(result1.progress);
    });
  });

  describe('reset', () => {
    it('should reset validator state', () => {
      validator.update('thumbs_up');
      validator.reset();
      expect(validator.isInCooldown()).toBe(false);
    });

    it('should clear gesture after reset', () => {
      validator.update('thumbs_up');
      validator.reset();
      const result = validator.update('thumbs_up');
      expect(result.progress).toBe(0);
    });
  });

  describe('isInCooldown', () => {
    it('should return false initially', () => {
      expect(validator.isInCooldown()).toBe(false);
    });

    it('should return boolean value', () => {
      const result = validator.isInCooldown();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getCurrentGesture', () => {
    it('should return null initially', () => {
      expect(validator.getCurrentGesture()).toBeNull();
    });

    it('should return current gesture after update', () => {
      validator.update('thumbs_up');
      expect(validator.getCurrentGesture()).toBe('thumbs_up');
    });

    it('should update current gesture on change', () => {
      validator.update('thumbs_up');
      validator.update('thumbs_down');
      expect(validator.getCurrentGesture()).toBe('thumbs_down');
    });
  });

  describe('getGestureChangeCount', () => {
    it('should return 0 initially', () => {
      expect(validator.getGestureChangeCount()).toBe(0);
    });

    it('should increment on gesture change', () => {
      validator.update('thumbs_up');
      const count1 = validator.getGestureChangeCount();
      validator.update('thumbs_down');
      const count2 = validator.getGestureChangeCount();
      expect(count2).toBeGreaterThan(count1);
    });
  });

  describe('getCooldownRemaining', () => {
    it('should return 0 when not in cooldown', () => {
      expect(validator.getCooldownRemaining()).toBe(0);
    });

    it('should return number value', () => {
      const result = validator.getCooldownRemaining();
      expect(typeof result).toBe('number');
    });
  });
});
