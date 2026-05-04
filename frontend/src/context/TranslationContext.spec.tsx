import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TranslationProvider, useTranslation } from './TranslationContext'

// Mock fetch globally
global.fetch = vi.fn()

function TestComponent() {
  const { language, setLanguage, supportedLanguages, t, detectedLang } = useTranslation()

  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <div data-testid="detected-lang">{detectedLang}</div>
      <div data-testid="supported-count">{supportedLanguages.length}</div>
      <div data-testid="translated-text">{t('Hello World')}</div>
      <button onClick={() => setLanguage('en')}>Set English</button>
      <button onClick={() => setLanguage('fr')}>Set French</button>
    </div>
  )
}

describe('TranslationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with French as default language', () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      )
      expect(screen.getByTestId('current-language')).textContent).toBe('fr')
    })

    it('should have supported languages list', () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      )
      expect(screen.getByTestId('supported-count')).textContent).toBe('14')
    })

    it('should have detected language as French', () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      )
      expect(screen.getByTestId('detected-lang')).textContent).toBe('fr')
    })
  })

  describe('language switching', () => {
    it('should change language when setLanguage is called', async () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      )

      expect(screen.getByTestId('current-language')).textContent).toBe('fr')

      const setEnglishButton = screen.getByText('Set English')
      await userEvent.click(setEnglishButton)

      expect(screen.getByTestId('current-language')).textContent).toBe('en')
    })

    it('should support switching between multiple languages', async () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      )

      const setEnglishButton = screen.getByText('Set English')
      const setFrenchButton = screen.getByText('Set French')

      await userEvent.click(setEnglishButton)
      expect(screen.getByTestId('current-language')).textContent).toBe('en')

      await userEvent.click(setFrenchButton)
      expect(screen.getByTestId('current-language')).textContent).toBe('fr')

      await userEvent.click(setEnglishButton)
      expect(screen.getByTestId('current-language')).textContent).toBe('en')
    })
  })

  describe('translation functionality', () => {
    it('should return original text when language is French', () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      )
      expect(screen.getByTestId('translated-text')).textContent).toBe('Hello World')
    })
  })

  describe('supported languages', () => {
    it('should include all expected languages', () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      )

      expect(screen.getByTestId('supported-count')).textContent).toBe('14')
    })
  })

  describe('t function', () => {
    it('should return the same text passed to it', () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      )

      expect(screen.getByTestId('translated-text')).textContent).toBe('Hello World')
    })

    it('should work with empty strings', () => {
      function TestComponentWithEmpty() {
        const { t } = useTranslation()
        return <div data-testid="empty-text">{t('')}</div>
      }

      render(
        <TranslationProvider>
          <TestComponentWithEmpty />
        </TranslationProvider>,
      )

      expect(screen.getByTestId('empty-text')).textContent).toBe('')
    })

    it('should work with special characters', () => {
      function TestComponentWithSpecial() {
        const { t } = useTranslation()
        return <div data-testid="special-text">{t('Hello @#$% World!')}</div>
      }

      render(
        <TranslationProvider>
          <TestComponentWithSpecial />
        </TranslationProvider>,
      )

      expect(screen.getByTestId('special-text')).textContent).toBe('Hello @#$% World!')
    })
  })

  describe('useTranslation hook', () => {
    it('should throw error when used outside provider', () => {
      const TestComponentWithoutProvider = () => {
        useTranslation()
        return null
      }

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponentWithoutProvider />)
      }).toThrow('useTranslation must be used within TranslationProvider')

      consoleSpy.mockRestore()
    })
  })
})

