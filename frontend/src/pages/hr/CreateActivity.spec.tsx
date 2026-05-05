import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CreateActivity from './CreateActivity';
import { DataProvider } from '../../context/DataContext';
import { AuthProvider } from '../../context/AuthContext';

// Mock des hooks
const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../../hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock du LocationPicker
vi.mock('../../components/LocationPicker', () => ({
  default: ({ onLocationSelect, initialLocation }: any) => (
    <div data-testid="location-picker">
      <button
        onClick={() => onLocationSelect(48.8566, 2.3522, 'Paris, France')}
        data-testid="select-location"
      >
        Select Location
      </button>
      <div data-testid="initial-location">
        {initialLocation.lat}, {initialLocation.lng}
      </div>
    </div>
  ),
}));

// Mock data
const mockUser = {
  id: '1',
  name: 'HR User',
  email: 'hr@test.com',
  role: 'HR',
};

const mockDepartments = [
  { id: 'dept1', name: 'IT Department', code: 'IT' },
  { id: 'dept2', name: 'HR Department', code: 'HR' },
];

const mockUsers = [
  { id: '1', name: 'Manager 1', role: 'MANAGER', email: 'manager1@test.com' },
  { id: '2', name: 'Manager 2', role: 'MANAGER', email: 'manager2@test.com' },
];

const mockSkills = [
  { intitule: 'JavaScript', type: 'knowledge' },
  { intitule: 'React', type: 'knowledge' },
  { intitule: 'TypeScript', type: 'knowledge' },
];

const mockAddActivity = vi.fn();
const mockFetchWithAuth = vi.fn();

// Wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <DataProvider>
        {children}
      </DataProvider>
    </AuthProvider>
  </BrowserRouter>
);

// Mock des contextes
vi.mock('../../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('../../context/DataContext', () => ({
  DataProvider: ({ children }: { children: React.ReactNode }) => children,
  useData: () => ({
    users: mockUsers,
    departments: mockDepartments,
    addActivity: mockAddActivity,
    fetchWithAuth: mockFetchWithAuth,
  }),
}));

