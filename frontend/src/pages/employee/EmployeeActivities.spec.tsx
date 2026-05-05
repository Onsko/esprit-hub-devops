import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import EmployeeActivities from './EmployeeActivities'
import { useData } from '../../context/DataContext'
import { useToast } from '../../../hooks/use-toast'
import { useRewrite } from '../../hooks/useRewrite'

// Mock des hooks
vi.mock('../../context/DataContext')
vi.mock('../../../hooks/use-toast')
vi.mock('../../hooks/useRewrite')
vi.mock('../../services/googleCalendarService', () => ({
  addActivityToCalendar: vi.fn().mockResolvedValue(true),
  isGoogleConnected: vi.fn().mockReturnValue(false),
}))

// Mock des composants
vi.mock('../../components/shared/StatusBadge', () => ({
  default: ({ status }: { status: string }) => <span data-testid="status-badge">{status}</span>
}))
vi.mock('../../components/MiniHandGestureControl', () => ({
  MiniHandGestureControl: ({ onAccept, onReject, isActive, onToggle }: any) => (
    <div data-testid="gesture-control">
      <button onClick={onAccept} data-testid="gesture-accept">Accept</button>
      <button onClick={onReject} data-testid="gesture-reject">Reject</button>
      <button onClick={onToggle} data-testid="gesture-toggle">
        {isActive ? 'Désactiver' : 'Activer'} gestes
      </button>
    </div>
  )
}))
vi.mock('../../components/GoogleCalendarConnect', () => ({
  GoogleCalendarConnect: () => <div data-testid="google-calendar">Google Calendar</div>
}))
vi.mock('../../components/Chatbot', () => ({
  Chatbot: ({ activityId, onClose }: any) => (
    <div data-testid="chatbot">
      <span>Chatbot for {activityId}</span>
      <button onClick={onClose} data-testid="close-chatbot">Close</button>
    </div>
  )
}))

const mockFetchWithAuth = vi.fn()
const mockToast = vi.fn()
const mockRewrite = vi.fn()

const mockEmployeeRecommendations = [
  {
    _id: 'rec1',
    activityId: {
      _id: 'act1',
      title: 'Formation TypeScript',
      description: 'Apprendre TypeScript avancé',
      location: 'Salle A',
      date: '2024-03-15T09:00:00Z',
      completed: false
    },
    score_total: 0.85,
    rank: 1,
    status: 'NOTIFIED',
    parsed_activity: {
      required_skills: [
        { intitule: 'JavaScript' },
        { intitule: 'TypeScript' }
      ]
    }
  },
  {
    _id: 'rec2',
    activityId: {
      _id: 'act2',
      title: 'Workshop React',
      description: 'Développement React moderne',
      location: 'Salle B',
      date: '2024-03-20T14:00:00Z',
      completed: true
    },
    score_total: 0.92,
    rank: 2,
    status: 'EMPLOYEE_CONFIRMED',
    parsed_activity: {
      required_skills: [
        { intitule: 'React' },
        { intitule: 'JavaScript' }
      ]
    }
  }
]

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <EmployeeActivities />
    </BrowserRouter>
  )
}

