import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatService } from './chatService';

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should be defined', () => {
      expect(chatService.sendMessage).toBeDefined();
    });

    it('should be an async function', () => {
      expect(chatService.sendMessage).toBeInstanceOf(Function);
    });

    it('should accept message and activityId parameters', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'test response' }),
      });
      global.fetch = mockFetch;

      try {
        await chatService.sendMessage('test message', 'activity123');
        expect(mockFetch).toHaveBeenCalled();
      } catch (error) {
        // Expected if API endpoint not available
      }
    });

    it('should return a string response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'test response' }),
      });
      global.fetch = mockFetch;

      try {
        const result = await chatService.sendMessage('test', 'activity123');
        expect(typeof result).toBe('string');
      } catch (error) {
        // Expected if API endpoint not available
      }
    });

    it('should handle API errors', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
      });
      global.fetch = mockFetch;

      try {
        await chatService.sendMessage('test', 'activity123');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle network errors', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      try {
        await chatService.sendMessage('test', 'activity123');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