describe('CreateActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful skills fetch
    mockFetchWithAuth.mockImplementation((url: string) => {
      if (url.includes('/competences/all')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: mockSkills }),
        });
      }
      if (url.includes('/question-competences/all')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [] }),
        });
      }
      if (url.includes('/activities')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            _id: 'activity123',
            title: 'Test Activity',
            description: 'Test Description',
            type: 'training',
            maxParticipants: 10,
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
            location: 'Test Location',
            requiredSkills: [],
          }),
        });
      }
      return Promise.resolve({ ok: false });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render create activity form', async () => {
    render(
      <TestWrapper>
        <CreateActivity />
      </TestWrapper>
    );

    expect(screen.getByText('Créer une activité')).toBeInTheDocument();
    expect(screen.getByText('Définir une nouvelle activité et ses compétences requises')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ex: Formation React Advanced')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Décrivez l\'activité en détail...')).toBeInTheDocument();
  });

  it('should populate department options', async () => {
    render(
      <TestWrapper>
        <CreateActivity />
      </TestWrapper>
    );

    // Check if departments are loaded
    await waitFor(() => {
      expect(screen.getByText('IT Department')).toBeInTheDocument();
      expect(screen.getByText('HR Department')).toBeInTheDocument();
    });
  });

  it('should handle form input changes', async () => {
    render(
      <TestWrapper>
        <CreateActivity />
      </TestWrapper>
    );

    const titleInput = screen.getByPlaceholderText('Ex: Formation React Advanced');
    const descriptionInput = screen.getByPlaceholderText('Décrivez l\'activité en détail...');
    const maxParticipantsInput = screen.getByDisplayValue('5');

    fireEvent.change(titleInput, { target: { value: 'Test Activity' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } });
    fireEvent.change(maxParticipantsInput, { target: { value: '15' } });

    expect(titleInput).toHaveValue('Test Activity');
    expect(descriptionInput).toHaveValue('Test Description');
    expect(maxParticipantsInput).toHaveValue(15);
  });

  it('should validate required fields', async () => {
    render(
      <TestWrapper>
        <CreateActivity />
      </TestWrapper>
    );

    // Fill only title to see validation for other fields
    const titleInput = screen.getByPlaceholderText('Ex: Formation React Advanced');
    const descriptionInput = screen.getByPlaceholderText('Décrivez l\'activité en détail...');
    
    // Fill and clear title to trigger validation
    fireEvent.change(titleInput, { target: { value: 'Test' } });
    fireEvent.change(titleInput, { target: { value: '' } });
    
    // Click submit - HTML5 required will prevent submission but we check validation
    const submitButton = screen.getByText('Créer l\'activité');
    fireEvent.click(submitButton);

    // Check that form validation is working (HTML5 required attributes prevent submission)
    expect(titleInput).toBeRequired();
    expect(descriptionInput).toBeRequired();
  });

  it('should add and remove skills', async () => {
    render(
      <TestWrapper>
        <CreateActivity />
      </TestWrapper>
    );

    // Wait for skills to load
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalled();
    });

    // Add skill button
    const addSkillButton = screen.getByText('Ajouter');
    fireEvent.click(addSkillButton);

    // Should have 2 skill rows now (1 initial + 1 added)
    const skillSelects = screen.getAllByText('-- Sélectionner une compétence --');
    expect(skillSelects).toHaveLength(2);
  });

  it('should handle location selection', async () => {
    render(
      <TestWrapper>
        <CreateActivity />
      </TestWrapper>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('location-picker')).toBeInTheDocument();
    });

    // Test location selection
    const selectLocationButton = screen.getByTestId('select-location');
    fireEvent.click(selectLocationButton);

    // Check if location was updated (this would be reflected in the address input)
    const addressInput = screen.getByPlaceholderText('Adresse de l\'activité');
    await waitFor(() => {
      expect(addressInput).toHaveValue('Paris, France');
    });
  });

  it('should create new skill in database', async () => {
    mockFetchWithAuth.mockImplementation((url: string, options?: any) => {
      if (url.includes('/question-competences') && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'skill123', intitule: 'New Skill' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockSkills }),
      });
    });

    render(
      <TestWrapper>
        <CreateActivity />
      </TestWrapper>
    );

    // Fill new skill form
    const newSkillNameInput = screen.getByPlaceholderText('Nom compétence');
    const newSkillDetailsInput = screen.getByPlaceholderText('Détails (optionnel)');
    const createSkillButton = screen.getByTitle('Ajouter a la base');

    fireEvent.change(newSkillNameInput, { target: { value: 'New Skill' } });
    fireEvent.change(newSkillDetailsInput, { target: { value: 'Skill details' } });
    fireEvent.click(createSkillButton);

    // Verify the POST request was made
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalledWith(
        expect.stringContaining('/question-competences'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            intitule: 'New Skill',
            details: 'Skill details',
            status: 'active',
            type: 'knowledge',
          }),
        })
      );
    }, { timeout: 10000 });
  });

  it('should navigate back when cancel button is clicked', () => {
    render(
      <TestWrapper>
        <CreateActivity />
      </TestWrapper>
    );

    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should display form sections correctly', () => {
    render(
      <TestWrapper>
        <CreateActivity />
      </TestWrapper>
    );

    expect(screen.getByText('Informations générales')).toBeInTheDocument();
    expect(screen.getByText('Localisation')).toBeInTheDocument();
    expect(screen.getByText('Compétences requises')).toBeInTheDocument();
  });

  it('should have correct form field types', () => {
    render(
      <TestWrapper>
        <CreateActivity />
      </TestWrapper>
    );

    const numberInput = screen.getByDisplayValue('5');
    expect(numberInput).toHaveAttribute('type', 'number');
    expect(numberInput).toHaveAttribute('min', '1');
  });

  it('should display skill search functionality', async () => {
    render(
      <TestWrapper>
        <CreateActivity />
      </TestWrapper>
    );

    expect(screen.getByPlaceholderText('Rechercher une compétence existante')).toBeInTheDocument();
    // Wait for skills to load first, then the button shows "Actualiser liste"
    await waitFor(() => {
      expect(mockFetchWithAuth).toHaveBeenCalled();
    });
    // After loading, the button text changes from "Chargement..." to "Actualiser liste"
    await waitFor(() => {
      expect(screen.getByText('Actualiser liste')).toBeInTheDocument();
    });
  });

  it('should show skill creation form', () => {
    render(
      <TestWrapper>
        <CreateActivity />
      </TestWrapper>
    );

    expect(screen.getByText('Ajouter une compétence manquante à la base')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nom compétence')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Détails (optionnel)')).toBeInTheDocument();
  });
});