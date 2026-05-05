import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import HRActivities from './HRActivities';
import { DataProvider } from '../../context/DataContext';
import type { Activity } from '../../types';

// Mock des hooks
const mockToast = vi.fn();

vi.mock('../../../../hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock activities data
const mockActivities: Activity[] = [
  {
    id: '1',
    title: 'Formation React',
    description: 'Formation avancée React',
    type: 'training',
    required_skills: [
      { skill_name: 'JavaScript', desired_level: 'medium' },
      { skill_name: 'React', desired_level: 'high' }
    ],
    seats: 15,
    date: '2024-06-01T09:00:00Z',
    end_date: '2024-06-01T17:00:00Z',
    duration: '1 jour',
    location: 'Salle A',
    priority: 'consolidate_medium',
    status: 'open',
    created_by: 'HR Manager',
    created_at: '2024-05-01T10:00:00Z',
    updated_at: '2024-05-01T10:00:00Z',
  },
  {
    id: '2',
    title: 'Certification AWS',
    description: 'Préparation certification AWS',
    type: 'certification',
    required_skills: [
      { skill_name: 'AWS', desired_level: 'expert' }
    ],
    seats: 10,
    date: '2024-06-15T09:00:00Z',
    end_date: '2024-06-15T17:00:00Z',
    duration: '2 jours',
    location: 'En ligne',
    priority: 'exploit_expert',
    status: 'draft',
    created_by: 'HR Manager',
    created_at: '2024-05-02T10:00:00Z',
    updated_at: '2024-05-02T10:00:00Z',
  },
  {
    id: '3',
    title: 'Mission Client',
    description: 'Mission chez le client ABC',
    type: 'mission',
    required_skills: [
      { skill_name: 'Communication', desired_level: 'high' }
    ],
    seats: 5,
    date: '2024-07-01T08:00:00Z',
    end_date: '2024-07-31T18:00:00Z',
    duration: '1 mois',
    location: 'Client ABC',
    priority: 'develop_low',
    status: 'in_progress',
    created_by: 'HR Manager',
    created_at: '2024-05-03T10:00:00Z',
    updated_at: '2024-05-03T10:00:00Z',
  },
];

const mockUpdateActivity = vi.fn();
const mockDeleteActivity = vi.fn();

// Wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <DataProvider>
      {children}
    </DataProvider>
  </BrowserRouter>
);

// Mock du contexte DataContext
vi.mock('../../context/DataContext', () => ({
  DataProvider: ({ children }: { children: React.ReactNode }) => children,
  useData: () => ({
    activities: mockActivities,
    updateActivity: mockUpdateActivity,
    deleteActivity: mockDeleteActivity,
  }),
}));

