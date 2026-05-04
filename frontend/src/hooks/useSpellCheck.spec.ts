/**
 * Tests unitaires pour useSpellCheck
 * Hook de correction orthographique via l'API LanguageTool
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSpellCheck } from './useSpellCheck'

// ── Mock global fetch ─────────────────────────────────────────────────────────

const mockFetch = vi.fn()
global.fetch = mockFetch

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeLTResponse = (matches: any[] = [], langCode = 'fr') => ({
  ok: true,
  json: async () => ({
    matches,
    language: { detectedLanguage: { code: langCode } },
  }),
})

const makeLTMatch = (offset: number, length: number, replacement: string, message = 'Erreur') => ({
  message,
  offset,
  length,
  replacements: [{ value: replacement }],
  rule: { id: 'RULE_1', description: 'Test rule' },
  context: { text: 'context', offset: 0, length: 5 },
})

// Helper : déclenche scheduleAnalysis + attend la fin de l'analyse
const triggerAnalysis = async (
  scheduleAnalysis: (t: string) => void,
  text: string,
) => {
  await act(async () => {
    scheduleAnalysis(text)
    // Avancer le debounce de 1100ms
    await new Promise((r) => setTimeout(r, 1100))
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useSpellCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── État initial ──────────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useSpellCheck())
      expect(result.current.checking).toBe(false)
      expect(result.current.analyzing).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.suggestions).toEqual([])
    })

    it('should expose all expected functions', () => {
      const { result } = renderHook(() => useSpellCheck())
      expect(typeof result.current.correctText).toBe('function')
      expect(typeof result.current.scheduleAnalysis).toBe('function')
      expect(typeof result.current.applySuggestion).toBe('function')
      expect(typeof result.current.dismissSuggestion).toBe('function')
      expect(typeof result.current.applyAllSuggestions).toBe('function')
    })
  })

  // ── scheduleAnalysis ──────────────────────────────────────────────────────

  describe('scheduleAnalysis', () => {
    it('should set analyzing=true immediately when text is long enough', () => {
      const { result } = renderHook(() => useSpellCheck())
      act(() => {
        result.current.scheduleAnalysis('Texte suffisamment long pour analyse')
      })
      expect(result.current.analyzing).toBe(true)
    })

    it('should clear suggestions and not analyze for short text (<10 chars)', () => {
      const { result } = renderHook(() => useSpellCheck())
      act(() => {
        result.current.scheduleAnalysis('court')
      })
      expect(result.current.analyzing).toBe(false)
      expect(result.current.suggestions).toEqual([])
    })

    it('should clear suggestions for empty text', () => {
      const { result } = renderHook(() => useSpellCheck())
      act(() => {
        result.current.scheduleAnalysis('')
      })
      expect(result.current.suggestions).toEqual([])
      expect(result.current.analyzing).toBe(false)
    })

    it('should call fetch after debounce delay and populate suggestions', async () => {
      const match = makeLTMatch(0, 5, 'Bonjour', 'Faute détectée')
      mockFetch.mockResolvedValue(makeLTResponse([match]))
      const { result } = renderHook(() => useSpellCheck())

      await triggerAnalysis(result.current.scheduleAnalysis, 'Bnjou tout le monde ici')

      expect(mockFetch).toHaveBeenCalled()
      expect(result.current.suggestions.length).toBeGreaterThan(0)
      expect(result.current.suggestions[0].suggestion).toBe('Bonjour')
      expect(result.current.suggestions[0].original).toBe('Bnjou')
    })

    it('should debounce multiple rapid calls — only last one fires', async () => {
      mockFetch.mockResolvedValue(makeLTResponse([]))
      const { result } = renderHook(() => useSpellCheck())

      await act(async () => {
        result.current.scheduleAnalysis('Premier texte long')
        result.current.scheduleAnalysis('Deuxième texte long')
        result.current.scheduleAnalysis('Troisième texte long')
        await new Promise((r) => setTimeout(r, 1100))
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should set analyzing=false after analysis completes', async () => {
      mockFetch.mockResolvedValue(makeLTResponse([]))
      const { result } = renderHook(() => useSpellCheck())

      await triggerAnalysis(result.current.scheduleAnalysis, 'Texte suffisamment long pour analyse')

      expect(result.current.analyzing).toBe(false)
    })

    it('should set error and clear suggestions when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))
      const { result } = renderHook(() => useSpellCheck())

      await triggerAnalysis(result.current.scheduleAnalysis, 'Texte suffisamment long pour analyse')

      expect(result.current.error).toBe('Network error')
      expect(result.current.suggestions).toEqual([])
    })

    it('should set error when API returns non-ok response', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
      const { result } = renderHook(() => useSpellCheck())

      await triggerAnalysis(result.current.scheduleAnalysis, 'Texte suffisamment long pour analyse')

      expect(result.current.error).toContain('LanguageTool API error: 500')
    })

    it('should filter out matches with no replacements', async () => {
      const matchNoReplacement = {
        message: 'Style',
        offset: 0,
        length: 3,
        replacements: [],
        rule: { id: 'STYLE', description: 'Style' },
        context: { text: 'ctx', offset: 0, length: 3 },
      }
      mockFetch.mockResolvedValue(makeLTResponse([matchNoReplacement]))
      const { result } = renderHook(() => useSpellCheck())

      await triggerAnalysis(result.current.scheduleAnalysis, 'Texte suffisamment long pour analyse')

      expect(result.current.suggestions).toEqual([])
    })
  })

  // ── correctText ───────────────────────────────────────────────────────────

  describe('correctText', () => {
    it('should return null for empty text', async () => {
      const { result } = renderHook(() => useSpellCheck())
      let res: any
      await act(async () => {
        res = await result.current.correctText('')
      })
      expect(res).toBeNull()
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should return null for whitespace-only text', async () => {
      const { result } = renderHook(() => useSpellCheck())
      let res: any
      await act(async () => {
        res = await result.current.correctText('   ')
      })
      expect(res).toBeNull()
    })

    it('should return corrected text with corrections count', async () => {
      const match = makeLTMatch(0, 5, 'Bonjour')
      mockFetch.mockResolvedValue(makeLTResponse([match], 'fr'))
      const { result } = renderHook(() => useSpellCheck())

      let res: any
      await act(async () => {
        res = await result.current.correctText('Bnjou tout le monde')
      })

      expect(res).not.toBeNull()
      expect(res.corrections).toBe(1)
      expect(res.correctedText).toBe('Bonjour tout le monde')
      expect(res.detectedLanguage).toBe('fr')
    })

    it('should apply corrections from right to left to preserve offsets', async () => {
      const matches = [
        makeLTMatch(0, 3, 'Bon'),
        makeLTMatch(10, 4, 'test'),
      ]
      mockFetch.mockResolvedValue(makeLTResponse(matches))
      const { result } = renderHook(() => useSpellCheck())

      let res: any
      await act(async () => {
        res = await result.current.correctText('Bnj xxxxxx tset yyyy')
      })

      expect(res).not.toBeNull()
      expect(res.corrections).toBe(2)
    })

    it('should return null and set error when fetch fails', async () => {
      mockFetch.mockRejectedValue(new Error('API down'))
      const { result } = renderHook(() => useSpellCheck())

      let res: any
      await act(async () => {
        res = await result.current.correctText('Texte à corriger maintenant')
      })

      expect(res).toBeNull()
      expect(result.current.error).toBe('API down')
    })

    it('should use "auto" as detectedLanguage fallback when not in response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ matches: [] }),
      })
      const { result } = renderHook(() => useSpellCheck())

      let res: any
      await act(async () => {
        res = await result.current.correctText('Texte à corriger maintenant')
      })

      expect(res?.detectedLanguage).toBe('auto')
    })

    it('should clear suggestions after correctText', async () => {
      mockFetch.mockResolvedValue(makeLTResponse([]))
      const { result } = renderHook(() => useSpellCheck())

      await act(async () => {
        await result.current.correctText('Texte à corriger maintenant')
      })

      expect(result.current.suggestions).toEqual([])
    })

    it('should set error when API returns non-ok status', async () => {
      mockFetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) })
      const { result } = renderHook(() => useSpellCheck())

      let res: any
      await act(async () => {
        res = await result.current.correctText('Texte à corriger maintenant')
      })

      expect(res).toBeNull()
      expect(result.current.error).toContain('429')
    })
  })

  // ── applySuggestion ───────────────────────────────────────────────────────

  describe('applySuggestion', () => {
    it('should replace the word at the correct offset', async () => {
      const match = makeLTMatch(8, 5, 'monde')
      mockFetch.mockResolvedValue(makeLTResponse([match]))
      const { result } = renderHook(() => useSpellCheck())

      await triggerAnalysis(result.current.scheduleAnalysis, 'Bonjour mndoe tout le monde')

      let corrected: string = ''
      act(() => {
        corrected = result.current.applySuggestion(
          'Bonjour mndoe tout le monde',
          result.current.suggestions[0],
        )
      })

      expect(corrected).toBe('Bonjour monde tout le monde')
    })

    it('should remove the applied suggestion from the list', async () => {
      const match = makeLTMatch(0, 5, 'Bonjour')
      mockFetch.mockResolvedValue(makeLTResponse([match]))
      const { result } = renderHook(() => useSpellCheck())

      await triggerAnalysis(result.current.scheduleAnalysis, 'Bnjou tout le monde ici')

      act(() => {
        result.current.applySuggestion('Bnjou tout le monde ici', result.current.suggestions[0])
      })

      expect(result.current.suggestions).toEqual([])
    })
  })

  // ── dismissSuggestion ─────────────────────────────────────────────────────

  describe('dismissSuggestion', () => {
    it('should remove suggestion by id', async () => {
      const match = makeLTMatch(0, 5, 'Bonjour')
      mockFetch.mockResolvedValue(makeLTResponse([match]))
      const { result } = renderHook(() => useSpellCheck())

      await triggerAnalysis(result.current.scheduleAnalysis, 'Bnjou tout le monde ici')

      const id = result.current.suggestions[0].id
      act(() => {
        result.current.dismissSuggestion(id)
      })

      expect(result.current.suggestions).toEqual([])
    })

    it('should only remove the targeted suggestion when multiple exist', async () => {
      const matches = [
        makeLTMatch(0, 3, 'Bon'),
        makeLTMatch(10, 4, 'test'),
      ]
      mockFetch.mockResolvedValue(makeLTResponse(matches))
      const { result } = renderHook(() => useSpellCheck())

      await triggerAnalysis(result.current.scheduleAnalysis, 'Bnj xxxxxx tset yyyy zzzz')

      const firstId = result.current.suggestions[0].id
      act(() => {
        result.current.dismissSuggestion(firstId)
      })

      expect(result.current.suggestions.length).toBe(1)
      expect(result.current.suggestions[0].id).not.toBe(firstId)
    })
  })

  // ── applyAllSuggestions ───────────────────────────────────────────────────

  describe('applyAllSuggestions', () => {
    it('should apply all suggestions and clear the list', async () => {
      const matches = [
        makeLTMatch(0, 3, 'Bon'),
        makeLTMatch(10, 4, 'test'),
      ]
      mockFetch.mockResolvedValue(makeLTResponse(matches))
      const { result } = renderHook(() => useSpellCheck())

      await triggerAnalysis(result.current.scheduleAnalysis, 'Bnj xxxxxx tset yyyy zzzz')

      let corrected: string = ''
      act(() => {
        corrected = result.current.applyAllSuggestions('Bnj xxxxxx tset yyyy zzzz')
      })

      expect(corrected).toBeDefined()
      expect(result.current.suggestions).toEqual([])
    })

    it('should apply corrections from right to left to preserve offsets', async () => {
      const matches = [
        makeLTMatch(0, 3, 'AAA'),
        makeLTMatch(8, 3, 'BBB'),
      ]
      mockFetch.mockResolvedValue(makeLTResponse(matches))
      const { result } = renderHook(() => useSpellCheck())

      await triggerAnalysis(result.current.scheduleAnalysis, 'xxx yyyy yyy zzzz aaaa')

      let corrected: string = ''
      act(() => {
        corrected = result.current.applyAllSuggestions('xxx yyyy yyy zzzz aaaa')
      })

      expect(corrected.startsWith('AAA')).toBe(true)
      expect(corrected).toContain('BBB')
    })

    it('should return original text unchanged when no suggestions', () => {
      const { result } = renderHook(() => useSpellCheck())
      let corrected: string = ''
      act(() => {
        corrected = result.current.applyAllSuggestions('Texte sans suggestions')
      })
      expect(corrected).toBe('Texte sans suggestions')
    })

    it('should clear all suggestions after applying', async () => {
      const match = makeLTMatch(0, 5, 'Bonjour')
      mockFetch.mockResolvedValue(makeLTResponse([match]))
      const { result } = renderHook(() => useSpellCheck())

      await triggerAnalysis(result.current.scheduleAnalysis, 'Bnjou tout le monde ici')

      act(() => {
        result.current.applyAllSuggestions('Bnjou tout le monde ici')
      })

      expect(result.current.suggestions).toEqual([])
    })
  })

  // ── Suggestion structure ──────────────────────────────────────────────────

  describe('suggestion structure', () => {
    it('should build suggestion with correct fields', async () => {
      // "Bonjour " = 8 chars, offset 8 → "mnde" (4 chars)
      const match = makeLTMatch(8, 4, 'monde', 'Mot mal orthographié')
      mockFetch.mockResolvedValue(makeLTResponse([match]))
      const { result } = renderHook(() => useSpellCheck())

      await triggerAnalysis(result.current.scheduleAnalysis, 'Bonjour mnde tout le monde')

      const s = result.current.suggestions[0]
      expect(s.id).toBe('0-8')
      expect(s.original).toBe('mnde')
      expect(s.suggestion).toBe('monde')
      expect(s.message).toBe('Mot mal orthographié')
      expect(s.offset).toBe(8)
      expect(s.length).toBe(4)
    })
  })
})
