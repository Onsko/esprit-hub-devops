import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DataProvider, useData } from './DataContext'
import { AuthProvider } from './AuthContext'

// Mock fetch globally
global.fetch = vi.fn()

function TestComponent() {
  const { users, departments, activities, notifications } = useData()
  return (
    <div>
      <div data-testid="users-count">{users.length}</div>
      <div data-testid="departments-count">{departments.length}</div>
      <div data-testid="activities-count">{activities.length}</div>
      <div data-testid="notifications-count">{notifications.length}</div>
    </div>
  )
}

describe('DataContext', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    // Mock all fetch calls to return empty arrays
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty users array', () => {
      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )
      expect(screen.getByTestId('users-count').textContent).toBe('0')
    })

    it('should initialize with empty departments array', () => {
      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )
      expect(screen.getByTestId('departments-count').textContent).toBe('0')
    })

    it('should initialize with empty activities array', () => {
      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )
      expect(screen.getByTestId('activities-count').textContent).toBe('0')
    })

    it('should initialize with empty notifications array', () => {
      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )
      expect(screen.getByTestId('notifications-count').textContent).toBe('0')
    })
  })

  describe('context data structure', () => {
    it('should provide users array', () => {
      const TestUsers = () => {
        const { users } = useData()
        return <div data-testid="has-users">{Array.isArray(users) ? 'true' : 'false'}</div>
      }

      render(
        <AuthProvider>
          <DataProvider>
            <TestUsers />
          </DataProvider>
        </AuthProvider>,
      )
      expect(screen.getByTestId('has-users').textContent).toBe('true')
    })

    it('should provide departments array', () => {
      const TestDepts = () => {
        const { departments } = useData()
        return <div data-testid="has-depts">{Array.isArray(departments) ? 'true' : 'false'}</div>
      }

      render(
        <AuthProvider>
          <DataProvider>
            <TestDepts />
          </DataProvider>
        </AuthProvider>,
      )
      expect(screen.getByTestId('has-depts').textContent).toBe('true')
    })

    it('should provide activities array', () => {
      const TestActivities = () => {
        const { activities } = useData()
        return <div data-testid="has-activities">{Array.isArray(activities) ? 'true' : 'false'}</div>
      }

      render(
        <AuthProvider>
          <DataProvider>
            <TestActivities />
          </DataProvider>
        </AuthProvider>,
      )
      expect(screen.getByTestId('has-activities').textContent).toBe('true')
    })

    it('should provide notifications array', () => {
      const TestNotifications = () => {
        const { notifications } = useData()
        return <div data-testid="has-notifications">{Array.isArray(notifications) ? 'true' : 'false'}</div>
      }

      render(
        <AuthProvider>
          <DataProvider>
            <TestNotifications />
          </DataProvider>
        </AuthProvider>,
      )
      expect(screen.getByTestId('has-notifications').textContent).toBe('true')
    })
  })

  describe('context functions', () => {
    it('should provide addUser function', () => {
      const TestAddUser = () => {
        const { addUser } = useData()
        return <div data-testid="has-add-user">{typeof addUser === 'function' ? 'true' : 'false'}</div>
      }

      render(
        <AuthProvider>
          <DataProvider>
            <TestAddUser />
          </DataProvider>
        </AuthProvider>,
      )
      expect(screen.getByTestId('has-add-user').textContent).toBe('true')
    })

    it('should provide updateUser function', () => {
      const TestUpdateUser = () => {
        const { updateUser } = useData()
        return <div data-testid="has-update-user">{typeof updateUser === 'function' ? 'true' : 'false'}</div>
      }

      render(
        <AuthProvider>
          <DataProvider>
            <TestUpdateUser />
          </DataProvider>
        </AuthProvider>,
      )
      expect(screen.getByTestId('has-update-user').textContent).toBe('true')
    })

    it('should provide deleteUser function', () => {
      const TestDeleteUser = () => {
        const { deleteUser } = useData()
        return <div data-testid="has-delete-user">{typeof deleteUser === 'function' ? 'true' : 'false'}</div>
      }

      render(
        <AuthProvider>
          <DataProvider>
            <TestDeleteUser />
          </DataProvider>
        </AuthProvider>,
      )
      expect(screen.getByTestId('has-delete-user').textContent).toBe('true')
    })

    it('should provide addDepartment function', () => {
      const TestAddDept = () => {
        const { addDepartment } = useData()
        return <div data-testid="has-add-dept">{typeof addDepartment === 'function' ? 'true' : 'false'}</div>
      }

      render(
        <AuthProvider>
          <DataProvider>
            <TestAddDept />
          </DataProvider>
        </AuthProvider>,
      )
      expect(screen.getByTestId('has-add-dept').textContent).toBe('true')
    })

    it('should provide addActivity function', () => {
      const TestAddActivity = () => {
        const { addActivity } = useData()
        return <div data-testid="has-add-activity">{typeof addActivity === 'function' ? 'true' : 'false'}</div>
      }

      render(
        <AuthProvider>
          <DataProvider>
            <TestAddActivity />
          </DataProvider>
        </AuthProvider>,
      )
      expect(screen.getByTestId('has-add-activity').textContent).toBe('true')
    })

    it('should provide getUnreadCount function', () => {
      const TestGetUnreadCount = () => {
        const { getUnreadCount } = useData()
        return <div data-testid="has-get-unread">{typeof getUnreadCount === 'function' ? 'true' : 'false'}</div>
      }

      render(
        <AuthProvider>
          <DataProvider>
            <TestGetUnreadCount />
          </DataProvider>
        </AuthProvider>,
      )
      expect(screen.getByTestId('has-get-unread').textContent).toBe('true')
    })

    it('should provide getUserNotifications function', () => {
      const TestGetUserNotifs = () => {
        const { getUserNotifications } = useData()
        return <div data-testid="has-get-user-notifs">{typeof getUserNotifications === 'function' ? 'true' : 'false'}</div>
      }

      render(
        <AuthProvider>
          <DataProvider>
            <TestGetUserNotifs />
          </DataProvider>
        </AuthProvider>,
      )
      expect(screen.getByTestId('has-get-user-notifs').textContent).toBe('true')
    })
  })

  describe('useData hook', () => {
    it('should throw error when used outside provider', () => {
      const TestComponentWithoutProvider = () => {
        useData()
        return null
      }

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TestComponentWithoutProvider />)
      }).toThrow('useData must be used within a DataProvider')

      consoleSpy.mockRestore()
    })
  })
})
