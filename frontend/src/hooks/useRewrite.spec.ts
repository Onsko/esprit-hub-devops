/**
 * Tests unitaires pour useRewrite
 * Hook de reformulation de texte via le backend NestJS (OpenRouter / DeepSeek)
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useRewrite } from './useRewrite'

// ── Mock global fetch ─────────────────────────────────────────────────────────

const mockFetch = vi.fn()
global.fetch = mockFetch

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeOkResponse = (rewritten: string, model = 'deepseek') => ({
  ok: true,
  status: 200,
  json: async () => ({ rewritten, model }),
})

const makeErrorResponse = (status: number, message?: string) => ({
  ok: false,
  status,
  json: async () => (message ? { message } : {}),
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useRewrite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  // ── État initial ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useRewrite())
      expect(result.current.rewriting).toBe(false)
      expect(result.current.error).toBeNull()
      expect(typeof result.current.rewrite).toBe('function')
    })
  })

  // ── rewrite — cas de succès ───────────────────────────────────────────────

  describe('rewrite — success cases', () => {
    it('should return rewritten text and model on success', async () => {
      localStorage.setItem('auth_token', 'valid-token')
      mockFetch.mockResolvedValue(makeOkResponse('Texte reformulé avec succès', 'deepseek'))

      const { result } = renderHook(() => useRewrite())
      let res: any
      await act(async () => {
        res = await result.current.rewrite('texte brut à reformuler')
      })

      expect(res).not.toBeNull()
      expect(res.rewritten).toBe('Texte reformulé avec succès')
      expect(res.model).toBe('deepseek')
    })

    it('should call fetch with POST method and correct URL', async () => {
      localStorage.setItem('auth_token', 'valid-token')
      mockFetch.mockResolvedValue(makeOkResponse('reformulé'))

      const { result } = renderHook(() => useRewrite())
      await act(async () => {
        await result.current.rewrite('texte à reformuler')
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat/rewrite'),
        expect.objectContaining({ method: 'POST' }),
      )
    })

    it('should include Authorization header with Bearer token', async () => {
      localStorage.setItem('auth_token', 'my-jwt-token')
      mockFetch.mockResolvedValue(makeOkResponse('reformulé'))

      const { result } = renderHook(() => useRewrite())
      await act(async () => {
        await result.current.rewrite('texte à reformuler')
      })

      const callArgs = mockFetch.mock.calls[0][1]
      expect(callArgs.headers['Authorization']).toBe('Bearer my-jwt-token')
    })

    it('should include Content-Type application/json header', async () => {
      localStorage.setItem('auth_token', 'token')
      mockFetch.mockResolvedValue(makeOkResponse('reformulé'))

      const { result } = renderHook(() => useRewrite())
      await act(async () => {
        await result.current.rewrite('texte à reformuler')
      })

      const callArgs = mockFetch.mock.calls[0][1]
      expect(callArgs.headers['Content-Type']).toBe('application/json')
    })

    it('should send prompt in request body', async () => {
      localStorage.setItem('auth_token', 'token')
      mockFetch.mockResolvedValue(makeOkResponse('reformulé'))

      const { result } = renderHook(() => useRewrite())
      await act(async () => {
        await result.current.rewrite('Mon texte original')
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.prompt).toBe('Mon texte original')
    })

    it('should send targetLanguage "fr" in request body', async () => {
      localStorage.setItem('auth_token', 'token')
      mockFetch.mockResolvedValue(makeOkResponse('reformulé'))

      const { result } = renderHook(() => useRewrite())
      await act(async () => {
        await result.current.rewrite('texte')
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.targetLanguage).toBe('fr')
    })

    it('should use custom context as constraints when provided', async () => {
      localStorage.setItem('auth_token', 'token')
      mockFetch.mockResolvedValue(makeOkResponse('reformulé'))

      const { result } = renderHook(() => useRewrite())
      await act(async () => {
        await result.current.rewrite('texte', 'Contexte personnalisé')
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.constraints).toBe('Contexte personnalisé')
    })

    it('should use default constraints when no context provided', async () => {
      localStorage.setItem('auth_token', 'token')
      mockFetch.mockResolvedValue(makeOkResponse('reformulé'))

      const { result } = renderHook(() => useRewrite())
      await act(async () => {
        await result.current.rewrite('texte')
      })

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.constraints).toContain('Reformule ce texte')
    })

    it('should use token from sessionStorage when not in localStorage', async () => {
      sessionStorage.setItem('auth_token', 'session-token')
      mockFetch.mockResolvedValue(makeOkResponse('reformulé'))

      const { result } = renderHook(() => useRewrite())
      await act(async () => {
        await result.current.rewrite('texte à reformuler')
      })

      const callArgs = mockFetch.mock.calls[0][1]
      expect(callArgs.headers['Authorization']).toBe('Bearer session-token')
    })

    it('should set rewriting=false after successful call', async () => {
      localStorage.setItem('auth_token', 'token')
      mockFetch.mockResolvedValue(makeOkResponse('reformulé'))

      const { result } = renderHook(() => useRewrite())
      await act(async () => {
        await result.current.rewrite('texte')
      })

      expect(result.current.rewriting).toBe(false)
    })

    it('should clear error on successful call', async () => {
      localStorage.setItem('auth_token', 'token')
      mockFetch.mockResolvedValue(makeOkResponse('reformulé'))

      const { result } = renderHook(() => useRewrite())
      await act(async () => {
        await result.current.rewrite('texte')
      })

      expect(result.current.error).toBeNull()
    })
  })

  // ── rewrite — cas limites ─────────────────────────────────────────────────

  describe('rewrite — edge cases', () => {
    it('should return null for empty text', async () => {
      const { result } = renderHook(() => useRewrite())
      let res: any
      await act(async () => {
        res = await result.current.rewrite('')
      })

      expect(res).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should return null for whitespace-only text', async () => {
      const { result } = renderHook(() => useRewrite())
      let res: any
      await act(async () => {
        res = await result.current.rewrite('   ')
      })

      expect(res).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should not include Authorization header when no token available', async () => {
      mockFetch.mockResolvedValue(makeOkResponse('reformulé'))

      const { result } = renderHook(() => useRewrite())
      await act(async () => {
        await result.current.rewrite('texte à reformuler')
      })

      const callArgs = mockFetch.mock.calls[0][1]
      expect(callArgs.headers['Authorization']).toBeUndefined()
    })

    it('should throw error when response rewritten is empty', async () => {
      localStorage.setItem('auth_token', 'token')
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ rewritten: '', model: 'deepseek' }),
      })

      const { result } = renderHook(() => useRewrite())
      let res: any
      await act(async () => {
        res = await result.current.rewrite('texte')
      })

      expect(res).toBeNull()
      expect(result.current.error).toContain('Réponse vide')
    })

    it('should handle missing rewritten field in response', async () => {
      localStorage.setItem('auth_token', 'token')
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ model: 'deepseek' }),
      })

      const { result } = renderHook(() => useRewrite())
      let res: any
      await act(async () => {
        res = await result.current.rewrite('texte')
      })

      expect(res).toBeNull()
      expect(result.current.error).toBeTruthy()
    })
  })

  // ── rewrite — gestion des erreurs ─────────────────────────────────────────

  describe('rewrite — error handling', () => {
    it('should set error and return null when fetch throws', async () => {
      localStorage.setItem('auth_token', 'token')
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useRewrite())
      let res: any
      await act(async () => {
        res = await result.current.rewrite('texte')
      })

      expect(res).toBeNull()
      expect(result.current.error).toBe('Network error')
    })

    it('should set error with server message when API returns error with message', async () => {
      localStorage.setItem('auth_token', 'token')
      mockFetch.mockResolvedValue(makeErrorResponse(500, 'Service indisponible'))

      const { result } = renderHook(() => useRewrite())
      let res: any
      await act(async () => {
        res = await result.current.rewrite('texte')
      })

      expect(res).toBeNull()
      expect(result.current.error).toContain('Service indisponible')
    })

    it('should set error with status code when API returns error without message', async () => {
      localStorage.setItem('auth_token', 'token')
      mockFetch.mockResolvedValue(makeErrorResponse(503))

      const { result } = renderHook(() => useRewrite())
      let res: any
      await act(async () => {
        res = await result.current.rewrite('texte')
      })

      expect(res).toBeNull()
      expect(result.current.error).toContain('503')
    })

    it('should set rewriting=false after error', async () => {
      localStorage.setItem('auth_token', 'token')
      mockFetch.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useRewrite())
      await act(async () => {
        await result.current.rewrite('texte')
      })

      expect(result.current.rewriting).toBe(false)
    })

    it('should use fallback error message when error has no message', async () => {
      localStorage.setItem('auth_token', 'token')
      mockFetch.mockRejectedValue({})

      const { result } = renderHook(() => useRewrite())
      await act(async () => {
        await result.current.rewrite('texte')
      })

      expect(result.current.error).toBe('Service de reformulation indisponible')
    })
  })

  // ── rewriting state ───────────────────────────────────────────────────────

  describe('rewriting state', () => {
    it('should set rewriting=true during the request', async () => {
      localStorage.setItem('auth_token', 'token')
      let resolvePromise: any
      mockFetch.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = () => resolve(makeOkResponse('reformulé'))
        }),
      )

      const { result } = renderHook(() => useRewrite())

      act(() => {
        void result.current.rewrite('texte à reformuler')
      })

      expect(result.current.rewriting).toBe(true)

      await act(async () => {
        resolvePromise()
      })

      expect(result.current.rewriting).toBe(false)
    })
  })
})
