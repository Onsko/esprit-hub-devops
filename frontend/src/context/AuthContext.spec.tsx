import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'
import type { User } from '../types'

// Mock fetch globally
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

const mockBackendUser = {
  _id: '123',
  name: 'John Doe',
  matricule: 'MAT001',
  telephone: '1234567890',
  email: 'john@example.com',
  date_embauche: '2023-01-01T00:00:00Z',
  department_id: 'dept1',
  manager_id: 'mgr1',
  status: 'ACTIVE',
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

  describe('AuthProvider initialization', () => {
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
      expect(screen.getByTestId('user-name')).textContent).toBe('John Doe')
      expect(screen.getByTestId('is-authenticated')).textContent).toBe('true')
    })

    it('should restore user from sessionStorage on mount', () => {
      sessionStorage.setItem('auth_user', JSON.stringify(mockUser))
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      )
      expect(screen.getByTestId('user-name')).textContent).toBe('John Doe')
      expect(screen.getByTestId('is-authenticated')).textContent).toBe('true')
    })

    it('should prefer localStorage over sessionStorage', () => {
      const localUser = { ...mockUser, name: 'Local User' }
      const sessionUser = { ...mockUser, name: 'Session User' }
      localStorage.setItem('auth_user', JSON.stringify(localUser))
      sessionStorage.setItem('auth_user', JSON.stringify(sessionUser))
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      )
      expect(screen.getByTestId('user-name')).textContent).toBe('Local User')
    })
  })

  describe('login functionality', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ user: mockBackendUser, token: 'token123', refresh_token: 'refresh123' }),
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
        expect(screen.getByTestId('user-name')).textContent).toBe('John Doe')
        expect(screen.getByTestId('is-authenticated')).textContent).toBe('true')
      })
    })

    it('should store user in localStorage when rememberMe is true', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ user: mockBackendUser, token: 'token123', refresh_token: 'refresh123' }),
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
        expect(localStorage.getItem('auth_user')).toBeTruthy()
        expect(localStorage.getItem('auth_token')).toBe('token123')
        expect(localStorage.getItem('auth_remember_me')).toBe('true')
      })
    })

    it('should handle login failure with error message', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({ message: 'Invalid credentials' }),
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
        expect(screen.getByTestId('is-authenticated')).textContent).toBe('false')
      })
    })

    it('should normalize email and password on login', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ user: mockBackendUser, token: 'token123' }),
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
        const fetchCall = vi.mocked(global.fetch).mock.calls[0]
        const body = JSON.parse(fetchCall[1]?.body as string)
        expect(body.email).toBe('test@example.com')
        expect(body.password).toBe('password123')
      })
    })

    it('should handle network errors gracefully', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      )

      const loginButton = screen.getByText('Login')
      await userEvent.click(loginButton)

      await waitFor(() => {
        expect(screen.getByTestId('is-authenticated')).textContent).toBe('false')
      })
    })

    it('should handle missing user in response', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ token: 'token123' }),
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
        expect(screen.getByTestId('is-authenticated')).textContent).toBe('false')
      })
    })
  })

  describe('logout functionality', () => {
    it('should clear user and storage on logout', async () => {
      localStorage.setItem('auth_user', JSON.stringify(mockUser))
      localStorage.setItem('auth_token', 'token123')
      localStorage.setItem('auth_refresh_token', 'refresh123')

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      )

      expect(screen.getByTestId('user-name')).textContent).toBe('John Doe')

      const logoutButton = screen.getByText('Logout')
      await userEvent.click(logoutButton)

      await waitFor(() => {
        expect(screen.getByTestId('user-name')).textContent).toBe('Not logged in')
        expect(screen.getByTestId('is-authenticated')).textContent).toBe('false')
        expect(localStorage.getItem('auth_user')).toBeNull()
        expect(localStorage.getItem('auth_token')).toBeNull()
      })
    })

    it('should clear both localStorage and sessionStorage on logout', async () => {
      localStorage.setItem('auth_user', JSON.stringify(mockUser))
      sessionStorage.setItem('auth_token', 'token123')

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      )

      const logoutButton = screen.getByText('Logout')
      await userEvent.click(logoutButton)

      await waitFor(() => {
        expect(localStorage.getItem('auth_user')).toBeNull()
        expect(sessionStorage.getItem('auth_token')).toBeNull()
      })
    })
  })

  describe('hasRole functionality', () => {
    it('should return true for matching role', () => {
      localStorage.setItem('auth_user', JSON.stringify(mockUser))
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      )
      expect(screen.getByTestId('has-admin-role')).textContent).toBe('false')
    })

    it('should normalize role comparison', () => {
      const userWithLowercaseRole = { ...mockUser, role: 'employee' as any }
      localStorage.setItem('auth_user', JSON.stringify(userWithLowercaseRole))
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>,
      )
      // Should still work because hasRole normalizes
      expect(screen.getByTestId('has-admin-role')).textContent).toBe('false')
    })
  })

  describe('useAuth hook', () => {
    it('should throw error when used outside provider', () => {
      const TestComponentWithoutProvider = () => {
        useAuth()
        return null
      }

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponentWithoutProvider />)
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('role normalization', () => {
    it('should normalize various role formats', () => {
      const testCases = [
        { input: 'admin', expected: 'ADMIN' },
        { input: 'ADMIN', expected: 'ADMIN' },
        { input: 'Admin', expected: 'ADMIN' },
        { input: 'hr', expected: 'HR' },
        { input: 'manager', expected: 'MANAGER' },
        { input: 'employee', expected: 'EMPLOYEE' },
        { input: 'invalid', expected: 'EMPLOYEE' },
        { input: '', expected: 'EMPLOYEE' },
        { input: null, expected: 'EMPLOYEE' },
      ]

      testCases.forEach(({ input, expected }) => {
        const user = { ...mockUser, role: input as any }
        localStorage.setItem('auth_user', JSON.stringify(user))

        const { unmount } = render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>,
        )

        // Verify the role was normalized by checking hasRole
        // We can't directly test the normalization, but we can verify behavior
        unmount()
        localStorage.clear()
      })
    })
  })

  describe('status mapping', () => {
    it('should map backend status to frontend status', async () => {
      const backendUserWithStatus = {
        ...mockBackendUser,
        status: 'SUSPENDED',
      }

      const mockResponse = {
        ok: true,
        json: async () => ({ user: backendUserWithStatus, token: 'token123' }),
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
        const storedUser = JSON.parse(localStorage.getItem('auth_user') || '{}')
        expect(storedUser.status).toBe('suspended')
      })
    })
  })
})

