import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DataProvider, useData } from './DataContext'
import { AuthProvider } from './AuthContext'
import type { User, Department, Activity, Notification } from '../types'

// Mock fetch globally
global.fetch = vi.fn()

// Mock toast
vi.mock('../../hooks/use-toast', () => ({
  toast: vi.fn(),
}))

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
  role: 'HR',
}

const mockDepartment: Department = {
  id: 'dept1',
  name: 'Engineering',
  code: 'ENG',
  description: 'Engineering Department',
  manager_id: 'mgr1',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
}

const mockActivity: Activity = {
  id: 'act1',
  title: 'React Training',
  description: 'Learn React',
  type: 'training',
  required_skills: [{ skill_name: 'JavaScript', desired_level: 'high' }],
  seats: 20,
  date: '2023-06-01T00:00:00Z',
  end_date: '2023-06-02T00:00:00Z',
  duration: '2 days',
  location: 'Room 101',
  priority: 'consolidate_high',
  status: 'open',
  created_by: 'HR',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
}

const mockNotification: Notification = {
  id: 'notif1',
  user_id: '123',
  title: 'Activity Assigned',
  message: 'You have been assigned to React Training',
  type: 'activity_assigned',
  read: false,
  activity_id: 'act1',
  created_at: '2023-01-01T00:00:00Z',
}

function TestComponent() {
  const {
    users,
    departments,
    activities,
    notifications,
    addUser,
    updateUser,
    deleteUser,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    addActivity,
    updateActivity,
    deleteActivity,
    markNotificationRead,
    getUnreadCount,
    getUserNotifications,
    getDepartmentName,
  } = useData()

  return (
    <div>
      <div data-testid="users-count">{users.length}</div>
      <div data-testid="departments-count">{departments.length}</div>
      <div data-testid="activities-count">{activities.length}</div>
      <div data-testid="notifications-count">{notifications.length}</div>
      <div data-testid="unread-count">{getUnreadCount('123')}</div>
      <div data-testid="dept-name">{getDepartmentName('dept1')}</div>
      <button onClick={() => addUser(mockUser)}>Add User</button>
      <button onClick={() => updateUser(mockUser)}>Update User</button>
      <button onClick={() => deleteUser('123')}>Delete User</button>
      <button onClick={() => addDepartment(mockDepartment)}>Add Department</button>
      <button onClick={() => updateDepartment(mockDepartment)}>Update Department</button>
      <button onClick={() => deleteDepartment('dept1')}>Delete Department</button>
      <button onClick={() => addActivity(mockActivity)}>Add Activity</button>
      <button onClick={() => updateActivity(mockActivity)}>Update Activity</button>
      <button onClick={() => deleteActivity('act1')}>Delete Activity</button>
      <button onClick={() => markNotificationRead('notif1')}>Mark Read</button>
    </div>
  )
}

describe('DataContext', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()
    // Mock localStorage for auth
    localStorage.setItem('auth_user', JSON.stringify(mockUser))
    localStorage.setItem('auth_token', 'token123')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with empty arrays', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('users-count')).textContent).toBe('0')
      })
    })

    it('should fetch activities on mount', async () => {
      const mockActivities = [mockActivity]
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockActivities,
      } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('activities-count')).textContent).toBe('1')
      })
    })

    it('should fetch departments for HR users', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [mockDepartment] }),
        } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('departments-count')).textContent).toBe('1')
      })
    })

    it('should not fetch restricted data for non-HR users', () => {
      const employeeUser = { ...mockUser, role: 'EMPLOYEE' }
      localStorage.setItem('auth_user', JSON.stringify(employeeUser))

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      // Should only fetch activities (public endpoint)
      expect(screen.getByTestId('departments-count')).textContent).toBe('0')
    })
  })

  describe('user management', () => {
    it('should add user to the list', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: mockUser }),
        } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      const addButton = screen.getByText('Add User')
      await waitFor(() => {
        addButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('users-count')).textContent).toBe('1')
      })
    })

    it('should update user in the list', async () => {
      const initialUsers = [mockUser]
      const updatedUser = { ...mockUser, name: 'Jane Doe' }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: initialUsers }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ user: updatedUser }),
        } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('users-count')).textContent).toBe('1')
      })

      const updateButton = screen.getByText('Update User')
      updateButton.click()

      await waitFor(() => {
        expect(screen.getByTestId('users-count')).textContent).toBe('1')
      })
    })

    it('should delete user from the list', async () => {
      const initialUsers = [mockUser]

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: initialUsers }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('users-count')).textContent).toBe('1')
      })

      const deleteButton = screen.getByText('Delete User')
      deleteButton.click()

      await waitFor(() => {
        expect(screen.getByTestId('users-count')).textContent).toBe('0')
      })
    })
  })

  describe('department management', () => {
    it('should add department to the list', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ department: mockDepartment }),
        } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      const addButton = screen.getByText('Add Department')
      await waitFor(() => {
        addButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('departments-count')).textContent).toBe('1')
      })
    })

    it('should update department in the list', async () => {
      const updatedDept = { ...mockDepartment, name: 'Updated Engineering' }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [mockDepartment] }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ department: updatedDept }),
        } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('departments-count')).textContent).toBe('1')
      })

      const updateButton = screen.getByText('Update Department')
      updateButton.click()

      await waitFor(() => {
        expect(screen.getByTestId('departments-count')).textContent).toBe('1')
      })
    })

    it('should delete department from the list', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [mockDepartment] }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('departments-count')).textContent).toBe('1')
      })

      const deleteButton = screen.getByText('Delete Department')
      deleteButton.click()

      await waitFor(() => {
        expect(screen.getByTestId('departments-count')).textContent).toBe('0')
      })
    })
  })

  describe('activity management', () => {
    it('should add activity to the list', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [],
      } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      const addButton = screen.getByText('Add Activity')
      addButton.click()

      await waitFor(() => {
        expect(screen.getByTestId('activities-count')).textContent).toBe('1')
      })
    })

    it('should update activity in the list', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [mockActivity],
      } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('activities-count')).textContent).toBe('1')
      })

      const updatedActivity = { ...mockActivity, title: 'Updated Training' }
      const updateButton = screen.getByText('Update Activity')
      updateButton.click()

      await waitFor(() => {
        expect(screen.getByTestId('activities-count')).textContent).toBe('1')
      })
    })

    it('should delete activity from the list', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => [mockActivity],
      } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('activities-count')).textContent).toBe('1')
      })

      const deleteButton = screen.getByText('Delete Activity')
      deleteButton.click()

      await waitFor(() => {
        expect(screen.getByTestId('activities-count')).textContent).toBe('0')
      })
    })
  })

  describe('notification management', () => {
    it('should mark notification as read', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockNotification],
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({}),
        } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).textContent).toBe('1')
      })

      const markReadButton = screen.getByText('Mark Read')
      markReadButton.click()

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).textContent).toBe('0')
      })
    })

    it('should count unread notifications correctly', async () => {
      const unreadNotif = { ...mockNotification, read: false }
      const readNotif = { ...mockNotification, id: 'notif2', read: true }

      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [unreadNotif, readNotif],
        } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).textContent).toBe('1')
      })
    })
  })

  describe('helper functions', () => {
    it('should get department name by id', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [mockDepartment] }),
        } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('dept-name')).textContent).toBe('Engineering')
      })
    })

    it('should return N/A for unknown department id', async () => {
      vi.mocked(global.fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        } as any)

      render(
        <AuthProvider>
          <DataProvider>
            <TestComponent />
          </DataProvider>
        </AuthProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('dept-name')).textContent).toBe('N/A')
      })
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

