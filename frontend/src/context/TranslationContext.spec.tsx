import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TranslationProvider, useTranslation } from './TranslationContext'

global.fetch = vi.fn()

function TestComponent() {
  const { language, setLanguage, isTranslating, supportedLanguages, t, detectedLang } = useTranslation()
  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <div data-testid="is-translating">{isTranslating ? 'true' : 'false'}</div>
      <div data-testid="supported-count">{supportedLanguages.length}</div>
      <div data-testid="detected-lang">{detectedLang}</div>
      <div data-testid="translated-text">{t('Hello World')}</div>
      <button onClick={() => setLanguage('en')}>Set English</button>
      <button onClick={() => setLanguage('fr')}>Set French</button>
      <button onClick={() => setLanguage('ar')}>Set Arabic</button>
    </div>
  )
}

describe('TranslationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      expect(screen.getByTestId('current-language').textContent).toBe('fr')
    })

    it('should initialize with isTranslating as false', () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      )
      expect(screen.getByTestId('is-translating').textContent).toBe('false')
    })

    it('should have supported languages list', () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      )
      expect(screen.getByTestId('supported-count').textContent).not.toBe('0')
    })

    it('should initialize with detected language as French', () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      )
      expect(screen.getByTestId('detected-lang').textContent).toBe('fr')
    })
  })

  describe('language switching', () => {
    it('should switch to English', async () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      )

      const englishButton = screen.getByText('Set English')
      await userEvent.click(englishButton)

      await waitFor(() => {
        expect(screen.getByTestId('current-language').textContent).toBe('en')
      })
    })

    it('should switch to Arabic', async () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      )

      const arabicButton = screen.getByText('Set Arabic')
      await userEvent.click(arabicButton)

      await waitFor(() => {
        expect(screen.getByTestId('current-language').textContent).toBe('ar')
      })
    })

    it('should switch back to French', async () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      )

      const englishButton = screen.getByText('Set English')
      await userEvent.click(englishButton)

      await waitFor(() => {
        expect(screen.getByTestId('current-language').textContent).toBe('en')
      })

      const frenchButton = screen.getByText('Set French')
      await userEvent.click(frenchButton)

      await waitFor(() => {
        expect(screen.getByTestId('current-language').textContent).toBe('fr')
      })
    })
  })

  describe('supported languages', () => {
    it('should include French in supported languages', () => {
      const TestSupportedLangs = () => {
        const { supportedLanguages } = useTranslation()
        const hasFrench = supportedLanguages.some(lang => lang.code === 'fr')
        return <div data-testid="has-french">{hasFrench ? 'true' : 'false'}</div>
      }

      render(
        <TranslationProvider>
          <TestSupportedLangs />
        </TranslationProvider>,
      )
      expect(screen.getByTestId('has-french').textContent).toBe('true')
    })

    it('should include English in supported languages', () => {
      const TestSupportedLangs = () => {
        const { supportedLanguages } = useTranslation()
        const hasEnglish = supportedLanguages.some(lang => lang.code === 'en')
        return <div data-testid="has-english">{hasEnglish ? 'true' : 'false'}</div>
      }

      render(
        <TranslationProvider>
          <TestSupportedLangs />
        </TranslationProvider>,
      )
      expect(screen.getByTestId('has-english').textContent).toBe('true')
    })

    it('should include Arabic in supported languages', () => {
      const TestSupportedLangs = () => {
        const { supportedLanguages } = useTranslation()
        const hasArabic = supportedLanguages.some(lang => lang.code === 'ar')
        return <div data-testid="has-arabic">{hasArabic ? 'true' : 'false'}</div>
      }

      render(
        <TranslationProvider>
          <TestSupportedLangs />
        </TranslationProvider>,
      )
      expect(screen.getByTestId('has-arabic').textContent).toBe('true')
    })

    it('should have at least 10 supported languages', () => {
      const TestSupportedLangs = () => {
        const { supportedLanguages } = useTranslation()
        return <div data-testid="lang-count">{supportedLanguages.length}</div>
      }

      render(
        <TranslationProvider>
          <TestSupportedLangs />
        </TranslationProvider>,
      )
      const count = parseInt(screen.getByTestId('lang-count').textContent ?? '0', 10)
      expect(count).toBeGreaterThanOrEqual(10)
    })
  })

  describe('translation function', () => {
    it('should return the same text when called with French language', () => {
      render(
        <TranslationProvider>
          <TestComponent />
        </TranslationProvider>,
      )
      expect(screen.getByTestId('translated-text').textContent).toBe('Hello World')
    })

    it('should provide t function that returns text', () => {
      const TestTFunction = () => {
        const { t } = useTranslation()
        const result = t('Test Text')
        return <div data-testid="t-result">{result}</div>
      }

      render(
        <TranslationProvider>
          <TestTFunction />
        </TranslationProvider>,
      )
      expect(screen.getByTestId('t-result').textContent).toBe('Test Text')
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

  describe('translatePage function', () => {
    it('should have translatePage function available', () => {
      const TestTranslatePage = () => {
        const { translatePage } = useTranslation()
        return <div data-testid="has-translate-page">{typeof translatePage === 'function' ? 'true' : 'false'}</div>
      }

      render(
        <TranslationProvider>
          <TestTranslatePage />
        </TranslationProvider>,
      )
      expect(screen.getByTestId('has-translate-page').textContent).toBe('true')
    })

    it('should not be translating initially', () => {
      const TestTranslatePage = () => {
        const { isTranslating } = useTranslation()
        return <div data-testid="initial-translating">{isTranslating ? 'true' : 'false'}</div>
      }

      render(
        <TranslationProvider>
          <TestTranslatePage />
        </TranslationProvider>,
      )
      expect(screen.getByTestId('initial-translating').textContent).toBe('false')
    })
  })
})
