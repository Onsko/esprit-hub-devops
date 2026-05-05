import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'
import type { User } from '../types'

global.fetch = vi.fn()

const mockUser: User = {
  id: '123',
  name: 'John Doe',
  matricule: 'MAT001',
  telephone: '1234567890',
  email: 'john@example.com',
  password: '',
  date_embauche: '2023-01-01T00:00:00Z',
  departement_id: 'dept1',
  manager_id: 'mgr1',
  status: 'active',
  en_ligne: true,
  role: 'EMPLOYEE',
}

function TestComponent() {
  const { user, isAuthenticated, login, logout, hasRole } = useAuth()
  return (
    <div>
      <div data-testid="user-name">{user?.name ?? 'Not logged in'}</div>
      <div data-testid="is-authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <button onClick={() => login('test@example.com', 'password123')}>Login</button>
      <button onClick={logout}>Logout</button>
      <div data-testid="has-admin-role">{hasRole('ADMIN') ? 'true' : 'false'}</div>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with no user when storage is empty', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      )
      expect(screen.getByTestId('user-name').textContent).toBe('Not logged in')
      expect(screen.getByTestId('is-authenticated').textContent).toBe('false')
    })

    it('should restore user from localStorage on mount', () => {
      localStorage.setItem('auth_user', JSON.stringify(mockUser))
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      )
      expect(screen.getByTestId('user-name').textContent).toBe('John Doe')
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true')
    })

    it('should restore user from sessionStorage on mount', () => {
      sessionStorage.setItem('auth_user', JSON.stringify(mockUser))
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      )
      expect(screen.getByTestId('user-name').textContent).toBe('John Doe')
      expect(screen.getByTestId('is-authenticated').textContent).toBe('true')
    })
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ user: mockUser, token: 'token123', refresh_token: 'refresh123' }),
      }
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      )

      const loginButton = screen.getByText('Login')
      await userEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByTestId('user-name').textContent).toBe('John Doe')
      })
    })

    it('should store tokens in localStorage when login succeeds', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ user: mockUser, token: 'token123', refresh_token: 'refresh123' }),
      }
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any)

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      )

      const loginButton = screen.getByText('Login')
      await userEvent.click(loginButton)

      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBe('token123')
      })
    })
  })

  describe('logout', () => {
    it('should clear user and storage on logout', async () => {
      localStorage.setItem('auth_user', JSON.stringify(mockUser))
      localStorage.setItem('auth_token', 'token123')

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      )

      expect(screen.getByTestId('user-name').textContent).toBe('John Doe')

      const logoutButton = screen.getByText('Logout')
      await userEvent.click(logoutButton)

      await waitFor(() => {
        expect(screen.getByTestId('user-name').textContent).toBe('Not logged in')
        expect(localStorage.getItem('auth_user')).toBeNull()
      })
    })
  })

  describe('hasRole', () => {
    it('should return false for non-matching role', () => {
      localStorage.setItem('auth_user', JSON.stringify(mockUser))
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      )
      expect(screen.getByTestId('has-admin-role').textContent).toBe('false')
    })
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      const TestComponentWithoutProvider = () => {
        useAuth()
        return null
      }

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponentWithoutProvider />)
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })
  })
})