describe('HRActivities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    mockFetch.mockImplementation((url: string, options?: any) => {
      if (options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      if (options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.resolve({ ok: false });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render activities list', () => {
    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    expect(screen.getByText('Activités')).toBeInTheDocument();
    expect(screen.getByText('3 activités au total')).toBeInTheDocument();
    expect(screen.getByText('Formation React')).toBeInTheDocument();
    expect(screen.getByText('Certification AWS')).toBeInTheDocument();
    expect(screen.getByText('Mission Client')).toBeInTheDocument();
  });

  it('should display activity details in table', () => {
    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    // Check activity details
    expect(screen.getByText('Formation React')).toBeInTheDocument();
    expect(screen.getByText('Formation avancée React')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // seats
    expect(screen.getByText('10')).toBeInTheDocument(); // seats for certification
    expect(screen.getByText('5')).toBeInTheDocument(); // seats for mission
  });

  it('should filter activities by search term', async () => {
    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Rechercher...');
    fireEvent.change(searchInput, { target: { value: 'React' } });

    await waitFor(() => {
      expect(screen.getByText('Formation React')).toBeInTheDocument();
      expect(screen.queryByText('Certification AWS')).not.toBeInTheDocument();
      expect(screen.queryByText('Mission Client')).not.toBeInTheDocument();
    });
  });

  it('should filter activities by status', async () => {
    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    const statusFilter = screen.getByDisplayValue('Tous statuts');
    fireEvent.change(statusFilter, { target: { value: 'draft' } });

    await waitFor(() => {
      expect(screen.queryByText('Formation React')).not.toBeInTheDocument();
      expect(screen.getByText('Certification AWS')).toBeInTheDocument();
      expect(screen.queryByText('Mission Client')).not.toBeInTheDocument();
    });
  });

  it('should toggle sort order', async () => {
    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    const sortButton = screen.getByText('Plus récentes');
    fireEvent.click(sortButton);

    await waitFor(() => {
      expect(screen.getByText('Plus anciennes')).toBeInTheDocument();
    });
  });

  it('should open edit modal when edit button is clicked', async () => {
    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    // Activities are sorted by date desc, so editButtons[0] corresponds to activity 3 (most recent)
    const editButtons = screen.getAllByTitle('Modifier');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Modifier l\'activité')).toBeInTheDocument();
      // The modal should have the title input with the activity's title
      expect(screen.getByDisplayValue('Mission Client')).toBeInTheDocument();
    });
  });

  it('should close edit modal when X button is clicked', async () => {
    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    // Open edit modal (activities sorted by date desc, so first button is for activity 3)
    const editButtons = screen.getAllByTitle('Modifier');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Modifier l\'activité')).toBeInTheDocument();
    });

    // Close modal - find the X button inside the modal
    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find(btn => btn.querySelector('.lucide-x') || btn.className.includes('rounded-md hover:bg-muted'));
    fireEvent.click(xButton!);

    await waitFor(() => {
      expect(screen.queryByText('Modifier l\'activité')).not.toBeInTheDocument();
    });
  });

  it('should update activity fields in edit form', async () => {
    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    // Open edit modal (activities sorted by date desc, so first button is for activity 3)
    const editButtons = screen.getAllByTitle('Modifier');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Modifier l\'activité')).toBeInTheDocument();
    });

    // Update fields - activity 3 has title "Mission Client", seats 5
    const titleInput = screen.getByDisplayValue('Mission Client');
    const descriptionInput = screen.getByDisplayValue('Mission chez le client ABC');
    const seatsInput = screen.getByDisplayValue('5');

    fireEvent.change(titleInput, { target: { value: 'Mission Client Avancée' } });
    fireEvent.change(descriptionInput, { target: { value: 'Mission très importante' } });
    fireEvent.change(seatsInput, { target: { value: '10' } });

    expect(titleInput).toHaveValue('Mission Client Avancée');
    expect(descriptionInput).toHaveValue('Mission très importante');
    expect(seatsInput).toHaveValue(10);
  });

  it('should submit edit form successfully', async () => {
    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    // Open edit modal (activities sorted by date desc, so first button is for activity 3)
    const editButtons = screen.getAllByTitle('Modifier');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Modifier l\'activité')).toBeInTheDocument();
    });

    // Update title
    const titleInput = screen.getByDisplayValue('Mission Client');
    fireEvent.change(titleInput, { target: { value: 'Mission Client Avancée' } });

    // Submit form
    const saveButton = screen.getByText('Sauvegarder');
    fireEvent.click(saveButton);

    // Verify fetch was called with correct parameters
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/activities/3',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }, { timeout: 10000 });
  });

  it('should handle edit form submission error', async () => {
    mockFetch.mockImplementation((url: string, options?: any) => {
      if (options?.method === 'PUT') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Update failed' }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    // Open edit modal (activities sorted by date desc, so first button is for activity 3)
    const editButtons = screen.getAllByTitle('Modifier');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Modifier l\'activité')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Sauvegarder');
    fireEvent.click(saveButton);

    // Verify fetch was called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/activities/'),
        expect.objectContaining({ method: 'PUT' })
      );
    }, { timeout: 10000 });
  });

  it('should open delete confirmation when delete button is clicked', async () => {
    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    const deleteButtons = screen.getAllByTitle('Supprimer');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirmer la suppression de cette activité ? Cette action est irréversible.')).toBeInTheDocument();
      expect(screen.getByText('Supprimer')).toBeInTheDocument();
      expect(screen.getByText('Annuler')).toBeInTheDocument();
    });
  });

  it('should cancel delete when cancel button is clicked', async () => {
    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    // Open delete confirmation
    const deleteButtons = screen.getAllByTitle('Supprimer');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirmer la suppression de cette activité ? Cette action est irréversible.')).toBeInTheDocument();
    });

    // Cancel delete
    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Confirmer la suppression de cette activité ? Cette action est irréversible.')).not.toBeInTheDocument();
    });
  });

  it('should delete activity successfully', async () => {
    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    // Open delete confirmation (activities sorted by date desc, so first button is for activity 3)
    const deleteButtons = screen.getAllByTitle('Supprimer');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirmer la suppression de cette activité ? Cette action est irréversible.')).toBeInTheDocument();
    });

    // Confirm delete
    const confirmDeleteButton = screen.getByText('Supprimer');
    fireEvent.click(confirmDeleteButton);

    // Verify delete was called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/activities/3',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    }, { timeout: 10000 });
  });

  it('should handle delete error', async () => {
    mockFetch.mockImplementation((url: string, options?: any) => {
      if (options?.method === 'DELETE') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Delete failed' }),
        });
      }
      return Promise.resolve({ ok: false });
    });

    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    // Open delete confirmation (activities sorted by date desc, so first button is for activity 3)
    const deleteButtons = screen.getAllByTitle('Supprimer');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Confirmer la suppression de cette activité ? Cette action est irréversible.')).toBeInTheDocument();
    });

    const confirmDeleteButton = screen.getByText('Supprimer');
    fireEvent.click(confirmDeleteButton);

    // Verify delete was called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/activities/'),
        expect.objectContaining({ method: 'DELETE' })
      );
    }, { timeout: 10000 });
  });

  it('should display action buttons for each activity', () => {
    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    // Check for action buttons (should have 3 activities × multiple buttons each)
    const aiRecoButtons = screen.getAllByText('AI Reco');
    const editButtons = screen.getAllByTitle('Modifier');
    const deleteButtons = screen.getAllByTitle('Supprimer');

    expect(aiRecoButtons).toHaveLength(3);
    expect(editButtons).toHaveLength(3);
    expect(deleteButtons).toHaveLength(3);
  });

  it('should display empty message when no activities match filter', async () => {
    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Rechercher...');
    fireEvent.change(searchInput, { target: { value: 'NonExistentActivity' } });

    await waitFor(() => {
      expect(screen.getByText('Aucune activité trouvée')).toBeInTheDocument();
    });
  });

  it('should display edit form with input fields', async () => {
    render(
      <TestWrapper>
        <HRActivities />
      </TestWrapper>
    );

    // Open edit modal (activities sorted by date desc, so first button is for activity 3)
    const editButtons = screen.getAllByTitle('Modifier');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Modifier l\'activité')).toBeInTheDocument();
    });

    // Verify modal is visible with input fields
    const titleInput = screen.getByDisplayValue('Mission Client');
    expect(titleInput).toBeInTheDocument();
    
    const descriptionInput = screen.getByDisplayValue('Mission chez le client ABC');
    expect(descriptionInput).toBeInTheDocument();
    
    const seatsInput = screen.getByDisplayValue('5');
    expect(seatsInput).toBeInTheDocument();
  });
});