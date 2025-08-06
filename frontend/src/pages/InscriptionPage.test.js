import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InscriptionPage from './InscriptionPage';
import * as api from '../api';

// Mock des contextes
const mockShowAlert = jest.fn();
jest.mock('../contexts/AlertContext.tsx', () => ({
  useAlertDrawer: () => ({
    showAlert: mockShowAlert
  })
}));

// Mock de l'API
jest.mock('../api');

describe('InscriptionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock par défaut pour les créneaux
    api.apiGet.mockResolvedValue({
      matin: {
        '09:00': { places_restantes: 10, complet: false },
        '09:20': { places_restantes: 5, complet: false },
        '12:40': { places_restantes: 14, complet: false }
      },
      'apres-midi': {
        '13:00': { places_restantes: 8, complet: false },
        '14:40': { places_restantes: 2, complet: false }
      }
    });
  });

  test('should render form fields correctly', async () => {
    render(<InscriptionPage />);
    
    await waitFor(() => {
      expect(screen.getByText('📝 Inscription d\'un agent')).toBeInTheDocument();
    });
    
    // Vérifier les champs du formulaire
    expect(screen.getByPlaceholderText('Ex: 1234567A')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nom de famille')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Prénom')).toBeInTheDocument();
    expect(screen.getByText('S\'inscrire')).toBeInTheDocument();
  });

  test('should load and display time slots', async () => {
    render(<InscriptionPage />);
    
    await waitFor(() => {
      expect(screen.getByText('🌅 Créneaux du matin (9h00 - 12h40)')).toBeInTheDocument();
      expect(screen.getByText('🌅 Créneaux de l\'après-midi (13h00 - 14h40)')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    expect(api.apiGet).toHaveBeenCalledWith('creneaux');
  });

  test('should validate code personnel format', async () => {
    const user = userEvent.setup();
    render(<InscriptionPage />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ex: 1234567A')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    const codeInput = screen.getByPlaceholderText('Ex: 1234567A');
    const submitButton = screen.getByText('S\'inscrire');
    
    // Remplir avec un code invalide
    await user.type(codeInput, '123456A'); // trop court
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Erreur de validation',
          intent: 'error'
        })
      );
    }, { timeout: 10000 });
  });

  test('should validate required fields', async () => {
    const user = userEvent.setup();
    render(<InscriptionPage />);
    
    await waitFor(() => {
      expect(screen.getByText('S\'inscrire')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    const submitButton = screen.getByText('S\'inscrire');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Erreur de validation',
          intent: 'error'
        })
      );
    }, { timeout: 10000 });
  });

  test('should handle successful form submission', async () => {
    const user = userEvent.setup();
    api.apiPost.mockResolvedValue({ success: true });
    
    render(<InscriptionPage />);
    
    await waitFor(() => {
      expect(screen.getByText('🌅 Créneaux du matin (9h00 - 12h40)')).toBeInTheDocument();
    });
    
    // Remplir le formulaire
    await user.type(screen.getByPlaceholderText('Ex: 1234567A'), '1234567A');
    await user.type(screen.getByPlaceholderText('Nom de famille'), 'Dupont');
    await user.type(screen.getByPlaceholderText('Prénom'), 'Jean');
    
    // Sélectionner nombre de proches (simulation)
    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: '1' } });
    
    // Cliquer sur un créneau (simulation du clic sur une carte)
    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    const creneauCard = screen.getByText('09:00').closest('wcs-card');
    if (creneauCard) {
      await user.click(creneauCard);
    }
    
    // Soumettre
    await user.click(screen.getByText('S\'inscrire'));
    
    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalledWith('agents', {
        code_personnel: '1234567A',
        nom: 'Dupont',
        prenom: 'Jean',
        nombre_proches: 1,
        heure_arrivee: '09:00',
        restauration_sur_place: 0
      });
    }, { timeout: 10000 });
    
    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith({
        title: 'Succès',
        subtitle: 'Inscription réussie !',
        intent: 'success'
      });
    }, { timeout: 10000 });
  });

  test('should handle API errors', async () => {
    const user = userEvent.setup();
    api.apiPost.mockRejectedValue(new Error('Agent déjà inscrit'));
    
    render(<InscriptionPage />);
    
    await waitFor(() => {
      expect(screen.getByText('🌅 Créneaux du matin (9h00 - 12h40)')).toBeInTheDocument();
    });
    
    // Remplir le formulaire minimal
    await user.type(screen.getByPlaceholderText('Ex: 1234567A'), '1234567A');
    await user.type(screen.getByPlaceholderText('Nom de famille'), 'Dupont');
    await user.type(screen.getByPlaceholderText('Prénom'), 'Jean');
    
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '0' } });
    
    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
    }, { timeout: 10000 });
    
    const creneauCard = screen.getByText('09:00').closest('wcs-card');
    if (creneauCard) {
      await user.click(creneauCard);
    }
    
    await user.click(screen.getByText('S\'inscrire'));
    
    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Erreur',
          intent: 'error'
        })
      );
    }, { timeout: 10000 });
  });

  test('should validate places availability', async () => {
    const user = userEvent.setup();
    
    // Mock avec créneaux limités
    api.apiGet.mockResolvedValue({
      matin: {
        '09:00': { places_restantes: 1, complet: false }
      },
      'apres-midi': {}
    });
    
    render(<InscriptionPage />);
    
    await waitFor(() => {
      expect(screen.getByText('🌅 Créneaux du matin (9h00 - 12h40)')).toBeInTheDocument();
    });
    
    // Remplir le formulaire avec trop de proches
    await user.type(screen.getByPlaceholderText('Ex: 1234567A'), '1234567A');
    await user.type(screen.getByPlaceholderText('Nom de famille'), 'Dupont');
    await user.type(screen.getByPlaceholderText('Prénom'), 'Jean');
    
    // Sélectionner 2 proches (donc 3 personnes total) mais seulement 1 place
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2' } });
    
    await waitFor(() => {
      expect(screen.getByText('09:00')).toBeInTheDocument();
    }, { timeout: 10000 });
      
    const creneauCard = screen.getByText('09:00').closest('wcs-card');
    if (creneauCard) {
      await user.click(creneauCard);
    }
    
    await user.click(screen.getByText('S\'inscrire'));
    
    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Erreur de validation',
          intent: 'error'
        })
      );
    }, { timeout: 10000 });
  });

  test('should show correct number of time slots', async () => {
    render(<InscriptionPage />);
    
    await waitFor(() => {
      expect(screen.getByText('12 créneaux disponibles')).toBeInTheDocument(); // Matin
      expect(screen.getByText('6 créneaux disponibles')).toBeInTheDocument(); // Après-midi
    }, { timeout: 10000 });
  });

  test('should handle loading states', () => {
    render(<InscriptionPage />);
    
    // Pendant le chargement des créneaux
    expect(screen.getByText('Chargement des créneaux...')).toBeInTheDocument();
  });
});