describe('EmployeeActivities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue('mock-token'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    })

    // Mock useData
    vi.mocked(useData).mockReturnValue({
      fetchWithAuth: mockFetchWithAuth,
    } as any)

    // Mock useToast
    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
    })

    // Mock useRewrite
    vi.mocked(useRewrite).mockReturnValue({
      rewrite: mockRewrite,
      rewriting: false,
    })

    // Mock successful API response
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockEmployeeRecommendations),
    })
  })

  it('should render page title and load recommendations', async () => {
    renderComponent()

    expect(screen.getByText('Mes activités')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/api/recommendations/my')
      )
    })
  })

  it('should display pending recommendations correctly', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Formation TypeScript')).toBeInTheDocument()
      expect(screen.getByText('Apprendre TypeScript avancé')).toBeInTheDocument()
      expect(screen.getByText('Rang #1')).toBeInTheDocument()
      expect(screen.getByText('85.0%')).toBeInTheDocument()
    })
  })

  it('should accept activity successfully', async () => {
    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmployeeRecommendations),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Formation TypeScript')).toBeInTheDocument()
    })

    const acceptButton = screen.getByTitle('Accepter')
    fireEvent.click(acceptButton)

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/api/recommendations/respond'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            recommendationId: 'rec1',
            response: 'ACCEPTED'
          })
        })
      )
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Présence confirmée',
        description: 'Votre confirmation a été envoyée.'
      })
    })
  })

  it('should open decline modal and handle decline with reason', async () => {
    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmployeeRecommendations),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Formation TypeScript')).toBeInTheDocument()
    })

    // Ouvrir la modale de refus
    const declineButton = screen.getByTitle('Refuser')
    fireEvent.click(declineButton)

    expect(screen.getByText('Justification du refus')).toBeInTheDocument()

    // Saisir une raison
    const textarea = screen.getByPlaceholderText('Veuillez indiquer la raison du refus...')
    fireEvent.change(textarea, { target: { value: 'Conflit d\'horaire' } })

    // Confirmer le refus
    const confirmButton = screen.getByText('Confirmer le refus')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/api/recommendations/respond'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            recommendationId: 'rec1',
            response: 'DECLINED',
            justification: 'Conflit d\'horaire'
          })
        })
      )
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Refus envoyé',
          variant: 'destructive'
        })
      )
    })
  })

  it('should require decline reason before submitting', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Formation TypeScript')).toBeInTheDocument()
    })

    // Ouvrir la modale de refus
    const declineButton = screen.getByTitle('Refuser')
    fireEvent.click(declineButton)

    // Essayer de confirmer sans raison
    const confirmButton = screen.getByText('Confirmer le refus')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Motif requis',
          variant: 'destructive'
        })
      )
    })
  })

  it('should handle AI rewrite functionality', async () => {
    mockRewrite.mockResolvedValue({
      rewritten: 'Message professionnel reformulé'
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Formation TypeScript')).toBeInTheDocument()
    })

    // Ouvrir la modale de refus
    const declineButton = screen.getByTitle('Refuser')
    fireEvent.click(declineButton)

    // Saisir du texte
    const textarea = screen.getByPlaceholderText('Veuillez indiquer la raison du refus...')
    fireEvent.change(textarea, { target: { value: 'pas dispo' } })

    // Cliquer sur reformuler - utiliser un sélecteur plus flexible
    const rewriteButton = screen.getByRole('button', { name: /reformuler/i })
    fireEvent.click(rewriteButton)

    await waitFor(() => {
      expect(mockRewrite).toHaveBeenCalledWith('pas dispo')
      expect(textarea).toHaveValue('Message professionnel reformulé')
    })
  })

  it('should toggle chatbot for activities', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Formation TypeScript')).toBeInTheDocument()
    })

    // Ouvrir le chatbot
    const chatbotButton = screen.getByText('Chatbot')
    fireEvent.click(chatbotButton)

    expect(screen.getByTestId('chatbot')).toBeInTheDocument()
    expect(screen.getByText('Chatbot for act1')).toBeInTheDocument()

    // Fermer le chatbot
    const closeButton = screen.getByTestId('close-chatbot')
    fireEvent.click(closeButton)

    expect(screen.queryByTestId('chatbot')).not.toBeInTheDocument()
  })

  it('should handle gesture control toggle', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Formation TypeScript')).toBeInTheDocument()
    })

    const gestureToggle = screen.getByTestId('gesture-toggle')
    expect(gestureToggle).toHaveTextContent('Activer gestes')

    fireEvent.click(gestureToggle)
    expect(gestureToggle).toHaveTextContent('Désactiver gestes')
  })

  it('should handle transport estimation', async () => {
    // Mock geolocation
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success) => {
        success({
          coords: {
            latitude: 48.8566,
            longitude: 2.3522
          }
        })
      })
    }
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true
    })

    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmployeeRecommendations),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          options: [
            {
              product_name: 'UberX',
              estimate_text: '15-20€',
              eta_seconds: 300,
              distance_km: 5.2
            }
          ],
          provider: 'uber'
        }),
      })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Formation TypeScript')).toBeInTheDocument()
    })

    // Ouvrir l'estimation transport
    const transportButton = screen.getByText('Estimer prix taxi')
    fireEvent.click(transportButton)

    // Cliquer sur voir taxis
    const estimateButton = screen.getByText('Voir taxis disponibles')
    fireEvent.click(estimateButton)

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/api/recommendations/transport/estimate'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            recommendationId: 'rec1',
            pickupLat: 48.8566,
            pickupLng: 2.3522,
            locale: 'fr-FR'
          })
        })
      )
    })
  })

  it('should display post-activity self-evaluation section', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Post-activité: votre auto-évaluation')).toBeInTheDocument()
      expect(screen.getByText('Workshop React')).toBeInTheDocument()
    })

    // Vérifier les compétences à évaluer
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('JavaScript')).toBeInTheDocument()
  })

  it('should submit self-evaluation successfully', async () => {
    mockFetchWithAuth
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEmployeeRecommendations),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Workshop React')).toBeInTheDocument()
    })

    // Remplir les notes d'auto-évaluation
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '8' } })
    fireEvent.change(inputs[1], { target: { value: '7' } })

    // Soumettre l'évaluation
    const submitButton = screen.getByText('Envoyer auto-évaluation')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/api/recommendations/post-activity/self-eval'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            recommendationId: 'rec2',
            skills: [
              { intitule: 'React', auto_eval: 8 },
              { intitule: 'JavaScript', auto_eval: 7 }
            ]
          })
        })
      )
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Auto-évaluation enregistrée',
        description: 'Merci, vos notes ont bien été envoyées.',
        variant: 'success'
      })
    })
  })

  it('should handle API errors gracefully', async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Erreur serveur' }),
    })

    renderComponent()

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Erreur',
        description: 'Impossible de charger vos validations.',
        variant: 'destructive'
      })
    })
  })

  it('should display empty state when no activities', async () => {
    mockFetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Aucune activité proposée pour le moment')).toBeInTheDocument()
      expect(screen.getByText('0 activité(s) proposée(s)')).toBeInTheDocument()
    })
  })
})